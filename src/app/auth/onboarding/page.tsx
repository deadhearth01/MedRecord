'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, User, UserCheck, ArrowLeft, Home } from 'lucide-react';
import { getCurrentUser, createUserProfile, getUserProfile } from '@/lib/supabase';
import { generateMedID } from '@/lib/utils';
import Link from 'next/link';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  blood_group: string;
  date_of_birth: string;
  user_type: 'citizen' | 'doctor' | null;
}

export default function OnboardingPage() {
  console.log('Onboarding: Component mounting/remounting...');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    blood_group: '',
    date_of_birth: '',
    user_type: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Onboarding: Checking authentication...');
      const currentUser = await getCurrentUser();
      console.log('Onboarding: getCurrentUser result:', currentUser);
      
      if (!currentUser.user) {
        console.log('Onboarding: No user found, redirecting to signin...');
        router.push('/auth/signin');
        return;
      }
      
      // Check if user already has a profile (shouldn't be on onboarding page)
      try {
        const { data: existingProfile } = await getUserProfile(currentUser.user.id);
        if (existingProfile) {
          console.log('Onboarding: User already has profile, redirecting to dashboard...');
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Onboarding: Error checking existing profile:', error);
      }
      
      console.log('Onboarding: Setting user data:', currentUser.user);
      setUser(currentUser.user);
      
      // Pre-fill name from Google profile if available
      if (currentUser.user?.user_metadata?.full_name) {
        const nameParts = currentUser.user.user_metadata.full_name.split(' ');
        setFormData(prev => ({
          ...prev,
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
        }));
      }

      // Set email from user data
      if (currentUser.user?.email) {
        setFormData(prev => ({
          ...prev,
          email: currentUser.user?.email || ''
        }));
      }
    };

    checkAuth();
  }, [router]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.first_name || !formData.last_name) {
        setError('Please fill in all required fields');
        return;
      }
    }
    
    setError(null);
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!formData.user_type) {
      setError('Please select your account type');
      return;
    }

    if (!user?.id) {
      setError('User authentication error. Please sign in again.');
      router.push('/auth/signin');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Onboarding: Creating profile for user:', user);
      const medId = generateMedID();
      
      const userData = {
        id: user.id,
        email: user.email || '',
        med_id: medId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        gender: (formData.gender as 'male' | 'female' | 'other') || undefined,
        blood_group: formData.blood_group || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        user_type: formData.user_type,
      };

      console.log('Onboarding: Creating user profile with data:', userData);

      const { error } = await createUserProfile(userData);

      if (error) {
        console.error('Onboarding: Profile creation error:', error);
        
        // Handle specific database errors
        if (error.code === '23505') {
          setError('This account is already registered. Please sign in instead.');
        } else if (error.message.includes('duplicate key')) {
          setError('This account is already registered. Please sign in instead.');
        } else {
          setError(`Profile creation failed: ${error.message || 'Unknown database error'}`);
        }
        return;
      }

      console.log('Onboarding: Profile created successfully, redirecting to dashboard...');
      // Success - redirect to dashboard
      router.push('/dashboard?welcome=true');
    } catch (err) {
      console.error('Onboarding: Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-blue-50 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Navigation Header */}
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="text-sm font-medium">Go to Homepage</span>
          </Link>
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Go Back</span>
            </button>
          )}
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="mt-2 text-sm text-gray-600">
            Step {currentStep} of 3 - Let's set up your account
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className="flex items-center text-sm">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep >= 2 ? 'bg-primary' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep >= 3 ? 'bg-primary' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Enter your first name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Enter your last name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleNext} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Medical Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="blood_group">Blood Group</Label>
                <select
                  id="blood_group"
                  value={formData.blood_group}
                  onChange={(e) => handleInputChange('blood_group', e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                >
                  <option value="">Select blood group</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Account Type */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">I am a:</Label>
                <div className="mt-4 space-y-3">
                  <div
                    onClick={() => handleInputChange('user_type', 'citizen')}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                      formData.user_type === 'citizen'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <User className="h-6 w-6 text-primary mr-3" />
                      <div>
                        <div className="font-medium">Citizen</div>
                        <div className="text-sm text-gray-600">
                          I want to store and manage my medical records
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    onClick={() => handleInputChange('user_type', 'doctor')}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                      formData.user_type === 'doctor'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <UserCheck className="h-6 w-6 text-primary mr-3" />
                      <div>
                        <div className="font-medium">Healthcare Professional</div>
                        <div className="text-sm text-gray-600">
                          I need to access patient records and manage appointments
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
