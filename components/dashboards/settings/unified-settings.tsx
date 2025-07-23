'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Lock,
  Download,
  Eye,
  EyeOff,
  Filter,
  Shield,
  Trash2,
  Users,
} from 'lucide-react'; // Added Users import
// Corrected import paths
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea'; // Added Textarea import
import toast from 'react-hot-toast';
import FullPageLoader from '@/components/full-page-loader';

export default function UnifiedSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const userRole = session?.user?.role;

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    systemUpdates: true, // Common for all roles
    newAdminRegistrations: true,
    reviewerActivityReports: true,
    submitterActivityReports: true,
    newEmployeeOnboarding: true,
    companyWideAnnouncements: false,
    courseReminders: true,
    performanceFeedback: true,
  });

  const [adminPreferences, setAdminPreferences] = useState({
    dashboardLayout: 'default',
    defaultUserView: 'all',
    auditLogRetentionDays: 90,
  });

  const [employeePreferences, setEmployeePreferences] = useState({
    department: 'Quality Assurance',
    expertise: [],
    reviewerLevel: 'Junior',
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    sessionTimeout: '4',
  });

  const {
    data: settingsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userSettings', session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/user/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      return response.json();
    },
    enabled: !!session,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (settingsData) {
      setNotifications((prev) => ({
        ...prev,
        ...(settingsData.notifications || {}),
      }));
      if (userRole === 'admin' && settingsData.adminPreferences) {
        setAdminPreferences(settingsData.adminPreferences);
      }
      if (userRole === 'employee' && settingsData.employeePreferences) {
        setEmployeePreferences(settingsData.employeePreferences);
      }
      if (settingsData.security) {
        setSecurity((prev) => ({
          ...prev,
          ...settingsData.security, // expects { twoFactorEnabled, sessionTimeout }
          sessionTimeout:
            settingsData.security.sessionTimeout?.toString() ||
            prev.sessionTimeout,
        }));
      }
    }
  }, [settingsData, userRole]);

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  const handleAdminPreferenceChange = (key: string, value: any) => {
    setAdminPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleEmployeePreferenceChange = (key: string, value: any) => {
    setEmployeePreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleSecurityChange = (key: string, value: string | boolean) => {
    setSecurity((prev) => ({ ...prev, [key]: value }));
  };

  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: async (updatedSettings: any) => {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Settings updated successfully!');
      queryClient.invalidateQueries({
        queryKey: ['userSettings', session?.user?.id],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Could not save settings.');
    },
  });

  const handleSaveSettings = () => {
    if (!userRole) return;

    const payload: any = {
      notifications,
      security: {
        twoFactorEnabled: security.twoFactorEnabled,
        sessionTimeout: Number(security.sessionTimeout),
      },
    };

    if (userRole === 'admin') {
      payload.adminPreferences = adminPreferences;
    } else if (userRole === 'employee') {
      payload.employeePreferences = employeePreferences;
    }

    saveSettings(payload);
  };

  const { mutate: changePassword, isPending: isChangingPassword } = useMutation(
    {
      mutationFn: async () => {
        const response = await fetch('/api/user/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: security.currentPassword,
            newPassword: security.newPassword,
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
        setSecurity((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      },
      onError: (error: any) => {
        toast.error(error.message || 'Could not change your password.');
      },
    }
  );

  const handleChangePassword = () => {
    if (security.newPassword !== security.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (security.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (!security.currentPassword) {
      toast.error('Current password is required.');
      return;
    }
    changePassword();
  };

  const { mutate: exportData, isPending: isExporting } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user/export-data');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export data');
      }
      return response;
    },
    onSuccess: async (response) => {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = `user_data_${userRole}.json`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (fileNameMatch && fileNameMatch.length === 2)
          fileName = fileNameMatch[1];
      }
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Your data has been downloaded.');
    },
    onError: (error: any) => {
      console.error('Error exporting data:', error);
      toast.error(error.message || 'Could not export your data.');
    },
  });

  if (isLoading || status === 'loading') {
    return <FullPageLoader placeholder="settings" />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-600">
          Manage your{' '}
          {userRole === 'employee'
            ? 'Employee'
            : userRole === 'company'
              ? 'Company'
              : 'Admin'}{' '}
          account settings and preferences
        </p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={notifications.emailNotifications}
                onCheckedChange={(c: boolean) =>
                  handleNotificationChange('emailNotifications', c)
                }
                className="!bg-charcoal"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <p className="text-sm text-gray-500">
                  Receive browser push notifications
                </p>
              </div>
              <Switch
                id="pushNotifications"
                checked={notifications.pushNotifications}
                onCheckedChange={(c: boolean) =>
                  handleNotificationChange('pushNotifications', c)
                }
                className="!bg-charcoal"
              />
            </div>
            <Separator />
            {/* Common system updates */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="systemUpdates">System Updates</Label>
                <p className="text-sm text-gray-500">
                  Platform updates and maintenance notifications
                </p>
              </div>
              <Switch
                id="systemUpdates"
                checked={notifications.systemUpdates}
                onCheckedChange={(c: boolean) =>
                  handleNotificationChange('systemUpdates', c)
                }
                className="!bg-charcoal"
              />
            </div>
            {/* Admin specific notifications */}
            {userRole === 'admin' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="newAdminRegistrations">
                      New Admin Registrations
                    </Label>
                    <p className="text-sm text-gray-500">
                      Notify when new admin accounts are registered
                    </p>
                  </div>
                  <Switch
                    id="newAdminRegistrations"
                    checked={notifications.newAdminRegistrations}
                    onCheckedChange={(c: boolean) =>
                      handleNotificationChange('newAdminRegistrations', c)
                    }
                    className="!bg-charcoal"
                    />
                </div>
                {/* Renaming reviewer/submitter activity reports to be more generic or specific to admin context */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reviewerActivityReports">
                      Reviewer Activity Reports
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive daily/weekly reports on reviewer activity
                    </p>
                  </div>
                  <Switch
                    id="reviewerActivityReports"
                    checked={notifications.reviewerActivityReports}
                    onCheckedChange={(c: boolean) =>
                      handleNotificationChange('reviewerActivityReports', c)
                    }
                    className="!bg-charcoal"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="submitterActivityReports">
                      Submitter Activity Reports
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive daily/weekly reports on submitter activity
                    </p>
                  </div>
                  <Switch
                    id="submitterActivityReports"
                    checked={notifications.submitterActivityReports}
                    onCheckedChange={(c: boolean) =>
                      handleNotificationChange('submitterActivityReports', c)
                    }
                    className="!bg-charcoal"
                  />
                </div>
              </>
            )}
            {/* Company specific notifications */}
            {userRole === 'company' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="newEmployeeOnboarding">
                      New Employee Onboarding
                    </Label>
                    <p className="text-sm text-gray-500">
                      Notify when new employees join
                    </p>
                  </div>
                  <Switch
                    id="newEmployeeOnboarding"
                    checked={notifications.newEmployeeOnboarding}
                    onCheckedChange={(c: boolean) =>
                      handleNotificationChange('newEmployeeOnboarding', c)
                    }
                    className="!bg-charcoal"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="companyWideAnnouncements">
                      Company-Wide Announcements
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive important company announcements
                    </p>
                  </div>
                  <Switch
                    id="companyWideAnnouncements"
                    checked={notifications.companyWideAnnouncements}
                    onCheckedChange={(c: boolean) =>
                      handleNotificationChange('companyWideAnnouncements', c)
                    }
                    className="!bg-charcoal"
                  />
                </div>
              </>
            )}
            {/* Employee specific notifications */}
            {userRole === 'employee' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="courseReminders">Course Reminders</Label>
                    <p className="text-sm text-gray-500">
                      Reminders for upcoming course deadlines
                    </p>
                  </div>
                  <Switch
                    id="courseReminders"
                    checked={notifications.courseReminders}
                    onCheckedChange={(c: boolean) =>
                      handleNotificationChange('courseReminders', c)
                    }
                    className="!bg-charcoal"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="performanceFeedback">
                      Performance Feedback
                    </Label>
                    <p className="text-sm text-gray-500">
                      Notifications about performance reviews or feedback
                    </p>
                  </div>
                  <Switch
                    id="performanceFeedback"
                    checked={notifications.performanceFeedback}
                    onCheckedChange={(c: boolean) =>
                      handleNotificationChange('performanceFeedback', c)
                    }
                    className="!bg-charcoal"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Specific Settings */}
      {userRole === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Admin Preferences
            </CardTitle>
            <CardDescription>
              Customize your admin dashboard and reporting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dashboardLayout">Dashboard Layout</Label>
                <Select
                  value={adminPreferences.dashboardLayout}
                  onValueChange={(v) =>
                    handleAdminPreferenceChange('dashboardLayout', v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Layout</SelectItem>
                    <SelectItem value="compact">Compact Layout</SelectItem>
                    <SelectItem value="custom">Custom Layout</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Choose the default layout for your admin dashboard.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultUserView">Default User View</Label>
                <Select
                  value={adminPreferences.defaultUserView}
                  onValueChange={(v) =>
                    handleAdminPreferenceChange('defaultUserView', v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="employees">
                      Company Employees
                    </SelectItem>{' '}
                    {/* Updated */}
                    <SelectItem value="companies">Companies</SelectItem>{' '}
                    {/* Added */}
                    <SelectItem value="admins">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Set the default view when managing users.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="auditLogRetentionDays">
                  Audit Log Retention (Days):{' '}
                  {adminPreferences.auditLogRetentionDays}
                </Label>
                <Slider
                  value={[adminPreferences.auditLogRetentionDays]}
                  onValueChange={(v) =>
                    handleAdminPreferenceChange('auditLogRetentionDays', v[0])
                  }
                  max={365}
                  min={30}
                  step={30}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  Number of days to retain audit logs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your account security and password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={security.currentPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleSecurityChange('currentPassword', e.target.value)
                  }
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={security.newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleSecurityChange('newPassword', e.target.value)
                  }
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={security.confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleSecurityChange('confirmPassword', e.target.value)
                  }
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              onClick={handleChangePassword}
              variant="outline"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>

            {/* Session Timeout - Common for all roles */}
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout</Label>
                <Select
                  value={security.sessionTimeout}
                  onValueChange={(v) =>
                    handleSecurityChange('sessionTimeout', v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeout duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="8">8 hours</SelectItem>
                    <SelectItem value="24">24 hours (1 day)</SelectItem>
                    <SelectItem value="168">168 hours (7 days)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Automatically log out after a period of inactivity.
                </p>
              </div>
            </>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Data Management
          </CardTitle>
          <CardDescription>Export your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Export Data</Label>
                <p className="text-sm text-gray-500">
                  Download a copy of all your data.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => exportData()}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}
