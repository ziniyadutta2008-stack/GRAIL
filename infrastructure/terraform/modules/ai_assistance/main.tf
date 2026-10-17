# Optional Bedrock drafting: runtime switches, quotas and an invoke policy limited to the
# allowlisted models. Disabled by default; the policy is null while disabled.

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

variable "bedrock_enabled" {
  type    = bool
  default = false
}

variable "model_allowlist" {
  description = "Bedrock model or inference-profile IDs confirmed available in the region."
  type        = list(string)
  default     = []
}

variable "daily_global_limit" {
  type    = number
  default = 0
}

variable "daily_user_limit" {
  type    = number
  default = 0
}

data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

resource "aws_ssm_parameter" "settings" {
  for_each = {
    bedrock-enabled         = tostring(var.bedrock_enabled)
    bedrock-model-allowlist = length(var.model_allowlist) > 0 ? join(",", var.model_allowlist) : "none"
    ai-daily-global-limit   = tostring(var.daily_global_limit)
    ai-daily-user-limit     = tostring(var.daily_user_limit)
  }
  name  = "/${var.prefix}/ai/${each.key}"
  type  = "String"
  value = each.value
}

data "aws_iam_policy_document" "invoke" {
  count = var.bedrock_enabled && length(var.model_allowlist) > 0 ? 1 : 0

  statement {
    sid     = "InvokeAllowlistedModels"
    actions = ["bedrock:InvokeModel", "bedrock:Converse"]
    resources = flatten([
      for model in var.model_allowlist : [
        "arn:aws:bedrock:${data.aws_region.current.region}::foundation-model/${model}",
        "arn:aws:bedrock:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:inference-profile/${model}",
      ]
    ])
  }
}

output "invoke_policy_json" {
  description = "Attach to agent roles only when Bedrock is enabled."
  value       = length(data.aws_iam_policy_document.invoke) > 0 ? data.aws_iam_policy_document.invoke[0].json : null
}

output "parameter_names" {
  value = { for key, parameter in aws_ssm_parameter.settings : key => parameter.name }
}
