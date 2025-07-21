'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { mutate: changePassword, isPending: isChangingPassword } =
    useMutation({
      mutationFn: async () => {
        const response = await fetch('/api/user/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to change password');
        }

        return response.json();
      },
      onSuccess: () => {
        toast.success('Your password has been successfully updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Could not change your password.');
      },
    });

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (!currentPassword) {
      toast.error('Current password is required.');
      return;
    }
    changePassword();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
        />
      </div>
      <Button
        onClick={handleChangePassword}
        disabled={isChangingPassword}
        className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white
      hover:bg-charcoal/90 transition-colors"
      >
        {isChangingPassword ? 'Changing...' : 'Change Password'}
      </Button>
    </div>
  );
}
