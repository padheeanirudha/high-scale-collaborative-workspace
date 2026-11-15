# High-Scale Collaborative Workspace

A React + TypeScript issue workspace used to explore the engineering trade-offs behind collaborative, data-intensive frontend applications.

The repository preserves the original V0 issue-list foundation and adds a more complete workspace interface. The current implementation is intentionally a **browser-local prototype**: it persists issues in local storage and synchronizes open tabs on the same origin. It does not yet provide server-backed multi-user collaboration.

## Current capabilities

- Issue overview with status counts, search, status filters, and priority filters.
- Issue creation, editing, deletion, and status/priority updates.
- Browser persistence using local storage.
- Cross-tab updates using the BroadcastChannel API, with the storage event as a fallback.
- Search state reflected in the URL so a filtered view can be bookmarked.
- Responsive issue table and detail panel.
- Keyboard-accessible controls and reduced-motion support.
- Online/offline connection indicator.

## Technology

- React 19
- TypeScript
- Vite
- Browser Storage and BroadcastChannel APIs

## Run locally

```bash
npm install
npm run dev
```

Run the static checks:

```bash
npm run lint
npm run build
```

## Architecture notes

The current client keeps the issue collection in React state and persists each accepted local change to `localStorage`. A `BroadcastChannel` message informs other tabs opened on the same origin; the browser `storage` event provides a fallback path. This is useful for exploring client synchronization and stale-view behavior, but it is not a substitute for an authoritative server.

The UI is kept dependency-light at this stage. The existing issue model is extended with optional priority, assignee, labels, and an update timestamp while retaining the original required fields.

## Roadmap

- [x] V0 — React + TypeScript issue workspace
- [x] Workspace UI — issue lifecycle, filters, details, and responsive layout
- [x] Browser persistence and same-origin tab synchronization
- [ ] V1 — Authoritative API and server-state cache
- [ ] V2 — Large server-side dataset, pagination, and list virtualization
- [ ] V3 — URL-driven filters, sorting, and selection
- [ ] V4 — Optimistic mutations with rollback and conflict-aware reconciliation
- [ ] V5 — Server-backed real-time collaboration across clients
- [ ] V6 — Reconnection, replay, and idempotent event processing
- [ ] V7 — Versioned records and delta synchronization
- [ ] V8 — Conflict resolution and offline mutation queue
- [ ] V9 — Automated unit, integration, and browser-level tests
- [ ] V10 — Production deployment, observability, and operational hardening

## Current limitations

- Data is local to the browser profile; there is no shared database or authentication.
- BroadcastChannel synchronization is limited to tabs on the same origin and does not coordinate different devices.
- Offline changes are retained locally, but there is no durable mutation queue or server reconciliation yet.
- The sample data is illustrative and is not a performance benchmark.

The next architectural step is to introduce an authoritative API before adding server-backed real-time collaboration. That keeps the synchronization model grounded in a clear source of truth instead of simulating distributed consistency entirely in the browser.
