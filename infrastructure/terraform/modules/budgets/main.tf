# Monthly cost budget for one environment. Requires the Environment cost-allocation tag
# to be activated in the Billing console (manual, one-off). Values in one TagKeyValue
# filter are ORed, so the budget filters on Environment only; keep other workloads in
# the account from reusing the same Environment values.

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

variable "environment" {
  type = string
}

variable "monthly_limit_usd" {
  type = number
}

variable "alarm_topic_arn" {
  type = string
}

resource "aws_budgets_budget" "monthly" {
  name         = "${var.prefix}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_limit_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = [format("user:Environment$%s", var.environment)]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [var.alarm_topic_arn]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "FORECASTED"
    subscriber_sns_topic_arns = [var.alarm_topic_arn]
  }
}
