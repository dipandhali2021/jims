'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  UserCog,
  Shield,
  ShieldAlert,
  User,
  Loader2,
  LayoutGrid,
  List,
  Trash2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ClerkUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  primaryEmailAddressId: string | null;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
  }>;
  publicMetadata: {
    role?: string;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<ClerkUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getCurrentUserRole = useCallback(async () => {
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserRole(data.role || '');
      }
    } catch (error) {
      console.error('Error fetching current user role:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    getCurrentUserRole();
  }, [fetchUsers, getCurrentUserRole]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      // Refresh the users list
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      // Refresh the users list
      await fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user: ClerkUser) => {
    const searchLower = searchTerm.toLowerCase();
    const firstName = user.firstName?.toLowerCase() || '';
    const lastName = user.lastName?.toLowerCase() || '';
    const email = user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    )?.emailAddress.toLowerCase() || '';

    return (
      firstName.includes(searchLower) ||
      lastName.includes(searchLower) ||
      email.includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-9 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-9 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        <div className="mb-6 flex justify-between">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
        </div>

        {viewMode === 'list' ? (
          <Card>
            <CardHeader>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">User</th>
                      <th className="text-left p-4">Email</th>
                      <th className="text-left p-4">Current Role</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="p-4">
                          <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
                        </td>
                        <td className="p-4">
                          <div className="h-10 w-[180px] bg-gray-200 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex flex-col items-center mb-4">
                      <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse mb-2" />
                      <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="mb-4 flex justify-center">
                      <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                    <div className="mt-4">
                      <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Helper function to get user email
  const getUserEmail = (user: ClerkUser) => {
    return user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    )?.emailAddress || '';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-6 flex justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>
      </div>

      {viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">User</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Current Role</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.imageUrl} />
                            <AvatarFallback>
                              {user.firstName?.[0]}
                              {user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-center">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getUserEmail(user)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.publicMetadata.role)}
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeColor(
                              user.publicMetadata.role
                            )}`}
                          >
                            {user.publicMetadata.role === 'admin'
                              ? 'Admin'
                              : 'Shopkeeper'}

                          </span>
                        </div>
                      </td>
                      <td className="flex p-4 space-x-2">
                        <Select
                          value={user.publicMetadata.role || 'user'}
                          onValueChange={(value) =>
                            handleRoleChange(user.id, value)
                          }
                          disabled={isLoading}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Shopkeeper</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {currentUserRole === 'admin' && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden relative">
              {currentUserRole === 'admin' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={isLoading}
                  className="absolute top-2 right-2 h-8 w-8 p-1 hover:bg-red-100 hover:text-red-700 z-10"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex flex-col items-center mb-4">
                    <Avatar className="h-20 w-20 mb-2">
                      <AvatarImage src={user.imageUrl} />
                      <AvatarFallback className="text-lg">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium text-lg text-center">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground break-all text-center">
                      {getUserEmail(user)}
                    </p>
                  </div>

                  <div className="mb-4 flex justify-center">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.publicMetadata.role)}
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeColor(
                          user.publicMetadata.role
                        )}`}
                      >
                        {user.publicMetadata.role === 'admin'
                          ? 'Admin'
                          : 'Shopkeeper' }
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Select
                      value={user.publicMetadata.role || 'user'}
                      onValueChange={(value) =>
                        handleRoleChange(user.id, value)
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Change role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Shopkeeper</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}