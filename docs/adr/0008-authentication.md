# ADR-0008: Cognito with PKCE; development-only persona stub

Status: Accepted. Date: 2026-10-17.

## Decision

- A Cognito user pool with administrator-created users, a strong password policy, optional TOTP MFA, a public app client using authorization code + PKCE, and a resource-server scope `grail-api/access`. The API Gateway JWT authorizer checks issuer, audience (client ID) and scope.
- The browser keeps tokens in memory only. The Stage 2 implementation will use the managed login with PKCE and short-lived access tokens. No token goes to `localStorage`.
- With no Cognito configuration and `import.meta.env.DEV` true, the frontend provides a **development persona stub** that lets a reviewer choose one of the nine synthetic personas. The stub only changes emphasis and visible actions. It never reaches a deployed environment: production builds without Cognito configuration show a configuration error.
- Organization membership and role always come from the database, never from Cognito groups or token claims beyond `sub`.
- Build once, promote everywhere: Cognito identifiers differ per environment, so the frontend must not bake them in at build time. In Stage 2 the deploy step writes a small `config.json` from Terraform outputs next to `index.html`, and the app reads it at start-up. Until then, deployed builds run in the `unconfigured` mode and refuse sign-in.

## Demonstration sign-in is not the production design

The public preview and local development use a synthetic persona picker. It changes which screens and actions a reviewer can see. It does not authenticate a person, issue a token, or isolate a tenant.

Production deployments target these controls:

- **Amazon Cognito or enterprise SSO.** Administrator-created users, or federation to the organization's identity provider. The preview persona list is not an account directory.
- **Multi-factor authentication.** Optional TOTP in the user pool for the portfolio environment, required for privileged roles before a production launch.
- **Tenant isolation.** Every request is authorized for one organization. Membership comes from the application database for the token subject. A caller-supplied organization id is not sufficient.
- **Session expiry.** Short-lived access tokens, in memory only. No long-lived token in `localStorage`. Refresh and idle expiry follow the Cognito client settings for that environment.
- **Role and group mapping.** Cognito establishes identity. GRAIL roles are assigned in the membership record. Hiding a button is not authorization.
- **Privileged-access logging.** Administration, approvals, risk acceptance, exception decisions and evidence validation write an append-only audit event with actor, organization, action and timestamp.
- **API authorisation independent of the frontend.** API Gateway validates the Cognito JWT. The Lambda handler checks organization membership and the permission for the mutation. A read-only caller receives 403 even if the browser shows the control.

## Divergence from ATLAS

ATLAS uses Clerk. CLAUDE.md mandates Cognito, and keeping identity inside the AWS account also avoids a third-party processor for governance data.
