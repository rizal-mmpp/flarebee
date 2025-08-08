# Flarebee SaaS Platform

Flarebee is a comprehensive SaaS platform providing technology solutions including web builder services, automation tools, and AI-powered applications. It is built with an **ERPNext-First** architecture, where ERPNext serves as the core backend for all business operations.

## Features

### Admin Panel
-   **Project Management**: Create, track, and manage client projects directly linked to ERPNext `Project` documents.
-   **B2B Invoicing**: Generate and send client invoices with integrated Xendit payment links.
-   **Customer Management**: View and manage customer data sourced from ERPNext.
-   **Service Management**: Define service offerings as `Item` documents in ERPNext.
-   **Content Management**: Edit content for key informational pages on the website.

### User / Client Features
-   **Service Marketplace**: Browse and explore available technology solutions.
-   **Secure Payments**: Pay invoices through a secure Xendit payment portal.
-   **Client Dashboard (Future)**: A dedicated portal for clients to track project status and access completed services.

## Core Architecture

-   **Framework**: Next.js 15+ with TypeScript (App Router)
-   **UI**: ShadCN UI & Radix UI
-   **Styling**: Tailwind CSS
-   **Backend of Choice**: **ERPNext**. All business data (Customers, Items, Projects, Invoices) is stored and managed in ERPNext.
-   **Authentication**:
    -   **ERPNext Login**: For all administrative access.
    -   **Firebase Auth**: For public-facing user accounts (legacy).
-   **Payment Processing**: **Xendit** (for B2B invoicing).
-   **Email Service**: **Mailjet** for transactional emails.

## Getting Started

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your `.env` file with credentials for **ERPNext, Xendit, and Mailjet**. See `/docs/blueprint.md` for a full list of required variables.
4.  Run the development server:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:9002`.

## B2B Service Delivery Workflow

The platform's primary function is a B2B service delivery system:
1.  **Admin creates a Project** in the Flarebee UI, which creates a `Project` in ERPNext.
2.  Admin **sends an invoice**, which creates a `Sales Invoice` in ERPNext and a corresponding payment link in Xendit.
3.  Client **pays the invoice** via the Xendit link.
4.  A **webhook from Xendit** updates the `Sales Invoice` in ERPNext to "Paid" by creating a `Payment Entry`.
5.  The `Project` status is updated to "In Progress", and work can begin.

For more detailed architectural information, please see `/docs/blueprint.md`.

## License

Private - All rights reserved
