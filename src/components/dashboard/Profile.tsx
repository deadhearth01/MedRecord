'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Key,
  Save,
  Edit,
  Camera,
  Heart,
  Activity,
  FileText,
  Settings
} from 'lucide-react';
import { type User as UserType, updateUserProfile } from '@/lib/supabase';

interface ProfileProps {
  user: UserType;
  onUserUpdate: (user: UserType) => void;
}

export default function Profile({ user, onUserUpdate }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await updateUserProfile(user.id, {
        first_name: editedUser.first_name,
        last_name: editedUser.last_name,
        phone: editedUser.phone,
        date_of_birth: editedUser.date_of_birth,
        blood_group: editedUser.blood_group,
        address: editedUser.address,
        emergency_contact_name: editedUser.emergency_contact_name,
        emergency_contact_phone: editedUser.emergency_contact_phone,
        medical_conditions: editedUser.medical_conditions,
        medications: editedUser.medications,
        allergies: editedUser.allergies,
      });

      if (error) throw error;
      
      onUserUpdate(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your personal information and settings</p>
        </div>
        
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Your basic profile information
                  </CardDescription>
                </div>
                <div className="text-center">
                  <div className="h-20 w-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                    {user.first_name[0]}{user.last_name[0]}
                  </div>
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-1" />
                    Change
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editedUser.first_name}
                    onChange={(e) => setEditedUser(prev => ({...prev, first_name: e.target.value}))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editedUser.last_name}
                    onChange={(e) => setEditedUser(prev => ({...prev, last_name: e.target.value}))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editedUser.phone || ''}
                    onChange={(e) => setEditedUser(prev => ({...prev, phone: e.target.value}))}
                    disabled={!isEditing}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={editedUser.date_of_birth || ''}
                    onChange={(e) => setEditedUser(prev => ({...prev, date_of_birth: e.target.value}))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={editedUser.address || ''}
                  onChange={(e) => setEditedUser(prev => ({...prev, address: e.target.value}))}
                  disabled={!isEditing}
                  placeholder="Enter your full address"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">MED ID</p>
                  <p className="text-blue-700 font-mono text-lg">{user.med_id}</p>
                  <p className="text-xs text-blue-600">This ID is used to access your medical records</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {user.user_type === 'citizen' ? 'Patient' : 'Healthcare Professional'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Information */}
        <TabsContent value="medical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Medical Information
              </CardTitle>
              <CardDescription>
                Your health information and medical history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Input
                  id="bloodGroup"
                  value={editedUser.blood_group || ''}
                  onChange={(e) => setEditedUser(prev => ({...prev, blood_group: e.target.value}))}
                  disabled={!isEditing}
                  placeholder="e.g., A+, B-, O+, AB-"
                />
              </div>

              <div>
                <Label htmlFor="conditions">Medical Conditions</Label>
                <Textarea
                  id="conditions"
                  value={editedUser.medical_conditions || ''}
                  onChange={(e) => setEditedUser(prev => ({...prev, medical_conditions: e.target.value}))}
                  disabled={!isEditing}
                  placeholder="List any chronic conditions, past surgeries, etc."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="medications">Current Medications</Label>
                <Textarea
                  id="medications"
                  value={editedUser.medications || ''}
                  onChange={(e) => setEditedUser(prev => ({...prev, medications: e.target.value}))}
                  disabled={!isEditing}
                  placeholder="List medications you're currently taking"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={editedUser.allergies || ''}
                  onChange={(e) => setEditedUser(prev => ({...prev, allergies: e.target.value}))}
                  disabled={!isEditing}
                  placeholder="List any known allergies (medications, food, environmental)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Contact */}
        <TabsContent value="emergency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Emergency Contact
              </CardTitle>
              <CardDescription>
                Person to contact in case of medical emergency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emergencyName">Emergency Contact Name</Label>
                <Input
                  id="emergencyName"
                  value={editedUser.emergency_contact_name || ''}
                  onChange={(e) => setEditedUser(prev => ({...prev, emergency_contact_name: e.target.value}))}
                  disabled={!isEditing}
                  placeholder="Full name of emergency contact"
                />
              </div>

              <div>
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  value={editedUser.emergency_contact_phone || ''}
                  onChange={(e) => setEditedUser(prev => ({...prev, emergency_contact_phone: e.target.value}))}
                  disabled={!isEditing}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-orange-600 mr-2" />
                  <h4 className="font-medium text-orange-900">Emergency Information</h4>
                </div>
                <p className="text-sm text-orange-700">
                  This information will be accessible to healthcare providers in case of an emergency. 
                  Make sure to keep it up to date.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Password</h4>
                    <p className="text-sm text-gray-600">Last changed 30 days ago</p>
                  </div>
                  <Button variant="outline">Change Password</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Login Sessions</h4>
                    <p className="text-sm text-gray-600">Manage your active sessions</p>
                  </div>
                  <Button variant="outline">View Sessions</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Data Export</h4>
                    <p className="text-sm text-gray-600">Download your data</p>
                  </div>
                  <Button variant="outline">Export Data</Button>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-red-600 mr-2" />
                  <h4 className="font-medium text-red-900">Account Deletion</h4>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
