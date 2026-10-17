# Alarm topic, core alarms and a small operations dashboard.

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

variable "alert_email" {
  description = "Optional address subscribed to alarms; confirmation is manual."
  type        = string
  default     = ""
}

variable "api_id" {
  type = string
}

variable "api_function_name" {
  type = string
}

variable "dead_letter_queue_name" {
  type = string
}

variable "state_machine_arn" {
  type = string
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

resource "aws_sns_topic" "alarms" {
  name              = "${var.prefix}-alarms"
  kms_master_key_id = "alias/aws/sns"
}

data "aws_iam_policy_document" "alarms" {
  statement {
    sid       = "CloudWatchAndBudgets"
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.alarms.arn]
    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com", "budgets.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_sns_topic_policy" "alarms" {
  arn    = aws_sns_topic.alarms.arn
  policy = data.aws_iam_policy_document.alarms.json
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alert_email == "" ? 0 : 1
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

locals {
  alarms = {
    api-5xx = {
      namespace  = "AWS/ApiGateway"
      metric     = "5xx"
      dimensions = { ApiId = var.api_id }
      threshold  = 5
      statistic  = "Sum"
    }
    api-lambda-errors = {
      namespace  = "AWS/Lambda"
      metric     = "Errors"
      dimensions = { FunctionName = var.api_function_name }
      threshold  = 5
      statistic  = "Sum"
    }
    dlq-messages = {
      namespace  = "AWS/SQS"
      metric     = "ApproximateNumberOfMessagesVisible"
      dimensions = { QueueName = var.dead_letter_queue_name }
      threshold  = 0
      statistic  = "Maximum"
    }
    workflow-failures = {
      namespace  = "AWS/States"
      metric     = "ExecutionsFailed"
      dimensions = { StateMachineArn = var.state_machine_arn }
      threshold  = 0
      statistic  = "Sum"
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "this" {
  for_each            = local.alarms
  alarm_name          = "${var.prefix}-${each.key}"
  namespace           = each.value.namespace
  metric_name         = each.value.metric
  dimensions          = each.value.dimensions
  statistic           = each.value.statistic
  period              = 300
  evaluation_periods  = 1
  threshold           = each.value.threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]
}

resource "aws_cloudwatch_dashboard" "operations" {
  dashboard_name = "${var.prefix}-operations"
  dashboard_body = jsonencode({
    widgets = [for index, key in keys(local.alarms) : {
      type   = "metric"
      x      = (index % 2) * 12
      y      = floor(index / 2) * 6
      width  = 12
      height = 6
      properties = {
        title   = key
        region  = data.aws_region.current.region
        stat    = local.alarms[key].statistic
        period  = 300
        metrics = [concat([local.alarms[key].namespace, local.alarms[key].metric], flatten([for k, v in local.alarms[key].dimensions : [k, v]]))]
      }
    }]
  })
}

output "alarm_topic_arn" {
  value = aws_sns_topic.alarms.arn
}
