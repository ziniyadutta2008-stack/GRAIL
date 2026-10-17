variable "environment" {
  type = string
}

variable "prefix" {
  type = string
}

variable "region" {
  type = string
}

variable "artifact_bucket" {
  description = "Bootstrap artifact bucket (immutable, commit-addressed packages)."
  type        = string
}

variable "backend_package_key" {
  type = string
}

variable "backend_package_sha256" {
  type = string
}

variable "aurora_engine_version" {
  type = string
}

variable "aurora_min_capacity" {
  type    = number
  default = 0
}

variable "aurora_max_capacity" {
  type    = number
  default = 2
}

variable "aurora_seconds_until_auto_pause" {
  type    = number
  default = 300
}

variable "backup_retention_days" {
  type    = number
  default = 7
}

variable "allow_destroy" {
  description = "Disables deletion protection and allows non-empty bucket deletion. Development only."
  type        = bool
  default     = false
}

variable "log_retention_days" {
  type    = number
  default = 14
}

variable "log_level" {
  type    = string
  default = "INFO"
}

variable "evidence_noncurrent_retention_days" {
  type    = number
  default = 365
}

variable "enable_waf" {
  type    = bool
  default = true
}

variable "origin_secret_version" {
  type    = number
  default = 1
}

variable "extra_app_origins" {
  description = "Additional app origins, such as http://localhost:5173 in development only."
  type        = list(string)
  default     = []
}

variable "alert_email" {
  type    = string
  default = ""
}

variable "monthly_budget_usd" {
  type = number
}

variable "bedrock_enabled" {
  type    = bool
  default = false
}

variable "bedrock_model_allowlist" {
  type    = list(string)
  default = []
}

variable "agent_catalog_version" {
  type    = string
  default = "2026-10-17"
}

variable "ai_daily_global_limit" {
  type    = number
  default = 0
}

variable "ai_daily_user_limit" {
  type    = number
  default = 0
}

variable "apply_agent_concurrency_limits" {
  type    = bool
  default = false
}
