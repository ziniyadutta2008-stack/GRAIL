output "app_url" {
  value = module.stack.app_url
}

output "cloudfront_distribution_id" {
  value = module.stack.cloudfront_distribution_id
}

output "web_bucket" {
  value = module.stack.web_bucket
}

output "api_function_name" {
  value = module.stack.api_function_name
}

output "state_machine_arn" {
  value = module.stack.state_machine_arn
}

output "database_cluster_arn" {
  value = module.stack.database_cluster_arn
}

output "database_secret_arn" {
  value     = module.stack.database_secret_arn
  sensitive = true
}

output "cognito_user_pool_id" {
  value = module.stack.cognito_user_pool_id
}

output "cognito_client_id" {
  value = module.stack.cognito_client_id
}

output "cognito_domain" {
  value = module.stack.cognito_domain
}
