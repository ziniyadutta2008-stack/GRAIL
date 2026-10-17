variable "region" {
  type    = string
  default = "eu-west-2"
}

variable "owner" {
  type    = string
  default = "ai-governance"
}

variable "cost_centre" {
  type    = string
  default = "portfolio"
}

variable "github_repository" {
  description = "owner/name of the canonical repository."
  type        = string
  default     = "ziniyadutta2008-stack/GRAIL"
}

variable "github_oidc_provider_arn" {
  description = "ARN of an existing GitHub Actions OIDC provider. An account can have only one provider for token.actions.githubusercontent.com. Leave empty to create it."
  type        = string
  default     = ""
}

variable "environments" {
  description = "Environments hosted in this account. Use one account per environment where feasible."
  type        = list(string)
  default     = ["development", "test", "production"]

  validation {
    condition     = alltrue([for env in var.environments : contains(["development", "test", "production"], env)])
    error_message = "environments may only contain development, test and production."
  }
}

variable "deploy_services" {
  description = "AWS service prefixes a deploy role may manage."
  type        = list(string)
  default = [
    "apigateway", "budgets", "cloudfront", "cloudwatch", "cognito-idp", "ec2", "iam", "lambda",
    "logs", "rds", "s3", "secretsmanager", "sns", "sqs", "ssm", "states", "wafv2", "xray",
  ]
}
