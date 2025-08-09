'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Home, 
  FileText, 
  Calendar, 
  User, 
  Plus, 
  LogOut, 
  Heart,
  Camera,
  Upload,
  Search,
  Users,
  Sparkles
} from 'lucide-react';
import { getCurrentUser, getUserProfile, signOut, type User as UserType } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { gsap } from 'gsap';

// Import dashboard components
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import MedicalRecords from '@/components/dashboard/MedicalRecords';
import Appointments from '@/components/dashboard/Appointments';
import Profile from '@/components/dashboard/Profile';
import PatientSearch from '@/components/dashboard/PatientSearch';
import UploadModal from '@/components/dashboard/UploadModal';

function DashboardContent() {
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'camera' | 'file'>('file');
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [recordsKey, setRecordsKey] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // GSAP refs
  const dashboardRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLDivElement>(null);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const checkAuth = async () => {
      try {
        // Add a small delay to ensure session is properly established
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const currentUser = await getCurrentUser();
        
        if (!currentUser.user) {
          router.push('/auth/signin');
          return;
        }

        const { data: userProfile, error } = await getUserProfile(currentUser.user.id);
        
        if (error || !userProfile) {
          router.push('/auth/onboarding');
          return;
        }

        setUser(userProfile);

        // Show welcome modal if coming from onboarding
        if (searchParams.get('welcome') === 'true') {
          setShowWelcome(true);
        }
      } catch (error) {
        router.push('/auth/signin');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, searchParams, mounted]);

  // GSAP Animations
  useEffect(() => {
    if (!mounted || isLoading || !user) return;

    const tl = gsap.timeline();

    // Animate header
    tl.fromTo(headerRef.current, 
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
    )
    // Animate tabs
    .fromTo(tabsRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      "-=0.3"
    )
    // Animate main content
    .fromTo(dashboardRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" },
      "-=0.2"
    )
    // Animate FAB
    .fromTo(fabRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
      "-=0.1"
    );

  }, [mounted, isLoading, user]);

  // Hover animations for interactive elements
  useEffect(() => {
    if (!mounted) return;

    const addHoverAnimations = () => {
      // Tab hover animations
      const tabs = document.querySelectorAll('[data-tab-trigger]');
      tabs.forEach(tab => {
        tab.addEventListener('mouseenter', () => {
          gsap.to(tab, { scale: 1.05, duration: 0.2, ease: "power2.out" });
        });
        tab.addEventListener('mouseleave', () => {
          gsap.to(tab, { scale: 1, duration: 0.2, ease: "power2.out" });
        });
      });

      // Button hover animations
      const buttons = document.querySelectorAll('[data-hover-button]');
      buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
          gsap.to(button, { y: -2, duration: 0.2, ease: "power2.out" });
        });
        button.addEventListener('mouseleave', () => {
          gsap.to(button, { y: 0, duration: 0.2, ease: "power2.out" });
        });
      });
    };

    const timer = setTimeout(addHoverAnimations, 500);
    return () => clearTimeout(timer);
  }, [mounted, user]);

  const handleSignOut = async () => {
    gsap.to(dashboardRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => {
        // Handle sign out after animation
        signOut().then(() => {
          router.push('/');
        }).catch((error) => {
          // Handle error silently
          console.error('Sign out error:', error);
          router.push('/');
        });
      }
    });
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    setRecordsKey(prev => prev + 1); // Force refresh of records
  };

  const handleUpload = (type: 'camera' | 'file') => {
    setUploadType(type);
    setShowUploadModal(true);
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    ...(user.user_type === 'doctor' ? [{ id: 'patients', label: 'Patients', icon: Users }] : []),
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div ref={dashboardRef} className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Mobile Header */}
      <div ref={headerRef} className="lg:hidden bg-white/90 backdrop-blur-md border-b border-white/20 shadow-lg px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">MedRecord</h1>
            <p className="text-xs text-gray-600">Welcome, {user.first_name || user.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleSignOut}
          data-hover-button
          className="hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white/80 backdrop-blur-md border-r border-white/20 shadow-xl overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-white/20">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">MedRecord</span>
                <div className="flex items-center mt-1">
                  <Sparkles className="h-3 w-3 text-indigo-400 mr-1" />
                  <span className="text-xs text-gray-600">AI-Powered Healthcare</span>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="text-sm text-gray-600">Welcome back,</div>
              <div className="font-semibold text-gray-900">{user.first_name} {user.last_name}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium mr-2">
                  {user.med_id}
                </span>
                {user.user_type === 'citizen' ? 'Patient' : 'Healthcare Professional'}
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    data-tab-trigger
                    style={{ animationDelay: `${index * 100}ms` }}
                    className={cn(
                      'w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden',
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-gray-900 bg-gray-50/50'
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 mr-3 transition-transform duration-200",
                      activeTab === item.id ? "text-white" : "text-gray-500 group-hover:text-blue-600"
                    )} />
                    {item.label}
                    {activeTab === item.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-xl"></div>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-6 border-t border-white/20 bg-gradient-to-r from-red-50 to-pink-50">
              <Button
                variant="ghost"
                onClick={handleSignOut}
                data-hover-button
                className="w-full justify-start text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1 p-4 lg:p-8">
            <Tabs ref={tabsRef} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {/* Mobile Navigation */}
              <TabsList className="lg:hidden grid grid-cols-4 gap-1 bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
                {navItems.slice(0, 4).map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <TabsTrigger 
                      key={item.id} 
                      value={item.id}
                      data-tab-trigger
                      style={{ animationDelay: `${index * 50}ms` }}
                      className="flex flex-col items-center py-3 px-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all duration-200 rounded-lg"
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      {item.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <DashboardOverview user={user} />
              </TabsContent>

              <TabsContent value="records" className="space-y-6">
                <MedicalRecords 
                  key={recordsKey}
                  user={user} 
                  onUpload={(type) => {
                    setUploadType(type);
                    setShowUploadModal(true);
                  }} 
                />
              </TabsContent>

              <TabsContent value="appointments" className="space-y-6">
                <Appointments user={user} />
              </TabsContent>

              {user.user_type === 'doctor' && (
                <TabsContent value="patients" className="space-y-6">
                  <PatientSearch user={user} />
                </TabsContent>
              )}

              <TabsContent value="profile" className="space-y-6">
                <Profile user={user} onUserUpdate={setUser} />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      {/* Floating Action Button - Only show on records tab */}
      {activeTab === 'records' && (
        <div ref={fabRef} className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-50">
          <div className="flex flex-col space-y-3">
            <Button
              size="icon"
              onClick={() => handleUpload('camera')}
              data-hover-button
              className="h-14 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-2xl shadow-emerald-500/25 border-2 border-white/20 backdrop-blur-md transition-all duration-300 hover:scale-110"
              title="Take Photo"
            >
              <Camera className="h-6 w-6 text-white" />
            </Button>
            <Button
              size="icon"
              onClick={() => handleUpload('file')}
              data-hover-button
              className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl shadow-blue-500/25 border-2 border-white/20 backdrop-blur-md transition-all duration-300 hover:scale-110"
              title="Upload File"
            >
              <Plus className="h-7 w-7 text-white" />
            </Button>
          </div>
        </div>
      )}

      {/* Welcome Modal */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Heart className="h-6 w-6 text-primary mr-2" />
              Welcome to MedRecord!
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Your account has been successfully created. Here's what you can do:
            </DialogDescription>
            <div className="space-y-4 pt-4">
              {user.user_type === 'citizen' ? (
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <FileText className="h-4 w-4 text-primary mr-2" />
                    Upload and organize your medical records
                  </li>
                  <li className="flex items-center">
                    <Camera className="h-4 w-4 text-primary mr-2" />
                    Take photos of prescriptions and documents
                  </li>
                  <li className="flex items-center">
                    <Calendar className="h-4 w-4 text-primary mr-2" />
                    Schedule appointments with doctors
                  </li>
                  <li className="flex items-center">
                    <Search className="h-4 w-4 text-primary mr-2" />
                    AI-powered document analysis and insights
                  </li>
                </ul>
              ) : (
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Users className="h-4 w-4 text-primary mr-2" />
                    Search and access patient records by MED ID
                  </li>
                  <li className="flex items-center">
                    <Calendar className="h-4 w-4 text-primary mr-2" />
                    Manage patient appointments
                  </li>
                  <li className="flex items-center">
                    <FileText className="h-4 w-4 text-primary mr-2" />
                    View comprehensive medical histories
                  </li>
                </ul>
              )}
              <p className="text-xs text-gray-500">
                Your unique MED ID: <span className="font-mono font-bold">{user.med_id}</span>
              </p>
            </div>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowWelcome(false)}>
              Get Started
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        type={uploadType}
        userId={user.id}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
