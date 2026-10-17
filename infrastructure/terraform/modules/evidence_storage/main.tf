# Encrypted, versioned evidence bucket. Uploads land in quarantine/ through short-lived
# presigned URLs and move to evidence/ only after validation.

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
  type    = bool
  default = false
}

variable "allowed_origins" {
  description = "Browser origins allowed to PUT or GET through presigned URLs."
  type        = list(string)
}

variable "noncurrent_retention_days" {
  description = "How long superseded evidence versions are kept."
  type        = number
  default     = 365
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "evidence" {
  bucket        = "${var.prefix}-evidence-${data.aws_caller_identity.current.account_id}"
  force_destroy = var.force_destroy
}

resource "aws_s3_bucket_ownership_controls" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "evidence" {
  bucket                  = aws_s3_bucket.evidence.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "evidence" {
  bucket = aws_s3_bucket.evidence.id

  rule {
    id     = "expire-unvalidated-quarantine"
    status = "Enabled"
    filter {
      prefix = "quarantine/"
    }
    expiration {
      days = 1
    }
    noncurrent_version_expiration {
      noncurrent_days = 1
    }
  }

  rule {
    id     = "retain-superseded-evidence"
    status = "Enabled"
    filter {
      prefix = "evidence/"
    }
    noncurrent_version_expiration {
      noncurrent_days = var.noncurrent_retention_days
    }
  }

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  cors_rule {
    allowed_methods = ["GET", "PUT"]
    allowed_origins = var.allowed_origins
    allowed_headers = ["content-type", "content-md5", "x-amz-checksum-sha256"]
    max_age_seconds = 300
  }
}

data "aws_iam_policy_document" "evidence" {
  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.evidence.arn, "${aws_s3_bucket.evidence.arn}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  policy = data.aws_iam_policy_document.evidence.json
}

output "bucket_id" {
  value = aws_s3_bucket.evidence.id
}

output "bucket_arn" {
  value = aws_s3_bucket.evidence.arn
}
