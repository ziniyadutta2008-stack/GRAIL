# Cost controls

When idle, the portfolio environment should cost close to zero. The figures below are order-of-magnitude estimates for eu-west-2 at portfolio usage. Confirm them with the AWS Pricing Calculator before deployment.

## Cost drivers

| Driver | Control in GRAIL | Idle cost tendency |
| --- | --- | --- |
| Aurora Serverless v2 | `min_capacity = 0`, `seconds_until_auto_pause = 300`, `max_capacity = 2`; Data API; no RDS Proxy; Performance Insights off outside production | Storage and backups only while paused. Each wake takes several seconds of latency |
| AWS WAF | One web ACL per environment with AWS managed common rules and one rate rule; no bot control | About USD 5/month per ACL plus rules. **This is the largest fixed cost.** Consider sharing or omitting it in development; see below |
| CloudFront | Price class 100; frontend assets cached; `/api/*` uncached | Requests only |
| API Gateway HTTP API | Stage throttling (burst/rate) per environment | Per request |
| Lambda | Arm64, 256–512 MB, explicit timeouts, optional reserved concurrency | Per invocation |
| Step Functions Standard | Bounded, linear workflow; no polling or wait states | Per state transition |
| Bedrock | **Disabled by default** in every environment. Allowlisted small text model; per-user and global daily quotas; per-agent token, timeout and concurrency budgets; cache by input hash + prompt version | Zero while disabled |
| S3 | Lifecycle on quarantine (1 day) and noncurrent evidence versions; frontend noncurrent versions expire | Storage only |
| CloudWatch | 14-day log retention by default; few alarms; one small dashboard; X-Ray sampling at a low rate | Low |
| Secrets Manager | One RDS-managed secret per environment | About USD 0.40/month per secret |
| KMS | AWS-managed keys only (ADR-0009) | Zero key charge |
| NAT Gateway | **Not created**. The Aurora VPC has no internet path. The Lambdas run outside the VPC | Zero |
| OpenSearch, provisioned throughput, containers, scheduled polling | Not used | Zero |

The WAF fixed cost appears once in each environment that is deployed. The variable `enable_waf` defaults to `true` everywhere. Leave development without WAF only if the CloudFront origin-secret header and Cognito authorizer are judged sufficient for a private demo. Record that decision.

## Budgets

The `budgets` module creates a monthly `COST` budget for each environment, filtered by the `Environment=<env>` cost-allocation tag. Values inside one AWS Budgets tag filter are combined with OR, so adding `Project=grail` would widen the filter, not narrow it. Keep other workloads in the account from reusing these Environment values. The budget notifies at 80% of actual spend and 100% of forecast spend. Activate the `Environment` cost-allocation tag in the Billing console. AWS does not activate it automatically, and until it is active the filter matches nothing.

Suggested limits are development USD 20, test USD 20 and production USD 40. Each environment can set its own value.

## Pre-deployment verification (read-only)

Run these commands before Stage 5. They only read information.

```bash
# Aurora PostgreSQL versions offered in the region (Serverless v2 uses engine mode "provisioned")
aws rds describe-db-engine-versions --engine aurora-postgresql --region eu-west-2 \
  --query "DBEngineVersions[].EngineVersion" --output text

# Serverless v2 0-ACU auto-pause and Data API support are documented per version:
#  https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2-auto-pause.html
#  https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
# Record the chosen engine_version in the environment tfvars and in the deployment manifest.

# Lambda runtime availability
aws lambda list-layers --compatible-runtime python3.14 --region eu-west-2 --max-items 1

# Bedrock models available in the region (for the allowlist)
aws bedrock list-foundation-models --region eu-west-2 --by-output-modality TEXT \
  --query "modelSummaries[].modelId" --output text
```

## AI spend guardrails (contract)

- `BEDROCK_ENABLED=false` by default. Local runs and CI never enable it.
- `AI_DAILY_GLOBAL_LIMIT` and `AI_DAILY_USER_LIMIT` are enforced before invocation (Stage 4).
- `agent_catalog.json` sets `max_output_tokens`, `timeout_seconds`, `max_retries` and `max_concurrency` for each agent.
- A circuit breaker opens when schema failures, model errors or daily spend exceed thresholds (Stage 4).
- Seeded deterministic drafts keep every golden-path screen useful at zero AI spend.
