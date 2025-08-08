# Flarebee Project Blueprint & Technical Architecture

This document serves as the comprehensive technical source of truth for the Flarebee platform, detailing its architecture, infrastructure, data flow, and core development concepts.

## 1. High-Level Vision

Flarebee aims to be a comprehensive SaaS platform providing technology solutions to businesses. The initial focus is on a **B2B Service Delivery System**, starting with a "Web Builder" service. The architecture is designed to be scalable, integrating a robust ERP backend with modern web technologies and automation tools.

## 2. Infrastructure & Hosting

Our infrastructure is a hybrid model leveraging best-in-class services for each component:

-   **Frontend Hosting**: The Next.js application is deployed and hosted on **Vercel**, providing CI/CD, scalability, and performance optimization.
-   **Backend & Core Services Hosting**: A **DigitalOcean VPS** serves as our private cloud for core backend services.
    -   **ERPNext**: The single source of truth for all business data (Customers, Items, Projects, Invoices).
    -   **n8n**: Our workflow automation engine, used for orchestrating processes between services.
    -   **Portainer**: A container management UI to simplify the management of our Dockerized services on the VPS.
-   **Development Environment**: All code is developed within **Firebase Studio**, a cloud-based IDE.
-   **Domain & DNS**: The primary domain is registered and managed, with DNS records pointing to Vercel (for the frontend) and DigitalOcean (for subdomains pointing to backend services).
-   **Productivity Suite**: **Google Workspace** is used for company email, collaboration, and document management.

## 3. Core Application Architecture

The fundamental principle of Flarebee is **"ERPNext-First"**. All core business data resides exclusively in ERPNext.

-   **Source of Truth**: ERPNext holds all master data.
-   **Next.js Frontend**: A modern, responsive interface built with Next.js, TypeScript, and ShadCN UI. It provides both an administrative panel for managing the business and a dashboard for clients.
-   **API Layer**: The application communicates with ERPNext via Next.js Server Actions. This layer handles authentication, data transformation, and business logic orchestration.
-   **Authentication**: A dual-auth system is in place:
    -   **Firebase Auth**: Used for public-facing user registration and B2C flows (e.g., template store). This is considered a legacy component for the B2B flow.
    -   **ERPNext Auth**: The primary authentication method for all administrative and B2B client dashboard access. Admins and clients will log in with their ERPNext credentials.

## 4. Key Integrations & Services

-   **Payments**: **Xendit** is the primary payment gateway for processing client invoices.
-   **Email**: **Mailjet** handles all transactional emails (invoices, notifications, etc.).
-   **Automation**: **n8n** is used for internal process automation, connecting various services without custom code.
-   **Communications (In Progress)**: We are actively setting up a **Facebook Developer Account** to gain access to the **WhatsApp API**. This will be used for client communication, notifications, and potentially support.
    -   *Current Blocker*: We are facing a temporary issue with a banned WhatsApp number, which is delaying the full implementation.

## 5. Current Project Status & Roadmap

-   **Backend Migration**: The platform is in an active migration phase. The goal is to move all backend logic and data management **from Firebase to ERPNext**. The B2B service flow is built entirely on ERPNext, while some legacy B2C features (like the template store) still rely on Firebase.
-   **First Service Setup**: We are in the process of launching our first flagship offering: a **Web Builder Service**. This service is the primary driver for the B2B service delivery workflow detailed below.

## 6. The B2B Service Delivery Flow (ERPNext-First)

This is the primary business process facilitated by the platform for services like the Web Builder.

1.  **Project Creation**: An admin creates a `Project` in the Flarebee admin panel, which directly creates a `Project` document in ERPNext.
2.  **Invoice Generation & Issuance**:
    -   The system generates a **submitted** `Sales Invoice` in ERPNext to get a final, official ID (e.g., `ACC-SINV-2024-00001`).
    -   It uses this final ID as the `external_id` to create an invoice in **Xendit**.
    -   The Xendit payment URL is saved back to a custom field on the ERPNext `Sales Invoice`.
    -   The `Project` status is updated to `Awaiting Payment`, and an email with the Xendit payment link is sent to the client.
3.  **Payment Confirmation (Webhook)**:
    -   The client pays via the Xendit link.
    -   A Xendit webhook notifies our API (`/api/webhooks/xendit`).
    -   The webhook handler **self-heals** by creating a `Mode of Payment` in ERPNext if it doesn't exist (e.g., "EWALLET - DANA").
    -   It then creates and submits a `Payment Entry` document against the `Sales Invoice`, which automatically marks the invoice as **"Paid"**.
    -   The corresponding `Project` status is updated to `In Progress`.
4.  **Service Delivery & Client Dashboard (Future)**: The final phase involves delivering the completed service and providing clients with access to a dashboard to manage their services, view project status, and handle billing.
