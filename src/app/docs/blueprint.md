# Flarebee Project Blueprint & Architecture

This document serves as the technical source of truth for the Flarebee platform, detailing its architecture, data flow, and core development concepts.

## 1. Core Architecture: ERPNext-First

The fundamental principle of Flarebee is **"ERPNext-First"**. All core business data—including customers, items (services), projects, and invoices—resides exclusively in ERPNext. The Next.js application acts as a sophisticated, user-friendly frontend and orchestration layer on top of ERPNext's robust backend.

-   **Source of Truth**: ERPNext holds all master data. Firebase is used for legacy B2C user authentication but is not the source of truth for business operations.
-   **Next.js Frontend**: A modern, responsive interface built with Next.js, TypeScript, and ShadCN UI. It provides both an administrative panel for managing the business and a dashboard for clients.
-   **API Layer**: The application communicates with ERPNext via a custom API layer built with Next.js Server Actions. This layer handles authentication, data transformation, and business logic orchestration.
-   **Authentication**: A dual-auth system is in place:
    -   **Firebase Auth**: For public-facing user registration and B2C flows (legacy/template store).
    -   **ERPNext Auth**: For all administrative and B2B client dashboard access. Admins log in with their ERPNext credentials.

## 2. The B2B Service Delivery Flow

This is the primary business process facilitated by the platform.

1.  **Project Creation**: An admin creates a `Project` in the Flarebee admin panel. This action directly creates a `Project` document in ERPNext.
    -   The admin links an existing `Customer` or creates a new one on the fly.
    -   A `Service Item` and `Subscription Plan` are selected to define the project scope and cost.

2.  **Invoice Generation & Issuance**:
    -   From the Project detail page, an admin clicks "Create & Send Invoice".
    -   The system creates a **Draft** `Sales Invoice` in ERPNext.
    -   It then immediately **submits** this draft to get the final, official invoice ID (e.g., `ACC-SINV-2024-00001`).
    -   Using this final ID as the `external_id`, an invoice is created in **Xendit**.
    -   The Xendit payment URL is saved back to a custom field on the now-submitted `Sales Invoice`.
    -   The `Project` status is updated to `Awaiting Payment`, and an email with the Xendit payment link is sent to the client.

3.  **Payment Confirmation (Webhook)**:
    -   The client pays via the Xendit link.
    -   Xendit sends a `payment.paid` webhook to a dedicated API route in Flarebee (`/api/webhooks/xendit`).
    -   The webhook handler identifies the `Sales Invoice` in ERPNext using the `external_id`.
    -   It creates and submits a `Payment Entry` document against the `Sales Invoice`, which automatically marks the invoice as **"Paid"** in ERPNext.
    -   The corresponding `Project` status is updated to `In Progress`.
    -   A payment confirmation email is sent to the client.

4.  **Service Delivery (Future)**:
    -   Admin works on the project.
    -   Once complete, the admin will use the Flarebee UI to mark the project as `Completed` and input the final service URL.
    -   This will trigger a final delivery email to the client with their service link and credentials for the Flarebee client dashboard.

## 3. Self-Healing Infrastructure

A key design concept is "self-healing" infrastructure, where the application programmatically ensures the required ERPNext configuration exists before performing an action.

-   **Custom Fields**: Before creating a `Project`, the system ensures all necessary custom fields (`service_item`, `sales_invoice`, etc.) exist on the `Project` DocType. If not, it creates them using the ERPNext API. This applies to `Sales Invoice` and `Payment Entry` as well.
-   **Mode of Payment**: The Xendit webhook handler dynamically creates `Mode of Payment` documents (e.g., "EWALLET - DANA") if they don't already exist, preventing link validation errors.

This approach dramatically simplifies deployment and reduces manual setup in ERPNext, making the system more robust and portable.

## 4. Key Technologies & Services

-   **Framework**: Next.js 15+ (App Router)
-   **Language**: TypeScript
-   **UI**: ShadCN UI, Tailwind CSS, Radix UI
-   **Backend/ERP**: ERPNext
-   **Payments**: Xendit
-   **Email**: Mailjet
-   **State Management**: Client-side state managed with React hooks (`useState`, `useEffect`). Server state managed via Server Actions.

## 5. Environment Variables (`.env`)

The application relies on the following environment variables:

```
# Firebase (Legacy/B2C)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# ERPNext
NEXT_PUBLIC_ERPNEXT_API_URL=https://your-erpnext-site.com
NEXT_PUBLIC_ERPNEXT_GUEST_API_KEY=
NEXT_PUBLIC_ERPNEXT_GUEST_API_SECRET=
ERPNEXT_ADMIN_API_KEY=
ERPNEXT_ADMIN_API_SECRET=

# Xendit
XENDIT_SECRET_KEY=
XENDIT_CALLBACK_VERIFICATION_TOKEN=

# Mailjet
MAILJET_API_KEY=
MAILJET_API_SECRET=
MAILJET_SENDER_EMAIL= # A verified sender email in Mailjet
```
