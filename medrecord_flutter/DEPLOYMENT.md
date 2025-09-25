# MedRecord Flutter - Deployment Guide

This guide covers how to deploy the MedRecord Flutter app to various platforms including web, iOS, and Android.

## Prerequisites

- Flutter 3.10+ installed
- Dart 3.0+ installed
- Platform-specific development tools:
  - **Web**: Chrome browser
  - **Android**: Android Studio, Android SDK
  - **iOS**: Xcode, iOS development certificates

## Environment Setup

### 1. Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Fill in your actual configuration values:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 2. Supabase Backend Setup

#### Database Schema
Run the following SQL commands in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT,
  medications TEXT,
  allergies TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical records table
CREATE TABLE medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('prescription', 'lab-report', 'medical-bill', 'scan-report', 'consultation', 'vaccination', 'vital-signs', 'other')),
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
  uploaded_by TEXT,
  uploaded_by_type TEXT,
  hospital_name TEXT,
  doctor_name TEXT,
  visit_date DATE,
  tags TEXT[],
  is_shared BOOLEAN DEFAULT false,
  shared_with TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  notes TEXT,
  doctor_name TEXT,
  patient_name TEXT,
  hospital_name TEXT,
  specialty TEXT,
  consultation_fee DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Row Level Security (RLS) Policies

Enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Medical records policies
CREATE POLICY "Users can view own medical records" ON medical_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medical records" ON medical_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medical records" ON medical_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medical records" ON medical_records FOR DELETE USING (auth.uid() = user_id);

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "Users can create appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
```

#### Storage Setup

1. Create a storage bucket named `medical-files`
2. Configure storage policies:

```sql
-- Storage policies for medical files
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-files', 'medical-files', false);

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload medical files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own files
CREATE POLICY "Users can view own medical files" ON storage.objects FOR SELECT USING (
  bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own medical files" ON storage.objects FOR DELETE USING (
  bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Web client**: For Flutter web
   - **Android client**: For Android app
   - **iOS client**: For iOS app
5. Configure authorized domains and redirect URIs
6. Add the OAuth client IDs to your Supabase Auth settings

### 4. Google Gemini AI Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the API key to your environment variables

## Development Build

### Install Dependencies

```bash
flutter pub get
```

### Generate Code (for models)

```bash
flutter packages pub run build_runner build --delete-conflicting-outputs
```

### Run Development Server

```bash
# Web
flutter run -d chrome

# Android
flutter run -d android

# iOS
flutter run -d ios
```

## Production Deployment

### Web Deployment

#### Build for Web

```bash
flutter build web --release --web-renderer html
```

#### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Initialize Firebase project:
```bash
firebase login
firebase init hosting
```

3. Configure `firebase.json`:
```json
{
  "hosting": {
    "public": "build/web",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

4. Deploy:
```bash
firebase deploy --only hosting
```

#### Deploy to Netlify

1. Build the web app:
```bash
flutter build web --release
```

2. Deploy via Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build/web
```

### Android Deployment

#### Build APK

```bash
flutter build apk --release
```

#### Build App Bundle (for Google Play Store)

```bash
flutter build appbundle --release
```

#### Configure App Signing

1. Generate signing key:
```bash
keytool -genkey -v -keystore ~/medrecord-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias medrecord
```

2. Create `android/key.properties`:
```properties
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=medrecord
storeFile=/path/to/medrecord-key.jks
```

3. Configure `android/app/build.gradle`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### iOS Deployment

#### Prerequisites

1. Apple Developer Account
2. iOS Development Certificates
3. App ID registration
4. Provisioning Profiles

#### Build for iOS

```bash
flutter build ios --release
```

#### Deploy to TestFlight/App Store

1. Open `ios/Runner.xcworkspace` in Xcode
2. Configure signing and capabilities
3. Archive the app
4. Upload to App Store Connect

### CI/CD Pipeline

#### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy MedRecord

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: subosito/flutter-action@v2
      with:
        flutter-version: '3.10.0'
    - run: flutter pub get
    - run: flutter test
    - run: flutter analyze

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - uses: subosito/flutter-action@v2
      with:
        flutter-version: '3.10.0'
    - run: flutter pub get
    - run: flutter build web --release
    - uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: your-firebase-project-id

  deploy-android:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - uses: subosito/flutter-action@v2
      with:
        flutter-version: '3.10.0'
    - run: flutter pub get
    - run: flutter build appbundle --release
    - uses: r0adkll/upload-google-play@v1
      with:
        serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
        packageName: com.yourcompany.medrecord
        releaseFiles: build/app/outputs/bundle/release/app-release.aab
        track: production
```

## Environment Variables for Production

### Required Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `GEMINI_API_KEY`: Google Gemini API key

### Optional Environment Variables

- `FIREBASE_PROJECT_ID`: For push notifications
- `SENTRY_DSN`: For crash reporting
- `GOOGLE_ANALYTICS_ID`: For analytics

## Performance Optimization

### Web Performance

1. **Enable Web Renderers**:
```bash
flutter build web --web-renderer canvaskit --release
```

2. **Enable Code Splitting**:
```bash
flutter build web --split-debug-info --release
```

### Mobile Performance

1. **Enable Proguard/R8** (Android):
```gradle
buildTypes {
    release {
        shrinkResources true
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

2. **Optimize Images**:
   - Use appropriate image formats (WebP for web)
   - Implement image caching
   - Use responsive images

## Monitoring and Analytics

### Error Reporting

1. **Sentry Integration**:
```yaml
dependencies:
  sentry_flutter: ^7.0.0
```

2. **Firebase Crashlytics**:
```yaml
dependencies:
  firebase_crashlytics: ^3.0.0
```

### Performance Monitoring

1. **Firebase Performance**:
```yaml
dependencies:
  firebase_performance: ^0.9.0
```

## Security Checklist

- [ ] Environment variables secured
- [ ] API keys not exposed in client code
- [ ] HTTPS enabled for all endpoints
- [ ] Row Level Security (RLS) enabled
- [ ] Input validation implemented
- [ ] File upload restrictions in place
- [ ] OAuth redirect URLs configured
- [ ] App signing certificates secured
- [ ] Biometric authentication enabled (optional)
- [ ] Session management implemented

## Troubleshooting

### Common Issues

1. **Supabase Connection Issues**:
   - Verify URL and keys
   - Check network connectivity
   - Ensure RLS policies are correct

2. **OAuth Issues**:
   - Verify client IDs
   - Check redirect URLs
   - Ensure OAuth consent screen is configured

3. **Build Issues**:
   - Clear build cache: `flutter clean`
   - Reinstall dependencies: `flutter pub get`
   - Check Flutter version compatibility

### Support

For deployment support:
- Check the [Flutter documentation](https://docs.flutter.dev)
- Review [Supabase guides](https://supabase.com/docs)
- Create an issue in the repository

## Maintenance

### Regular Tasks

- Update Flutter SDK and dependencies
- Monitor Supabase usage and costs
- Review and rotate API keys
- Update security policies
- Monitor app performance metrics
- Review user feedback and crash reports