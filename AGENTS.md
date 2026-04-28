<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version is Next.js 16 with React 19. APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# second-brain-frontend

Next.js client for the Second Brain Laravel API (in the sibling `second-brain-backend` repo). Same UX as the old Inertia frontend; built so a future Expo app can share the same `/api/v1` JSON contract.

## Conventions

- Write all code and copy in English.
- Don't duplicate code. Look for an existing component or `lib/` util before adding a new one.
- Components live in `src/components`. Keep them small (max ~700 lines). Split into subcomponents and put shared logic in `src/lib/*` or `src/hooks/*`.
- Avoid native `title` attributes; use HeroUI `Tooltip` for hovers.
- Entities mirror the backend: `note, place, recipe, wishlist, people, bag, trip, hardware, software, mega_file, bookmark` (and the calendar/planning/cashflow trees). Mirror the URL slugs the backend exposes.

## Architecture

- **Auth**: Sanctum personal access token (Bearer). Stored in `localStorage` via `src/lib/auth-storage.ts`. The same token model works for the Expo app later.
- **API client**: `src/lib/api.ts` is the single axios instance. Base URL is `${NEXT_PUBLIC_API_URL}/api/v1`. The request interceptor injects `Authorization: Bearer …`. The response interceptor clears the token and redirects to `/login` on 401.
- **State / data**: TanStack Query for server state. Don't keep server data in React state. Mutations should invalidate keys, not refetch manually.
- **Auth context**: `src/contexts/AuthContext.tsx` exposes `useAuth()` with `{ status, user, privileges, login, logout, refresh }`. `status` is `"loading" | "unauthenticated" | "authenticated"`.
- **Route protection**: protected pages live under `src/app/(app)/…` whose layout wraps in `<AuthGate>`. Public routes (`/login`, share links) live at the top level.
- **UI library**: HeroUI v3 + Tailwind v4. The HeroUI provider is set up in `src/providers/Providers.tsx` and wires `next/navigation`'s `router.push` for HeroUI's `<Link>`s.
- **Env vars**: prefix with `NEXT_PUBLIC_` to expose to the client. Read through `src/lib/env.ts`, never `process.env.*` directly in components.

## Running locally

```sh
# Laravel API on http://127.0.0.1:8000
cd ../second-brain-backend && php artisan serve

# Next.js on http://localhost:3000
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` if the API is on a different host.

## When adding a new entity page

1. Confirm the `/api/v1/<entity>` JSON endpoints exist on the backend. If not, add them first.
2. Add response types under `src/types/<entity>.ts`.
3. Add a query/mutation hook under `src/hooks/use<Entity>.ts` using TanStack Query against the `api` instance.
4. Build the page under `src/app/(app)/<route>/page.tsx`. Mark it `"use client"` if it needs hooks/state (which is the default for this app).
5. Reuse HeroUI primitives for inputs, buttons, modals, tables. Match Tailwind classes to the patterns already in the codebase.
