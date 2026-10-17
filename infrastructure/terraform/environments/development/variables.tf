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

variable "artifact_bucket" {
  description = "Bootstrap artifact bucket name, provided by CI."
  type        = string
}

variable "backend_package_key" {
  description = "Commit-addressed key of the backend Lambda package, provided by CI."
  type        = string
}

variable "backend_package_sha256" {
  description = "Base64 SHA-256 of the backend package, provided by CI from the manifest."
  type        = string
}

variable "aurora_engine_version" {
  description = "Verified Aurora PostgreSQL version supporting 0-ACU auto-pause and Data API."
  type        = string
}

variable "enable_waf" {
  type    = bool
  default = true
}

variable "alert_email" {
  type    = string
  default = ""
}

variable "bedrock_enabled" {
  type    = bool
  default = false
}

variable "bedrock_model_allowlist" {
  type    = list(string)
  default = []
}

variable "ai_daily_global_limit" {
  type    = number
  default = 0
}

variable "ai_daily_user_limit" {
  type    = number
  default = 0
}
