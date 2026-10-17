# Composition of every GRAIL module for one environment. Environment roots only set values.

terraform {
  required_version = ">= 1.10, < 2.0"

  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 6.0"
      configuration_aliases = [aws.us_east_1]
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.7"
    }
  }
}

locals {
  app_origin      = "https://${module.edge.domain_name}"
  app_origins     = concat([local.app_origin], var.extra_app_origins)
  backend_package = { key = var.backend_package_key, sha256 = var.backend_package_sha256 }

  # AWS_REGION is set by the Lambda runtime and cannot be overridden.
  runtime_environment = {
    APP_ENV                            = var.environment
    DEPLOYMENT_ENVIRONMENT             = var.environment
    LOG_LEVEL                          = var.log_level
    DATABASE_CLUSTER_ARN               = module.database.cluster_arn
    DATABASE_SECRET_ARN                = module.database.secret_arn
    DATABASE_NAME                      = module.database.database_name
    EVIDENCE_BUCKET                    = module.evidence_storage.bucket_id
    COGNITO_USER_POOL_ID               = module.authentication.user_pool_id
    COGNITO_CLIENT_ID                  = module.authentication.client_id
    ALLOWED_ORIGINS                    = join(",", local.app_origins)
    CLOUDFRONT_ORIGIN_HEADER_PARAMETER = module.edge.origin_secret_parameter_name
    BEDROCK_ENABLED                    = tostring(var.bedrock_enabled)
    BEDROCK_MODEL_ALLOWLIST            = join(",", var.bedrock_model_allowlist)
    AGENT_CATALOG_VERSION              = var.agent_catalog_version
    AI_DAILY_GLOBAL_LIMIT              = tostring(var.ai_daily_global_limit)
    AI_DAILY_USER_LIMIT                = tostring(var.ai_daily_user_limit)
  }
}

module "frontend" {
  source        = "../frontend"
  prefix        = var.prefix
  force_destroy = var.allow_destroy
}

module "authentication" {
  source              = "../authentication"
  prefix              = var.prefix
  app_origins         = local.app_origins
  deletion_protection = !var.allow_destroy
}

module "database" {
  source                   = "../database"
  prefix                   = var.prefix
  engine_version           = var.aurora_engine_version
  min_capacity             = var.aurora_min_capacity
  max_capacity             = var.aurora_max_capacity
  seconds_until_auto_pause = var.aurora_seconds_until_auto_pause
  backup_retention_days    = var.backup_retention_days
  deletion_protection      = !var.allow_destroy
  skip_final_snapshot      = var.allow_destroy
}

module "evidence_storage" {
  source                    = "../evidence_storage"
  prefix                    = var.prefix
  force_destroy             = var.allow_destroy
  allowed_origins           = local.app_origins
  noncurrent_retention_days = var.evidence_noncurrent_retention_days
}

module "queues" {
  source = "../queues"
  prefix = var.prefix
}

module "ai_assistance" {
  source             = "../ai_assistance"
  prefix             = var.prefix
  bedrock_enabled    = var.bedrock_enabled
  model_allowlist    = var.bedrock_model_allowlist
  daily_global_limit = var.ai_daily_global_limit
  daily_user_limit   = var.ai_daily_user_limit
}

module "orchestration" {
  source                         = "../orchestration"
  prefix                         = var.prefix
  artifact_bucket                = var.artifact_bucket
  backend_package_key            = local.backend_package.key
  backend_package_sha256         = local.backend_package.sha256
  environment_variables          = local.runtime_environment
  bedrock_invoke_policy_json     = module.ai_assistance.invoke_policy_json
  log_retention_days             = var.log_retention_days
  apply_agent_concurrency_limits = var.apply_agent_concurrency_limits
}

module "compute" {
  source                      = "../compute"
  prefix                      = var.prefix
  artifact_bucket             = var.artifact_bucket
  backend_package_key         = local.backend_package.key
  backend_package_sha256      = local.backend_package.sha256
  environment_variables       = merge(local.runtime_environment, { GOVERNANCE_WORKFLOW_ARN = module.orchestration.state_machine_arn })
  database_cluster_arn        = module.database.cluster_arn
  database_secret_arn         = module.database.secret_arn
  evidence_bucket_arn         = module.evidence_storage.bucket_arn
  jobs_queue_arn              = module.queues.jobs_queue_arn
  state_machine_arn           = module.orchestration.state_machine_arn
  origin_secret_parameter_arn = module.edge.origin_secret_parameter_arn
  log_retention_days          = var.log_retention_days
}

module "api" {
  source               = "../api"
  prefix               = var.prefix
  lambda_invoke_arn    = module.compute.invoke_arn
  lambda_function_name = module.compute.function_name
  jwt_issuer           = module.authentication.issuer
  jwt_audience         = module.authentication.client_id
  api_scope            = module.authentication.api_scope
  cors_allow_origins   = var.extra_app_origins
  log_retention_days   = var.log_retention_days
}

module "edge" {
  source = "../edge"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
  prefix                          = var.prefix
  web_bucket_id                   = module.frontend.bucket_id
  web_bucket_arn                  = module.frontend.bucket_arn
  web_bucket_regional_domain_name = module.frontend.bucket_regional_domain_name
  api_endpoint                    = module.api.api_endpoint
  enable_waf                      = var.enable_waf
  origin_secret_version           = var.origin_secret_version
  csp_connect_src                 = [module.authentication.domain, "https://cognito-idp.${var.region}.amazonaws.com"]
}

module "observability" {
  source                 = "../observability"
  prefix                 = var.prefix
  alert_email            = var.alert_email
  api_id                 = module.api.api_id
  api_function_name      = module.compute.function_name
  dead_letter_queue_name = module.queues.dead_letter_queue_name
  state_machine_arn      = module.orchestration.state_machine_arn
}

module "budgets" {
  source            = "../budgets"
  prefix            = var.prefix
  environment       = var.environment
  monthly_limit_usd = var.monthly_budget_usd
  alarm_topic_arn   = module.observability.alarm_topic_arn
}
