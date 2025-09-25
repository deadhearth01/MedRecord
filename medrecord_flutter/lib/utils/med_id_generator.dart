import '../models/user_model.dart';

class MedIdGenerator {
  static String generate(UserType userType) {
    final prefix = userType.prefix;
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString().substring(7, 13);
    final random = _generateRandomString(3);
    return '$prefix$timestamp$random';
  }

  static String _generateRandomString(int length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = DateTime.now().microsecondsSinceEpoch;
    var result = '';
    
    for (int i = 0; i < length; i++) {
      result += chars[(random + i) % chars.length];
    }
    
    return result;
  }
  
  static bool isValidMedId(String medId) {
    if (medId.length != 9) return false;
    
    final prefix = medId.substring(0, 2);
    if (prefix != 'CT' && prefix != 'DR') return false;
    
    final numbers = medId.substring(2, 8);
    if (!RegExp(r'^\d{6}$').hasMatch(numbers)) return false;
    
    final suffix = medId.substring(8);
    if (!RegExp(r'^[A-Z0-9]{1}$').hasMatch(suffix)) return false;
    
    return true;
  }
}