import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user_model.dart';
import '../config/app_config.dart';
import '../utils/med_id_generator.dart';

class SupabaseService {
  static final SupabaseClient _client = Supabase.instance.client;
  static const _storage = FlutterSecureStorage();

  static SupabaseClient get client => _client;

  // Authentication Methods
  static Future<AuthResponse> signInWithGoogle() async {
    return await _client.auth.signInWithOAuth(
      Provider.google,
      redirectTo: AppConfig.authCallbackUrl,
    );
  }

  static Future<void> signOut() async {
    await _client.auth.signOut();
    await _storage.deleteAll();
  }

  static User? getCurrentAuthUser() {
    return _client.auth.currentUser;
  }

  static Stream<AuthState> get authStream => _client.auth.onAuthStateChange;

  // User Profile Methods
  static Future<UserModel?> getUserProfile(String userId) async {
    try {
      final response = await _client
          .from('users')
          .select()
          .eq('id', userId)
          .single();
      
      return UserModel.fromJson(response);
    } catch (e) {
      print('Error getting user profile: $e');
      return null;
    }
  }

  static Future<UserModel?> createUserProfile({
    required String id,
    required String firstName,
    required String lastName,
    required String email,
    required UserType userType,
    String? phone,
    String? profileImageUrl,
  }) async {
    try {
      final medId = MedIdGenerator.generate(userType);
      
      final userData = {
        'id': id,
        'med_id': medId,
        'first_name': firstName,
        'last_name': lastName,
        'email': email,
        'user_type': userType.name,
        'phone': phone,
        'profile_image_url': profileImageUrl,
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      };

      final response = await _client
          .from('users')
          .insert(userData)
          .select()
          .single();
      
      return UserModel.fromJson(response);
    } catch (e) {
      print('Error creating user profile: $e');
      rethrow;
    }
  }

  static Future<UserModel?> updateUserProfile({
    required String userId,
    required Map<String, dynamic> updates,
  }) async {
    try {
      updates['updated_at'] = DateTime.now().toIso8601String();
      
      final response = await _client
          .from('users')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();
      
      return UserModel.fromJson(response);
    } catch (e) {
      print('Error updating user profile: $e');
      rethrow;
    }
  }

  // Medical Records Methods
  static Future<List<Map<String, dynamic>>> getMedicalRecords(String userId) async {
    try {
      final response = await _client
          .from('medical_records')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false);
      
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error getting medical records: $e');
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> createMedicalRecord(
      Map<String, dynamic> recordData) async {
    try {
      recordData['created_at'] = DateTime.now().toIso8601String();
      recordData['updated_at'] = DateTime.now().toIso8601String();
      
      final response = await _client
          .from('medical_records')
          .insert(recordData)
          .select()
          .single();
      
      return response;
    } catch (e) {
      print('Error creating medical record: $e');
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> updateMedicalRecord({
    required String recordId,
    required Map<String, dynamic> updates,
  }) async {
    try {
      updates['updated_at'] = DateTime.now().toIso8601String();
      
      final response = await _client
          .from('medical_records')
          .update(updates)
          .eq('id', recordId)
          .select()
          .single();
      
      return response;
    } catch (e) {
      print('Error updating medical record: $e');
      rethrow;
    }
  }

  static Future<void> deleteMedicalRecord(String recordId) async {
    try {
      await _client
          .from('medical_records')
          .delete()
          .eq('id', recordId);
    } catch (e) {
      print('Error deleting medical record: $e');
      rethrow;
    }
  }

  // Appointments Methods
  static Future<List<Map<String, dynamic>>> getAppointments(String userId) async {
    try {
      final response = await _client
          .from('appointments')
          .select()
          .or('patient_id.eq.$userId,doctor_id.eq.$userId')
          .order('appointment_date', ascending: true);
      
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error getting appointments: $e');
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> createAppointment(
      Map<String, dynamic> appointmentData) async {
    try {
      appointmentData['created_at'] = DateTime.now().toIso8601String();
      appointmentData['updated_at'] = DateTime.now().toIso8601String();
      
      final response = await _client
          .from('appointments')
          .insert(appointmentData)
          .select()
          .single();
      
      return response;
    } catch (e) {
      print('Error creating appointment: $e');
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> updateAppointment({
    required String appointmentId,
    required Map<String, dynamic> updates,
  }) async {
    try {
      updates['updated_at'] = DateTime.now().toIso8601String();
      
      final response = await _client
          .from('appointments')
          .update(updates)
          .eq('id', appointmentId)
          .select()
          .single();
      
      return response;
    } catch (e) {
      print('Error updating appointment: $e');
      rethrow;
    }
  }

  // File Upload Methods
  static Future<String> uploadFile({
    required String bucket,
    required String path,
    required List<int> fileBytes,
    String? contentType,
  }) async {
    try {
      await _client.storage.from(bucket).uploadBinary(
            path,
            fileBytes,
            fileOptions: FileOptions(
              contentType: contentType,
              upsert: true,
            ),
          );

      return _client.storage.from(bucket).getPublicUrl(path);
    } catch (e) {
      print('Error uploading file: $e');
      rethrow;
    }
  }

  static Future<void> deleteFile({
    required String bucket,
    required String path,
  }) async {
    try {
      await _client.storage.from(bucket).remove([path]);
    } catch (e) {
      print('Error deleting file: $e');
      rethrow;
    }
  }

  // Doctor-specific Methods
  static Future<List<Map<String, dynamic>>> searchPatients({
    required String query,
    String? medId,
  }) async {
    try {
      var queryBuilder = _client
          .from('users')
          .select()
          .eq('user_type', 'citizen');

      if (medId != null && medId.isNotEmpty) {
        queryBuilder = queryBuilder.eq('med_id', medId);
      } else if (query.isNotEmpty) {
        queryBuilder = queryBuilder.or(
          'first_name.ilike.%$query%,last_name.ilike.%$query%,email.ilike.%$query%',
        );
      }

      final response = await queryBuilder.limit(50);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error searching patients: $e');
      rethrow;
    }
  }

  // Dashboard Statistics Methods
  static Future<Map<String, dynamic>> getDashboardStats(String userId) async {
    try {
      // Get medical records count by category
      final recordsResponse = await _client
          .from('medical_records')
          .select('category, urgency_level')
          .eq('user_id', userId);

      // Get appointments count
      final appointmentsResponse = await _client
          .from('appointments')
          .select('status')
          .or('patient_id.eq.$userId,doctor_id.eq.$userId');

      // Process the data
      final records = List<Map<String, dynamic>>.from(recordsResponse);
      final appointments = List<Map<String, dynamic>>.from(appointmentsResponse);

      final recordsByCategory = <String, int>{};
      int urgentRecords = 0;

      for (final record in records) {
        final category = record['category'] as String? ?? 'other';
        recordsByCategory[category] = (recordsByCategory[category] ?? 0) + 1;
        
        if (record['urgency_level'] == 'high') {
          urgentRecords++;
        }
      }

      final upcomingAppointments = appointments.where((appointment) {
        return appointment['status'] == 'scheduled' || 
               appointment['status'] == 'confirmed';
      }).length;

      return {
        'totalRecords': records.length,
        'totalAppointments': appointments.length,
        'upcomingAppointments': upcomingAppointments,
        'urgentRecords': urgentRecords,
        'recordsByCategory': recordsByCategory,
      };
    } catch (e) {
      print('Error getting dashboard stats: $e');
      rethrow;
    }
  }
}