# Superseded: use the unified hackathon repository

The registry now lives in **[zabrodsk/pneu007-business](https://github.com/zabrodsk/pneu007-business)** alongside the autoshop website/backend, bookings, A2A transport, GrokBot tools and skills, audit/rulebooks, and Masumi payment integration.

Continue development and deploy both services from that single repository. See its [registry instructions](https://github.com/zabrodsk/pneu007-business/blob/main/docs/business-registry.html) and [main README](https://github.com/zabrodsk/pneu007-business#readme).

This repository is archived historical source. Its original documentation follows.

---

# Business Agent Registry

A small directory that lets a business agent register its services and lets a customer agent discover suitable businesses. Built with TypeScript, Express and SQLite. Includes a bundled terminal client and a portable agent skill.

## How it works

1. The operator issues a publisher token to an authorized business agent.
2. The agent registers a listing with services, location, advertised actions and an Agent Card URL.
3. The registry returns a website verification challenge. The business publishes the exact JSON at the returned URL.
4. Verification checks website control and basic A2A 1.0 card metadata, then activates the listing.
5. Customer agents search by service, action and geographic radius, then contact matching business agents using their current cards.

The registry stores public listings and publisher token hashes. Booking data and customer records stay with each business. Verification covers domain control and card metadata; booking capabilities are publisher-declared. The initial limit is 100 listings. Periodic checks hide unhealthy or stale listings. Updating a listing requires new verification; pausing immediately removes it from discovery.

## Local development

Use Node.js 22 or newer.

```bash
npm ci
cp .env.example .env
```

Set `REGISTRY_ADMIN_TOKEN` in `.env` to a securely generated random value of at least 24 characters. Keep the file private and out of Git. Then:

```bash
npm run build
npm run typecheck
npm test
npm start
```

The service listens at `http://127.0.0.1:8792`. `GET /healthz` reports health. CLI test requests to localhost require `--allow-http-localhost`.

## Deploy from GitHub to Railway

1. Create a new Railway service from this repository's `main` branch. Keep the root directory at `/`. Railway detects the root `Dockerfile`; its default command starts the registry.
2. Attach one persistent volume at `/data`.
3. Set `REGISTRY_ADMIN_TOKEN` through Railway's secret variables. The Docker image already sets `NODE_ENV=production` and `REGISTRY_DB_PATH=/data/registry.db`.
4. Leave `REGISTRY_HOST` and `REGISTRY_PORT` unset. The app binds `0.0.0.0` in production and uses Railway's `PORT`.
5. Configure the service health check as `/healthz`, with a 60-second startup timeout. Keep one replica in the volume's region.
6. Deploy, generate a public HTTPS domain, then request `/healthz` and `/api/search` to confirm it is running.

On Railway the application refuses startup if the persistent volume is missing or if the database path is outside the mounted volume. The database schema is initialized at startup, after Railway mounts the volume. Configure backups for the volume separately.

For CLI-managed infrastructure, [`.railway/railway.ts`](.railway/railway.ts) declares the GitHub source, Docker build, health check, one replica and a 1 GiB volume. It preserves an existing admin secret. Use a current Railway CLI and its `railway/iac` TypeScript SDK in your deployment tooling environment, link a new project, set the admin secret, then review `railway config plan` before `railway config apply`. The application does not install this SDK. Railway does not automatically apply the IaC file merely because it exists in GitHub. See [Railway IaC](https://docs.railway.com/infrastructure-as-code) and [persistent volumes](https://docs.railway.com/volumes).

## Agent commands

Download `/cli/registry.mjs` from your registry's HTTPS origin. Configure `REGISTRY_URL`; a business agent also needs its publisher credential in `REGISTRY_TOKEN`. Public search/get requests omit authentication.

```bash
node registry.mjs tools
node registry.mjs register --data-file business.json
node registry.mjs mine
# Publish the returned verification JSON on the authorized business website.
node registry.mjs verify BUSINESS_ID
node registry.mjs search --service tyre_change --action book --lat 50.08 --lon 14.43 --radius-km 10
node registry.mjs update BUSINESS_ID --data-file changes.json
node registry.mjs pause BUSINESS_ID
```

The [agent skill](skills/business-registry/SKILL.md) provides the listing schema and full workflow. The server also serves it at `/skills/business-registry/SKILL.md`. [API details](docs/business-registry.html) describe publisher enrollment, endpoint permissions and verification rules.

The MVP requires the website, card and advertised interface URLs to share a public HTTPS origin. Remote document fetches reject private/reserved addresses, redirects, credentials, custom ports and oversized responses. Customer agents still authenticate separately to each business and obtain live offers before booking.

## Layout

- `apps/registry`: server, validation, remote verification and tests.
- `packages/agent-client`: standalone registry CLI and tests.
- `skills/business-registry`: registration and discovery instructions.
- `Dockerfile`: deployable service image with the bundled CLI and skill.

No public deployment or business listing is preconfigured. Test domains and tokens in automated tests are synthetic.
