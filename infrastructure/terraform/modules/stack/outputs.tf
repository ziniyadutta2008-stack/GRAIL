output "app_url" {
  value = "https://${module.edge.domain_name}"
}

output "cloudfront_distribution_id" {
  value = module.edge.distribution_id
}

output "web_bucket" {
  value = module.frontend.bucket_id
}

output "api_function_name" {
  value = module.compute.function_name
}

output "state_machine_arn" {
  value = module.orchestration.state_machine_arn
}

output "database_cluster_arn" {
  value = module.database.cluster_arn
}

output "database_secret_arn" {
  value     = module.database.secret_arn
  sensitive = true
}

output "cognito_user_pool_id" {
  value = module.authentication.user_pool_id
}

output "cognito_client_id" {
  value = module.authentication.client_id
}

output "cognito_domain" {
  value = module.authentication.domain
}
