# Deploy the lumber CRM on Vercel

This deployment preserves Twenty CRM and the Lumber Distribution app. The root `vercel.json` runs the official, pinned Twenty 2.58.0 image as one HTTP service and one background worker daemon. JavaScript, styles, images and emoji files are extracted from that exact image and served by a separate static service, so loading them does not start database-connected containers. HTML and APIs remain on Twenty, preserving its runtime configuration and security policy. It does not build Twenty's large development monorepo during deployment.

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
| `PG_POOL_MAX_CONNECTIONS` | `2` per native pool for the free shared database. |
| `PG_POOL_IDLE_TIMEOUT_MS` | `10000` to release idle database connections promptly. |
| `PG_POOL_ALLOW_EXIT_ON_IDLE` | `true`. |
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

Both images contain the same runtime scripts. A SHA-256 digest of those scripts and the pinned image identifies their bootstrap readiness, scoped to the Twenty version and public origin. This remains consistent when Vercel gives its service and daemon different deployment metadata; changing the runtime scripts creates a new readiness identity.

## Database bootstrap and startup

The worker acquires a PostgreSQL advisory lock, initializes an empty database or upgrades an existing one, flushes the metadata cache, and registers scheduled jobs. It marks that release ready only after every command succeeds, then starts the queue worker. Failed bootstrap stops the worker with an error.

HTTP containers immediately open the platform port and hold initial requests for up to 25 seconds while waiting for the matching readiness marker and native HTTP health check. Requests exceeding that bound receive a private, uncached 503 startup page. Native database pools default to two connections to limit pressure on a free shared database. Streaming requests, response cookies, and upgrade connections pass through to Twenty. HTTP containers never run migrations or register scheduled jobs on a cold start. Automatic deployments are disabled for the development branch because full preview workers are unavailable; production deployments remain enabled on `main`.

Deploy an active **Production** release behind the onboarding protection below and inspect both service and daemon logs. A staged `--prod --skip-domain` deployment may not start its daemon until it becomes the active production release; HTTP containers will then keep waiting for bootstrap. Production here selects Vercel's environment; creating the first CRM account and installing the lumber app remain separate steps.

## Protect the first owner signup

Before the first working deployment, set **Settings > Deployment Protection > Vercel Authentication > All Deployments**. The API setting is `ssoProtection.deploymentType: "all"`. This is available on Hobby and does not require the paid Password Protection feature. Verify that an unauthenticated visitor is sent to Vercel login on every production, branch and deployment URL. Standard Protection (`all_except_custom_domains`) leaves production domains public, and `--skip-domain` alone is not an access gate.

Keep `SERVER_URL` set to the stable production HTTPS hostname during onboarding. The owner first signs in to Vercel, then creates their own Twenty email/password account at that hostname and completes workspace onboarding. They enter the password directly on the site. Do not create a shared default administrator or run Twenty's development seed.

This outer gate matters even with signup restrictions enabled: Twenty allows initial signup while no workspace exists, and the first user receives server-administrator access. Its native configuration has no owner-email allowlist for claiming an empty instance. Keep Vercel Authentication enabled until the owner has claimed the workspace and the checks below pass.

## Install the lumber app and close general invitations

The worker image includes a verified Lumber Distribution build and enables `LUMBER_AUTO_INSTALL=true`. Its installer waits for the owner's workspace to finish provisioning while the normal queue worker continues running. It then uses Twenty's pinned administrative services to register the app, upload its artifacts to private storage, and apply its manifest. It rejects foreign registrations and destructive changes, verifies the resulting schema, and records the successful content hash in `vercel_runtime.lumber_installation`. The owner does not need Windows command-line tools or to share a password or API token.

After installation succeeds, refresh the CRM and open **Lumber Overview**. An installer failure reports only its phase in the daemon logs and leaves the normal queue worker running. Correct the failure and redeploy before claiming the lumber features are ready. This adapter is tied to the pinned Twenty version and must be verified when upgrading the base image.

After editing the SDK app, regenerate and commit its retained deployment package using the matching CLI:

```bash
node deploy/vercel/scripts/package-lumber-application.cjs --twenty-package /path/to/node_modules/twenty
```

The helper uses the official Twenty 2.58.0 build worker, verifies every artifact and its content hash while holding the snapshot, then releases it. Do not edit retained files manually.

### Optional developer workflow

For manual SDK development, disable automatic installation and use these Windows commands with Node.js 24 and Git installed. While Vercel Authentication remains enabled, CLI requests also need approved platform access: configure its [automation bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) privately through the Twenty CLI's `--proxy-header-command` support. A Twenty access token alone does not bypass Vercel's gate. Never commit the bypass secret or send it in chat.

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

Replace the URL with your actual production URL. This opens browser authentication; it does not require sending a password or token to anyone.

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
