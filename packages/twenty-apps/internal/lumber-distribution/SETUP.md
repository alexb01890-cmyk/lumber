# Setup

## Existing Twenty workspace

Use Node.js 24.5+ (or supported Node 26), Yarn 4 and the matching standalone Twenty CLI:

```bash
npm install -g twenty@2.58.0
cd packages/twenty-apps/internal/lumber-distribution
yarn install
twenty app typecheck
yarn lint
yarn test:unit
twenty app build
```

Connect to your Twenty workspace URL (managed or self-hosted). Keep credentials in the CLI's private configuration, never in this repository:

```bash
twenty auth login --url https://your-twenty-instance.example --name dev
twenty app apply --create --remote dev
```

After the apply succeeds, open the workspace and select **Lumber Overview**. The app adds its objects and views to the navigation. Add real contacts and suppliers; it does not seed fabricated customers, orders, products or earnings.

For later changes, inspect and apply a bounded update:

```bash
twenty app plan --remote dev
twenty app apply --remote dev
```

For a production workspace, review the plan and get the workspace owner's approval before applying changes.

## Vercel hosting

Use the [Vercel deployment guide](../../../../deploy/vercel/README.md) from the repository root. The app is an extension installed after the CRM workspace is running; its own folder is not a Vercel website root.

## No workspace yet

A repository alone does not run Twenty. Choose a managed Twenty workspace or self-host Twenty with persistent PostgreSQL, Redis and file storage using the [official self-hosting instructions](https://docs.twenty.com/developers/self-host/capabilities/docker-compose). Then install this app into that workspace.

For local development with Docker:

```bash
twenty local start 2.58.0
twenty auth login --url http://localhost:2020 --name local
twenty app apply --create --remote local
```

Local development is for trying the app; it is not the business's production hosting or backup plan.

## Preview tools

The app registers authenticated POST calculation tools with `{records: [...]}` inputs. They return previews and never create orders or payouts:

- `/calculate-commissions`: eligible USD amount in integer micros, rate, terms confirmation and optional confirmed split.
- `/plan-reorders`: next need date, calendar-month interval, supplier lead-time days and review-buffer days.

The commission record-event handlers use the same calculation helper to update expected amounts. Preview routes are workspace function routes, not public storefront endpoints.

## Tests

Unit tests cover commission money/unknown terms and calendar-month dates:

```bash
yarn test:unit
```

Integration tests install and uninstall the app. They deliberately require the separate local test environment and its API key, not a business workspace:

```bash
twenty local start 2.58.0 --test
TWENTY_API_URL=http://localhost:2021 TWENTY_API_KEY=<local-test-api-key> yarn test
```

Get the key from the isolated local test environment. Do not paste production credentials into this command. Install the standalone CLI or set `TWENTY_CLI` to its executable path. Integration setup rejects any URL outside local port 2021 before changing an app.
