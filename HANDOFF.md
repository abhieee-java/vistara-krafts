# VISTĀRA KRAFTS — OPERATIONAL HANDOFF & SYSTEM REFERENCE

> **Comprehensive Handover Document:** The complete, production-grade 12-section technical handover dossier and architectural playbook is available in:
> - **Markdown:** [`docs/VISTARA-KRAFTS-PROJECT-HANDOVER.md`](./docs/VISTARA-KRAFTS-PROJECT-HANDOVER.md)
> - **Print PDF:** [`docs/VISTARA-KRAFTS-PROJECT-HANDOVER.pdf`](./docs/VISTARA-KRAFTS-PROJECT-HANDOVER.pdf)
> - **Styled HTML:** [`docs/VISTARA-KRAFTS-PROJECT-HANDOVER.html`](./docs/VISTARA-KRAFTS-PROJECT-HANDOVER.html)

---

## Quick Reference Coordinates

| System Component | Repository Link | Live Production URL | Primary Tech Stack |
| :--- | :--- | :--- | :--- |
| **Customer Storefront** | [`abhieee-java/vistara-krafts`](https://github.com/abhieee-java/vistara-krafts) | **[`https://vistarakrafts.com`](https://vistarakrafts.com)** | Vanilla JS SPA · 120fps Kinetic CSS · Supabase SDK |
| **Owner Admin Portal** | [`abhieee-java/vistara-krafts-admin`](https://github.com/abhieee-java/vistara-krafts-admin) | Operations Dashboard | React 19 · TypeScript · Vite · Tailwind v4 · Supabase SDK |
| **PostgreSQL Database** | Schema in `supabase/schema.sql` | Supabase Dashboard (`supabase.com`) | PostgreSQL 15+ with RLS & Realtime CDC |
| **Media & Asset CDN** | Cloudinary Console | Cloudinary CDN (`res.cloudinary.com`) | Direct Unsigned Uploads & Transformations (`f_auto,q_auto`) |
| **Payment Gateway** | Razorpay Dashboard | Razorpay Checkout (`checkout.razorpay.com`) | Razorpay Standard Checkout & Webhook Verifier |
| **Email Service** | Resend Console | `api.resend.com` | Resend SDK · Transactional SMTP / REST · Verified Domain |

**Creator, Founder & Lead Architect:** Abhijit  
For complete documentation covering architecture, database security definers, payment tamper resistance, operational runbooks, test verification commands, and disaster recovery procedures, refer to [`docs/VISTARA-KRAFTS-PROJECT-HANDOVER.md`](./docs/VISTARA-KRAFTS-PROJECT-HANDOVER.md).
