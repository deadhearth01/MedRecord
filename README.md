# MedRecord - Medical Records Management System

**🚀 Status: PRODUCTION READY (August 9, 2025)**

A comprehensive medical records web application built with Next.js, Supabase, and AI-powered document analysis.

## 🔥 Latest Deployment Fixes
- ✅ All TypeScript compilation errors resolved
- ✅ Autoprefixer dependency added for production builds  
- ✅ GSAP animation compatibility fixed
- ✅ Missing database functions added
- ✅ Production-ready configuration complete

## Features

### For Citizens
- **Secure Medical Records Storage**: Store prescriptions, lab reports, medical bills, and other health documents
- **AI-Powered Analysis**: Get intelligent summaries and insights from uploaded medical documents
- **Mobile-First Design**: Optimized for smartphones and tablets with responsive design
- **Unique MED ID**: Generate a unique medical ID for easy patient identification
- **Document Organization**: Categorize and tag medical records for easy retrieval
- **Photo Capture**: Take photos of medical documents directly from your phone

### For Healthcare Professionals
- **Patient Search**: Find patients using their unique MED ID
- **Medical History Access**: View comprehensive patient medical records
- **Appointment Management**: Schedule and manage patient appointments
- **Professional Dashboard**: Dedicated interface for healthcare providers

## Technology Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI with Radix UI primitives
- **Backend**: Supabase (Authentication, Database, File Storage)
- **AI Integration**: Google Gemini API for document analysis
- **Mobile Optimization**: Progressive Web App (PWA) capabilities

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MedRecord
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

You need to create the following tables in your Supabase database:

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  med_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  blood_group TEXT,
  date_of_birth DATE,
  profile_image_url TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('citizen', 'doctor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

### Medical Records Table
```sql
CREATE TABLE medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  hospital_name TEXT,
  visit_date DATE,
  record_type TEXT NOT NULL CHECK (record_type IN ('prescription', 'lab_report', 'bill', 'general', 'other')),
  ai_summary TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

### Appointments Table
```sql
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

### Doctor Profiles Table
```sql
CREATE TABLE doctor_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  license_number TEXT NOT NULL,
  hospital_affiliation TEXT,
  experience_years INTEGER,
  consultation_fee DECIMAL(10,2),
  available_days TEXT[],
  available_hours TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

### Storage Bucket
Create a storage bucket named `medical-files` in Supabase Storage for file uploads.

### Row Level Security (RLS)
Enable RLS and create appropriate policies for each table to ensure data security.

## Authentication Setup

Configure Google OAuth in your Supabase project:
1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Google provider
3. Add your Google OAuth credentials
4. Set the redirect URL to: `https://your-domain.com/auth/callback`

## Deployment

The application can be deployed to any platform that supports Next.js:

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push

### Other Platforms
- Netlify
- Railway
- Digital Ocean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Security Features

- End-to-end encryption for sensitive data
- Row Level Security (RLS) in Supabase
- Secure file upload with type validation
- Authentication required for all protected routes
- HTTPS enforcement in production

## Support

For support, email [evanriosprojects@gmail.com](mailto:evanriosprojects@gmail.com)

## License

This project is licensed under the MIT License.

## Acknowledgments

- Supabase for the backend infrastructure
- Google Gemini for AI-powered document analysis
- Shadcn UI for the beautiful component library
- Vercel for hosting and deployment
