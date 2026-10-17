# Bounded Step Functions Standard workflow, the deterministic workflow-control Lambda and
# the six constrained agent workers (ADR-0007). Each function has its own role.

terraform {
  required_version = ">= 1.10, < 2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0"
    }
  }
}

variable "prefix" {
  type = string
}

variable "artifact_bucket" {
  type = string
}

variable "backend_package_key" {
  type = string
}

variable "backend_package_sha256" {
  type = string
}

variable "environment_variables" {
  type = map(string)
}

variable "bedrock_invoke_policy_json" {
  description = "Null unless Bedrock is enabled."
  type        = string
  default     = null
}

variable "log_retention_days" {
  type = number
}

variable "apply_agent_concurrency_limits" {
  description = "Reserve per-agent concurrency from the catalogue. Needs spare account concurrency."
  type        = bool
  default     = false
}

locals {
  repo_root = "${path.module}/../../../.."
  catalog   = jsondecode(file("${local.repo_root}/backend/src/grail/agents/agent_catalog.json"))
  enabled   = [for agent in local.catalog.agents : agent if agent.enabled]
  workers   = toset([for agent in local.enabled : agent.worker])

  # Worker limits follow the strictest/longest catalogue entry it serves.
  worker_timeout     = { for w in local.workers : w => max([for a in local.enabled : a.budget.timeout_seconds if a.worker == w]...) + 15 }
  worker_concurrency = { for w in local.workers : w => min([for a in local.enabled : a.budget.max_concurrency if a.worker == w]...) }

  functions = merge(
    { for w in local.workers : "agent-${replace(w, "_", "-")}" => {
      handler     = "grail.agents.worker.handler"
      timeout     = local.worker_timeout[w]
      concurrency = local.worker_concurrency[w]
      worker      = w
      is_agent    = true
    } },
    { "workflow-control" = {
      handler     = "grail.orchestration.control.handler"
      timeout     = 30
      concurrency = 2
      worker      = ""
      is_agent    = false
    } },
  )
}

data "aws_iam_policy_document" "assume_lambda" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "function" {
  for_each           = local.functions
  name               = "${var.prefix}-${each.key}-role"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json
}

resource "aws_cloudwatch_log_group" "function" {
  for_each          = local.functions
  name              = "/aws/lambda/${var.prefix}-${each.key}"
  retention_in_days = var.log_retention_days
}

# Agents may only write logs (and invoke allowlisted models when enabled). Proposal
# persistence is performed by the workflow-control function, never by an agent.
resource "aws_iam_role_policy" "logs" {
  for_each = local.functions
  name     = "${var.prefix}-${each.key}-logs"
  role     = aws_iam_role.function[each.key].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
      Resource = "${aws_cloudwatch_log_group.function[each.key].arn}:*"
    }]
  })
}

resource "aws_iam_role_policy" "bedrock" {
  for_each = var.bedrock_invoke_policy_json == null ? {} : { for k, v in local.functions : k => v if v.is_agent }
  name     = "${var.prefix}-${each.key}-bedrock"
  role     = aws_iam_role.function[each.key].id
  policy   = var.bedrock_invoke_policy_json
}

resource "aws_lambda_function" "function" {
  for_each                       = local.functions
  function_name                  = "${var.prefix}-${each.key}"
  role                           = aws_iam_role.function[each.key].arn
  runtime                        = "python3.14"
  architectures                  = ["arm64"]
  handler                        = each.value.handler
  s3_bucket                      = var.artifact_bucket
  s3_key                         = var.backend_package_key
  source_code_hash               = var.backend_package_sha256
  memory_size                    = 512
  timeout                        = each.value.timeout
  reserved_concurrent_executions = var.apply_agent_concurrency_limits ? each.value.concurrency : null

  environment {
    variables = merge(var.environment_variables, each.value.is_agent ? { GRAIL_AGENT_WORKER = each.value.worker } : {})
  }

  logging_config {
    log_format            = "JSON"
    log_group             = aws_cloudwatch_log_group.function[each.key].name
    application_log_level = "INFO"
    system_log_level      = "WARN"
  }
}

resource "aws_cloudwatch_log_group" "state_machine" {
  name              = "/aws/vendedlogs/states/${var.prefix}-governance-workflow"
  retention_in_days = var.log_retention_days
}

data "aws_iam_policy_document" "assume_states" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "state_machine" {
  name               = "${var.prefix}-governance-workflow-role"
  assume_role_policy = data.aws_iam_policy_document.assume_states.json
}

data "aws_iam_policy_document" "state_machine" {
  statement {
    sid       = "InvokeWorkflowFunctions"
    actions   = ["lambda:InvokeFunction"]
    resources = flatten([for f in aws_lambda_function.function : [f.arn, "${f.arn}:*"]])
  }

  # CloudWatch Logs delivery for Step Functions requires these account-level actions.
  statement {
    sid = "LogDelivery"
    actions = [
      "logs:CreateLogDelivery",
      "logs:GetLogDelivery",
      "logs:UpdateLogDelivery",
      "logs:DeleteLogDelivery",
      "logs:ListLogDeliveries",
      "logs:PutResourcePolicy",
      "logs:DescribeResourcePolicies",
      "logs:DescribeLogGroups",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "state_machine" {
  name   = "${var.prefix}-governance-workflow-policy"
  role   = aws_iam_role.state_machine.id
  policy = data.aws_iam_policy_document.state_machine.json
}

resource "aws_sfn_state_machine" "governance" {
  name     = "${var.prefix}-governance-workflow"
  type     = "STANDARD"
  role_arn = aws_iam_role.state_machine.arn
  definition = templatefile("${local.repo_root}/backend/src/grail/orchestration/governance_workflow.asl.json", merge(
    { workflow_control_arn = aws_lambda_function.function["workflow-control"].arn },
    { for w in local.workers : "${w}_arn" => aws_lambda_function.function["agent-${replace(w, "_", "-")}"].arn },
  ))

  # Execution data can contain record content, so only errors are logged without payloads.
  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.state_machine.arn}:*"
    include_execution_data = false
    level                  = "ERROR"
  }

  depends_on = [aws_iam_role_policy.state_machine]
}

output "state_machine_arn" {
  value = aws_sfn_state_machine.governance.arn
}

output "state_machine_name" {
  value = aws_sfn_state_machine.governance.name
}

output "function_names" {
  value = { for key, f in aws_lambda_function.function : key => f.function_name }
}
