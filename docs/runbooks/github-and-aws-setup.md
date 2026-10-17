# GitHub and AWS setup (manual, one-off)

None of this has been done yet. The workflows detect missing configuration and stop without changing AWS. Each step needs an administrator and explicit authorisation.

## 1. Repository protection (GitHub settings)

1. Protect `main`:
   - Require a pull request with at least one approval and CODEOWNERS review.
   - Require these status checks: `frontend`, `backend`, `terraform`, `workflows` (from CI).
   - Block force pushes and branch deletion.
2. Enable secret scanning with push protection, Dependabot alerts and security updates, and private vulnerability reporting.
3. Replace the placeholder owner in `CODEOWNERS` if a team should own reviews.

## 2. AWS bootstrap (once per account, administrator laptop or CloudShell)

```bash
cd infrastructure/terraform/bootstrap
terraform init
terraform plan -out=bootstrap.tfplan      # review: two buckets, OIDC provider, IAM roles
terraform apply bootstrap.tfplan           # only with explicit authorisation
terraform output                           # note bucket names and role ARNs
```

Then migrate the bootstrap state into the new bucket under `grail/bootstrap/terraform.tfstate`, or keep it in a secured location. Never commit state.

Activate the `Environment` cost-allocation tag in Billing → Cost allocation tags so the budgets can filter costs.

## 3. GitHub Environments

Create the environments `development`, `test` and `production`.

| Setting | development | test | production |
| --- | --- | --- | --- |
| Required reviewers | none | one | one or more, plus a wait timer |
| Deployment branches | `main` | `main` | `main` and protected tags |
| `AWS_DEPLOY_ROLE_ARN` (variable) | bootstrap `deploy_role_arns.development` | `…test` | `…production` |
| `TF_STATE_BUCKET` (variable) | bootstrap `state_bucket` | same | same, or the production account's bucket |
| `ARTIFACT_BUCKET` (variable) | bootstrap `artifact_bucket` | same | same |
| `AURORA_ENGINE_VERSION` (variable) | verified version (cost-controls.md) | same | same |
| `ALERT_EMAIL` (variable, optional) | address | address | address |

Repository-level variables: `AWS_CI_ROLE_ARN` (bootstrap `ci_role_arn`), `ARTIFACT_BUCKET`, `TF_STATE_BUCKET`, `AWS_REGION` (optional, default `eu-west-2`).

No AWS secrets are stored in GitHub. Every credential is short-lived and obtained through OIDC.

## 4. Release flow

1. Merge to `main`. CI builds `backend/<sha>/grail-backend.zip`, `frontend/<sha>/grail-frontend.zip` and `manifests/<sha>/build-manifest.json`.
2. `Deploy development` runs automatically when CI succeeds on `main`.
3. Run `Promote` with `target_environment=test`, using the full commit SHA that development deployed successfully.
4. Create an annotated tag on that commit (`git tag -a v0.x.y <sha> -m "…"`), then run `Promote` with `target_environment=production`, the tag and a release reason. The production environment approval gate applies.

## 5. Rollback

Re-run `Promote` for the target environment with the previous successful commit. Its artifacts are still in the artifact bucket. Database schemas are never rolled back automatically; use a forward fix (ADR-0006).
