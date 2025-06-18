
# RIO Templates: Developer Guide

Welcome to the developer guide for the Ragam Inovasi Optima (RIO) Templates project. This guide is intended for developers working on the RIO platform itself or for those who purchase and customize RIO templates.

## 1. Project Overview & Tech Stack

The RIO Templates platform is built using a modern web development stack:

*   **Frontend Framework:** Next.js (with App Router)
*   **Language:** TypeScript
*   **UI Components:** React, ShadCN UI
*   **Styling:** Tailwind CSS
*   **Backend & Database:** Firebase (Firestore for database, Firebase Authentication for users)
*   **Payments:** Xendit (for Indonesian market)
*   **File Storage (for template assets like preview images/zips):** Vercel Blob
*   **AI Features (Example - Template Tagging):** Genkit

## 2. Project Setup (for Platform Developers)

If you're contributing to the RIO platform itself:

1.  **Clone the Repository:**
    ```bash
    git clone [your-repository-url]
    cd ragam-inovasi-optima
    ```
2.  **Install Dependencies:**
    We recommend using `pnpm` for package management.
    ```bash
    pnpm install
    ```
3.  **Environment Variables:**
    Create a `.env.local` file in the root of the project and populate it with the necessary Firebase, Xendit, and Vercel Blob API keys and configuration details. Refer to `.env.example` (if available) or the specific service documentation for required variables.
    *   `NEXT_PUBLIC_FIREBASE_API_KEY`
    *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
    *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    *   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
    *   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
    *   `NEXT_PUBLIC_FIREBASE_APP_ID`
    *   `XENDIT_SECRET_KEY`
    *   `XENDIT_CALLBACK_VERIFICATION_TOKEN`
    *   `BLOB_READ_WRITE_TOKEN` (from Vercel for Vercel Blob storage)
4.  **Firebase Setup:**
    *   Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
    *   Enable Firestore Database (in Native mode).
    *   Enable Firebase Authentication (configure sign-in methods, e.g., Google, Email/Password).
    *   Register your web app in Firebase and copy the configuration details to your `.env.local`.
    *   Set up Firestore security rules appropriate for your application.
5.  **Xendit Setup:**
    *   Create a Xendit account at [dashboard.xendit.co](https://dashboard.xendit.co/).
    *   Obtain your Secret API Key from the Xendit dashboard and add it to `.env.local`.
    *   Configure a callback verification token in Xendit settings and add it to `.env.local`.
    *   Set up webhook URLs in Xendit to point to your deployed application's webhook endpoint (e.g., `https://your-app-url.com/api/webhooks/xendit`).
6.  **Vercel Blob Setup:**
    *   If deploying to Vercel, create a Blob store through the Vercel dashboard for your project.
    *   Obtain the `BLOB_READ_WRITE_TOKEN` and add it to your Vercel project's environment variables (and `.env.local` for local development if testing Blob uploads locally, though direct local upload might require tunneling or Vercel CLI).
7.  **Run the Development Server:**
    ```bash
    pnpm dev
    ```
    The application should now be running, typically on `http://localhost:9002`.

## 3. Key Directories & Code Structure

*   `src/app/`: Contains all routes and UI for the Next.js App Router.
    *   `(auth)`: Authentication-related pages (login, signup).
    *   `(main)`: Main application pages accessible to general users (homepage, template details, checkout).
    *   `admin/`: Admin panel pages.
    *   `api/`: API routes (e.g., webhooks).
*   `src/components/`: Reusable UI components.
    *   `layout/`: Components for overall page structure (Navbar, Footer).
    *   `sections/`: Larger UI sections specific to certain pages.
    *   `shared/`: Generic shared components (TemplateCard, LoginModal).
    *   `ui/`: Base UI elements from ShadCN (Button, Card, Input, etc.).
*   `src/lib/`: Core logic, constants, and third-party service integrations.
    *   `actions/`: Next.js Server Actions for mutations (form submissions, API calls).
    *   `firebase/`: Firebase configuration, AuthContext, and Firestore interaction functions.
    *   `constants.ts`: Application-wide constants (e.g., categories).
    *   `types.ts`: TypeScript type definitions.
    *   `utils.ts`: Utility functions.
*   `src/context/`: React Context providers (e.g., CartContext).
*   `public/`: Static assets.

## 4. Coding Conventions & Best Practices

*   **Next.js App Router:** Utilize Server Components by default. Use Client Components (`'use client';`) only when necessary (e.g., for interactivity, hooks).
*   **TypeScript:** Use TypeScript for all new code. Strive for strong typing.
*   **ShadCN UI & Tailwind CSS:** Leverage ShadCN components for UI and Tailwind CSS for styling. Adhere to the project's theme defined in `globals.css`.
*   **Server Actions:** Use Server Actions for form submissions and data mutations to simplify data handling.
*   **Error Handling:** Implement robust error handling, especially for API calls and server actions. Use toasts for user feedback.
*   **Firebase:** Follow Firebase best practices for security rules and data modeling.
*   **Environment Variables:** Never commit sensitive keys directly. Use environment variables.
*   **Responsiveness:** Ensure all UI is responsive across common device sizes.
*   **Accessibility (a11y):** Build with accessibility in mind (semantic HTML, ARIA attributes where appropriate).

## 5. Working with Templates (for End-Users/Customizers)

If you've purchased a template from RIO:

*   **Unzip the Template:** Each template is typically provided as a ZIP file.
*   **Follow Template-Specific README:** Each template should include its own `README.md` with specific setup instructions, dependencies, and how to run it.
*   **Customization:**
    *   Modify Tailwind CSS configuration (`tailwind.config.ts`) and `globals.css` for theming.
    *   Update text, images, and branding in the React components.
    *   Adapt or extend existing functionality to meet your needs.
*   **Deployment:** Templates are standard Next.js applications and can be deployed to platforms like Vercel, Netlify, or any Node.js-compatible hosting.

## 6. Contribution Guidelines (for Platform Developers)

*   Follow existing coding styles and conventions.
*   Create feature branches from the main development branch.
*   Write clear and concise commit messages.
*   Ensure new features are well-tested (unit/integration tests are encouraged).
*   Update relevant documentation if your changes impact existing functionality or add new features.
*   Submit Pull Requests (PRs) for review.

This guide provides a starting point. As the project evolves, specific sections may require more detailed documentation.
