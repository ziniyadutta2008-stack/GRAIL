# GitHub Actions roles. Deploy roles trust only their GitHub Environment; the plan role
# trusts pull requests and main for read-only planning and drift detection.

locals {
  oidc_sub_prefix = "repo:${var.github_repository}"
}

data "aws_iam_policy_document" "deploy_trust" {
  for_each = toset(var.environments)
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_provider_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["${local.oidc_sub_prefix}:environment:${each.key}"]
    }
  }
}

# The boundary caps what any deploy role can ever do, whatever its attached policy says.
data "aws_iam_policy_document" "deploy_boundary" {
  for_each = toset(var.environments)

  statement {
    sid       = "AllowManagedServices"
    actions   = [for service in var.deploy_services : "${service}:*"]
    resources = ["*"]
  }

  statement {
    sid    = "DenyIamOutsideEnvironmentPrefix"
    effect = "Deny"
    actions = [
      "iam:CreateRole", "iam:DeleteRole", "iam:PutRolePolicy", "iam:DeleteRolePolicy",
      "iam:AttachRolePolicy", "iam:DetachRolePolicy", "iam:UpdateAssumeRolePolicy", "iam:PassRole",
    ]
    not_resources = ["arn:aws:iam::${local.account_id}:role/grail-${each.key}-*"]
  }

  statement {
    sid     = "DenyStateOfOtherEnvironments"
    effect  = "Deny"
    actions = ["s3:PutObject", "s3:DeleteObject"]
    resources = [
      for key in concat(["bootstrap"], [for env in var.environments : env if env != each.key]) :
      "${aws_s3_bucket.this["state"].arn}/grail/${key}/*"
    ]
  }

  statement {
    sid       = "DenyAccountAndBootstrapChanges"
    effect    = "Deny"
    actions   = ["organizations:*", "account:*", "iam:CreateUser", "iam:CreateAccessKey", "iam:CreateOpenIDConnectProvider", "iam:DeleteOpenIDConnectProvider"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "deploy_boundary" {
  for_each = toset(var.environments)
  name     = "grail-${each.key}-deploy-boundary"
  policy   = data.aws_iam_policy_document.deploy_boundary[each.key].json
}

resource "aws_iam_role" "deploy" {
  for_each             = toset(var.environments)
  name                 = "grail-${each.key}-github-deploy"
  assume_role_policy   = data.aws_iam_policy_document.deploy_trust[each.key].json
  permissions_boundary = aws_iam_policy.deploy_boundary[each.key].arn
  max_session_duration = 3600
}

# Scaffold: service-scoped access inside the boundary. Narrow to resource-prefix
# conditions before the production promotion exercise (security-boundaries.md).
data "aws_iam_policy_document" "deploy" {
  for_each = toset(var.environments)

  statement {
    sid       = "ManageEnvironmentResources"
    actions   = [for service in var.deploy_services : "${service}:*"]
    resources = ["*"]
  }

  statement {
    sid       = "EnvironmentState"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.this["state"].arn}/grail/${each.key}/*"]
  }

  statement {
    sid       = "ListState"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.this["state"].arn]
  }

  statement {
    sid       = "ReadArtifacts"
    actions   = ["s3:GetObject", "s3:ListBucket"]
    resources = [aws_s3_bucket.this["artifacts"].arn, "${aws_s3_bucket.this["artifacts"].arn}/*"]
  }
}

resource "aws_iam_role_policy" "deploy" {
  for_each = toset(var.environments)
  name     = "grail-${each.key}-deploy"
  role     = aws_iam_role.deploy[each.key].id
  policy   = data.aws_iam_policy_document.deploy[each.key].json
}

data "aws_iam_policy_document" "ci_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_provider_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "${local.oidc_sub_prefix}:ref:refs/heads/main",
        "${local.oidc_sub_prefix}:pull_request",
      ]
    }
  }
}

# Builds publish artifacts from main; plans and drift checks are read-only.
resource "aws_iam_role" "ci" {
  name                 = "grail-github-ci"
  assume_role_policy   = data.aws_iam_policy_document.ci_trust.json
  max_session_duration = 3600
}

resource "aws_iam_role_policy_attachment" "ci_read_only" {
  role       = aws_iam_role.ci.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

data "aws_iam_policy_document" "ci" {
  statement {
    sid       = "PublishArtifacts"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.this["artifacts"].arn}/*"]
  }

  statement {
    sid       = "ReadState"
    actions   = ["s3:GetObject", "s3:ListBucket"]
    resources = [aws_s3_bucket.this["state"].arn, "${aws_s3_bucket.this["state"].arn}/grail/*"]
  }
}

resource "aws_iam_role_policy" "ci" {
  name   = "grail-github-ci"
  role   = aws_iam_role.ci.id
  policy = data.aws_iam_policy_document.ci.json
}
