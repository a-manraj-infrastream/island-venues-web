# island-venues-web

Customer web app for **Island Venues**, a demo that books event venues across
Mauritius. Visitors browse venues, open one to see its details, request a
booking (date, guests, contact email) and manage their requests under
**My bookings**, where pending or approved bookings can be cancelled.

It is one of four repositories built for the DevFest 2026 talk
*"The Era of Agentic Developer Platforms"*:

| Repository | Role |
|---|---|
| `island-venues-api` | HTTP API (Go): catalog, bookings, staff actions, payment webhook |
| `island-venues-notifier` | Sends booking confirmations from `booking-created` events (Go) |
| **`island-venues-web`** | This app: the customer site |
| `island-venues-admin` | Staff app: approve or reject bookings, add venues |

Venues and prices are fictional.

## Stack

React 18, TypeScript (strict), Vite, CSS Modules with logical properties
(RTL-ready), Vitest and Testing Library. No router or state library: three
screens are switched with a small discriminated union (`src/view.ts`).

## Run locally

Requires Node.js 22 (22.22.2 or later) or 24.

```bash
npm ci
npm run dev        # http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:8080`. Start
`island-venues-api` next to it with `DEV_MODE=true`: in that mode the API takes
the caller from the `X-Dev-User` header, which the dev proxy sets to
`visitor@example.com` (see `vite.config.ts`). The header exists only in local
development; the built app never sends it and the deployed API does not trust it.

| Command | What it does |
|---|---|
| `npm test` | Unit and component tests (`vitest run`) |
| `npm run lint` | ESLint, warnings are errors (the same rules CI runs) |
| `npm run typecheck` | `tsc -b --noEmit` across the app and the Vite config |
| `npm run build` | Type-check, then build the static site into `dist/` |
| `npm run preview` | Serve `dist/` locally |

## Configuration

The app needs no configuration: it calls the API on the same origin (`/api/...`)
and the load balancer routes those paths to `island-venues-api`.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_SIGN_IN_URL` | unset (`/api/bookings/sign-in`) | Where the **Sign in** button sends the visitor. The default is an edge-protected api path that answers `303` back to `/` once the edge has signed the visitor in (the app page itself is open, so reloading it would not start a sign-in). A same-origin path or an `https://` URL; anything else is ignored. Bundled into the public JavaScript, so never put a secret here. |

## How it talks to the API

`src/api.ts` is the only module that calls `fetch`. It:

- checks every response body against the declared types at runtime and turns a
  wrong shape into an error instead of rendering `undefined`;
- maps failures to a kind (`unauthorized`, `forbidden`, `not_found`,
  `conflict`, `invalid`, `server`, `network`, `bad_response`). A **401**, or a
  redirect from the edge towards a sign-in page, becomes `unauthorized`, which
  the UI shows as **Sign in required**;
- sends `X-Requested-With: XMLHttpRequest` so Identity-Aware Proxy answers an
  unauthenticated call with 401 instead of redirecting it to the Google sign-in
  page, which a background request cannot follow.

Sign-in itself happens at the edge (Identity-Aware Proxy first, Identity
Platform later). The app never sees or stores a token.

User-visible text lives in `src/strings.ts`, so translations can be added later
without touching components.

## Deployment

The app is built and deployed by [Infrastream](https://infrastream.io) from the
manifests in
[`a-manraj-infrastream/infrastream-organization-manifests-ab204170`](https://github.com/a-manraj-infrastream/infrastream-organization-manifests-ab204170)
(tenant `island-venues`):

- The `island-venues-web` **BuildDefinition** (type `REACT`) generates the CI
  workflow: `npm ci`, ESLint, `tsc -b --noEmit`,
  `npm audit --audit-level=high --omit=dev`, Vitest, then `npm run build`. The
  `dist/` bundle is published to the static registry and packaged into an nginx
  image (the engine generates the Dockerfile, so this repository has none).
- The `island-venues-web` **Application** runs that image on Cloud Run in the
  `development` and `production` environments of the `main` release track;
  production follows development after an approval.
- The load balancer serves this app and routes `/api/...` to
  `island-venues-api`, enforcing sign-in on the booking routes.

## License

Apache-2.0, see [LICENSE](LICENSE).
