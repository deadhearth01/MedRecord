import 'package:flutter/material.dart';
import '../models/appointment_model.dart';
import '../services/supabase_service.dart';

class AppointmentsProvider with ChangeNotifier {
  List<AppointmentModel> _appointments = [];
  bool _isLoading = false;
  String? _errorMessage;
  
  List<AppointmentModel> get appointments => _appointments;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  
  int get totalAppointments => _appointments.length;
  int get upcomingAppointments => _appointments.where((a) => a.isUpcoming).length;
  int get todayAppointments => _appointments.where((a) => a.isToday).length;

  List<AppointmentModel> get upcomingAppointmentsList {
    return _appointments
        .where((a) => a.isUpcoming)
        .toList()
      ..sort((a, b) => a.fullDateTime.compareTo(b.fullDateTime));
  }

  Future<void> loadAppointments(String userId) async {
    try {
      _setLoading(true);
      
      final appointmentsData = await SupabaseService.getAppointments(userId);
      
      _appointments = appointmentsData
          .map((data) => AppointmentModel.fromJson(data))
          .toList();
      
      // Sort by date
      _appointments.sort((a, b) => a.fullDateTime.compareTo(b.fullDateTime));
      
      _clearError();
    } catch (e) {
      print('Error loading appointments: $e');
      _setError('Failed to load appointments: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> createAppointment({
    required String patientId,
    required String doctorId,
    required DateTime appointmentDate,
    required String appointmentTime,
    String? notes,
    String? doctorName,
    String? patientName,
    String? hospitalName,
    String? specialty,
    double? consultationFee,
  }) async {
    try {
      _setLoading(true);
      
      final appointmentData = {
        'patient_id': patientId,
        'doctor_id': doctorId,
        'appointment_date': appointmentDate.toIso8601String().split('T')[0],
        'appointment_time': appointmentTime,
        'status': AppointmentStatus.scheduled.name,
        'notes': notes,
        'doctor_name': doctorName,
        'patient_name': patientName,
        'hospital_name': hospitalName,
        'specialty': specialty,
        'consultation_fee': consultationFee,
      };

      final response = await SupabaseService.createAppointment(appointmentData);
      
      final newAppointment = AppointmentModel.fromJson(response);
      _appointments.add(newAppointment);
      
      // Re-sort appointments
      _appointments.sort((a, b) => a.fullDateTime.compareTo(b.fullDateTime));
      
      _clearError();
      notifyListeners();
      return true;
    } catch (e) {
      print('Error creating appointment: $e');
      _setError('Failed to create appointment: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateAppointment({
    required String appointmentId,
    required Map<String, dynamic> updates,
  }) async {
    try {
      _setLoading(true);
      
      final response = await SupabaseService.updateAppointment(
        appointmentId: appointmentId,
        updates: updates,
      );
      
      final updatedAppointment = AppointmentModel.fromJson(response);
      final index = _appointments.indexWhere((a) => a.id == appointmentId);
      
      if (index != -1) {
        _appointments[index] = updatedAppointment;
        // Re-sort appointments
        _appointments.sort((a, b) => a.fullDateTime.compareTo(b.fullDateTime));
        notifyListeners();
      }
      
      _clearError();
      return true;
    } catch (e) {
      print('Error updating appointment: $e');
      _setError('Failed to update appointment: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> cancelAppointment(String appointmentId) async {
    return updateAppointment(
      appointmentId: appointmentId,
      updates: {'status': AppointmentStatus.cancelled.name},
    );
  }

  Future<bool> confirmAppointment(String appointmentId) async {
    return updateAppointment(
      appointmentId: appointmentId,
      updates: {'status': AppointmentStatus.confirmed.name},
    );
  }

  Future<bool> completeAppointment(String appointmentId, {String? notes}) async {
    final updates = {'status': AppointmentStatus.completed.name};
    if (notes != null) {
      updates['notes'] = notes;
    }
    
    return updateAppointment(
      appointmentId: appointmentId,
      updates: updates,
    );
  }

  List<AppointmentModel> getAppointmentsByStatus(AppointmentStatus status) {
    return _appointments.where((a) => a.status == status).toList();
  }

  List<AppointmentModel> getAppointmentsByDate(DateTime date) {
    return _appointments.where((a) {
      return a.appointmentDate.year == date.year &&
          a.appointmentDate.month == date.month &&
          a.appointmentDate.day == date.day;
    }).toList();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String message) {
    _errorMessage = message;
    notifyListeners();
  }

  void _clearError() {
    _errorMessage = null;
  }

  void clearAppointments() {
    _appointments.clear();
    notifyListeners();
  }
}