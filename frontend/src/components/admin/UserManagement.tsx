import React, { useState } from 'react';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { Plus, Edit, Trash2, User as UserIcon, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/appStore';

interface UserManagementProps {
  currentUserId?: string;
}

interface UserFormData {
  username: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'Cashier';
  password: string;
  profileImage?: string;
}

export const UserManagement: React.FC = () => { 
  const { user: currentUser } = useAppStore();  
  const currentUserId = currentUser?.id || ''; 
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<(User & { profileImage?: string }) | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{open: boolean, userId: string}>({open: false, userId: ''});
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    fullName: '',
    email: '',
    role: 'Cashier',
    password: '',
    profileImage: ''
  });

  const queryClient = useQueryClient();

  // Fetch users from backend
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.getUsers(),
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: { userData: UserFormData, profileImage?: File }) => 
      apiService.createUser(data.userData, data.profileImage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create user');
    }
  });

  // Update user mutation - FIXED: Update current user in store if it's the same user
  const updateUserMutation = useMutation({
    mutationFn: (data: { id: string, userData: UserFormData, profileImage?: File }) => 
      apiService.updateUser(data.id, data.userData, data.profileImage),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Update current user in store if it's the same user
      const { user, setUser } = useAppStore.getState();
      if (user && user.id === updatedUser.id) {
        setUser(updatedUser);
      }
      
      toast.success('User updated successfully');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user');
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
      setDeleteConfirm({open: false, userId: ''});
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userData = {
        ...formData,
        password: editingUser ? (formData.password || undefined) : formData.password,
        profileImage: profileImageFile ? undefined : formData.profileImage
      };
      
      if (editingUser) {
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          userData,
          profileImage: profileImageFile || undefined
        });
      } else {
        await createUserMutation.mutateAsync({
          userData,
          profileImage: profileImageFile || undefined
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Operation failed');
    }
  };

  const handleEdit = (user: User & { profileImage?: string }) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      email: user.email || '',
      role: user.role,
      password: '',
      profileImage: user.profileImage || ''
    });
    setProfileImageFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      fullName: '',
      email: '',
      role: 'Cashier',
      password: '',
      profileImage: ''
    });
    setEditingUser(null);
    setProfileImageFile(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage staff accounts and permissions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <ImageUpload
                value={formData.profileImage}
                onChange={(value, file) => {
                  setFormData({...formData, profileImage: value});
                  setProfileImageFile(file || null);
                }}
                label="Profile Picture (Optional)"
                accept="image/*"
                maxSize={2}
              />     
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value: 'Admin' | 'Cashier') => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cashier">Cashier</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="password">Password {editingUser && '(leave empty to keep current)'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={!editingUser}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                  {editingUser ? 'Update' : 'Create'} User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {users.map((user: User & { profileImage?: string }) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{user.fullName}</h3>
                    <p className="text-sm text-gray-600">@{user.username} • {user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={user.role === 'Admin' ? 'default' : 'secondary'}
                    className={user.role === 'Admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                  >
                    {user.role === 'Admin' && <Shield className="h-3 w-3 mr-1" />}
                    {user.role}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    {currentUserId && user.id !== currentUserId && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeleteConfirm({open: true, userId: user.id})}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({open, userId: ''})}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone and will affect shift tracking and sales history."
        confirmText="Delete"
        onConfirm={() => handleDelete(deleteConfirm.userId)}
        variant="destructive"
      />
    </div>
  );
};