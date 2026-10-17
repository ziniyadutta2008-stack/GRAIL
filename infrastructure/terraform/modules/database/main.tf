# Aurora Serverless v2 PostgreSQL with Data API, RDS-managed credentials and 0-ACU auto-pause.
# The cluster sits in a dedicated VPC with no internet gateway, no NAT and no ingress.

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

variable "engine_version" {
  description = "Aurora PostgreSQL version verified to support 0-ACU auto-pause and Data API in the region (see docs/architecture/cost-controls.md)."
  type        = string
}

variable "database_name" {
  type    = string
  default = "grail"
}

variable "min_capacity" {
  type    = number
  default = 0
}

variable "max_capacity" {
  type    = number
  default = 2
}

variable "seconds_until_auto_pause" {
  type    = number
  default = 300
}

variable "backup_retention_days" {
  type    = number
  default = 7
}

variable "deletion_protection" {
  type = bool
}

variable "skip_final_snapshot" {
  description = "Only true in development, where controlled destroy is allowed."
  type        = bool
  default     = false
}

variable "vpc_cidr" {
  type    = string
  default = "10.42.0.0/24"
}

# Fails the plan if the requested engine version is not offered in this region.
data "aws_rds_engine_version" "selected" {
  engine  = "aurora-postgresql"
  version = var.engine_version
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "database" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "${var.prefix}-database"
  }
}

# Lock down the VPC default security group; nothing uses it.
resource "aws_default_security_group" "database" {
  vpc_id = aws_vpc.database.id
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.database.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 2, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = {
    Name = "${var.prefix}-database-${count.index}"
  }
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.prefix}-database"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "cluster" {
  name        = "${var.prefix}-database"
  description = "Aurora cluster; no ingress. Access is only through the RDS Data API."
  vpc_id      = aws_vpc.database.id
}

resource "aws_rds_cluster" "this" {
  cluster_identifier                  = "${var.prefix}-aurora"
  engine                              = data.aws_rds_engine_version.selected.engine
  engine_version                      = data.aws_rds_engine_version.selected.version
  engine_mode                         = "provisioned"
  database_name                       = var.database_name
  master_username                     = "grail_admin"
  manage_master_user_password         = true
  enable_http_endpoint                = true
  storage_encrypted                   = true
  iam_database_authentication_enabled = true
  db_subnet_group_name                = aws_db_subnet_group.this.name
  vpc_security_group_ids              = [aws_security_group.cluster.id]
  backup_retention_period             = var.backup_retention_days
  preferred_backup_window             = "02:00-03:00"
  preferred_maintenance_window        = "sun:03:30-sun:04:30"
  copy_tags_to_snapshot               = true
  deletion_protection                 = var.deletion_protection
  skip_final_snapshot                 = var.skip_final_snapshot
  final_snapshot_identifier           = var.skip_final_snapshot ? null : "${var.prefix}-aurora-final"

  serverlessv2_scaling_configuration {
    min_capacity             = var.min_capacity
    max_capacity             = var.max_capacity
    seconds_until_auto_pause = var.min_capacity == 0 ? var.seconds_until_auto_pause : null
  }
}

resource "aws_rds_cluster_instance" "writer" {
  identifier                   = "${var.prefix}-aurora-writer"
  cluster_identifier           = aws_rds_cluster.this.id
  instance_class               = "db.serverless"
  engine                       = aws_rds_cluster.this.engine
  engine_version               = aws_rds_cluster.this.engine_version
  auto_minor_version_upgrade   = true
  performance_insights_enabled = false
}

output "cluster_arn" {
  value = aws_rds_cluster.this.arn
}

output "secret_arn" {
  description = "RDS-managed master credential secret."
  value       = aws_rds_cluster.this.master_user_secret[0].secret_arn
}

output "database_name" {
  value = aws_rds_cluster.this.database_name
}
