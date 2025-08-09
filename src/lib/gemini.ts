// Client-side AI analysis interface that calls the server API

export interface MedicalAnalysis {
  summary: string;
  keyFindings: string[];
  medications: string[];
  recommendations: string[];
  urgencyLevel: 'low' | 'medium' | 'high';
  documentType: string;
}

export async function analyzeMedicalDocument(file: File): Promise<MedicalAnalysis> {
  try {
    console.log('Client: Starting AI analysis for file:', file.name, file.type);
    
    // Create form data to send file to API
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/analyze-document', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const analysisResult = await response.json();
    console.log('Client: AI analysis completed:', analysisResult);
    
    // Ensure documentType is included in the result
    return {
      ...analysisResult,
      documentType: analysisResult.documentType || 'other'
    };
    
  } catch (error) {
    console.error('Client: AI analysis failed:', error);
    
    // Return a fallback analysis instead of throwing
    return {
      summary: `Analysis of ${file.name} (${file.type}) - ${Math.round(file.size / 1024)}KB`,
      keyFindings: ['Document uploaded for review'],
      medications: [],
      recommendations: ['Please consult with your healthcare provider for detailed analysis'],
      urgencyLevel: 'low' as const,
      documentType: 'other'
    };
  }
}

// Helper functions no longer needed for client-side implementation
// File processing is now handled by the server API

export async function generateMedicalSummary(
  records: any[],
  timeframe: string = 'recent'
): Promise<string> {
  try {
    // For now, return a simple summary based on available data
    // This could be enhanced to call a server API endpoint for summary generation
    const recordCount = records.length;
    const recentRecords = records.slice(0, 3);
    
    let summary = `Medical Summary (${timeframe}):\n\n`;
    summary += `Total records: ${recordCount}\n\n`;
    
    if (recentRecords.length > 0) {
      summary += 'Recent records:\n';
      recentRecords.forEach((record, index) => {
        summary += `${index + 1}. ${record.record_type || 'Medical Record'} - ${record.visit_date || record.created_at}\n`;
        if (record.ai_summary) {
          summary += `   Summary: ${record.ai_summary}\n`;
        }
      });
    } else {
      summary += 'No recent medical records found.';
    }
    
    return summary;

  } catch (error) {
    console.error('Error generating medical summary:', error);
    return 'Unable to generate medical summary at this time.';
  }
}

export async function classifyMedicalDocument(
  fileName: string,
  content?: string
): Promise<'prescription' | 'lab_report' | 'bill' | 'general' | 'other'> {
  try {
    // Simple client-side classification based on filename
    const lowerFileName = fileName.toLowerCase();
    
    if (lowerFileName.includes('prescription') || lowerFileName.includes('rx') || lowerFileName.includes('medication')) {
      return 'prescription';
    }
    
    if (lowerFileName.includes('lab') || lowerFileName.includes('blood') || lowerFileName.includes('test') || lowerFileName.includes('report')) {
      return 'lab_report';
    }
    
    if (lowerFileName.includes('bill') || lowerFileName.includes('invoice') || lowerFileName.includes('payment') || lowerFileName.includes('receipt')) {
      return 'bill';
    }
    
    if (lowerFileName.includes('consultation') || lowerFileName.includes('visit') || lowerFileName.includes('checkup')) {
      return 'general';
    }

    return 'other';

  } catch (error) {
    console.error('Error classifying document:', error);
    return 'other';
  }
}
