import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getGeminiClient = () => {
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.');
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  return genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1000,
    },
  });
};

// Convert file to base64 for image analysis
async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  return base64;
}

// Extract text from file for text-based analysis
async function fileToText(file: File): Promise<string> {
  if (file.type.startsWith('text/')) {
    return await file.text();
  }
  
  if (file.type === 'application/pdf') {
    // For PDF files, we'll need to implement PDF text extraction
    // For now, return a placeholder
    return "PDF content extraction not implemented yet. Please analyze based on file name and type.";
  }
  
  // For other file types, return basic info
  return `File: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json({
        summary: 'Document uploaded successfully',
        keyFindings: ['Document analysis unavailable - API key not configured'],
        medications: [],
        recommendations: ['Please configure GEMINI_API_KEY in environment variables'],
        urgencyLevel: 'low',
        documentType: 'other'
      }, { status: 200 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('API: Analyzing file:', file.name, file.type);

    const model = getGeminiClient();
    
    const prompt = `You are a medical AI assistant. Analyze this medical document and provide a structured response in the following JSON format:

{
  "summary": "Brief 2-3 sentence summary of the document",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "medications": ["medication1", "medication2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "urgencyLevel": "low|medium|high"
}

Important guidelines:
- Be accurate and only extract information that is clearly present
- If information is not available, use empty arrays or appropriate default values
- Urgency levels: low (routine), medium (follow-up needed), high (immediate attention)
- Focus on medical relevance and patient safety

Document to analyze: `;

    let result;
    
    if (file.type.startsWith('image/')) {
      // Handle image files
      const base64Data = await fileToBase64(file);
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      };
      
      result = await model.generateContent([prompt, imagePart]);
    } else {
      // Handle text-based files
      const textContent = await fileToText(file);
      const fullPrompt = `${prompt}\n\nFile content:\n${textContent}`;
      
      result = await model.generateContent(fullPrompt);
    }

    const response = await result.response;
    const text = response.text();
    
    console.log('API: Raw AI response:', text);

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const analysisData = JSON.parse(jsonMatch[0]);
    
    console.log('API: Parsed analysis:', analysisData);

    return NextResponse.json(analysisData);
    
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
