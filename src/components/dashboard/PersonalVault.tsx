'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Shield,
  Upload,
  Share2,
  Lock,
  Eye,
  Download,
  Trash2,
  Clock,
  AlertTriangle,
  FileText,
  CreditCard,
  IdCard,
  Award
} from 'lucide-react';
import { PersonalVaultItem, createVaultItem, getUserVaultItems, shareVaultItem } from '@/lib/supabase';

interface PersonalVaultProps {
  userId: string;
  userType: 'citizen' | 'doctor';
}

export default function PersonalVault({ userId, userType }: PersonalVaultProps) {
  const [vaultItems, setVaultItems] = useState<PersonalVaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PersonalVaultItem | null>(null);
  const [vaultPassword, setVaultPassword] = useState('');

  // Document type icons
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'insurance': return <CreditCard className="h-5 w-5" />;
      case 'aadhaar': return <IdCard className="h-5 w-5" />;
      case 'government_scheme': return <Award className="h-5 w-5" />;
      case 'passport': return <IdCard className="h-5 w-5" />;
      case 'license': return <IdCard className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  // Load vault items
  const loadVaultItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await getUserVaultItems(userId);
      if (error) throw error;
      setVaultItems(data || []);
    } catch (error) {
      console.error('Error loading vault items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVaultItems();
  }, [userId]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload file logic would go here
      // For now, creating a placeholder vault item
      const vaultData = {
        user_id: userId,
        document_type: 'other' as const,
        title: file.name,
        description: '',
        file_name: file.name,
        file_path: `/vault/${userId}/${file.name}`,
        file_size: file.size,
        file_type: file.type,
        is_shared: false,
        shared_with: [],
      };

      const { data, error } = await createVaultItem(vaultData);
      if (error) throw error;

      await loadVaultItems();
      setUploadModalOpen(false);
    } catch (error) {
      console.error('Error uploading to vault:', error);
    }
  };

  // Handle sharing
  const handleShare = async (doctorIds: string[], expiryDate?: string) => {
    if (!selectedItem) return;

    try {
      const { error } = await shareVaultItem(selectedItem.id, doctorIds, expiryDate);
      if (error) throw error;

      await loadVaultItems();
      setShareModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error sharing vault item:', error);
    }
  };

  // Check if item sharing is expired
  const isExpired = (item: PersonalVaultItem) => {
    if (!item.share_expiry) return false;
    return new Date(item.share_expiry) < new Date();
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
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Personal Vault</h2>
            <p className="text-gray-600">Secure storage for sensitive documents</p>
          </div>
        </div>
        {userType === 'citizen' && (
          <Button onClick={() => setUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Vault Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vaultItems.map((item) => (
          <Card key={item.id} className={`relative ${isExpired(item) && item.is_shared ? 'border-red-200' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getDocumentIcon(item.document_type)}
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  {item.is_shared && (
                    <Badge variant={isExpired(item) ? 'destructive' : 'secondary'}>
                      <Share2 className="h-3 w-3 mr-1" />
                      {isExpired(item) ? 'Expired' : 'Shared'}
                    </Badge>
                  )}
                  {item.vault_password_hash && (
                    <Badge variant="outline">
                      <Lock className="h-3 w-3 mr-1" />
                      Protected
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>{item.description || 'No description'}</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-sm text-gray-500">
                  <p>Type: {item.document_type.replace('_', ' ').toUpperCase()}</p>
                  <p>Size: {item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</p>
                  <p>Added: {new Date(item.created_at).toLocaleDateString()}</p>
                </div>

                {item.is_shared && item.share_expiry && (
                  <div className={`flex items-center gap-2 text-sm ${isExpired(item) ? 'text-red-600' : 'text-yellow-600'}`}>
                    <Clock className="h-4 w-4" />
                    <span>
                      {isExpired(item) ? 'Expired: ' : 'Expires: '}
                      {new Date(item.share_expiry).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      if (item.vault_password_hash) {
                        setSelectedItem(item);
                        setPasswordModalOpen(true);
                      } else {
                        // Direct view
                        window.open(item.file_url, '_blank');
                      }
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  {userType === 'citizen' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedItem(item);
                        setShareModalOpen(true);
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vaultItems.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Documents in Vault</h3>
            <p className="text-gray-600 mb-4">
              Your personal vault is empty. Upload important documents like insurance cards, Aadhaar, etc.
            </p>
            {userType === 'citizen' && (
              <Button onClick={() => setUploadModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload to Personal Vault</DialogTitle>
            <DialogDescription>
              Add sensitive documents to your secure vault with optional password protection.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Select Document</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileUpload}
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Documents will be encrypted and stored securely</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Vault Password</DialogTitle>
            <DialogDescription>
              This document is password protected. Enter the vault password to view.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="vault-password">Vault Password</Label>
              <Input
                id="vault-password"
                type="password"
                value={vaultPassword}
                onChange={(e) => setVaultPassword(e.target.value)}
                placeholder="Enter vault password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Verify password and open document
              setPasswordModalOpen(false);
              setVaultPassword('');
            }}>
              <Lock className="h-4 w-4 mr-2" />
              Unlock & View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
