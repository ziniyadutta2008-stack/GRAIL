# Naming and tagging conventions. Pure computation: no resources.

terraform {
  required_version = ">= 1.10, < 2.0"
}

variable "project" {
  description = "Project name used as the resource prefix root."
  type        = string
  default     = "grail"
}

variable "environment" {
  description = "Deployment environment."
  type        = string

  validation {
    condition     = contains(["development", "test", "production"], var.environment)
    error_message = "environment must be development, test or production."
  }
}

variable "owner" {
  description = "Accountable owner tag value."
  type        = string
}

variable "cost_centre" {
  description = "Cost centre tag value."
  type        = string
}

variable "data_classification" {
  description = "Highest data classification held in this environment."
  type        = string
  default     = "Synthetic"
}

locals {
  prefix = "${var.project}-${var.environment}"
}

output "prefix" {
  description = "Resource name prefix, for example grail-development."
  value       = local.prefix
}

output "tags" {
  description = "Default tags applied through the provider."
  value = {
    Project            = var.project
    Environment        = var.environment
    Owner              = var.owner
    ManagedBy          = "terraform"
    CostCentre         = var.cost_centre
    DataClassification = var.data_classification
  }
}
