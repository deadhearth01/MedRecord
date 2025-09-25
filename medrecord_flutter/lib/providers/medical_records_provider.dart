import 'package:flutter/material.dart';
import '../models/medical_record_model.dart';
import '../services/supabase_service.dart';

class MedicalRecordsProvider with ChangeNotifier {
  List<MedicalRecordModel> _records = [];
  bool _isLoading = false;
  String? _errorMessage;
  
  List<MedicalRecordModel> get records => _records;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  
  int get totalRecords => _records.length;
  int get urgentRecords => _records.where((r) => r.urgencyLevel == UrgencyLevel.high).length;
  
  Map<RecordCategory, int> get recordsByCategory {
    final categoryCount = <RecordCategory, int>{};
    for (final record in _records) {
      final category = record.categoryEnum;
      categoryCount[category] = (categoryCount[category] ?? 0) + 1;
    }
    return categoryCount;
  }

  Future<void> loadRecords(String userId) async {
    try {
      _setLoading(true);
      
      final recordsData = await SupabaseService.getMedicalRecords(userId);
      
      _records = recordsData
          .map((data) => MedicalRecordModel.fromJson(data))
          .toList();
      
      _clearError();
    } catch (e) {
      print('Error loading medical records: $e');
      _setError('Failed to load medical records: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> createRecord({
    required String userId,
    required String title,
    required String category,
    String? description,
    String? summary,
    String? aiAnalysis,
    List<String>? keyFindings,
    List<String>? medications,
    List<String>? recommendations,
    UrgencyLevel? urgencyLevel,
    String? fileName,
    String? filePath,
    String? fileUrl,
    int? fileSize,
    String? fileType,
    String? hospitalName,
    String? doctorName,
    DateTime? visitDate,
    List<String>? tags,
  }) async {
    try {
      _setLoading(true);
      
      final recordData = {
        'user_id': userId,
        'title': title,
        'category': category,
        'description': description,
        'summary': summary,
        'ai_analysis': aiAnalysis,
        'key_findings': keyFindings,
        'medications': medications,
        'recommendations': recommendations,
        'urgency_level': urgencyLevel?.name,
        'file_name': fileName,
        'file_path': filePath,
        'file_url': fileUrl,
        'file_size': fileSize,
        'file_type': fileType,
        'hospital_name': hospitalName,
        'doctor_name': doctorName,
        'visit_date': visitDate?.toIso8601String(),
        'tags': tags,
        'is_shared': false,
      };

      final response = await SupabaseService.createMedicalRecord(recordData);
      
      final newRecord = MedicalRecordModel.fromJson(response);
      _records.insert(0, newRecord);
      
      _clearError();
      notifyListeners();
      return true;
    } catch (e) {
      print('Error creating medical record: $e');
      _setError('Failed to create medical record: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateRecord({
    required String recordId,
    required Map<String, dynamic> updates,
  }) async {
    try {
      _setLoading(true);
      
      final response = await SupabaseService.updateMedicalRecord(
        recordId: recordId,
        updates: updates,
      );
      
      final updatedRecord = MedicalRecordModel.fromJson(response);
      final index = _records.indexWhere((r) => r.id == recordId);
      
      if (index != -1) {
        _records[index] = updatedRecord;
        notifyListeners();
      }
      
      _clearError();
      return true;
    } catch (e) {
      print('Error updating medical record: $e');
      _setError('Failed to update medical record: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> deleteRecord(String recordId) async {
    try {
      _setLoading(true);
      
      await SupabaseService.deleteMedicalRecord(recordId);
      
      _records.removeWhere((r) => r.id == recordId);
      
      _clearError();
      notifyListeners();
      return true;
    } catch (e) {
      print('Error deleting medical record: $e');
      _setError('Failed to delete medical record: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  List<MedicalRecordModel> getRecordsByCategory(RecordCategory category) {
    return _records.where((r) => r.categoryEnum == category).toList();
  }

  List<MedicalRecordModel> searchRecords(String query) {
    if (query.isEmpty) return _records;
    
    final lowerQuery = query.toLowerCase();
    return _records.where((record) {
      return record.title.toLowerCase().contains(lowerQuery) ||
          record.description?.toLowerCase().contains(lowerQuery) == true ||
          record.hospitalName?.toLowerCase().contains(lowerQuery) == true ||
          record.doctorName?.toLowerCase().contains(lowerQuery) == true ||
          record.tags?.any((tag) => tag.toLowerCase().contains(lowerQuery)) == true;
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

  void clearRecords() {
    _records.clear();
    notifyListeners();
  }
}