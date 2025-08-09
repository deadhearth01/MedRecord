'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  QrCode,
  Scan,
  Download,
  Share2,
  RefreshCw,
  Camera,
  Eye,
  Copy,
  CheckCircle,
  AlertCircle,
  User,
  Activity
} from 'lucide-react';
import { QRCode as QRCodeType, generateUserQRCode, getUserQRCodes, scanQRCode } from '@/lib/supabase';

interface QRCodeManagerProps {
  userId: string;
  userMedId: string;
  userType: 'citizen' | 'doctor';
}

export default function QRCodeManager({ userId, userMedId, userType }: QRCodeManagerProps) {
  const [qrCodes, setQrCodes] = useState<QRCodeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCodeType | null>(null);
  const [scanResult, setScanResult] = useState<{ medId: string } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load user's QR codes
  const loadQRCodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await getUserQRCodes(userId);
      if (error) throw error;
      setQrCodes(data || []);
    } catch (error) {
      console.error('Error loading QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQRCodes();
  }, [userId]);

  // Generate new QR code
  const handleGenerateQR = async () => {
    try {
      setGenerating(true);
      const { data, error } = await generateUserQRCode(userId, userMedId);
      if (error) throw error;
      
      await loadQRCodes();
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setGenerating(false);
    }
  };

  // Start camera for scanning
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanError('Unable to access camera');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  // Scan QR code from camera
  const handleScanFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      // In a real implementation, you would use a QR code library here
      // For now, simulating a scan result
      const mockQRData = 'eyJtZWRJZCI6Ik1FRDEyMzQ1IiwidGltZXN0YW1wIjoxNzAyOTg3NjAwMDAwfQ==';
      
      try {
        const { data, error } = await scanQRCode(mockQRData);
        if (error) throw error;
        
        setScanResult(data);
        setScanError(null);
        stopCamera();
        setScanModalOpen(false);
      } catch (error) {
        setScanError('Invalid QR code or scanning failed');
      }
    }
  };

  // Copy QR data to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Download QR code image
  const downloadQRCode = (qrCode: QRCodeType) => {
    // Generate QR code image and trigger download
    // This would typically use a QR code library
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      canvas.width = 256;
      canvas.height = 256;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.fillText('QR Code', 100, 128);
      
      const link = document.createElement('a');
      link.download = `medid-qr-${qrCode.id}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <QrCode className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">QR Code Manager</h2>
            <p className="text-gray-600">Share your MED ID securely via QR codes</p>
          </div>
        </div>
        <div className="flex gap-2">
          {userType === 'doctor' && (
            <Button variant="outline" onClick={() => setScanModalOpen(true)}>
              <Scan className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
          )}
          <Button onClick={handleGenerateQR} disabled={generating}>
            {generating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <QrCode className="h-4 w-4 mr-2" />
            )}
            Generate QR
          </Button>
        </div>
      </div>

      {/* Scan Result */}
      {scanResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">QR Code Scanned Successfully</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">MED ID: {scanResult.medId}</p>
                <p className="text-sm text-gray-600">Patient QR code scanned successfully</p>
              </div>
              <Button onClick={() => setScanResult(null)}>
                <Eye className="h-4 w-4 mr-2" />
                View Patient Records
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {scanError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{scanError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {qrCodes.map((qrCode) => (
          <Card key={qrCode.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">MED ID QR Code</CardTitle>
                <Badge variant={qrCode.is_active ? 'default' : 'secondary'}>
                  {qrCode.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription>
                Created: {new Date(qrCode.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* QR Code Display Area */}
              <div 
                className="w-full h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  setSelectedQR(qrCode);
                  setQrModalOpen(true);
                }}
              >
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to view QR code</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Scans: {qrCode.scan_count}</span>
                {qrCode.last_scanned && (
                  <span>Last: {new Date(qrCode.last_scanned).toLocaleDateString()}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedQR(qrCode);
                    setQrModalOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => downloadQRCode(qrCode)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>

                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(qrCode.qr_code_data)}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {qrCodes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No QR Codes Generated</h3>
            <p className="text-gray-600 mb-4">
              Generate a QR code to share your MED ID with healthcare providers quickly and securely.
            </p>
            <Button onClick={handleGenerateQR} disabled={generating}>
              {generating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4 mr-2" />
              )}
              Generate First QR Code
            </Button>
          </CardContent>
        </Card>
      )}

      {/* QR Code View Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code for MED ID</DialogTitle>
            <DialogDescription>
              Show this QR code to healthcare providers for quick access to your MED ID: {userMedId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="w-full h-64 bg-white border rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="h-32 w-32 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">QR Code would render here</p>
              </div>
            </div>
            
            {selectedQR && (
              <div className="text-center text-sm text-gray-600">
                <p>Generated: {new Date(selectedQR.created_at).toLocaleDateString()}</p>
                <p>Scanned: {selectedQR.scan_count} times</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQrModalOpen(false)}>
              Close
            </Button>
            {selectedQR && (
              <Button onClick={() => downloadQRCode(selectedQR)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan Modal */}
      <Dialog open={scanModalOpen} onOpenChange={setScanModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Patient QR Code</DialogTitle>
            <DialogDescription>
              Position the QR code within the camera frame to scan the patient's MED ID.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                onLoadedMetadata={() => startCamera()}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg opacity-75"></div>
              </div>
            </div>
            
            <Button 
              onClick={handleScanFromCamera} 
              className="w-full"
              disabled={!videoRef.current}
            >
              <Camera className="h-4 w-4 mr-2" />
              Scan QR Code
            </Button>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setScanModalOpen(false);
                stopCamera();
                setScanError(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
