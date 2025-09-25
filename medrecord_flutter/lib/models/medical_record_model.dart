import 'package:json_annotation/json_annotation.dart';

part 'medical_record_model.g.dart';

@JsonSerializable()
class MedicalRecordModel {
  final String id;
  @JsonKey(name: 'user_id')
  final String userId;
  final String title;
  final String category;
  final String? description;
  final String? summary;
  @JsonKey(name: 'ai_analysis')
  final String? aiAnalysis;
  @JsonKey(name: 'key_findings')
  final List<String>? keyFindings;
  final List<String>? medications;
  final List<String>? recommendations;
  @JsonKey(name: 'urgency_level')
  final UrgencyLevel? urgencyLevel;
  @JsonKey(name: 'file_name')
  final String? fileName;
  @JsonKey(name: 'file_path')
  final String? filePath;
  @JsonKey(name: 'file_url')
  final String? fileUrl;
  @JsonKey(name: 'file_size')
  final int? fileSize;
  @JsonKey(name: 'file_type')
  final String? fileType;
  @JsonKey(name: 'uploaded_by')
  final String? uploadedBy;
  @JsonKey(name: 'uploaded_by_type')
  final String? uploadedByType;
  @JsonKey(name: 'hospital_name')
  final String? hospitalName;
  @JsonKey(name: 'doctor_name')
  final String? doctorName;
  @JsonKey(name: 'visit_date')
  final DateTime? visitDate;
  final List<String>? tags;
  @JsonKey(name: 'is_shared')
  final bool isShared;
  @JsonKey(name: 'shared_with')
  final List<String>? sharedWith;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;

  MedicalRecordModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.category,
    this.description,
    this.summary,
    this.aiAnalysis,
    this.keyFindings,
    this.medications,
    this.recommendations,
    this.urgencyLevel,
    this.fileName,
    this.filePath,
    this.fileUrl,
    this.fileSize,
    this.fileType,
    this.uploadedBy,
    this.uploadedByType,
    this.hospitalName,
    this.doctorName,
    this.visitDate,
    this.tags,
    this.isShared = false,
    this.sharedWith,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MedicalRecordModel.fromJson(Map<String, dynamic> json) =>
      _$MedicalRecordModelFromJson(json);
  Map<String, dynamic> toJson() => _$MedicalRecordModelToJson(this);

  MedicalRecordModel copyWith({
    String? id,
    String? userId,
    String? title,
    String? category,
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
    String? uploadedBy,
    String? uploadedByType,
    String? hospitalName,
    String? doctorName,
    DateTime? visitDate,
    List<String>? tags,
    bool? isShared,
    List<String>? sharedWith,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return MedicalRecordModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      category: category ?? this.category,
      description: description ?? this.description,
      summary: summary ?? this.summary,
      aiAnalysis: aiAnalysis ?? this.aiAnalysis,
      keyFindings: keyFindings ?? this.keyFindings,
      medications: medications ?? this.medications,
      recommendations: recommendations ?? this.recommendations,
      urgencyLevel: urgencyLevel ?? this.urgencyLevel,
      fileName: fileName ?? this.fileName,
      filePath: filePath ?? this.filePath,
      fileUrl: fileUrl ?? this.fileUrl,
      fileSize: fileSize ?? this.fileSize,
      fileType: fileType ?? this.fileType,
      uploadedBy: uploadedBy ?? this.uploadedBy,
      uploadedByType: uploadedByType ?? this.uploadedByType,
      hospitalName: hospitalName ?? this.hospitalName,
      doctorName: doctorName ?? this.doctorName,
      visitDate: visitDate ?? this.visitDate,
      tags: tags ?? this.tags,
      isShared: isShared ?? this.isShared,
      sharedWith: sharedWith ?? this.sharedWith,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  bool get hasFile => fileUrl != null && fileUrl!.isNotEmpty;
  String get formattedFileSize {
    if (fileSize == null) return '';
    final sizeInMB = fileSize! / (1024 * 1024);
    return '${sizeInMB.toStringAsFixed(2)} MB';
  }

  RecordCategory get categoryEnum => RecordCategory.values.firstWhere(
        (cat) => cat.value == category,
        orElse: () => RecordCategory.other,
      );
}

enum RecordCategory {
  prescription,
  labReport,
  medicalBill,
  scanReport,
  consultation,
  vaccination,
  vitalSigns,
  other,
}

extension RecordCategoryExtension on RecordCategory {
  String get value {
    switch (this) {
      case RecordCategory.prescription:
        return 'prescription';
      case RecordCategory.labReport:
        return 'lab-report';
      case RecordCategory.medicalBill:
        return 'medical-bill';
      case RecordCategory.scanReport:
        return 'scan-report';
      case RecordCategory.consultation:
        return 'consultation';
      case RecordCategory.vaccination:
        return 'vaccination';
      case RecordCategory.vitalSigns:
        return 'vital-signs';
      case RecordCategory.other:
        return 'other';
    }
  }

  String get displayName {
    switch (this) {
      case RecordCategory.prescription:
        return 'Prescription';
      case RecordCategory.labReport:
        return 'Lab Report';
      case RecordCategory.medicalBill:
        return 'Medical Bill';
      case RecordCategory.scanReport:
        return 'Scan Report';
      case RecordCategory.consultation:
        return 'Consultation';
      case RecordCategory.vaccination:
        return 'Vaccination';
      case RecordCategory.vitalSigns:
        return 'Vital Signs';
      case RecordCategory.other:
        return 'Other';
    }
  }
}

enum UrgencyLevel {
  @JsonValue('low')
  low,
  @JsonValue('medium')
  medium,
  @JsonValue('high')
  high,
}

extension UrgencyLevelExtension on UrgencyLevel {
  String get displayName {
    switch (this) {
      case UrgencyLevel.low:
        return 'Low';
      case UrgencyLevel.medium:
        return 'Medium';
      case UrgencyLevel.high:
        return 'High';
    }
  }

  String get colorCode {
    switch (this) {
      case UrgencyLevel.low:
        return '#10B981'; // Green
      case UrgencyLevel.medium:
        return '#F59E0B'; // Amber
      case UrgencyLevel.high:
        return '#EF4444'; // Red
    }
  }
}