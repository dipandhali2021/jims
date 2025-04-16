'use client';

import { useState, useEffect } from 'react';
import { useClerk, useUser, useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, Eye, EyeOff, Settings, Shield, LogOut, UserCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AccountPage() {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const { signOut } = useClerk();
  const { signIn } = useSignIn();

  // State for change password
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [signOutOthers, setSignOutOthers] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for setup password confirmation dialog
  const [isSetupPasswordDialogOpen, setIsSetupPasswordDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // State for reset password
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string>('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
    
  // State for Google Sign-in toggle
  const [showGoogleSignIn, setShowGoogleSignIn] = useState<boolean>(true);
  const [isLoadingGoogleSetting, setIsLoadingGoogleSetting] = useState<boolean>(true);
  const [isSavingGoogleSetting, setIsSavingGoogleSetting] = useState<boolean>(false);

  const isAdmin = user?.publicMetadata?.role === 'admin';

  // Reset change password dialog state
  useEffect(() => {
    if (!isPasswordDialogOpen) {
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setSignOutOthers(false);
      }, 300);
    }
  }, [isPasswordDialogOpen]);

  // Reset reset password dialog state
  useEffect(() => {
    if (!isResetPasswordDialogOpen) {
      setTimeout(() => {
        setResetNewPassword('');
        setResetConfirmPassword('');
        setResetPasswordError('');
      }, 300);
    }
  }, [isResetPasswordDialogOpen]);
  
  // Fetch Google sign-in settings (admin only)
  useEffect(() => {
    if (isAdmin) {
      const fetchGoogleSignInSetting = async () => {
        try {
          const response = await fetch('/api/settings/google-signin');
          
          if (response.ok) {
            const data = await response.json();
            setShowGoogleSignIn(data.showGoogleSignIn);
          }
        } catch (error) {
          console.error('Error fetching Google sign-in setting:', error);
          toast({
            title: 'Error',
            description: 'Failed to load Google sign-in settings',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingGoogleSetting(false);
        }
      };
      
      fetchGoogleSignInSetting();
    }
  }, [isAdmin, toast]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  // Handle Google Sign-in toggle change
  const handleGoogleSignInToggle = async (checked: boolean) => {
    setIsSavingGoogleSetting(true);
    try {
      const response = await fetch('/api/settings/google-signin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ showGoogleSignIn: checked }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      const data = await response.json();
      setShowGoogleSignIn(data.showGoogleSignIn);
      
      toast({
        title: 'Settings Updated',
        description: 'Google Sign-in button visibility has been updated',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setIsSavingGoogleSetting(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordError('');

      await user.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions: signOutOthers,
      });

      toast({
        title: 'Success',
        description: 'Password updated successfully',
      });

      setIsPasswordDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating password:', error);
      setPasswordError(
        error?.errors?.[0]?.message ||
          'Failed to update password. Make sure your current password is correct.'
      );
      toast({
        title: 'Error',
        description:
          error?.errors?.[0]?.long_message ||
          'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handler for setup password button
  const handleSetupPassword = async () => {
    try {
      setIsLoggingOut(true);
      toast({
        title: 'Logging out',
        description: 'You will be redirected to set up your password',
      });
      
      // Sign out the user
      await signOut({ redirectUrl: '/forgot-password' });
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
      setIsLoggingOut(false);
      setIsSetupPasswordDialogOpen(false);
    }
  };

  // Handler for setup face recognition button
  const handleSetupFaceRecognition = async () => {
    try {
      setIsLoggingOut(true);
      toast({
        title: 'Logging out',
        description: 'You will be redirected to set up face recognition',
      });
      // First sign out
      await signOut();
      // Then immediately start face authentication flow
      if (signIn) {
        await signIn.authenticateWithRedirect({
          strategy: 'oauth_custom_face_recognition_auth',
          redirectUrl: `${window.location.origin}/sso-callback`,
          redirectUrlComplete: '/dashboard',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Face authentication service unavailable. Please refresh and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error during logout or face auth:', error);
      toast({
        title: 'Error',
        description: 'Failed to start face recognition. Please try again.',
        variant: 'destructive',
      });
      setIsLoggingOut(false);
    }
  };

  const hasPassword = user.passwordEnabled;

  return (
    <div className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your account preferences and security options</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Tabs defaultValue="security" className="w-full">
          <div className="border-b">
            <TabsList className="w-full h-full justify-start rounded-none bg-gray-50 px-2 sm:px-4 pt-1 sm:pt-2 overflow-x-auto flex-nowrap">
              <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-t-lg px-3 py-2 text-sm whitespace-nowrap">
                <Shield className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Security</span>
                <span className="sm:hidden">Security</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-t-lg px-3 py-2 text-sm whitespace-nowrap">
                  <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Admin Settings</span>
                  <span className="sm:hidden">Admin</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>
          
          <TabsContent value="security" className="p-3 sm:p-4 md:p-6 space-y-6 sm:space-y-8">
            
            
            {/* Password Management Section */}
            <div className="flex flex-col space-y-3 pb-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Password Settings</h2>
              <div className="bg-gray-50 p-3 sm:p-4 md:p-5 rounded-lg">
                <div>
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 flex-shrink-0"></div>
                    <span className="text-sm font-medium">
                      {hasPassword ? "Password protection enabled" : "Password not set"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-4">
                    {hasPassword
                      ? 'You can change your password at any time. We recommend using a strong, unique password.'
                      : "You haven't set up a password yet. Setting up a password will enable password-based login."}
                  </p>
                  
                  {hasPassword ? (
                    <Dialog
                      open={isPasswordDialogOpen}
                      onOpenChange={setIsPasswordDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm">
                          <Key className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white max-w-[95vw] sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-lg sm:text-xl">Change Password</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2 sm:py-4">
                          {passwordError && (
                            <div className="p-2 sm:p-3 bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm rounded-md">
                              {passwordError}
                            </div>
                          )}

                          <div className="space-y-1 sm:space-y-2">
                            <Label htmlFor="current-password" className="text-sm">
                              Current Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="current-password"
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="pr-10 text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() =>
                                  setShowCurrentPassword(!showCurrentPassword)
                                }
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1 sm:space-y-2">
                            <Label htmlFor="new-password" className="text-sm">New Password</Label>
                            <div className="relative">
                              <Input
                                id="new-password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="pr-10 text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Password must be at least 8 characters long
                            </p>
                          </div>

                          <div className="space-y-1 sm:space-y-2">
                            <Label htmlFor="confirm-password" className="text-sm">
                              Confirm New Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="pr-10 text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 pt-1 sm:pt-2">
                            <Switch
                              id="sign-out-others"
                              checked={signOutOthers}
                              onCheckedChange={setSignOutOthers}
                            />
                            <Label
                              htmlFor="sign-out-others"
                              className="text-xs sm:text-sm font-normal"
                            >
                              Sign out of all other sessions
                            </Label>
                          </div>
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                          <Button
                            variant="outline"
                            onClick={() => setIsPasswordDialogOpen(false)}
                            disabled={isUpdatingPassword}
                            className="w-full sm:w-auto order-2 sm:order-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdatePassword}
                            disabled={
                              isUpdatingPassword ||
                              !currentPassword ||
                              !newPassword ||
                              !confirmPassword
                            }
                            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
                          >
                            {isUpdatingPassword ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              'Update Password'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Dialog
                      open={isSetupPasswordDialogOpen}
                      onOpenChange={setIsSetupPasswordDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm">
                          <Key className="h-4 w-4 mr-2" />
                          Set Up Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white max-w-[95vw] sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-lg sm:text-xl">Set Up Password</DialogTitle>
                        </DialogHeader>
                        <div className="py-2 sm:py-4">
                          <p className="text-sm text-gray-700">
                            You will be logged out from this session and redirected to the password setup page.
                            Do you want to continue?
                          </p>
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                          <Button
                            variant="outline"
                            onClick={() => setIsSetupPasswordDialogOpen(false)}
                            disabled={isLoggingOut}
                            className="w-full sm:w-auto order-2 sm:order-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSetupPassword}
                            disabled={isLoggingOut}
                            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
                          >
                            {isLoggingOut ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Logging out...
                              </>
                            ) : (
                              'Continue'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>
            
            {/* Authentication Methods */}
            <div className="flex flex-col space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Authentication Methods</h2>
              <div className="space-y-3">
                {/* Google Auth */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center">
                      <div className="bg-white p-2 rounded-full mr-3 shadow-sm flex-shrink-0">
                        <img
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                          alt="Google"
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm sm:text-base">Google Authentication</h3>
                        <p className="text-xs sm:text-sm text-gray-500">Sign in with your Google account</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        setIsLoggingOut(true);
                        toast({
                          title: 'Logging out',
                          description: 'You will be redirected to Google authentication',
                        });
                        await signOut();
                        if (signIn) {
                          await signIn.authenticateWithRedirect({
                            strategy: 'oauth_google',
                            redirectUrl: `${window.location.origin}/sso-callback`,
                            redirectUrlComplete: '/dashboard',
                          });
                        } else {
                          toast({
                            title: 'Error',
                            description: 'Google authentication service unavailable. Please refresh and try again.',
                            variant: 'destructive',
                          });
                        }
                        setIsLoggingOut(false);
                      }}
                      disabled={isLoggingOut}
                      className="bg-white w-full sm:w-auto text-sm"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <span className="sm:hidden">Connect with Google</span>
                          <span className="hidden sm:inline">Connect</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Face Recognition (Admin only) */}
                {isAdmin && (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center">
                        <div className="bg-white p-2 rounded-full mr-3 shadow-sm flex-shrink-0">
                          <UserCheck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm sm:text-base">Face Recognition</h3>
                          <p className="text-xs sm:text-sm text-gray-500">Admin-only secure authentication method</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleSetupFaceRecognition}
                        disabled={isLoggingOut}
                        className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm"
                      >
                        {isLoggingOut ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Setup'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Admin Settings Tab */}
          {isAdmin && (
            <TabsContent value="admin" className="p-3 sm:p-4 md:p-6 space-y-6 sm:space-y-8">
              <div className="flex flex-col space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Authentication Settings</h2>
                <div className="bg-gray-50 p-3 sm:p-4 md:p-5 rounded-lg">
                  {isLoadingGoogleSetting ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading settings...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="font-medium text-sm sm:text-base">Google Sign-in</h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Show or hide the "Continue with Google" button on the sign-in page
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        {isSavingGoogleSetting && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Switch
                          id="google-signin"
                          checked={showGoogleSignIn}
                          onCheckedChange={handleGoogleSignInToggle}
                          disabled={isSavingGoogleSetting}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    
    </div>
  );
}