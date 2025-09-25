import 'package:flutter/material.dart';
import '../screens/splash/splash_screen.dart';
import '../screens/auth/auth_wrapper.dart';
import '../screens/auth/signin_screen.dart';
import '../screens/auth/onboarding_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/medical_records/medical_records_screen.dart';
import '../screens/appointments/appointments_screen.dart';
import '../screens/profile/profile_screen.dart';

class AppRouter {
  static const String splash = '/splash';
  static const String auth = '/auth';
  static const String signin = '/signin';
  static const String onboarding = '/onboarding';
  static const String dashboard = '/dashboard';
  static const String medicalRecords = '/medical-records';
  static const String appointments = '/appointments';
  static const String profile = '/profile';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return MaterialPageRoute(
          builder: (_) => const SplashScreen(),
          settings: settings,
        );
      
      case auth:
        return MaterialPageRoute(
          builder: (_) => const AuthWrapper(),
          settings: settings,
        );
      
      case signin:
        return MaterialPageRoute(
          builder: (_) => const SignInScreen(),
          settings: settings,
        );
      
      case onboarding:
        return MaterialPageRoute(
          builder: (_) => const OnboardingScreen(),
          settings: settings,
        );
      
      case dashboard:
        return MaterialPageRoute(
          builder: (_) => const DashboardScreen(),
          settings: settings,
        );
      
      case medicalRecords:
        return MaterialPageRoute(
          builder: (_) => const MedicalRecordsScreen(),
          settings: settings,
        );
      
      case appointments:
        return MaterialPageRoute(
          builder: (_) => const AppointmentsScreen(),
          settings: settings,
        );
      
      case profile:
        return MaterialPageRoute(
          builder: (_) => const ProfileScreen(),
          settings: settings,
        );
      
      default:
        return MaterialPageRoute(
          builder: (_) => const Scaffold(
            body: Center(
              child: Text('Route not found'),
            ),
          ),
          settings: settings,
        );
    }
  }
}