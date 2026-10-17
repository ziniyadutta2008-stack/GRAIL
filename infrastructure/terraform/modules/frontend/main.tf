# Private S3 bucket for the built frontend. Read access is granted to CloudFront
# through Origin Access Control by the edge module's bucket policy.

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

variable "force_destroy" {
  description = "Allow deleting a non-empty bucket. Only true in development."
  type        = bool
  default     = false
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "web" {
  bucket        = "${var.prefix}-web-${data.aws_caller_identity.current.account_id}"
  force_destroy = var.force_destroy
}

resource "aws_s3_bucket_ownership_controls" "web" {
  bucket = aws_s3_bucket.web.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "web" {
  bucket                  = aws_s3_bucket.web.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "web" {
  bucket = aws_s3_bucket.web.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "web" {
  bucket = aws_s3_bucket.web.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Previous entry documents stay available for rollback, then expire.
resource "aws_s3_bucket_lifecycle_configuration" "web" {
  bucket = aws_s3_bucket.web.id
  rule {
    id     = "expire-noncurrent"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

output "bucket_id" {
  value = aws_s3_bucket.web.id
}

output "bucket_arn" {
  value = aws_s3_bucket.web.arn
}

output "bucket_regional_domain_name" {
  value = aws_s3_bucket.web.bucket_regional_domain_name
}
