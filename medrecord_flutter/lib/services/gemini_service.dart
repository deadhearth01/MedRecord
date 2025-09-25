import 'dart:io';
import 'dart:typed_data';
import 'package:google_generative_ai/google_generative_ai.dart';
import '../config/app_config.dart';
import '../models/medical_record_model.dart';

class GeminiService {
  static GenerativeModel? _model;
  
  static GenerativeModel get model {
    _model ??= GenerativeModel(
      model: 'gemini-1.5-flash',
      apiKey: AppConfig.geminiApiKey,
    );
    return _model!;
  }

  /// Analyzes a medical document and returns structured information
  static Future<MedicalAnalysis> analyzeMedicalDocument({
    required Uint8List fileBytes,
    required String fileName,
    required String mimeType,
  }) async {
    try {
      final prompt = _buildAnalysisPrompt(fileName);
      
      final dataPart = DataPart(mimeType, fileBytes);
      final textPart = TextPart(prompt);
      
      final response = await model.generateContent([
        Content.multi([textPart, dataPart])
      ]);
      
      if (response.text == null) {
        throw Exception('No response from AI analysis');
      }
      
      return _parseAnalysisResponse(response.text!, fileName);
      
    } catch (e) {
      print('Error in AI analysis: $e');
      
      // Return fallback analysis
      return MedicalAnalysis(
        summary: 'Medical document uploaded: $fileName',
        keyFindings: ['Document uploaded for manual review'],
        medications: [],
        recommendations: ['Please consult with your healthcare provider for detailed analysis'],
        urgencyLevel: UrgencyLevel.low,
        documentType: _inferDocumentType(fileName),
        confidence: 0.0,
      );
    }
  }

  /// Generates a medical summary from multiple records
  static Future<String> generateMedicalSummary({
    required List<MedicalRecordModel> records,
    String timeframe = 'recent',
  }) async {
    try {
      if (records.isEmpty) {
        return 'No medical records available for summary.';
      }

      final recordsData = records.take(5).map((record) => {
        'title': record.title,
        'category': record.category,
        'description': record.description ?? '',
        'date': record.createdAt.toIso8601String(),
        'summary': record.summary ?? '',
      }).toList();

      final prompt = '''
      Based on the following medical records, generate a comprehensive medical summary:
      
      Records:
      ${recordsData.map((r) => '- ${r['title']} (${r['category']}) - ${r['date']}\\n  ${r['description']}\\n  ${r['summary']}').join('\\n\\n')}
      
      Please provide:
      1. Overall health status overview
      2. Key medical findings and trends
      3. Current medications or treatments mentioned
      4. Any concerning patterns or urgent items
      5. Recommendations for follow-up care
      
      Format the response in a clear, professional medical summary format.
      ''';

      final response = await model.generateContent([
        Content.text(prompt)
      ]);

      return response.text ?? 'Unable to generate medical summary at this time.';

    } catch (e) {
      print('Error generating medical summary: $e');
      return 'Error generating medical summary. Please try again later.';
    }
  }

  /// Classifies the type of medical document
  static Future<RecordCategory> classifyDocument({
    required String fileName,
    String? content,
  }) async {
    try {
      final prompt = '''
      Classify this medical document into one of these categories:
      - prescription
      - lab-report
      - medical-bill
      - scan-report
      - consultation
      - vaccination
      - vital-signs
      - other
      
      File name: $fileName
      Content preview: ${content?.substring(0, 200) ?? 'No content available'}
      
      Respond with only the category name.
      ''';

      final response = await model.generateContent([
        Content.text(prompt)
      ]);

      final category = response.text?.trim().toLowerCase() ?? 'other';
      return _mapCategoryString(category);

    } catch (e) {
      print('Error classifying document: $e');
      return _inferDocumentType(fileName);
    }
  }

  /// Builds the analysis prompt for Gemini
  static String _buildAnalysisPrompt(String fileName) {
    return '''
    Analyze this medical document and provide structured information. 
    
    Document: $fileName
    
    Please extract and provide the following information in JSON format:
    {
      "summary": "Brief summary of the document (2-3 sentences)",
      "keyFindings": ["List of key medical findings", "Important observations"],
      "medications": ["List any medications mentioned", "Include dosages if available"],
      "recommendations": ["Any recommendations or instructions", "Follow-up care mentioned"],
      "urgencyLevel": "low|medium|high (based on medical urgency)",
      "documentType": "prescription|lab-report|medical-bill|scan-report|consultation|vaccination|vital-signs|other",
      "confidence": 0.85 // confidence score between 0 and 1
    }
    
    If you cannot extract specific information, use empty arrays or "Not specified" appropriately.
    Ensure medical accuracy and use professional medical terminology.
    ''';
  }

  /// Parses the AI response and creates MedicalAnalysis object
  static MedicalAnalysis _parseAnalysisResponse(String response, String fileName) {
    try {
      // Simple JSON parsing - in production, you'd want more robust parsing
      final jsonStart = response.indexOf('{');
      final jsonEnd = response.lastIndexOf('}') + 1;
      
      if (jsonStart == -1 || jsonEnd == 0) {
        throw Exception('No valid JSON found in response');
      }
      
      final jsonString = response.substring(jsonStart, jsonEnd);
      // For simplicity, we'll parse manually - in production use json_decode
      
      return MedicalAnalysis(
        summary: _extractValue(jsonString, 'summary') ?? 'Medical document analyzed: $fileName',
        keyFindings: _extractArray(jsonString, 'keyFindings') ?? ['Document processed'],
        medications: _extractArray(jsonString, 'medications') ?? [],
        recommendations: _extractArray(jsonString, 'recommendations') ?? ['Consult healthcare provider'],
        urgencyLevel: _parseUrgencyLevel(_extractValue(jsonString, 'urgencyLevel') ?? 'low'),
        documentType: _mapCategoryString(_extractValue(jsonString, 'documentType') ?? 'other'),
        confidence: double.tryParse(_extractValue(jsonString, 'confidence') ?? '0.8') ?? 0.8,
      );
      
    } catch (e) {
      print('Error parsing analysis response: $e');
      return MedicalAnalysis(
        summary: 'Medical document analyzed: $fileName',
        keyFindings: ['Document requires manual review'],
        medications: [],
        recommendations: ['Please consult with healthcare provider'],
        urgencyLevel: UrgencyLevel.low,
        documentType: _inferDocumentType(fileName),
        confidence: 0.5,
      );
    }
  }

  /// Simple JSON value extraction (replace with proper JSON parsing in production)
  static String? _extractValue(String json, String key) {
    final regex = RegExp('"$key"\\s*:\\s*"([^"]*)"');
    final match = regex.firstMatch(json);
    return match?.group(1);
  }

  /// Simple JSON array extraction (replace with proper JSON parsing in production)
  static List<String>? _extractArray(String json, String key) {
    final regex = RegExp('"$key"\\s*:\\s*\\[([^\\]]+)\\]');
    final match = regex.firstMatch(json);
    if (match == null) return null;
    
    final arrayContent = match.group(1)!;
    return arrayContent
        .split(',')
        .map((item) => item.trim().replaceAll('"', ''))
        .where((item) => item.isNotEmpty)
        .toList();
  }

  static UrgencyLevel _parseUrgencyLevel(String level) {
    switch (level.toLowerCase()) {
      case 'high':
        return UrgencyLevel.high;
      case 'medium':
        return UrgencyLevel.medium;
      default:
        return UrgencyLevel.low;
    }
  }

  static RecordCategory _mapCategoryString(String category) {
    switch (category.toLowerCase()) {
      case 'prescription':
        return RecordCategory.prescription;
      case 'lab-report':
      case 'lab_report':
        return RecordCategory.labReport;
      case 'medical-bill':
      case 'medical_bill':
        return RecordCategory.medicalBill;
      case 'scan-report':
      case 'scan_report':
        return RecordCategory.scanReport;
      case 'consultation':
        return RecordCategory.consultation;
      case 'vaccination':
        return RecordCategory.vaccination;
      case 'vital-signs':
      case 'vital_signs':
        return RecordCategory.vitalSigns;
      default:
        return RecordCategory.other;
    }
  }

  static RecordCategory _inferDocumentType(String fileName) {
    final lowerFileName = fileName.toLowerCase();
    
    if (lowerFileName.contains('prescription') || lowerFileName.contains('rx')) {
      return RecordCategory.prescription;
    } else if (lowerFileName.contains('lab') || lowerFileName.contains('test')) {
      return RecordCategory.labReport;
    } else if (lowerFileName.contains('bill') || lowerFileName.contains('invoice')) {
      return RecordCategory.medicalBill;
    } else if (lowerFileName.contains('scan') || lowerFileName.contains('xray') || lowerFileName.contains('mri')) {
      return RecordCategory.scanReport;
    } else if (lowerFileName.contains('consultation') || lowerFileName.contains('visit')) {
      return RecordCategory.consultation;
    } else if (lowerFileName.contains('vaccine') || lowerFileName.contains('immunization')) {
      return RecordCategory.vaccination;
    }
    
    return RecordCategory.other;
  }
}

/// Analysis result from Gemini AI
class MedicalAnalysis {
  final String summary;
  final List<String> keyFindings;
  final List<String> medications;
  final List<String> recommendations;
  final UrgencyLevel urgencyLevel;
  final RecordCategory documentType;
  final double confidence;

  MedicalAnalysis({
    required this.summary,
    required this.keyFindings,
    required this.medications,
    required this.recommendations,
    required this.urgencyLevel,
    required this.documentType,
    required this.confidence,
  });
}