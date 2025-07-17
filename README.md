# Flarebee

Flarebee is a comprehensive SaaS platform that provides cutting-edge technology solutions, including web builder services, automation tools, and AI-powered applications. Our platform enables businesses to discover, purchase, and manage various technology services through an intuitive interface.

## Features

### For Users
- 🔍 **Service Discovery** - Browse and explore our technology solutions
- 🛒 **Easy Purchase Flow** - Streamlined cart and checkout experience
- 📊 **User Dashboard** - Manage services, billing, and integrations
- 📱 **Responsive Design** - Seamless experience across all devices
- 🔐 **Secure Authentication** - Protected access to your services

### For Administrators
- 🎛️ **Service Management** - Create and manage service offerings
- 👥 **Customer Management** - Track customer profiles and orders
- 📝 **Content Management** - Edit website content and documentation
- ⚙️ **System Settings** - Configure platform and integrations

## Tech Stack

- **Framework**: Next.js 15.2 with TypeScript
- **UI Components**: Radix UI with custom styling
- **Styling**: Tailwind CSS
- **Authentication**: Dual system supporting Firebase and ERPNext
- **Database**: Firebase
- **Payment Processing**: Multiple providers (Stripe, Xendit, iPaymu)
- **State Management**: TanStack Query

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (see `.env.example`)
4. Configure authentication:
   - For Firebase: Set up a Firebase project and add credentials
   - For ERPNext: Configure your ERPNext instance URL
5. Run the development server:
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:9002

## Development Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                # Next.js app directory
│   ├── admin/          # Admin panel pages
│   ├── dashboard/      # User dashboard pages
│   └── auth/           # Authentication pages
├── components/         # Reusable components
├── lib/               # Utilities and configurations
└── types/             # TypeScript type definitions
```

## Design System

- **Primary Color**: #FFC72C (Warm Yellow)
- **Background**: #1A202C (Dark Blue)
- **Accent**: #FF9100 (Golden Orange)

## Authentication

Flarebee supports two authentication methods:

### Firebase Authentication
- Email/Password sign-in
- Password reset functionality
- Secure token management

### ERPNext Authentication
- Direct integration with ERPNext instance
- Session-based authentication
- Unified password reset system

Users can choose their preferred authentication method during login.

## Future Roadmap

- Enhanced ERPNext integration features
- Enhanced AI capabilities
- Additional automation tools
- Expanded payment options

## License

Private - All rights reserved