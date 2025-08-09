<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# MedRecord - Medical Records Management System

This is a Next.js 14 medical records web application built with TypeScript, Tailwind CSS, Shadcn UI, and Supabase.

## Project Structure

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI components with Radix UI primitives
- **Backend**: Supabase for authentication, database, and file storage
- **AI Integration**: Google Gemini API for medical document analysis
- **Mobile-First**: Responsive design optimized for mobile devices

## Key Features

1. **Authentication**: Google OAuth via Supabase Auth
2. **User Management**: Citizen and Doctor user types with unique MED IDs
3. **Medical Records**: Upload, categorize, and manage medical documents
4. **AI Analysis**: Automatic document analysis and summarization using Gemini AI
5. **File Upload**: Support for images, PDFs, and documents with secure storage
6. **Appointments**: Basic appointment scheduling system
7. **Mobile Optimized**: Touch-friendly interface with responsive design

## Development Guidelines

- Use TypeScript for all components and utilities
- Follow mobile-first responsive design principles
- Implement proper error handling and loading states
- Use Supabase RLS (Row Level Security) for data protection
- Follow accessibility best practices
- Use semantic HTML and ARIA labels where appropriate
- Implement proper form validation
- Use React Server Components where possible
- Follow Next.js App Router conventions

## Database Schema

The application uses the following main tables:
- `users`: User profiles with MED IDs
- `medical_records`: Medical documents and records
- `appointments`: Appointment scheduling
- `doctor_profiles`: Additional doctor information

## Security Considerations

- All database operations use RLS policies
- File uploads are sanitized and validated
- User authentication is required for all protected routes
- Sensitive data is encrypted at rest
- API keys are properly secured in environment variables

## Styling Guidelines

- Use Tailwind CSS utility classes
- Follow the established color scheme (blue theme)
- Ensure minimum 44px touch targets for mobile
- Use consistent spacing and typography
- Implement smooth animations and transitions
- Support both light and dark modes (prepared but light mode priority)

## Component Patterns

- Create reusable UI components in `/components/ui/`
- Use proper TypeScript interfaces for props
- Implement loading and error states
- Follow compound component patterns where appropriate
- Use React hooks for state management
- Implement proper cleanup in useEffect hooks
