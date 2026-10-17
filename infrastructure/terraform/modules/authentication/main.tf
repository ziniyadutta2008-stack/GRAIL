# Cognito user pool, managed-login domain, API resource server and a public PKCE client (ADR-0008).

terraform {
  required_version = ">= 1.10, < 2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.7"
    }
  }
}

variable "prefix" {
  type = string
}

variable "app_origins" {
  description = "HTTPS origins the browser app is served from (CloudFront, custom domain, localhost in development)."
  type        = list(string)
}

variable "deletion_protection" {
  type = bool
}

resource "random_string" "domain_suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "aws_cognito_user_pool" "this" {
  name                     = "${var.prefix}-users"
  deletion_protection      = var.deletion_protection ? "ACTIVE" : "INACTIVE"
  mfa_configuration        = "OPTIONAL"
  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 3
  }

  software_token_mfa_configuration {
    enabled = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

resource "aws_cognito_user_pool_domain" "this" {
  domain       = "${var.prefix}-${random_string.domain_suffix.result}"
  user_pool_id = aws_cognito_user_pool.this.id
}

resource "aws_cognito_resource_server" "api" {
  identifier   = "grail-api"
  name         = "${var.prefix}-api"
  user_pool_id = aws_cognito_user_pool.this.id

  scope {
    scope_name        = "access"
    scope_description = "Call the GRAIL API as the signed-in user."
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name                                 = "${var.prefix}-web"
  user_pool_id                         = aws_cognito_user_pool.this.id
  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "${aws_cognito_resource_server.api.identifier}/access"]
  supported_identity_providers         = ["COGNITO"]
  callback_urls                        = [for origin in var.app_origins : "${origin}/auth/callback"]
  logout_urls                          = [for origin in var.app_origins : "${origin}/sign-in"]
  explicit_auth_flows                  = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation              = true
  access_token_validity                = 60
  id_token_validity                    = 60
  refresh_token_validity               = 12

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "hours"
  }
}

data "aws_region" "current" {}

output "user_pool_id" {
  value = aws_cognito_user_pool.this.id
}

output "user_pool_arn" {
  value = aws_cognito_user_pool.this.arn
}

output "client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "issuer" {
  value = "https://cognito-idp.${data.aws_region.current.region}.amazonaws.com/${aws_cognito_user_pool.this.id}"
}

output "domain" {
  value = "https://${aws_cognito_user_pool_domain.this.domain}.auth.${data.aws_region.current.region}.amazoncognito.com"
}

output "api_scope" {
  value = "${aws_cognito_resource_server.api.identifier}/access"
}
