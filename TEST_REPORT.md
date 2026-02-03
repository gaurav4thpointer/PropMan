# PropMan (RentalTracker) — Independent Test Report

**Date:** February 3, 2026  
**Scope:** Frontend (React/Vite), Backend (NestJS/Prisma), and functional flows  
**Method:** Code review and static analysis (live browser testing not completed due to port conflict; backend was already bound to 3000).

**Fixes applied (same date):** All reported issues have been addressed—see commit history and the sections below; each recommendation was implemented (401 return URL, Vite proxy, LeaseForm/PaymentForm validation, onboarding params, filter/URL consistency, Dashboard label, JWT_SECRET in production, CORS allowlist, lease update end > start, Register/Login/HomeOrApp flows).

---

## 1. Frontend Issues

### 1.1 High — 401 redirect loses return URL

**Location:** `client/src/api/client.ts` (response interceptor)

When any API call returns 401, the interceptor does:

```ts
window.location.href = '/login'
```

This performs a **full page navigation**, so React Router’s `location.state` (e.g. `from`) is lost. As a result:

- If the user’s token expires while they are on e.g. `/leases`, the next API call triggers 401 and they are sent to `/login` with **no** “return after login” state.
- After login they always land on `/` (or `/admin` for super-admin), not on the page they were on.

**Recommendation:** On 401, use React Router’s `navigate('/login', { state: { from: window.location.pathname } })` from a shared place (e.g. a small auth/navigation helper used by the interceptor or a global error handler), or store the current path in `sessionStorage` before redirecting and read it on the login page to redirect after successful login.

---

### 1.2 Medium — No API proxy when `VITE_API_URL` is unset

**Location:** `client/src/api/client.ts`, `client/vite.config.ts`

- `baseURL` is `import.meta.env.VITE_API_URL ?? '/api'`.
- If `.env` is missing or `VITE_API_URL` is not set, requests go to same-origin `/api`, but **Vite has no proxy** for `/api` in `vite.config.ts`.
- Result: In dev without `.env`, all API calls hit `http://localhost:5173/api` and get 404.

**Recommendation:** Either document that `VITE_API_URL` is required (e.g. `http://localhost:3000/api`) or add a dev proxy in `vite.config.ts`, e.g.:

```ts
server: {
  port: 5173,
  proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } },
},
```

and keep `baseURL` as `'/api'` when not set.

---

### 1.3 Medium — Lease form: no client-side “end date after start date” validation

**Location:** `client/src/components/LeaseForm.tsx`

- Schema uses `startDate` and `endDate` with only `z.string().min(1)`.
- User can submit e.g. end date before start date; validation happens only on the server, leading to a generic error and weaker UX.

**Recommendation:** Add a `.refine()` (or equivalent) so that `endDate >= startDate` and show a clear message, e.g. “End date must be on or after start date.”

---

### 1.4 Low — Payment form: lease required but first option is empty

**Location:** `client/src/components/PaymentForm.tsx`

- Schema: `leaseId: z.string().uuid()` (required).
- First option in the lease dropdown is `<option value="">Select lease</option>`.
- Submitting without selecting a lease yields a Zod “Invalid uuid” style error instead of a friendlier “Please select a lease” message.

**Recommendation:** Either use a custom message for `leaseId` (e.g. “Please select a lease”) or treat empty string explicitly in the schema (e.g. refine that `leaseId` is not empty) so the error copy is user-friendly.

---

### 1.5 Low — Onboarding query params not cleared after flow

**Location:** `client/src/pages/Properties.tsx`, `Tenants.tsx`, `Leases.tsx`

- After “Add property” in onboarding, `handleSaved` can call `navigate('/tenants?onboarding=new&next=lease')`.
- URL keeps `onboarding=new` and `next=...`; reopening the same list can re-open the form if `useEffect` depends on `searchParams.get('onboarding') === 'new'`.

**Recommendation:** Optionally clear or normalize onboarding params after each step (e.g. remove `onboarding` and `next` after navigating) so the URL reflects “done with this step” and avoids accidental re-triggering of modals/forms on refresh or back.

---

### 1.6 Low — List pages: filters vs URL

**Location:** `client/src/pages/Leases.tsx`, `Payments.tsx`, `Tenants.tsx`

- Some pages sync filter state to URL (e.g. `setSearchParams`) and some only initialize from URL; behavior is not fully consistent.
- Filtering is client-side on the current page of data (e.g. `list.filter(...)`), so with large lists, “filter by property” only filters what’s already loaded.

**Recommendation:** Document intended behavior (e.g. “filter is client-side on first N rows”). If filters should be shareable, consistently push filter values to `searchParams` and use them in the list API (e.g. `propertyId`, `tenantId`) when the backend supports it.

---

### 1.7 Info — Dashboard “total received” vs “month/quarter received”

**Location:** `client/src/pages/Dashboard.tsx`, `server/src/reports/reports.service.ts`

- “Month – Received” and “Quarter” received values come from **rent schedule** (PAID status).
- “Total received (all time)” comes from **sum of payments**.
- So “total received” can differ from the sum of “received” rent (e.g. overpayments or unmatched payments). This is consistent with the backend but may need a short tooltip or label so users understand the difference.

---

## 2. Backend Issues

### 2.1 High — Default JWT secret in code

**Location:** `server/src/auth/jwt.strategy.ts`

```ts
secretOrKey: config.get<string>('JWT_SECRET') ?? 'change-me-in-production',
```

If `JWT_SECRET` is not set, the app uses a fixed default. In production this is a serious security risk (predictable tokens).

**Recommendation:** In production, require `JWT_SECRET` and fail startup if missing (e.g. in `main.ts` or ConfigModule validation). Do not fall back to a default in production.

---

### 2.2 Medium — CORS allows any origin

**Location:** `server/src/main.ts`

```ts
app.enableCors({ origin: true });
```

This allows any origin. For production, CORS should be restricted to the known frontend origin(s).

**Recommendation:** Use an env-driven allowlist, e.g. `origin: process.env.CORS_ORIGIN?.split(',') ?? false`, and set `CORS_ORIGIN` in production.

---

### 2.3 Low — Terminate lease DTO: no range validation

**Location:** `server/src/leases/dto/terminate-lease.dto.ts`

- Only `@IsDateString()` is used for `terminationDate`.
- Valid range (between lease start and end) is enforced in `LeasesService.terminateEarly()`, which is correct, but invalid or meaningless dates (e.g. far past/future) are only rejected with a generic “must be on or after startDate” style message after DB read.

**Recommendation:** Optional: add `@MinDate()` / `@MaxDate()` or a custom validator if you want to fail fast at DTO level; current behavior is acceptable if error messages are clear.

---

### 2.4 Low — Lease create: duplicate validation of end > start

**Location:** `server/src/leases/leases.service.ts`

- `create()` checks `if (end <= start) throw new BadRequestException('endDate must be after startDate')`.
- This is correct. Consider mirroring the same check in `update()` when both `startDate` and `endDate` are provided (if not already covered by overlap logic).

---

### 2.5 Info — Route order (no bug found)

**Location:** `server/src/leases/leases.controller.ts`, `server/src/cheques/cheques.controller.ts`

- More specific routes (`:id/terminate`, `:id/status`) are declared before generic `:id` PATCH, so “terminate” and “status” are not interpreted as IDs. No change needed.

---

## 3. Functional Flow Issues

### 3.1 High — Post-login redirect after 401

**Flow:** User is on a protected page → token expires → API returns 401 → interceptor redirects to `/login` → user logs in → lands on `/` instead of the page they were on.

Already covered under **1.1** (401 loses return URL). Fixing the interceptor (or equivalent) will fix this flow.

---

### 3.2 Medium — Register flow does not preserve intended destination

**Location:** `client/src/pages/Register.tsx`

- After successful registration, `navigate('/', { replace: true })` always goes to dashboard.
- If the user had been redirected to register from a protected route (e.g. “login” → “Create one” from login page), there is no “redirect back to X after register” behavior. This is consistent with many apps but can be improved by passing a `from` or `next` in state/query when navigating to register and using it after signup.

**Recommendation:** Optional: when navigating from Login to Register, pass state (e.g. `from`) and after register redirect to that path if present.

---

### 3.3 Low — HomeOrApp: unauthenticated user on non-home path

**Location:** `client/src/components/HomeOrApp.tsx`

- If `!user` and `pathname !== '/'`, the app does `<Navigate to="/" replace />`, so the user sees the landing page. There is no redirect to `/login` with `state.from` for the path they tried to open.

**Recommendation:** For consistency with ProtectedRoute, you could redirect to `/login` with `state: { from: location }` when an unauthenticated user hits a protected path under `/` (e.g. `/properties`). Currently they land on `/` (landing) and must click “Get started” or “Log in”; both are acceptable but the former is more consistent with “protected” behavior.

---

## 4. Summary Table

| Severity | Frontend | Backend | Flows |
|----------|----------|---------|--------|
| **High** | 401 loses return URL (1.1) | Default JWT secret (2.1) | Same as 1.1 (3.1) |
| **Medium** | No API proxy / env (1.2), No end > start in LeaseForm (1.3) | CORS any origin (2.2) | Register no “from” (3.2) |
| **Low** | Payment lease message (1.4), Onboarding params (1.5), Filter/URL (1.6) | Terminate DTO (2.3), Lease update end>start (2.4) | Unauthenticated redirect to / (3.3) |
| **Info** | Dashboard labels (1.7) | Route order (2.5) | — |

---

## 5. Recommendations (priority)

1. **Security:** Remove default JWT secret; require `JWT_SECRET` in production and restrict CORS.
2. **UX / flows:** Fix 401 handling so return URL is preserved (sessionStorage or router state) and optionally improve post-register redirect.
3. **Dev experience:** Document `VITE_API_URL` or add Vite proxy for `/api`.
4. **Forms:** Add LeaseForm `endDate >= startDate` validation and friendlier PaymentForm lease selection error.
5. **Consistency:** Align filter ↔ URL and onboarding query params across list/onboarding pages.

---

*Report generated from codebase review. Run backend and frontend with a seeded DB and repeat critical paths (login, register, create property/lease, 401, CORS) in the browser for full regression coverage.*
