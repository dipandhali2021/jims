'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Shield, Mail, Calendar, Key, Eye, EyeOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { UserResource } from '@clerk/types';
export default function ProfilePage() {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
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

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
      });
      setPreviewUrl(user.imageUrl);
    }
  }, [user]);

  // Reset the dialog state when it closes
  useEffect(() => {
    if (!isPasswordDialogOpen) {
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setSignOutOthers(false);
      }, 300); // Small delay to allow the dialog to close smoothly
    }
  }, [isPasswordDialogOpen]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Image size should be less than 10MB',
          variant: 'destructive',
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please select a valid image file',
          variant: 'destructive',
        });
        return;
      }

      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl !== user.imageUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(null);
    setPreviewUrl(user.imageUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update Clerk profile
      await user.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      // Update profile image if changed
      if (imageFile) {
        await user.setProfileImage({
          file: imageFile,
        });
      }

      // Update database
      await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      await user.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };




  const handleUpdatePassword = async () => {
    // Validate passwords
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

      // Use the updatePassword method directly
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
        description: error?.errors?.[0]?.long_message || 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>

        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Change Password Dialog */}
            {/* Profile Image */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center space-x-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewUrl} />
                  <AvatarFallback>
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="profile-image"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById('profile-image')?.click()
                      }
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload new image
                    </Button>
                  </div>
                  {previewUrl !== user.imageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleRemoveImage}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove new image
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-muted-foreground">
                Email address cannot be changed
              </p>
            </div>

            {/* Account Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Account Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Role</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {typeof user.publicMetadata === 'object' && user.publicMetadata?.role === 'admin'
                          ? 'Admin'
                          : 'Shopkeeper'}
                      </p>

                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Email Verification</p>
                      <p className="text-sm text-muted-foreground">
                        {user.primaryEmailAddress?.verification.status === 'verified'
                          ? 'Verified'
                          : 'Not Verified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Last Sign In</p>
                      <p className="text-sm text-muted-foreground">
                        {user.lastSignInAt ? (
                          new Date(user.lastSignInAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          'Never'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Account Created</p>
                      <p className="text-sm text-muted-foreground">
                        {user.createdAt ? (
                          new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        ) : (
                          'Unknown'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {user.updatedAt ? (
                          new Date(user.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        ) : (
                          'Unknown'
                        )}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function useReverification(arg0: (params: any) => Promise<UserResource>) {
  throw new Error('Function not implemented.');
}
