'use client';

import { useState, useEffect } from 'react';
import { useSignIn, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Gem, Loader2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, DollarSign } from 'lucide-react';

export default function SignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signOut, user } = useClerk(); // Use useClerk to access proper signOut method
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsFaceVerification, setNeedsFaceVerification] = useState(false);
  const [showGoogleSignIn, setShowGoogleSignIn] = useState(true); // Default to true until we fetch from the API
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const router = useRouter();

  // Fetch the Google sign-in visibility setting on component mount
  useEffect(() => {
    const fetchGoogleSignInSetting = async () => {
      try {
        const response = await fetch('/api/settings/google-signin');
        if (response.ok) {
          const data = await response.json();
          setShowGoogleSignIn(data.showGoogleSignIn);
        }
      } catch (error) {
        console.error('Error fetching Google sign-in setting:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchGoogleSignInSetting();
  }, []);

  if (!isLoaded) {
    return null;
  }

  async function handleGoogleSignIn() {
    try {
      setIsLoading(true);
      setError('');

      await signIn?.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: '/dashboard',
      });
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      setIsLoading(true);
      setError('');
      
      // First factor: Email/Password verification
      const emailPasswordResult = await signIn.create({
        identifier: emailAddress,
        password,
      });

      console.log('Email/Password result:', emailPasswordResult);
      
      if (emailPasswordResult.status === 'complete') {
        // Set Clerk session as active before redirect
        // Now fetch the user role from our database
        try {
          const response = await fetch('/api/user/get-role', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: emailAddress }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch user role');
          }
          
          const { role } = await response.json();
          console.log('User role:', role);
          
          if (role === 'admin') {
            // Admin requires face verification
            setNeedsFaceVerification(true);
          } else {
        
            if (emailPasswordResult.createdSessionId) {
              await setActive({ session: emailPasswordResult.createdSessionId });
              console.log('Session activated:', emailPasswordResult.createdSessionId);
            }
            
            // Regular user - redirect directly to inventory
            console.log('Redirecting to /inventory');
            router.push('/inventory');
          }
        } catch (roleError) {
          console.error('Error fetching user role:', roleError);
          // Default to face verification if we can't determine the role
          setNeedsFaceVerification(true);
        }
      } else {
        console.error('Unexpected result:', JSON.stringify(emailPasswordResult, null, 2));
        setError('Authentication failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Error during email/password verification:', err);
      setError(err.errors?.[0]?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFaceVerification() {
    try {
      setIsLoading(true);
      setError('');
      console.log('User from face :', user);
      if (signOut) {
        // First sign out completely to clear any existing sessions
        await signOut();
        
        // After signing out, use the correct method to initiate face authentication
        // We need to use authenticateWithRedirect directly instead of building a URL manually
        if (signIn) {
          await signIn.authenticateWithRedirect({
            strategy: 'oauth_custom_face_recognition_auth',
            redirectUrl: `${window.location.origin}/sso-callback`,
            redirectUrlComplete: '/dashboard',
          });
        } else {
          setError("Authentication service is not available. Please try refreshing the page.");
        }
      } else {
        setError("Could not sign out. Please try refreshing the page.");
      }
    } catch (err: any) {
      console.error('Error during sign out and face verification:', err);
      setError('Failed to verify with Face Recognition. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Gem className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to  Jewelry Inventory
          </CardTitle>
          <CardDescription className="text-center">
            {!needsFaceVerification 
              ? 'Please enter your details to sign in'
              : 'Please verify your identity with Face Recognition'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!needsFaceVerification ? (
            // First step: Email/Password verification
            <>
              {/* Only render Google sign-in button if setting is enabled */}
              {showGoogleSignIn && !isLoadingSettings && (
                <Button
                  onClick={handleGoogleSignIn}
                  className="w-full mb-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google"
                      className="w-5 h-5 mr-2"
                    />
                  )}
                  Continue with Google
                </Button>
              )}

              {/* Divider is only shown when Google sign-in is enabled */}
              {showGoogleSignIn && !isLoadingSettings && (
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with email
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
            </>
          ) : (
            // Second step: Face verification
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-yellow-100 p-3">
                  <svg className="w-8 h-8 text-yellow-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M3 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M19 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 3V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-center text-sm text-gray-600">
                  Your email and password have been verified. To complete the sign-in process, we need to verify your identity using facial recognition.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleFaceVerification} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify with Face Recognition'
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setNeedsFaceVerification(false);
                }}
                disabled={isLoading}
              >
                Back to Sign In
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/sign-up"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}