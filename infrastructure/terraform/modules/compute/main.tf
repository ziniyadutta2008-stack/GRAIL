# The domain API Lambda and its least-privilege role. Lambdas run outside any VPC and
# reach Aurora only through the Data API, so no NAT Gateway is needed.

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
  description = "Bootstrap artifact bucket holding immutable, commit-addressed packages."
  type        = string
}

variable "backend_package_key" {
  type = string
}

variable "backend_package_sha256" {
  description = "Base64-encoded SHA-256 of the package, recorded in the deployment manifest."
  type        = string
}

variable "environment_variables" {
  description = "Non-secret runtime configuration."
  type        = map(string)
}

variable "database_cluster_arn" {
  type = string
}

variable "database_secret_arn" {
  type = string
}

variable "evidence_bucket_arn" {
  type = string
}

variable "jobs_queue_arn" {
  type = string
}

variable "state_machine_arn" {
  type = string
}

variable "origin_secret_parameter_arn" {
  type = string
}

variable "log_retention_days" {
  type = number
}

variable "reserved_concurrency" {
  description = "Null leaves the function on unreserved account concurrency."
  type        = number
  default     = null
}

variable "tracing_mode" {
  type    = string
  default = "PassThrough"
}

locals {
  function_name = "${var.prefix}-api"
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

resource "aws_iam_role" "api" {
  name               = "${local.function_name}-role"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = var.log_retention_days
}

data "aws_iam_policy_document" "api" {
  statement {
    sid       = "WriteOwnLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.api.arn}:*"]
  }

  statement {
    sid = "DataApi"
    actions = [
      "rds-data:ExecuteStatement",
      "rds-data:BatchExecuteStatement",
      "rds-data:BeginTransaction",
      "rds-data:CommitTransaction",
      "rds-data:RollbackTransaction",
    ]
    resources = [var.database_cluster_arn]
  }

  statement {
    sid       = "DatabaseSecret"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.database_secret_arn]
  }

  statement {
    sid       = "OriginSecret"
    actions   = ["ssm:GetParameter"]
    resources = [var.origin_secret_parameter_arn]
  }

  statement {
    sid       = "EvidenceObjects"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["${var.evidence_bucket_arn}/quarantine/*", "${var.evidence_bucket_arn}/evidence/*"]
  }

  statement {
    sid       = "EnqueueJobs"
    actions   = ["sqs:SendMessage"]
    resources = [var.jobs_queue_arn]
  }

  statement {
    sid       = "StartGovernanceWorkflow"
    actions   = ["states:StartExecution"]
    resources = [var.state_machine_arn]
  }

  statement {
    sid       = "Tracing"
    actions   = ["xray:PutTraceSegments", "xray:PutTelemetryRecords"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "api" {
  name   = "${local.function_name}-policy"
  role   = aws_iam_role.api.id
  policy = data.aws_iam_policy_document.api.json
}

resource "aws_lambda_function" "api" {
  function_name                  = local.function_name
  role                           = aws_iam_role.api.arn
  runtime                        = "python3.14"
  architectures                  = ["arm64"]
  handler                        = "grail.api.lambda_handler.handler"
  s3_bucket                      = var.artifact_bucket
  s3_key                         = var.backend_package_key
  source_code_hash               = var.backend_package_sha256
  memory_size                    = 512
  timeout                        = 15
  reserved_concurrent_executions = var.reserved_concurrency

  environment {
    variables = var.environment_variables
  }

  logging_config {
    log_format            = "JSON"
    log_group             = aws_cloudwatch_log_group.api.name
    application_log_level = "INFO"
    system_log_level      = "WARN"
  }

  tracing_config {
    mode = var.tracing_mode
  }
}

output "function_name" {
  value = aws_lambda_function.api.function_name
}

output "function_arn" {
  value = aws_lambda_function.api.arn
}

output "invoke_arn" {
  value = aws_lambda_function.api.invoke_arn
}
