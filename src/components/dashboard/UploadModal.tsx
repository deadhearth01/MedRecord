'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  Camera, 
  FileText, 
  Image, 
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  RotateCcw,
  CircleStop
} from 'lucide-react';
import { uploadMedicalRecord } from '@/lib/supabase';
import { analyzeMedicalDocument } from '@/lib/gemini';
import { validateFileType, validateFileSize } from '@/lib/utils';
import { gsap } from 'gsap';

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'camera' | 'file';
  userId: string;
  onSuccess?: () => void; // Add callback for successful upload
}

const categories = [
  { value: 'prescription', label: 'Prescription' },
  { value: 'lab-report', label: 'Lab Report' },
  { value: 'medical-bill', label: 'Medical Bill' },
  { value: 'scan-report', label: 'Scan/X-Ray' },
  { value: 'consultation', label: 'Consultation Report' },
  { value: 'vaccination', label: 'Vaccination Record' },
  { value: 'vital-signs', label: 'Vital Signs' },
  { value: 'other', label: 'Other' },
];

export default function UploadModal({ open, onOpenChange, type, userId, onSuccess }: UploadModalProps) {
  const [step, setStep] = useState<'upload' | 'camera' | 'details' | 'analyzing' | 'success'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  
  // Camera specific states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'other',
    description: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // GSAP animations
  useEffect(() => {
    if (open && modalContentRef.current) {
      gsap.fromTo(modalContentRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
      );
    }
  }, [open]);

  useEffect(() => {
    if (modalContentRef.current) {
      // Set transform origin to center to prevent movement
      gsap.set(modalContentRef.current, { transformOrigin: "center center" });
      
      gsap.fromTo(modalContentRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [step]);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    
    // Validate file type
    if (!validateFileType(selectedFile)) {
      setError('Please select a valid file type (JPG, PNG, PDF, DOC, DOCX)');
      return;
    }

    // Validate file size (10MB limit)
    if (!validateFileSize(selectedFile, 10)) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    
    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }

    // Auto-suggest title based on filename
    const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
    if (!formData.title) {
      setFormData(prev => ({ ...prev, title: fileName }));
    }

    setStep('details');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera for documents
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      setIsCameraActive(true);
      setStep('camera');
      
      // Wait for the component to re-render and then set the video source
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
          });
        }
      }, 100);
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setCameraError(
        error.name === 'NotAllowedError' 
          ? 'Camera access denied. Please allow camera permissions and try again.'
          : error.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Failed to access camera. Please try again.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setIsVideoReady(false);
    setStep('upload');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      console.error('Video, canvas, or stream not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('Canvas context not available');
      return;
    }

    // Ensure video is playing and has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video dimensions not valid');
      setCameraError('Camera not ready. Please wait a moment and try again.');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const capturedFile = new File([blob], `medical_document_${timestamp}.jpg`, {
          type: 'image/jpeg'
        });
        
        // Stop camera
        stopCamera();
        
        // Handle the captured file
        handleFileSelect(capturedFile);
      } else {
        setCameraError('Failed to capture photo. Please try again.');
      }
    }, 'image/jpeg', 0.9);
  };

  // Cleanup camera on modal close
  useEffect(() => {
    if (!open) {
      stopCamera();
      // Reset state when modal closes
      setStep('upload');
      setFile(null);
      setPreview(null);
      setError(null);
      setCameraError(null);
      setAiAnalysis(null);
      setIsVideoReady(false);
      setFormData({ title: '', category: 'other', description: '' });
    }
  }, [open]);

  // Handle video stream when camera step is active
  useEffect(() => {
    if (step === 'camera' && stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      
      const handleLoadedMetadata = () => {
        setIsVideoReady(true);
        video.play().catch(err => {
          console.error('Error playing video:', err);
          setCameraError('Failed to start video playback. Please try again.');
        });
      };
      
      const handleError = (e: Event) => {
        console.error('Video error:', e);
        setCameraError('Video error occurred. Please try again.');
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('error', handleError);
      };
    }
  }, [step, stream]);

  const handleUpload = async () => {
    if (!file || !formData.title) {
      return;
    }

    if (!userId) {
      setError('You must be signed in to upload files. Please sign in and try again.');
      setStep('details');
      return;
    }

    setIsUploading(true);
    setStep('analyzing');

    try {
      // Analyze document with AI for all file types
      let analysis = null;
      try {
        analysis = await analyzeMedicalDocument(file);
        setAiAnalysis(analysis);
      } catch (aiError) {
        // Continue with upload even if AI analysis fails
      }

      // Upload to Supabase with AI analysis data
      const result = await uploadMedicalRecord({
        user_id: userId,
        title: formData.title,
        category: formData.category as 'prescription' | 'lab-report' | 'medical-bill' | 'scan-report' | 'consultation' | 'vaccination' | 'vital-signs' | 'other',
        description: formData.description,
        summary: analysis?.summary || '',
        ai_analysis: analysis ? JSON.stringify(analysis) : undefined,
        key_findings: analysis?.keyFindings || [],
        medications: analysis?.medications || [],
        recommendations: analysis?.recommendations || [],
        urgency_level: analysis?.urgencyLevel || 'low',
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file: file, // Pass the actual file
      });

      
      if (result.error) {
        // Provide more specific error messages
        let errorMessage = 'Upload failed. Please try again.';
        console.error('Upload error details:', {
          error: result.error,
          message: result.error?.message,
          code: result.error?.code,
          details: result.error?.details
        });
        
        if (result.error.message?.includes('uuid') || result.error.message?.includes('invalid input syntax')) {
          errorMessage = 'Authentication error. Please sign out and sign in again.';
        } else if (result.error.message?.includes('row level security') || result.error.message?.includes('policy')) {
          errorMessage = 'Permission denied. Please contact support.';
        } else if (result.error.message?.includes('duplicate') || result.error.message?.includes('unique')) {
          errorMessage = 'A record with this information already exists.';
        } else if (result.error.message?.includes('foreign key') || result.error.message?.includes('user_id')) {
          errorMessage = 'Invalid user session. Please sign out and sign in again.';
        } else if (result.error.message) {
          errorMessage = `Database error: ${result.error.message}`;
        }
        
        setError(errorMessage);
        setStep('details');
        return;
      }
      
      setStep('success');
      
      // Call onSuccess callback to refresh records list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
      setStep('details');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setError(null);
    setAiAnalysis(null);
    setFormData({ title: '', category: 'other', description: '' });
    onOpenChange(false);
  };

  const renderUploadStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        {type === 'camera' ? (
          <>
            <div className="h-16 w-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/25">
              <Camera className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Take a Photo</h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Capture a clear photo of your medical document using your device camera
            </p>
            
            {cameraError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-700">{cameraError}</span>
                </div>
              </div>
            )}
            
            <Button 
              onClick={startCamera}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
              disabled={isCameraActive}
            >
              <Camera className="h-5 w-5 mr-2" />
              {isCameraActive ? 'Camera Active...' : 'Open Camera'}
            </Button>
          </>
        ) : (
          <>
            <div className="h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Document</h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Select a medical document from your device to upload and analyze
            </p>
            <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center bg-gradient-to-br from-blue-50/50 to-indigo-50/50 hover:border-blue-300 transition-colors cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <Button 
                variant="outline"
                className="mb-4 border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              <p className="text-sm text-gray-500">
                Supports: JPG, PNG, PDF, DOC, DOCX<br/>
                <span className="font-medium text-blue-600">Maximum size: 10MB</span>
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </>
        )}
      </div>
      
      {error && (
        <div className="flex items-start p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 rounded-xl shadow-lg">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-medium">Upload Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderCameraStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-12 w-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Camera className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Position Your Document</h3>
        <p className="text-gray-600 text-sm mb-6">
          Make sure your document is well-lit and clearly visible in the frame
        </p>
      </div>

      {/* Camera View */}
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] max-w-md mx-auto">
        {stream ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              onLoadedData={() => {
                console.log('Video loaded data');
                setIsVideoReady(true);
                // Ensure video starts playing when data is loaded
                if (videoRef.current) {
                  videoRef.current.play().catch(err => {
                    console.error('Error auto-playing video:', err);
                    setCameraError('Failed to start video. Please try again.');
                  });
                }
              }}
              onCanPlay={() => {
                console.log('Video can play');
                setIsVideoReady(true);
              }}
            />
            
            {!isVideoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Initializing camera...</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Starting camera...</p>
            </div>
          </div>
        )}
        
        {/* Camera overlay - only show when video is ready */}
        {isVideoReady && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-white/50 rounded-xl"></div>
            <div className="absolute top-4 left-4 right-4 text-center">
              <p className="text-white text-sm bg-black/50 rounded-full px-3 py-1 inline-block">
                Align document within the frame
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={stopCamera}
          variant="outline"
          size="lg"
          className="flex-1 max-w-32"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        
        <Button 
          onClick={capturePhoto}
          size="lg"
          className="flex-1 max-w-32 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white disabled:opacity-50"
          disabled={!isVideoReady}
        >
          <Camera className="h-4 w-4 mr-2" />
          {isVideoReady ? 'Capture' : 'Loading...'}
        </Button>
      </div>

      {cameraError && (
        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-4 w-4 mr-2" />
          {cameraError}
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📷 Photo Tips:</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Ensure good lighting on the document</li>
          <li>• Keep the camera steady</li>
          <li>• Fill the frame with your document</li>
          <li>• Avoid shadows and glare</li>
        </ul>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      {/* File Preview */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center space-x-3">
          {preview ? (
            <img src={preview} alt="Preview" className="h-16 w-16 object-cover rounded" />
          ) : (
            <FileText className="h-16 w-16 text-gray-400" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file?.name}</p>
            <p className="text-sm text-gray-500">
              {file && (file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setStep('upload')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter a title for this record"
          />
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Add any additional notes or description"
            rows={3}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      <div className="flex space-x-3">
        <Button 
          variant="outline" 
          onClick={() => setStep('upload')}
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          onClick={handleUpload}
          disabled={!formData.title || isUploading}
          className="flex-1"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload & Analyze'
          )}
        </Button>
      </div>
    </div>
  );

  const renderAnalyzingStep = () => (
    <div className="text-center space-y-8 py-8">
      <div className="relative">
        <div className="h-20 w-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/25">
          <Sparkles className="h-10 w-10 text-white animate-pulse" />
        </div>
        <div className="absolute inset-0 h-20 w-20 mx-auto animate-ping bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-20"></div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">AI Analysis in Progress</h3>
        <p className="text-gray-600 max-w-sm mx-auto">
          Our advanced AI is carefully analyzing your medical document to extract key information and insights...
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-center text-sm">
          <CheckCircle className="h-5 w-5 text-emerald-500 mr-3" />
          <span className="text-gray-700">File uploaded successfully</span>
        </div>
        <div className="flex items-center justify-center text-sm">
          <div className="h-5 w-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-3 animate-pulse"></div>
          <span className="text-gray-700">Extracting medical information...</span>
        </div>
        <div className="flex items-center justify-center text-sm">
          <Loader2 className="h-5 w-5 text-indigo-500 mr-3 animate-spin" />
          <span className="text-gray-700">Generating insights and recommendations...</span>
        </div>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-8 py-6">
      <div className="relative">
        <div className="h-20 w-20 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/25">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        <div className="absolute inset-0 h-20 w-20 mx-auto animate-pulse bg-gradient-to-r from-emerald-400 to-green-500 rounded-full opacity-20"></div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Successfully Uploaded!</h3>
        <p className="text-gray-600 max-w-sm mx-auto">
          Your medical record has been uploaded and analyzed with AI-powered insights.
        </p>
      </div>

      {aiAnalysis && (
        <div className="text-left p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl shadow-lg">
          <div className="flex items-center mb-3">
            <Sparkles className="h-5 w-5 text-indigo-600 mr-2" />
            <h4 className="font-semibold text-indigo-900">AI Analysis Summary</h4>
          </div>
          <p className="text-sm text-indigo-700 leading-relaxed">{aiAnalysis.summary}</p>
          {aiAnalysis.urgencyLevel && aiAnalysis.urgencyLevel !== 'low' && (
            <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium ${
              aiAnalysis.urgencyLevel === 'high' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              Urgency Level: {aiAnalysis.urgencyLevel.charAt(0).toUpperCase() + aiAnalysis.urgencyLevel.slice(1)}
            </div>
          )}
        </div>
      )}

      <Button 
        onClick={handleClose} 
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Done
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        ref={modalContentRef} 
        className={`${step === 'camera' ? 'sm:max-w-lg' : 'sm:max-w-md'} max-h-[90vh] flex flex-col bg-gradient-to-br from-white to-blue-50/30 border border-white/20 shadow-2xl backdrop-blur-md`}
        style={{ 
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <DialogHeader className="space-y-3 flex-shrink-0">
          <DialogTitle className="flex items-center text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {step === 'upload' && (
              <>
                {type === 'camera' ? <Camera className="h-6 w-6 mr-2 text-blue-600" /> : <Upload className="h-6 w-6 mr-2 text-blue-600" />}
                {type === 'camera' ? 'Take Photo' : 'Upload File'}
              </>
            )}
            {step === 'camera' && (
              <>
                <Camera className="h-6 w-6 mr-2 text-emerald-600" />
                Camera View
              </>
            )}
            {step === 'details' && (
              <>
                <FileText className="h-6 w-6 mr-2 text-blue-600" />
                Add Details
              </>
            )}
            {step === 'analyzing' && (
              <>
                <Sparkles className="h-6 w-6 mr-2 text-indigo-600 animate-pulse" />
                AI Processing...
              </>
            )}
            {step === 'success' && (
              <>
                <CheckCircle className="h-6 w-6 mr-2 text-emerald-600" />
                Upload Complete
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {step === 'upload' && 'Capture or select your medical document to get started'}
            {step === 'camera' && 'Position your document clearly in the camera view and capture'}
            {step === 'details' && 'Provide information about your medical record for better organization'}
            {step === 'analyzing' && 'Our AI is analyzing your document to extract key medical information'}
            {step === 'success' && 'Your medical record has been successfully saved and analyzed'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pt-4">
          {step === 'upload' && renderUploadStep()}
          {step === 'camera' && renderCameraStep()}
          {step === 'details' && renderDetailsStep()}
          {step === 'analyzing' && renderAnalyzingStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
