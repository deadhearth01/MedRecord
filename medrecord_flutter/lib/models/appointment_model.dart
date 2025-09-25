import 'package:json_annotation/json_annotation.dart';

part 'appointment_model.g.dart';

@JsonSerializable()
class AppointmentModel {
  final String id;
  @JsonKey(name: 'patient_id')
  final String patientId;
  @JsonKey(name: 'doctor_id')
  final String doctorId;
  @JsonKey(name: 'appointment_date')
  final DateTime appointmentDate;
  @JsonKey(name: 'appointment_time')
  final String appointmentTime;
  final AppointmentStatus status;
  final String? notes;
  @JsonKey(name: 'doctor_name')
  final String? doctorName;
  @JsonKey(name: 'patient_name')
  final String? patientName;
  @JsonKey(name: 'hospital_name')
  final String? hospitalName;
  final String? specialty;
  @JsonKey(name: 'consultation_fee')
  final double? consultationFee;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;

  AppointmentModel({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.status,
    this.notes,
    this.doctorName,
    this.patientName,
    this.hospitalName,
    this.specialty,
    this.consultationFee,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) =>
      _$AppointmentModelFromJson(json);
  Map<String, dynamic> toJson() => _$AppointmentModelToJson(this);

  AppointmentModel copyWith({
    String? id,
    String? patientId,
    String? doctorId,
    DateTime? appointmentDate,
    String? appointmentTime,
    AppointmentStatus? status,
    String? notes,
    String? doctorName,
    String? patientName,
    String? hospitalName,
    String? specialty,
    double? consultationFee,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AppointmentModel(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      doctorId: doctorId ?? this.doctorId,
      appointmentDate: appointmentDate ?? this.appointmentDate,
      appointmentTime: appointmentTime ?? this.appointmentTime,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      doctorName: doctorName ?? this.doctorName,
      patientName: patientName ?? this.patientName,
      hospitalName: hospitalName ?? this.hospitalName,
      specialty: specialty ?? this.specialty,
      consultationFee: consultationFee ?? this.consultationFee,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  DateTime get fullDateTime {
    final timeParts = appointmentTime.split(':');
    final hour = int.parse(timeParts[0]);
    final minute = int.parse(timeParts[1]);
    return DateTime(
      appointmentDate.year,
      appointmentDate.month,
      appointmentDate.day,
      hour,
      minute,
    );
  }

  bool get isUpcoming {
    return fullDateTime.isAfter(DateTime.now());
  }

  bool get isToday {
    final now = DateTime.now();
    return appointmentDate.year == now.year &&
        appointmentDate.month == now.month &&
        appointmentDate.day == now.day;
  }
}

enum AppointmentStatus {
  @JsonValue('scheduled')
  scheduled,
  @JsonValue('confirmed')
  confirmed,
  @JsonValue('completed')
  completed,
  @JsonValue('cancelled')
  cancelled,
  @JsonValue('no_show')
  noShow,
  @JsonValue('rescheduled')
  rescheduled,
}

extension AppointmentStatusExtension on AppointmentStatus {
  String get displayName {
    switch (this) {
      case AppointmentStatus.scheduled:
        return 'Scheduled';
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
      case AppointmentStatus.noShow:
        return 'No Show';
      case AppointmentStatus.rescheduled:
        return 'Rescheduled';
    }
  }

  String get colorCode {
    switch (this) {
      case AppointmentStatus.scheduled:
        return '#3B82F6'; // Blue
      case AppointmentStatus.confirmed:
        return '#10B981'; // Green
      case AppointmentStatus.completed:
        return '#6B7280'; // Gray
      case AppointmentStatus.cancelled:
        return '#EF4444'; // Red
      case AppointmentStatus.noShow:
        return '#F59E0B'; // Amber
      case AppointmentStatus.rescheduled:
        return '#8B5CF6'; // Purple
    }
  }
}