# ADR-0003: Private S3 origin with OAC and a CloudFront Function for SPA routing

Status: Accepted. Date: 2026-10-17.

## Context

ATLAS serves its frontend from a public S3 website endpoint over HTTP and maps 403/404 errors to `index.html`. CLAUDE.md requires a private bucket with Origin Access Control. A distribution-wide error mapping would also turn API 403/404 responses into HTML.

## Decision

- Use a private bucket with all public access blocked and the `BucketOwnerEnforced` object-ownership setting. Read access is granted by a bucket policy limited to `cloudfront.amazonaws.com` and this distribution's ARN, through OAC (`sigv4`, always).
- A viewer-request CloudFront Function on the default behaviour rewrites application routes to `/index.html`. Only a fixed list of static asset extensions is fetched from S3. A path is not treated as a file merely because it contains a dot, so a control id such as `iso-fg-6.1.2` still returns the application. `/api/*` is a separate behaviour and its status codes pass through unchanged.
- Use managed cache policies (`Managed-CachingOptimized` for assets, `Managed-CachingDisabled` for `/api/*`) and `Managed-AllViewerExceptHostHeader` for API origin requests.
- A custom response headers policy sets the CSP, HSTS (2 years, includeSubDomains), `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin` and `X-Frame-Options: DENY`.

## Consequences

Status codes stay correct for API clients. No HTTP-only origin hop. The CSP must be updated when Cognito hosted-UI domains are introduced in Stage 2.
