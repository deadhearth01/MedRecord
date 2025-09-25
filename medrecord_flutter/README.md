# MedRecord Flutter App

A comprehensive medical records management system built with Flutter for web, iOS, and Android platforms.

## Features

### 🔐 Authentication & Security
- Google OAuth integration via Supabase Auth
- Secure user profiles with unique MED IDs
- Role-based access (Citizens and Healthcare Professionals)
- End-to-end encryption for sensitive data

### 📱 Cross-Platform Support
- **Web**: Progressive Web App (PWA) capabilities
- **iOS**: Native iOS app with platform-specific optimizations
- **Android**: Native Android app with Material Design
- Responsive design that adapts to all screen sizes

### 🏥 Medical Records Management
- Upload medical documents (photos, PDFs, images)
- AI-powered document analysis using Google Gemini
- Categorize records (Prescriptions, Lab Reports, Medical Bills, etc.)
- Secure cloud storage with Supabase
- OCR text extraction from document images
- Search and filter medical records

### 🤖 AI-Powered Features
- Automatic document categorization
- Medical document analysis and summarization
- Key findings extraction
- Medication list generation
- Health recommendations
- Urgency level detection

### 📅 Appointment Management
- Schedule appointments with healthcare providers
- View upcoming and past appointments
- Appointment reminders and notifications
- Doctor search and discovery
- Integration with healthcare provider calendars

### 👨‍⚕️ Healthcare Provider Features
- Patient search by MED ID
- Access to patient medical history (with permission)
- Appointment management dashboard
- Professional profile management
- Patient record sharing capabilities

### 📊 Dashboard & Analytics
- Health overview with key statistics
- Recent records and appointments
- Quick actions for common tasks
- Visual charts and graphs
- Health trends analysis

### 🔗 Sharing & Collaboration
- QR code generation for easy MED ID sharing
- Secure record sharing with healthcare providers
- Emergency contact access
- Family member account linking

## Technology Stack

### Frontend
- **Flutter 3.10+** - Cross-platform UI framework
- **Dart 3.0+** - Programming language
- **Material Design 3** - UI components and design system
- **Provider** - State management
- **Custom Widgets** - Reusable UI components

### Backend & Services
- **Supabase** - Backend as a service
  - Authentication (Google OAuth)
  - PostgreSQL Database
  - File Storage
  - Row Level Security (RLS)
- **Google Gemini AI** - Document analysis and AI features
- **Supabase Storage** - Secure file uploads and management

### Key Dependencies
```yaml
dependencies:
  flutter: sdk
  supabase_flutter: ^2.3.4      # Backend integration
  provider: ^6.1.1              # State management
  google_generative_ai: ^0.2.2  # AI document analysis
  image_picker: ^1.0.7          # Camera and gallery access
  file_picker: ^6.1.1           # File selection
  qr_flutter: ^4.1.0            # QR code generation
  cached_network_image: ^3.3.1  # Image caching
  fl_chart: ^0.66.2             # Charts and graphs
  intl: ^0.19.0                 # Internationalization
```

## Project Structure

```
lib/
├── main.dart                  # App entry point
├── config/
│   ├── app_config.dart        # App configuration
│   └── theme_config.dart      # Theme and styling
├── models/
│   ├── user_model.dart        # User data model
│   ├── medical_record_model.dart
│   └── appointment_model.dart
├── providers/
│   ├── auth_provider.dart     # Authentication state
│   ├── medical_records_provider.dart
│   └── appointments_provider.dart
├── services/
│   ├── supabase_service.dart  # Backend API calls
│   └── gemini_service.dart    # AI analysis
├── screens/
│   ├── auth/                  # Authentication screens
│   ├── dashboard/             # Main dashboard
│   ├── medical_records/       # Records management
│   ├── appointments/          # Appointment booking
│   └── profile/              # User profile
├── widgets/
│   ├── common/               # Reusable widgets
│   └── dashboard/            # Dashboard components
└── utils/
    ├── app_router.dart       # Navigation routing
    └── med_id_generator.dart # MED ID generation
```

## Environment Setup

### Prerequisites
- Flutter 3.10+
- Dart 3.0+
- Android Studio / VS Code
- Xcode (for iOS development)

### Environment Variables
Create a `.env` file or set environment variables:
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd medrecord_flutter
```

2. **Install dependencies**
```bash
flutter pub get
```

3. **Generate code (for models)**
```bash
flutter packages pub run build_runner build
```

4. **Configure Supabase**
- Create a Supabase project
- Set up the database schema (see database setup below)
- Configure Google OAuth provider
- Update environment variables

5. **Run the app**
```bash
# Web
flutter run -d chrome

# iOS Simulator
flutter run -d ios

# Android Emulator
flutter run -d android
```

## Database Schema

The app uses Supabase PostgreSQL with the following tables:

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
  user_type TEXT NOT NULL CHECK (user_type IN ('citizen', 'doctor')),
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Medical Records Table
```sql
CREATE TABLE medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  summary TEXT,
  ai_analysis TEXT,
  key_findings TEXT[],
  medications TEXT[],
  recommendations TEXT[],
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high')),
  file_name TEXT,
  file_path TEXT,
  file_url TEXT,
  file_size BIGINT,
  file_type TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Features Implementation Status

### ✅ Completed
- [x] Flutter project structure and configuration
- [x] Supabase integration and authentication
- [x] User models and data structures
- [x] Authentication flow (Google OAuth)
- [x] User onboarding and profile creation
- [x] Dashboard with statistics and overview
- [x] State management with Provider
- [x] Theme configuration and styling
- [x] AI document analysis service
- [x] MED ID generation system
- [x] Responsive design foundation

### 🔄 In Development
- [ ] Complete medical records management
- [ ] File upload and camera integration
- [ ] Appointment booking system
- [ ] QR code sharing functionality
- [ ] Doctor search and discovery
- [ ] Advanced dashboard analytics
- [ ] Offline support and caching

### 📋 Planned Features
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Biometric authentication
- [ ] Family account linking
- [ ] Export functionality (PDF reports)
- [ ] Integration with wearable devices
- [ ] Telemedicine features

## Security Features

- **Row Level Security (RLS)** - Database-level access control
- **End-to-end encryption** - Sensitive data encryption
- **Secure file storage** - Protected file uploads
- **Authentication required** - All routes protected
- **HTTPS enforcement** - Secure communication
- **Input validation** - Prevent injection attacks
- **Session management** - Secure user sessions

## Performance Optimizations

- **Image caching** - Cached network images
- **Lazy loading** - Efficient data loading
- **State management** - Optimized state updates
- **Database indexing** - Fast query performance
- **File compression** - Optimized file uploads
- **Responsive images** - Device-appropriate image sizes

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

```bash
# Run unit tests
flutter test

# Run integration tests
flutter drive --target=test_driver/app.dart

# Run widget tests
flutter test test/widget_test.dart
```

## Deployment

### Web Deployment
```bash
flutter build web --release
```

### Android APK
```bash
flutter build apk --release
```

### iOS App Store
```bash
flutter build ios --release
```

## Support

For support and questions:
- Create an issue in the repository
- Contact: [your-email@example.com](mailto:your-email@example.com)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Supabase** - Backend infrastructure and authentication
- **Google Gemini** - AI-powered document analysis
- **Flutter Team** - Cross-platform development framework
- **Material Design** - UI/UX design system