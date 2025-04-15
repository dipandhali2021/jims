'use client';

import { useState, useEffect } from 'react';
import { useClerk, useUser, useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

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
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] =
    useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string>('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] =
    useState(false);

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
      
      // Navigate to forgot-password page
      // router.push('/forgot-password');
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
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password Management Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Password Management</h3>
            <p className="text-sm text-muted-foreground">
              {hasPassword
                ? 'You can change your password here. Make sure to use a strong password.'
                : "You haven't set up a password yet. Set one up to enable password-based login."}
            </p>

            <div className="space-x-4">
              {hasPassword ? (
                <Dialog
                  open={isPasswordDialogOpen}
                  onOpenChange={setIsPasswordDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="default">
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {passwordError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                          {passwordError}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="current-password">
                          Current Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
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

                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
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
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 8 characters long
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
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

                      <div className="flex items-center space-x-2 pt-2">
                        <input
                          type="checkbox"
                          id="sign-out-others"
                          checked={signOutOthers}
                          onChange={(e) => setSignOutOthers(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <Label
                          htmlFor="sign-out-others"
                          className="text-sm font-normal"
                        >
                          Sign out of all other sessions
                        </Label>
                      </div>
                    </div>
                    <DialogFooter className="flex justify-between sm:justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setIsPasswordDialogOpen(false)}
                        disabled={isUpdatingPassword}
                        className="border-gray-200 hover:bg-gray-50"
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
                        className="bg-blue-500 hover:bg-blue-600 text-white"
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
                    <Button variant="default">
                      <Key className="h-4 w-4 mr-2" />
                      Set Up Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>Set Up Password</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p>
                        You will be logged out from this session and redirected to the password setup page.
                        Do you want to continue?
                      </p>
                    </div>
                    <DialogFooter className="flex justify-between sm:justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setIsSetupPasswordDialogOpen(false)}
                        disabled={isLoggingOut}
                        className="border-gray-200 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSetupPassword}
                        disabled={isLoggingOut}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
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

          {/* Face Recognition Setup Section (Admin only) */}
          {isAdmin && (
            <div className="space-y-4 pt-8">
              <h3 className="text-lg font-semibold">Face Recognition</h3>
              <p className="text-sm text-muted-foreground">
                Set up face recognition for secure admin authentication.
              </p>
              <Button
                variant="default"
                onClick={handleSetupFaceRecognition}
                disabled={isLoggingOut}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  'Setup Face Recognition'
                )}
              </Button>
            </div>
          )}

          {/* Google Authentication Setup Section (All users) */}
          <div className="space-y-4 pt-8">
            <h3 className="text-lg font-semibold">Google Authentication</h3>
            <p className="text-sm text-muted-foreground">
              Use Google to sign in securely.
            </p>
            <Button
              variant="default"
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
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {isLoggingOut ? (
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}