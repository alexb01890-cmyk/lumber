# Deploy the lumber CRM on Vercel

This deployment preserves Twenty CRM and the Lumber Distribution app. The root `vercel.json` runs the official, pinned Twenty 2.58.0 image as one HTTP service (frontend and API) and one background worker daemon. It does not build Twenty's large development monorepo during deployment.

Vercel Containers, Services and Daemons are beta features. Daemons currently run only in production; a preview deployment cannot run the complete CRM. This deployment deliberately rejects preview runtime startup rather than connect a preview to production customer data or queues.

## Required services

Provision real resources before deploying:

- PostgreSQL with permission to create schemas and the `uuid-ossp`, `unaccent` and `citext` extensions. Use a direct, non-transaction-pooled connection for bootstrap and migrations.
- Redis with a native TCP/TLS URL compatible with BullMQ. A Redis REST URL/token alone is insufficient.
- S3-compatible object storage for attachments, app source and executable bundles. Both the API and worker use the same bucket and credentials. Keep the bucket private and allow the CRM's production HTTPS origin in its CORS configuration for presigned uploads.

Persistent data lives in those services. Vercel container filesystems and `/tmp` are temporary. The deployment uses `/tmp` only for rebuildable function caches.

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

The images set remote S3 storage, enable the trusted lumber calculation functions, and disable Twenty cloud billing and multi-workspace signup. The worker receives `SERVER_INTERNAL_URL` through a Vercel service binding; do not replace that binding with a hardcoded preview URL. The HTTP service uses its own loopback URL for internal requests.

Vercel must expose its deployment identity to the runtime (`VERCEL_DEPLOYMENT_ID` or `VERCEL_GIT_COMMIT_SHA`) so a web container can match the worker's completed bootstrap to the same release. Ensure automatic system environment variables are enabled in the project.

## Database bootstrap and startup

The worker acquires a PostgreSQL advisory lock, initializes an empty database or upgrades an existing one, flushes the metadata cache, and registers scheduled jobs. It marks that release ready only after every command succeeds, then starts the queue worker. Failed bootstrap stops the worker with an error.

HTTP containers wait for the matching readiness marker and then start the API. They never run migrations or register scheduled jobs on a cold start. This avoids concurrent schema changes when Vercel starts multiple HTTP instances.

Deploy to **Production** and inspect both service and daemon logs. Production here selects Vercel's environment; creating the first CRM account and installing the lumber app remain separate steps.

## Create the workspace and install the lumber app

Open the production URL, create the administrator account, and finish workspace onboarding. Then run these commands on Windows with Node.js 24 and Git installed:

```powershell
npm.cmd install -g twenty@2.58.0 @yarnpkg/cli-dist@4.18.1
git clone --depth 1 --filter=blob:none --sparse https://github.com/alexb01890-cmyk/lumber.git lumber
cd lumber
git sparse-checkout set .yarn/releases packages/twenty-apps/internal/lumber-distribution
cd packages/twenty-apps/internal/lumber-distribution
yarn.cmd install
twenty.cmd auth login --url https://YOUR-PRODUCTION-DOMAIN --name lumber
twenty.cmd app apply --create --remote lumber
```

Replace the URL with your actual production URL. This opens browser authentication; it does not require sending a password or token to anyone. After apply succeeds, refresh the CRM and open **Lumber Overview**. Merely starting Twenty does not install the lumber SDK app.

For an existing checkout, switch to the merged `main` branch instead of cloning over local work. Before the deployment change is merged, use the pull request branch explicitly.

## Verification

Run the deployment wrapper tests:

```bash
node --test deploy/vercel/tests/*.test.cjs
```

Also run the lumber app's unit tests, lint, typecheck and Twenty app build described in its `SETUP.md`.

Before using the online CRM, verify the complete flow on the production deployment:

1. Signup/login and save/reopen a customer and order.
2. Install the lumber app and confirm its navigation, list and detail views.
3. Confirm a USD commission and observe the worker update expected amounts; confirm the partner split separately.
4. Upload a sample/site photo, redeploy or restart, and retrieve the same photo.
5. Execute a calculation after the web service has been idle/cold-started.
6. Confirm the worker remains healthy and scheduled jobs are registered.

A successful image build or `/healthz` response does not establish that these flows work. Keep database, bucket and encryption-key backups before entering business records. Never run `docker compose down -v` or database reset commands against those services.

## References

- [Vercel Container runtime](https://vercel.com/docs/functions/runtimes/container)
- [Vercel Services](https://vercel.com/docs/services)
- [Vercel Daemons](https://vercel.com/docs/daemons)
- [Daemon limits and quotas](https://vercel.com/docs/daemons/limits)
- [Twenty self-hosting](https://docs.twenty.com/developers/self-host/capabilities/docker-compose)
