# GRAIL test environment root. Separate state key, data stores, identity and role.

terraform {
  required_version = ">= 1.10, < 2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }

  # Partial configuration: supply bucket and region with -backend-config=backend.hcl.
  backend "s3" {
    key          = "grail/test/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}

locals {
  environment = "test"

  settings = {
    allow_destroy         = false
    backup_retention_days = 7
    log_retention_days    = 14
    monthly_budget_usd    = 20
    extra_app_origins     = []
  }
}

module "naming" {
  source      = "../../modules/naming"
  environment = local.environment
  owner       = var.owner
  cost_centre = var.cost_centre
}

provider "aws" {
  region = var.region
  default_tags {
    tags = module.naming.tags
  }
}

# CloudFront-scoped WAF must be created in us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags {
    tags = module.naming.tags
  }
}

module "stack" {
  source = "../../modules/stack"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  environment             = local.environment
  prefix                  = module.naming.prefix
  region                  = var.region
  artifact_bucket         = var.artifact_bucket
  backend_package_key     = var.backend_package_key
  backend_package_sha256  = var.backend_package_sha256
  aurora_engine_version   = var.aurora_engine_version
  allow_destroy           = local.settings.allow_destroy
  backup_retention_days   = local.settings.backup_retention_days
  log_retention_days      = local.settings.log_retention_days
  monthly_budget_usd      = local.settings.monthly_budget_usd
  extra_app_origins       = local.settings.extra_app_origins
  enable_waf              = var.enable_waf
  alert_email             = var.alert_email
  bedrock_enabled         = var.bedrock_enabled
  bedrock_model_allowlist = var.bedrock_model_allowlist
  ai_daily_global_limit   = var.ai_daily_global_limit
  ai_daily_user_limit     = var.ai_daily_user_limit
}
