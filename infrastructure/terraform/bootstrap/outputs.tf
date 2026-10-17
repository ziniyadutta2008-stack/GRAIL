output "state_bucket" {
  value = aws_s3_bucket.this["state"].id
}

output "artifact_bucket" {
  value = aws_s3_bucket.this["artifacts"].id
}

output "deploy_role_arns" {
  description = "Set each as the AWS_DEPLOY_ROLE_ARN variable of the matching GitHub Environment."
  value       = { for env, role in aws_iam_role.deploy : env => role.arn }
}

output "ci_role_arn" {
  description = "Set as the repository variable AWS_CI_ROLE_ARN."
  value       = aws_iam_role.ci.arn
}
