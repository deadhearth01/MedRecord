/// Application configuration constants
class AppConfig {
  // Supabase Configuration
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'YOUR_SUPABASE_URL',
  );
  
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY', 
    defaultValue: 'YOUR_SUPABASE_ANON_KEY',
  );
  
  // Gemini AI Configuration
  static const String geminiApiKey = String.fromEnvironment(
    'GEMINI_API_KEY',
    defaultValue: 'YOUR_GEMINI_API_KEY',
  );
  
  // App Configuration
  static const String appName = 'MedRecord';
  static const String appVersion = '1.0.0';
  static const String appBuildNumber = '1';
  
  // Storage Configuration
  static const String medicalFilesBucket = 'medical-files';
  
  // MED ID Prefixes
  static const String citizenPrefix = 'CT';
  static const String doctorPrefix = 'DR';
  
  // File Upload Limits
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'webp'];
  static const List<String> allowedDocumentTypes = ['pdf', 'doc', 'docx'];
  
  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 400);
  static const Duration longAnimation = Duration(milliseconds: 800);
  
  // API Endpoints
  static const String apiBaseUrl = 'https://api.medrecord.app';
  
  // OAuth Redirect URLs
  static const String authCallbackUrl = 'https://medrecord.app/auth/callback';
  
  // Feature Flags
  static const bool enableAnalytics = true;
  static const bool enableCrashReporting = true;
  static const bool enableOfflineMode = true;
  
  // Development Settings
  static const bool isDebugMode = bool.fromEnvironment('dart.vm.product') == false;
  static const bool enableLogging = true;
}