import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide Provider;
import '../models/user_model.dart';
import '../services/supabase_service.dart';

enum AuthState {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

class AuthProvider with ChangeNotifier {
  AuthState _authState = AuthState.initial;
  UserModel? _currentUser;
  String? _errorMessage;
  
  AuthState get authState => _authState;
  UserModel? get currentUser => _currentUser;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _authState == AuthState.authenticated;
  bool get isLoading => _authState == AuthState.loading;

  AuthProvider() {
    _initialize();
  }

  void _initialize() {
    // Listen to auth state changes
    SupabaseService.authStream.listen((AuthState authState) {
      _handleAuthStateChange(authState.session?.user);
    });
    
    // Check current session
    final currentAuthUser = SupabaseService.getCurrentAuthUser();
    if (currentAuthUser != null) {
      _loadUserProfile(currentAuthUser.id);
    } else {
      _setAuthState(AuthState.unauthenticated);
    }
  }

  Future<void> _handleAuthStateChange(User? user) async {
    if (user != null) {
      await _loadUserProfile(user.id);
    } else {
      _currentUser = null;
      _setAuthState(AuthState.unauthenticated);
    }
  }

  Future<void> _loadUserProfile(String userId) async {
    try {
      _setAuthState(AuthState.loading);
      
      final userProfile = await SupabaseService.getUserProfile(userId);
      
      if (userProfile != null) {
        _currentUser = userProfile;
        _setAuthState(AuthState.authenticated);
      } else {
        // User exists in auth but not in profiles table
        // This might be a new user that needs onboarding
        _setAuthState(AuthState.unauthenticated);
      }
    } catch (e) {
      print('Error loading user profile: $e');
      _setError('Failed to load user profile: ${e.toString()}');
    }
  }

  Future<bool> signInWithGoogle() async {
    try {
      _setAuthState(AuthState.loading);
      
      await SupabaseService.signInWithGoogle();
      
      // The auth state change listener will handle the rest
      return true;
    } catch (e) {
      print('Error signing in with Google: $e');
      _setError('Failed to sign in with Google: ${e.toString()}');
      return false;
    }
  }

  Future<bool> createUserProfile({
    required String firstName,
    required String lastName,
    required UserType userType,
    String? phone,
  }) async {
    try {
      _setAuthState(AuthState.loading);
      
      final authUser = SupabaseService.getCurrentAuthUser();
      if (authUser == null) {
        _setError('No authenticated user found');
        return false;
      }

      final userProfile = await SupabaseService.createUserProfile(
        id: authUser.id,
        firstName: firstName,
        lastName: lastName,
        email: authUser.email!,
        userType: userType,
        phone: phone,
        profileImageUrl: authUser.userMetadata?['avatar_url'],
      );

      if (userProfile != null) {
        _currentUser = userProfile;
        _setAuthState(AuthState.authenticated);
        return true;
      } else {
        _setError('Failed to create user profile');
        return false;
      }
    } catch (e) {
      print('Error creating user profile: $e');
      _setError('Failed to create profile: ${e.toString()}');
      return false;
    }
  }

  Future<bool> updateUserProfile(Map<String, dynamic> updates) async {
    try {
      if (_currentUser == null) {
        _setError('No current user to update');
        return false;
      }

      final updatedUser = await SupabaseService.updateUserProfile(
        userId: _currentUser!.id,
        updates: updates,
      );

      if (updatedUser != null) {
        _currentUser = updatedUser;
        notifyListeners();
        return true;
      } else {
        _setError('Failed to update user profile');
        return false;
      }
    } catch (e) {
      print('Error updating user profile: $e');
      _setError('Failed to update profile: ${e.toString()}');
      return false;
    }
  }

  Future<void> signOut() async {
    try {
      _setAuthState(AuthState.loading);
      
      await SupabaseService.signOut();
      
      _currentUser = null;
      _setAuthState(AuthState.unauthenticated);
    } catch (e) {
      print('Error signing out: $e');
      _setError('Failed to sign out: ${e.toString()}');
    }
  }

  Future<void> refreshUserProfile() async {
    if (_currentUser != null) {
      await _loadUserProfile(_currentUser!.id);
    }
  }

  void _setAuthState(AuthState state) {
    _authState = state;
    _errorMessage = null;
    notifyListeners();
  }

  void _setError(String message) {
    _authState = AuthState.error;
    _errorMessage = message;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}