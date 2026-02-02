# PropMan — Product Brief

## 1. Product Overview

**PropMan** (codename: RentalTracker) is a web application for landlords to manage rental properties, tenants, leases, post-dated cheques (PDCs), and rental income. It is built as an MVP with a focus on **India** and **UAE (Dubai)** markets, supporting INR and AED, and common rent frequencies (monthly, quarterly, yearly).

The product helps a single landlord (one account = one owner) keep a clear view of:
- Which units are occupied or vacant  
- What rent is expected vs received  
- Which cheques are pending, cleared, or bounced  
- When leases expire or have been terminated early  
- Lease-related documents in one place  

---

## 2. Target Users

- **Primary:** Individual landlords who own one or more residential properties in India or Dubai and rent them out.  
- **Secondary:** Small property managers or family offices managing a handful of properties who need simple income and PDC tracking without full property-management software.

**User needs:**
- Track multiple properties and units in one place  
- Record tenant and lease details (start/end, rent amount, due day)  
- Manage post-dated cheques (PDCs) and their status  
- See expected vs received rent (month/quarter) and overdue amounts  
- Attach and organise lease documents (agreements, IDs, etc.)  
- Optional: early termination of leases and unit status updates  

---

## 3. Problem Statement

Landlords often rely on spreadsheets, paper, or scattered notes to track:
- Which unit is vacant or occupied  
- Lease dates and rent amounts  
- Post-dated cheques and whether they are deposited, cleared, or bounced  
- Overdue rent and upcoming lease renewals  

This leads to:
- Missed rent follow-ups and unclear cash flow  
- Poor visibility on PDC status and bounce risk  
- No single place for lease documents  
- Manual, error-prone updates when a tenant leaves early or a lease ends  

PropMan addresses these by providing a single, structured place for properties, tenants, leases, cheques, payments, and documents.

---

## 4. Solution Summary

PropMan is a **logged-in web app** where the user (landlord) can:

1. **Define portfolio:** Add properties (with country, currency, address, state/emirate) and units (unit number, bedrooms, vacancy status).  
2. **Manage tenants:** Create tenants with contact and ID details; link them to leases.  
3. **Manage leases:** Create leases (property, unit, tenant, dates, rent, frequency, due day, security deposit); auto-generated rent schedules; optional early termination; attach documents with optional display names.  
4. **Track cheques:** Record PDCs (number, bank, date, amount, period); update status (received → deposited → cleared / bounced / replaced).  
5. **Record payments:** Log payments (date, amount, method, reference) and match them to rent schedule lines.  
6. **Use reports and dashboard:** See expected vs received (month/quarter), overdue schedules, upcoming cheques, expiring leases, and high-level “money tracked” totals.  

Access is secured with **email + password** (JWT). Optional **super-admin** role can manage users. The app is responsive so it can be used on desktop and mobile.

---

## 5. Key Features (Detailed)

### 5.1 Authentication & Users

- **Register / Login** with email and password (JWT, bcrypt).  
- **Account:** Update profile (name, email, mobile, gender); change password.  
- **Roles:** `USER` (landlord), `SUPER_ADMIN` (optional admin).  
- **Protected routes:** Main app and admin area require login; admin routes require super-admin.

### 5.2 Properties

- **CRUD** for properties: name, address, country (IN / AE), currency (INR / AED), state or emirate, notes.  
- **Units:** Add/edit/delete units per property (unit number, bedrooms, status VACANT/OCCUPIED, notes).  
- **Property detail:** View property with list of units; quick links to leases and cheques for that property.  
- Unit status is updated automatically when leases are created, terminated early, or deleted (no other active lease on that unit).

### 5.3 Tenants

- **CRUD** for tenants: name, phone, email, ID number, notes.  
- **Tenant detail:** View tenant with linked leases, payments, and cheques; edit tenant.

### 5.4 Leases

- **Create lease:** Property, unit, tenant, start date, end date, rent frequency (monthly/quarterly/yearly/custom), installment amount, due day (1–28), optional security deposit and notes.  
- **Rent schedule:** System generates due dates and expected amounts per frequency; schedule is shown on lease detail.  
- **Early termination:** Set a termination date (between start and end); unit can be marked vacant from that date; future schedule lines can be shown as cancelled.  
- **Lease documents:**  
  - Upload files (e.g. PDF, Word, images; max 10 MB).  
  - Optional display name per document.  
  - Thumbnail-style tile view; download; inline edit of display name; remove with **confirmation dialog** (“Remove document? This cannot be undone.”).  
- **Lease list/detail:** Filter by property/tenant; view lease with schedule and documents; badges for expired or terminated early.

### 5.5 Cheques (PDCs)

- **CRUD** for cheques: cheque number, bank, date, amount, “covers period” (e.g. “Feb 2026 Rent”), status (received → deposited → cleared / bounced / replaced).  
- **Status updates:** Deposit date; cleared/bounce date; bounce reason; link to replacement cheque when replaced.  
- **Filters:** By property, tenant, status; dashboard shows upcoming (e.g. 90 days) and bounced count.

### 5.6 Payments

- **Record payments:** Date, amount, method (cheque, bank transfer, UPI, cash), reference, notes; link to tenant, property, unit, lease, optional cheque.  
- **Match to schedule:** Payments can be matched to rent schedule lines (allocation of amount to specific due dates).

### 5.7 Reports & Dashboard

- **Dashboard:**  
  - At a glance: month expected/received, quarter expected/received, overdue amount, units (vacant/occupied), bounced cheques count.  
  - Quick links to properties, tenants, leases, payments, cheques, reports.  
  - Money tracked: total expected/received (all time), cheque value tracked, security deposits.  
  - Overdue schedules, upcoming cheques (e.g. 90 days), leases expiring (e.g. 90 days).  
  - Charts: month expected vs received; income overview (e.g. pie).  
- **Reports:** Configurable period and property; outstanding rent; overdue schedules; export-friendly data for reconciliation.

### 5.8 Admin (Optional)

- **Admin dashboard:** High-level activity or stats.  
- **User management:** List users; optional role/status management (super-admin only).  
- **Activity:** View recent activity (e.g. logins, key actions).

---

## 6. User Flows (High Level)

1. **Onboarding:** Register → Login → Add first property and units.  
2. **New tenant and lease:** Add tenant → Create lease (property, unit, tenant, dates, rent) → Rent schedule is generated; optionally upload lease documents and set display names.  
3. **PDC handling:** Add cheque(s) for the lease → When deposited, update status → When cleared/bounced, update and optionally link replacement cheque.  
4. **Rent received:** Record payment → Match to rent schedule (if supported in UI) so schedule shows PAID/PARTIAL.  
5. **Early exit:** On lease detail, “Terminate early” → Set termination date → Unit becomes vacant from that date; schedule shows cancelled for future dates.  
6. **Documents:** On lease detail, attach document (optional name) → Tiles show with edit name / download / remove (with confirmation).  
7. **Monitoring:** Dashboard and reports for expected vs received, overdue, upcoming cheques, expiring leases.

---

## 7. Technical Overview

- **Frontend:** Vite, React, TypeScript, Tailwind CSS, React Router, React Hook Form. Responsive layout; mobile-friendly tables and forms.  
- **Backend:** NestJS (Node.js), TypeScript, Prisma ORM, PostgreSQL.  
- **Auth:** JWT (e.g. 7d expiry), bcrypt for passwords.  
- **API:** REST; Swagger at `/api/docs`.  
- **Storage:** Lease documents stored on server (e.g. `uploads/leases/{leaseId}/`); metadata and display names in DB.  
- **Deployment:** Docker support (app + Postgres); env-based config (e.g. `DATABASE_URL`, `JWT_SECRET`, `VITE_API_URL`).

---

## 8. Data Model (Summary)

- **User:** id, email, password, name, mobile, gender, role.  
- **Property:** name, address, country, currency, emirateOrState, owner.  
- **Unit:** unitNo, bedrooms, status (VACANT/OCCUPIED), property.  
- **Tenant:** name, phone, email, idNumber, notes, owner.  
- **Lease:** property, unit, tenant, start/end dates, terminationDate (optional), rent frequency, installment amount, due day, security deposit, notes; rent schedules, documents.  
- **LeaseDocument:** lease, displayName (optional), originalFileName, storedPath, mimeType, size.  
- **RentSchedule:** lease, due date, expected amount, paid amount, status (DUE/OVERDUE/PAID/PARTIAL).  
- **Cheque:** lease, tenant, property, unit, number, bank, date, amount, covers period, status, deposit/cleared/bounce dates, bounce reason, replacement link.  
- **Payment:** lease, tenant, property, unit, date, amount, method, reference, optional cheque; schedule matches.  

All tenant/lease/cheque/payment data is scoped by the logged-in owner.

---

## 9. Out of Scope (Current MVP)

- Multi-tenant SaaS (multiple organisations).  
- Invoicing or accounting integration.  
- Tenant portal or self-service.  
- Automated reminders (email/SMS).  
- Native mobile app (web only).  
- Bulk import/export of data.  

---

## 10. Success Criteria (MVP)

- Landlord can add properties, units, tenants, and leases and see expected rent.  
- PDCs can be recorded and status updated (received → cleared/bounced).  
- Payments can be recorded and linked to leases/tenants.  
- Dashboard shows expected vs received, overdue, and expiring leases.  
- Leases can be terminated early and documents attached with optional names.  
- Remove document requires explicit confirmation.  
- App is usable on desktop and mobile (responsive).  

---

*Document version: 1.0 — aligned with current PropMan (RentalTracker) MVP.*
