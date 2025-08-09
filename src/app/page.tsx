'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Heart, Shield, Smartphone, Users, FileText, Brain, Sparkles, ArrowRight, Activity, Search, Zap } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase';
import { gsap } from 'gsap';

export default function LandingPage() {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is already authenticated and redirect to dashboard
    const checkAuth = async () => {
      try {
        // Add a small delay to ensure session is properly established
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { user } = await getCurrentUser();
        if (user) {
          router.push('/dashboard');
        }
      } catch (error) {
        // Handle silently
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    // GSAP animations for landing page
    const tl = gsap.timeline();

    tl.fromTo(heroRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power2.out" }
    )
    .fromTo(featuresRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
      "-=0.5"
    );

    // Floating animation for hero elements
    gsap.to(".float-element", {
      y: -10,
      duration: 2,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1
    });

  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="px-6 lg:px-8 h-16 flex items-center border-b border-white/20 bg-white/80 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">MedRecord</span>
          <div className="ml-2 flex items-center">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="text-xs text-gray-600 ml-1">AI-Powered</span>
          </div>
        </div>
        <nav className="ml-auto flex gap-6">
          <Link className="text-sm font-medium hover:text-blue-600 transition-colors relative group" href="#features">
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
          </Link>
          <Link className="text-sm font-medium hover:text-blue-600 transition-colors relative group" href="#about">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="w-full py-16 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-white to-indigo-100/20"></div>
        <div className="absolute top-20 left-10 float-element">
          <div className="h-20 w-20 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
        </div>
        <div className="absolute bottom-20 right-10 float-element" style={{ animationDelay: '1s' }}>
          <div className="h-32 w-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
        </div>
        
        <div className="container px-6 md:px-8 mx-auto relative z-10">
          <div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered Healthcare Management
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Your Medical Records,
                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Intelligently Organized
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-gray-600 text-lg md:text-xl leading-relaxed">
                Securely store, organize, and analyze your medical documents with AI-powered insights. 
                Get intelligent recommendations and keep your health information at your fingertips.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-4 text-lg"
              >
                <Link href="/auth/signin">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 px-8 py-4 text-lg transition-all duration-300"
                asChild
              >
                <Link href="#features">
                  Learn More
                </Link>
              </Button>
            </div>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-3xl">
              <div className="flex items-center justify-center p-4 bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <Brain className="h-8 w-8 text-blue-600 mr-3" />
                <span className="font-semibold text-gray-800">AI Analysis</span>
              </div>
              <div className="flex items-center justify-center p-4 bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <Shield className="h-8 w-8 text-emerald-600 mr-3" />
                <span className="font-semibold text-gray-800">Secure Storage</span>
              </div>
              <div className="flex items-center justify-center p-4 bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <Smartphone className="h-8 w-8 text-indigo-600 mr-3" />
                <span className="font-semibold text-gray-800">Mobile Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="w-full py-16 md:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white"></div>
        <div className="container px-6 md:px-8 mx-auto relative z-10">
          <div className="text-center space-y-6 mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-full text-blue-700 text-sm font-medium">
              <Zap className="h-4 w-4 mr-2" />
              Powerful Features
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Everything You Need for
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Complete Health Management
              </span>
            </h2>
            <p className="mx-auto max-w-3xl text-gray-600 text-lg md:text-xl leading-relaxed">
              Comprehensive tools designed to make managing your health records effortless, 
              secure, and intelligent.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            <div className="group flex flex-col items-center space-y-6 text-center p-8 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Enterprise Security</h3>
              <p className="text-gray-600 leading-relaxed">
                Bank-level encryption and compliance with healthcare privacy regulations 
                ensure your medical data is always protected and secure.
              </p>
            </div>
            
            <div className="group flex flex-col items-center space-y-6 text-center p-8 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">AI-Powered Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced AI analyzes your medical documents to extract key insights, 
                identify patterns, and provide intelligent health recommendations.
              </p>
            </div>
            
            <div className="group flex flex-col items-center space-y-6 text-center p-8 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Mobile Optimized</h3>
              <p className="text-gray-600 leading-relaxed">
                Access your records anywhere, anytime with our mobile-first responsive 
                design that works perfectly on all devices.
              </p>
            </div>
            
            <div className="group flex flex-col items-center space-y-6 text-center p-8 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Smart Organization</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload, organize, and categorize prescriptions, lab reports, bills, 
                and more with automatic tagging and intelligent sorting.
              </p>
            </div>
            
            <div className="group flex flex-col items-center space-y-6 text-center p-8 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">For Everyone</h3>
              <p className="text-gray-600 leading-relaxed">
                Designed for both citizens managing their personal health and 
                healthcare providers accessing patient records efficiently.
              </p>
            </div>
            
            <div className="group flex flex-col items-center space-y-6 text-center p-8 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Better Healthcare</h3>
              <p className="text-gray-600 leading-relaxed">
                Improve healthcare outcomes with organized, accessible medical 
                information that empowers better decision-making.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                About MedRecord
              </h2>
              <p className="text-gray-500 md:text-lg">
                MedRecord is a comprehensive medical records management platform designed to simplify 
                healthcare for everyone. Whether you're a citizen looking to organize your health 
                information or a healthcare provider needing efficient patient record access, 
                we've got you covered.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-gray-500">Secure cloud storage with end-to-end encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-gray-500">AI-powered document analysis and insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-gray-500">Mobile-first design for accessibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-gray-500">Easy sharing with healthcare providers</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-4 bg-gradient-to-r from-primary to-blue-600 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute inset-8 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center">
                  <Heart className="h-20 w-20 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600"></div>
        <div className="absolute top-10 left-10 float-element">
          <div className="h-24 w-24 bg-white/10 rounded-full blur-xl"></div>
        </div>
        <div className="absolute bottom-10 right-10 float-element" style={{ animationDelay: '2s' }}>
          <div className="h-16 w-16 bg-white/10 rounded-full blur-xl"></div>
        </div>
        
        <div className="container px-6 md:px-8 mx-auto relative z-10">
          <div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-white">
                Ready to Transform Your
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  Healthcare Journey?
                </span>
              </h2>
              <p className="mx-auto max-w-2xl text-blue-100 text-lg md:text-xl leading-relaxed">
                Join thousands of users who trust MedRecord with their health information. 
                Start organizing your medical records today with AI-powered insights.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button 
                asChild 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-4 text-lg font-semibold"
              >
                <Link href="/auth/signin">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm px-8 py-4 text-lg transition-all duration-300"
                asChild
              >
                <Link href="#features">
                  View Features
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center space-x-8 text-white/80 text-sm">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                <span>Free to Start</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-blue-400 rounded-full mr-2"></div>
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-purple-400 rounded-full mr-2"></div>
                <span>AI-Powered</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 bg-gray-900 text-white">
        <div className="container px-6 md:px-8 mx-auto">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                MedRecord
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Simplifying healthcare management with AI-powered medical record organization 
                and intelligent insights for better health outcomes.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-300">Product</h4>
              <div className="space-y-2">
                <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Features
                </Link>
                <Link href="#about" className="text-sm text-gray-400 hover:text-white transition-colors">
                  About
                </Link>
                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-300">Support</h4>
              <div className="space-y-2">
                <Link href="/help" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Help Center
                </Link>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
                <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Documentation
                </Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-300">Legal</h4>
              <div className="space-y-2">
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <Link href="/security" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Security
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2025 MedRecord. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Shield className="h-4 w-4 text-green-400" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Heart className="h-4 w-4 text-red-400" />
                <span>Made with care</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
