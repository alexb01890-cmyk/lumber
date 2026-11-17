# Deploy the lumber CRM on Vercel

This deployment preserves Twenty CRM and the Lumber Distribution app. The root `vercel.json` runs the official, pinned Twenty 2.58.0 image as one HTTP service (frontend and API) and one background worker daemon. It does not build Twenty's large development monorepo during deployment.

Vercel Containers, Services and Daemons are beta features. Daemons currently run only in production; a preview deployment cannot run the complete CRM. This deployment deliberately rejects preview runtime startup rather than connect a preview to production customer data or queues.

## Required services

Provision real resources before deploying:

- PostgreSQL with permission to create schemas and the `uuid-ossp`, `unaccent` and `citext` extensions. Use a direct, non-transaction-pooled connection for bootstrap and migrations.
- Redis with a native TCP/TLS URL compatible with BullMQ. A Redis REST URL/token alone is insufficient.
- S3-compatible object storage for attachments, app source and executable bundles. Both the API and worker use the same bucket and credentials. Keep the bucket private and allow the CRM's production HTTPS origin in its CORS configuration for presigned uploads.

Persistent data lives in those services. Vercel container filesystems and `/tmp` are temporary. The deployment uses `/tmp` only for rebuildable function caches.

For Supabase PostgreSQL, append `sslmode=verify-full&sslrootcert=/app/vercel/certificates/supabase-root-ca-bundle.crt` to the connection URL. The image includes the public 2021 and 2025 production roots from the [official Supabase CLI templates](https://github.com/supabase/cli/tree/develop/apps/cli/src/command-internal/supabase-ca-templates). The certificate bundle applies only to this database connection; keep hostname and certificate verification enabled. Other PostgreSQL providers can use their normal verified connection settings.

An always-running worker consumes Vercel's provisioned-memory allowance even while idle. A free plan's monthly quota may stop the worker before the month ends. Review the plan and provider prices before using this as an always-on business CRM; this configuration does not promise free hosting.

## Configure the Vercel project

1. Import `alexb01890-cmyk/lumber` into the intended Vercel team.
2. Use the repository root as **Root Directory**. Do not choose `packages/twenty-website` or the lumber SDK app folder.
3. Let root `vercel.json` select the container service and worker. Do not override it with a Next.js/Vite build command or install the whole development workspace.
4. Under project **Settings > Environment Variables**, add the settings below to **Production**. Store values in Vercel, never Git or chat.

| Variable | Value |
| --- | --- |
| `SERVER_URL` | Stable production HTTPS URL, such as the project's assigned `.vercel.app` domain. |
| `PORT` | `3000`; Vercel's container router needs this explicitly. |
| `PG_DATABASE_URL` | Direct PostgreSQL connection string. |
| `REDIS_URL` | Native `rediss://` connection string for managed Redis (or `redis://` on a trusted private network). |
| `ENCRYPTION_KEY` | One generated secret shared by API and worker; preserve it across deployments. |
| `STORAGE_S3_NAME` | Private bucket name. |
| `STORAGE_S3_REGION` | Bucket/provider region. |
| `STORAGE_S3_ENDPOINT` | S3-compatible endpoint, if the provider requires one; omit it for ordinary AWS S3. |
| `STORAGE_S3_ACCESS_KEY_ID` | Storage access key. |
| `STORAGE_S3_SECRET_ACCESS_KEY` | Storage secret key. |
| `STORAGE_S3_PRESIGNED_URL_ENABLED` | `true`. Configure bucket CORS for your HTTPS origin. |
| `AUTH_PASSWORD_ENABLED` | `true`; use Twenty's native email/password login. |
| `SIGN_IN_PREFILLED` | `false`; do not use development/demo sign-in settings. |
| `AUTH_GOOGLE_ENABLED`, `AUTH_MICROSOFT_ENABLED` | `false` for a password-only test workspace. |
| `IS_MULTIWORKSPACE_ENABLED` | `false`. |
| `IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS` | `true`. |

The images set remote S3 storage, enable the trusted lumber calculation functions, and disable Twenty cloud billing and multi-workspace signup. The worker receives `SERVER_INTERNAL_URL` through a Vercel service binding; do not replace that binding with a hardcoded preview URL. The HTTP service uses its own loopback URL for internal requests.

Vercel must expose its deployment identity to the runtime (`VERCEL_DEPLOYMENT_ID` or `VERCEL_GIT_COMMIT_SHA`) so a web container can match the worker's completed bootstrap to the same release. Ensure automatic system environment variables are enabled in the project.

## Database bootstrap and startup

The worker acquires a PostgreSQL advisory lock, initializes an empty database or upgrades an existing one, flushes the metadata cache, and registers scheduled jobs. It marks that release ready only after every command succeeds, then starts the queue worker. Failed bootstrap stops the worker with an error.

HTTP containers wait for the matching readiness marker and then start the API. They never run migrations or register scheduled jobs on a cold start. This avoids concurrent schema changes when Vercel starts multiple HTTP instances.

Deploy an active **Production** release behind the onboarding protection below and inspect both service and daemon logs. A staged `--prod --skip-domain` deployment may not start its daemon until it becomes the active production release; HTTP containers will then keep waiting for bootstrap. Production here selects Vercel's environment; creating the first CRM account and installing the lumber app remain separate steps.

## Protect the first owner signup

Before the first working deployment, set **Settings > Deployment Protection > Vercel Authentication > All Deployments**. The API setting is `ssoProtection.deploymentType: "all"`. This is available on Hobby and does not require the paid Password Protection feature. Verify that an unauthenticated visitor is sent to Vercel login on every production, branch and deployment URL. Standard Protection (`all_except_custom_domains`) leaves production domains public, and `--skip-domain` alone is not an access gate.

Keep `SERVER_URL` set to the stable production HTTPS hostname during onboarding. The owner first signs in to Vercel, then creates their own Twenty email/password account at that hostname and completes workspace onboarding. They enter the password directly on the site. Do not create a shared default administrator or run Twenty's development seed.

This outer gate matters even with signup restrictions enabled: Twenty allows initial signup while no workspace exists, and the first user receives server-administrator access. Its native configuration has no owner-email allowlist for claiming an empty instance. Keep Vercel Authentication enabled until the owner has claimed the workspace and the checks below pass.

## Install the lumber app and close general invitations

After owner onboarding, run these commands on Windows with Node.js 24 and Git installed. While Vercel Authentication remains enabled, CLI requests also need approved platform access: configure its [automation bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) privately through the Twenty CLI's `--proxy-header-command` support. A Twenty access token alone does not bypass Vercel's gate. Never commit the bypass secret or send it in chat.

```powershell
npm.cmd install -g twenty@2.58.0 @yarnpkg/cli-dist@4.18.1
git clone --branch codex/lumber-distribution-crm --depth 1 --filter=blob:none --sparse https://github.com/alexb01890-cmyk/lumber.git lumber
cd lumber
git sparse-checkout set .yarn/releases packages/twenty-apps/internal/lumber-distribution
cd packages/twenty-apps/internal/lumber-distribution
yarn.cmd install
twenty.cmd auth login --url https://YOUR-PRODUCTION-DOMAIN --name lumber
twenty.cmd app apply --create --remote lumber
```

Replace the URL with your actual production URL. This opens browser authentication; it does not require sending a password or token to anyone. After apply succeeds, refresh the CRM and open **Lumber Overview**. Merely starting Twenty does not install the lumber SDK app.

The clone command selects the pull request branch while these changes are unmerged. After merge, use `main`. For an existing checkout, switch to the intended branch instead of cloning over local work.

In the workspace settings, keep password authentication enabled, disable the general public invite link (`isPublicInviteLinkEnabled: false`), and leave approved access domains empty. Add testers through individual email invitations. These remain available with multi-workspace signup disabled. Workspace discoverability can be `MEMBERS_AND_INVITEES` or `HIDDEN`, but hiding a workspace is not a substitute for authentication.

Verify the effective auth settings after startup: database-stored Twenty configuration can override environment values. Do not use `WORKSPACE_SCHEMA_DDL_LOCKED` to disable signup; it also blocks installing the app's objects and fields. Leave required email verification off until outgoing mail is configured and tested.

## Verification

Run the deployment wrapper tests:

```bash
node --test deploy/vercel/tests/*.test.cjs
```

Also run the lumber app's unit tests, lint, typecheck and Twenty app build described in its `SETUP.md`.

Before using the online CRM, verify the complete flow on the production deployment:

1. Complete protected owner signup and password login.
2. Install the lumber app, confirm its navigation and views, then save and reopen a customer and order.
3. Confirm a USD commission and observe the worker update expected amounts; confirm the partner split separately.
4. Upload a sample/site photo, redeploy or restart, and retrieve the same photo.
5. Execute a calculation after the web service has been idle/cold-started.
6. Confirm the worker remains healthy and scheduled jobs are registered.
7. Log out and verify that CRM records cannot be read without authentication. Check GraphQL error bodies as well as HTTP status. Wrong passwords and arbitrary new signups must fail; individual invitations must still work.

After these checks, keep Vercel Authentication on **All Deployments** for a private test, or restore **Standard Protection** if the production URL should show Twenty's own login screen without requiring a Vercel account. Restore it only after the native owner account and closed-signup checks pass; repeat the logged-out record-access check afterward.

A successful image build or `/healthz` response does not establish that these flows work. Keep database, bucket and encryption-key backups before entering business records. Never run `docker compose down -v` or database reset commands against those services.

## References

- [Vercel Container runtime](https://vercel.com/docs/functions/runtimes/container)
- [Vercel Services](https://vercel.com/docs/services)
- [Vercel Daemons](https://vercel.com/docs/daemons)
- [Daemon limits and quotas](https://vercel.com/docs/daemons/limits)
- [Vercel deployment protection scopes](https://vercel.com/docs/deployment-protection)
- [Twenty self-hosting](https://docs.twenty.com/developers/self-host/capabilities/docker-compose)
