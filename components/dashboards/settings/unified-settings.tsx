"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Bell, Lock, Download, Eye, EyeOff, Filter, Shield, Trash2, Users } from "lucide-react" // Added Users import
// Corrected import paths
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea" // Added Textarea import

export default function UnifiedSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  // Map roles to the new structure: 'submitter' and 'reviewer' become 'COMPANY EMPLOYEE'
  // Now mapping to 'admin', 'company', 'employee'
  console.log("session?.user?.role", session?.user?.role);
  const rawRole = session?.user?.role?.toLowerCase() || null;
  let userRole: "admin" | "company" | "employee" | null = null;

  if (rawRole === "admin") {
      userRole = "admin";
  } else if (rawRole === "company") {
      userRole = "company";
  } else if (rawRole === "employee") {
      userRole = "employee";
  }

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Unified Notifications State - Simplified for new roles
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    systemUpdates: true, // Common for all roles

    // Admin specific notifications
    newAdminRegistrations: true,
    reviewerActivityReports: true, // These might be renamed or removed depending on new structure
    submitterActivityReports: true, // These might be renamed or removed depending on new structure

    // Company specific notifications (example)
    newEmployeeOnboarding: true,
    companyWideAnnouncements: false,

    // Employee specific notifications (example)
    courseReminders: true,
    performanceFeedback: true,
  });

  // Admin Specific State
  const [adminPreferences, setAdminPreferences] = useState({
    dashboardLayout: "default",
    defaultUserView: "all",
    auditLogRetentionDays: 90,
  });

  // Company Specific State (derived from previous submitter/reviewer fields)
  const [companyPreferences, setCompanyPreferences] = useState({
    companyName: "", // Added companyName
    submitterType: "", // business | agency
    registrationNumber: "",
    sector: "",
    officeAddress: "",
    state: "",
    country: "",
    businessDescription: "",
    letterOfAuthorityUrl: null,
    letterOfAuthorityPublicId: null,
  });

  // Employee Specific State (derived from previous reviewer fields)
  const [employeePreferences, setEmployeePreferences] = useState({
    department: "Quality Assurance", 
    expertise: [], 
    reviewerLevel: "Junior", // This might need renaming or removal if not applicable to general employees
  });

  // Common Security State
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false, // Default, can be fetched if API supports
    sessionTimeout: "4", // Default session timeout, will be fetched
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !userRole) {
      // router.push("/login"); // Redirect if not authenticated or role not found
      return;
    }

    const fetchSettings = async () => {
      setIsLoading(true);

      let apiUrl = "";
      if (userRole === "employee") {
        apiUrl = "/api/employee/settings"; // New endpoint for employees
      } else if (userRole === "company") {
        apiUrl = "/api/company/settings"; // New endpoint for companies
      } else if (userRole === "admin") {
        apiUrl = "/api/admin/settings";
      } else {
        console.warn(`Unknown or null user role: ${userRole}. Redirecting to login.`);
        // router.push("/login");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl);
        let data: any = {}; 

        if (response.ok) {
          data = await response.json();
        } else {
          if (response.status === 404) {
            console.warn(`No settings found for ${userRole}. Using default settings.`);
          } else {
            throw new Error("Failed to fetch settings: " + response.statusText);
          }
        }
        
        // Apply fetched settings, falling back to initial state if keys are missing
        setNotifications(prev => ({ ...prev, ...(data.notifications || {}) }));
        
        if (userRole === "admin") {
          setAdminPreferences(prev => ({ ...prev, ...(data.adminPreferences || {}) }));
        } else if (userRole === "company") {
          setCompanyPreferences(prev => ({ ...prev, ...(data.companyPreferences || {}) }));
        } else if (userRole === "employee") {
          setEmployeePreferences(prev => ({ ...prev, ...(data.employeePreferences || {}) }));
        }
        
        // Fetch common security settings, including sessionTimeout
        setSecurity(prev => ({...prev, sessionTimeout: data.security?.sessionTimeout || prev.sessionTimeout}));
        // If API structure changes, ensure sessionTimeout is correctly mapped.
        // For example, if it was previously nested differently:
        // if (data.security && data.security.sessionTimeout) {
        //     setSecurity(prev => ({...prev, sessionTimeout: data.security.sessionTimeout}));
        // }

      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Could not load your settings. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [session, status, userRole, router]);

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };
  
  const handleAdminPreferenceChange = (key: string, value: any) => {
    setAdminPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleCompanyPreferenceChange = (key: string, value: any) => {
    setCompanyPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleEmployeePreferenceChange = (key: string, value: any) => {
    setEmployeePreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleSecurityChange = (key: string, value: string | boolean) => {
    setSecurity((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    if (!userRole) return;
    setIsSaving(true);
    let apiUrl = "";
    let payload: any = { 
      notifications,
      security: { sessionTimeout: security.sessionTimeout } // Include session timeout for all roles
    };

    if (userRole === "employee") {
      apiUrl = "/api/employee/settings"; // Endpoint for employees
      payload.employeePreferences = employeePreferences;
    } else if (userRole === "company") {
      apiUrl = "/api/company/settings"; // Endpoint for companies
      payload.companyPreferences = companyPreferences;
    } else if (userRole === "admin") {
      apiUrl = "/api/admin/settings";
      payload.adminPreferences = adminPreferences;
    } else {
      console.error("Attempted to save settings for unknown role:", userRole);
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save settings");
      }

      toast({
        title: "Settings Saved",
        description: "Your settings have been successfully updated.",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: error.message || "Could not save your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" })
      return
    }
    if (security.newPassword.length < 8) {
      toast({ title: "Error", description: "New password must be at least 8 characters long.", variant: "destructive" })
      return
    }
    if (!security.currentPassword) {
      toast({ title: "Error", description: "Current password is required.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword: security.newPassword,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Failed to change password")
      toast({ title: "Password Changed", description: "Your password has been successfully updated." })
      setSecurity((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }))
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast({ title: "Error", description: error.message || "Could not change your password.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  // Export Data is common for all roles
  const handleExportData = async () => {
    setIsSaving(true)
    try {
      // Assuming a common export endpoint or one that handles role-specific data
      const response = await fetch("/api/user/export-data") 
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to export data")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = `user_data_${userRole}.json`; // Use mapped role
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
      }
      a.download = fileName;
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast({ title: "Data Exported", description: "Your data has been downloaded." })
    } catch (error: any) {
      console.error("Error exporting data:", error)
      toast({ title: "Export Error", description: error.message || "Could not export your data.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  // Delete Account is removed as it was submitter-specific and not applicable to COMPANY_EMPLOYEE or ADMIN

  if (isLoading || status === "loading") {
    return <div className="flex justify-center items-center h-64"><p>Loading settings...</p></div>
  }

  // if (status === "unauthenticated" || !userRole) { // Also redirect if role is null/undefined
  //   router.push("/login");
  //   return <div className="flex justify-center items-center h-64"><p>Redirecting to login...</p></div>;
  // }


  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-600">Manage your {userRole === "employee" ? "Employee" : userRole === "company" ? "Company" : "Admin"} account settings and preferences</p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Bell className="h-5 w-5 mr-2" />Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><Label htmlFor="emailNotifications">Email Notifications</Label><p className="text-sm text-gray-500">Receive notifications via email</p></div>
              <Switch id="emailNotifications" checked={notifications.emailNotifications} onCheckedChange={(c: boolean) => handleNotificationChange("emailNotifications", c)} className="!bg-charcoal" />
            </div>
            <div className="flex items-center justify-between">
              <div><Label htmlFor="pushNotifications">Push Notifications</Label><p className="text-sm text-gray-500">Receive browser push notifications</p></div>
              <Switch id="pushNotifications" checked={notifications.pushNotifications} onCheckedChange={(c: boolean) => handleNotificationChange("pushNotifications", c)} className="!bg-charcoal" />
            </div>
            <Separator />
            {/* Common system updates */}
             <div className="flex items-center justify-between">
              <div><Label htmlFor="systemUpdates">System Updates</Label><p className="text-sm text-gray-500">Platform updates and maintenance notifications</p></div>
              <Switch id="systemUpdates" checked={notifications.systemUpdates} onCheckedChange={(c: boolean) => handleNotificationChange("systemUpdates", c)} className="!bg-charcoal" />
            </div>
            {/* Admin specific notifications */}
            {userRole === "admin" && (
              <>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="newAdminRegistrations">New Admin Registrations</Label><p className="text-sm text-gray-500">Notify when new admin accounts are registered</p></div>
                  <Switch id="newAdminRegistrations" checked={notifications.newAdminRegistrations} onCheckedChange={(c: boolean) => handleNotificationChange("newAdminRegistrations", c)} className="!bg-charcoal" />
                </div>
                {/* Renaming reviewer/submitter activity reports to be more generic or specific to admin context */}
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="reviewerActivityReports">Reviewer Activity Reports</Label><p className="text-sm text-gray-500">Receive daily/weekly reports on reviewer activity</p></div>
                  <Switch id="reviewerActivityReports" checked={notifications.reviewerActivityReports} onCheckedChange={(c: boolean) => handleNotificationChange("reviewerActivityReports", c)} className="!bg-charcoal" />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="submitterActivityReports">Submitter Activity Reports</Label><p className="text-sm text-gray-500">Receive daily/weekly reports on submitter activity</p></div>
                  <Switch id="submitterActivityReports" checked={notifications.submitterActivityReports} onCheckedChange={(c: boolean) => handleNotificationChange("submitterActivityReports", c)} className="!bg-charcoal" />
                </div>
              </>
            )}
            {/* Company specific notifications */}
            {userRole === "company" && (
              <>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="newEmployeeOnboarding">New Employee Onboarding</Label><p className="text-sm text-gray-500">Notify when new employees join</p></div>
                  <Switch id="newEmployeeOnboarding" checked={notifications.newEmployeeOnboarding} onCheckedChange={(c: boolean) => handleNotificationChange("newEmployeeOnboarding", c)} className="!bg-charcoal" />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="companyWideAnnouncements">Company-Wide Announcements</Label><p className="text-sm text-gray-500">Receive important company announcements</p></div>
                  <Switch id="companyWideAnnouncements" checked={notifications.companyWideAnnouncements} onCheckedChange={(c: boolean) => handleNotificationChange("companyWideAnnouncements", c)} className="!bg-charcoal" />
                </div>
              </>
            )}
            {/* Employee specific notifications */}
            {userRole === "employee" && (
              <>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="courseReminders">Course Reminders</Label><p className="text-sm text-gray-500">Reminders for upcoming course deadlines</p></div>
                  <Switch id="courseReminders" checked={notifications.courseReminders} onCheckedChange={(c: boolean) => handleNotificationChange("courseReminders", c)} className="!bg-charcoal" />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="performanceFeedback">Performance Feedback</Label><p className="text-sm text-gray-500">Notifications about performance reviews or feedback</p></div>
                  <Switch id="performanceFeedback" checked={notifications.performanceFeedback} onCheckedChange={(c: boolean) => handleNotificationChange("performanceFeedback", c)} className="!bg-charcoal" />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Specific Settings */}
      {userRole === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Filter className="h-5 w-5 mr-2" />Admin Preferences</CardTitle>
            <CardDescription>Customize your admin dashboard and reporting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dashboardLayout">Dashboard Layout</Label>
                <Select value={adminPreferences.dashboardLayout} onValueChange={(v) => handleAdminPreferenceChange("dashboardLayout", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Layout</SelectItem>
                    <SelectItem value="compact">Compact Layout</SelectItem>
                    <SelectItem value="custom">Custom Layout</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Choose the default layout for your admin dashboard.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultUserView">Default User View</Label>
                <Select value={adminPreferences.defaultUserView} onValueChange={(v) => handleAdminPreferenceChange("defaultUserView", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="employees">Company Employees</SelectItem> {/* Updated */}
                    <SelectItem value="companies">Companies</SelectItem> {/* Added */}
                    <SelectItem value="admins">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Set the default view when managing users.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="auditLogRetentionDays">Audit Log Retention (Days): {adminPreferences.auditLogRetentionDays}</Label>
                <Slider value={[adminPreferences.auditLogRetentionDays]} onValueChange={(v) => handleAdminPreferenceChange("auditLogRetentionDays", v[0])} max={365} min={30} step={30} className="w-full" />
                <p className="text-sm text-gray-500">Number of days to retain audit logs.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Specific Settings */}
      {userRole === "company" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Shield className="h-5 w-5 mr-2" />Company Settings</CardTitle>
            <CardDescription>Manage your company's profile and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="submitterType">Company Type</Label>
                <Select value={companyPreferences.submitterType} onValueChange={(v) => handleCompanyPreferenceChange("submitterType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Company Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" value={companyPreferences.companyName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyPreferenceChange("companyName", e.target.value)} placeholder="Enter Company Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input id="registrationNumber" value={companyPreferences.registrationNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyPreferenceChange("registrationNumber", e.target.value)} placeholder="Enter Registration Number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Select name="sector" onValueChange={(value) => handleCompanyPreferenceChange("sector", value)} value={companyPreferences.sector || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Assuming businessSectors is defined elsewhere or needs to be added */}
                    {["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Education", "Real Estate", "Hospitality", "Agriculture", "Other"].map((sector) => (
                      <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="officeAddress">Office Address</Label>
                <Input id="officeAddress" value={companyPreferences.officeAddress} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyPreferenceChange("officeAddress", e.target.value)} placeholder="Enter Office Address" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={companyPreferences.state} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyPreferenceChange("state", e.target.value)} placeholder="Enter State" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={companyPreferences.country} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyPreferenceChange("country", e.target.value)} placeholder="Enter Country" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea id="businessDescription" rows={3} value={companyPreferences.businessDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleCompanyPreferenceChange("businessDescription", e.target.value)} placeholder="Describe your business..." />
              </div>
              {/* Letter of Authority for Agency */}
              {companyPreferences.submitterType === 'agency' && (
                <div className="space-y-2">
                  <Label htmlFor="letterOfAuthority">Letter of Authority</Label>
                  {/* Placeholder for upload logic */}
                  <p className="text-sm text-gray-500">Upload Letter of Authority (PDF, DOCX, JPG, PNG)</p>
                  <Button variant="outline" className="bg-transparent border-warm-gray/30">Upload File</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Specific Settings */}
      {userRole === "employee" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="h-5 w-5 mr-2" />Employee Settings</CardTitle>
            <CardDescription>Customize your employee preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={employeePreferences.department} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEmployeePreferenceChange("department", e.target.value)} placeholder="Enter your department" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expertise">Areas of Expertise (comma-separated)</Label>
                <Input
                  id="expertise"
                  value={employeePreferences.expertise?.join(", ") || ""}
                  onChange={(e) => handleEmployeePreferenceChange("expertise", e.target.value.split(",").map((s: string) => s.trim()))}
                  placeholder="e.g. React, Node.js, UI/UX"
                />
              </div>
              {/* This might be specific to certain employee types or removed */}
              <div className="space-y-2">
                <Label htmlFor="reviewerLevel">Your Level</Label>
                <Select value={employeePreferences.reviewerLevel} onValueChange={(v) => handleEmployeePreferenceChange("reviewerLevel", v)}>
                  <SelectTrigger><SelectValue placeholder="Select your level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Lock className="h-5 w-5 mr-2" />Security Settings</CardTitle>
          <CardDescription>Manage your account security and password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input id="currentPassword" type={showCurrentPassword ? "text" : "password"} value={security.currentPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSecurityChange("currentPassword", e.target.value)} placeholder="Enter current password" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>{showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input id="newPassword" type={showNewPassword ? "text" : "password"} value={security.newPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSecurityChange("newPassword", e.target.value)} placeholder="Enter new password" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={security.confirmPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSecurityChange("confirmPassword", e.target.value)} placeholder="Confirm new password" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              </div>
            </div>
            <Button onClick={handleChangePassword} variant="outline" disabled={isSaving && !!security.currentPassword}>{isSaving && !!security.currentPassword ? "Changing..." : "Change Password"}</Button>
            
            {/* Session Timeout - Common for all roles */}
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout</Label>
                <Select value={security.sessionTimeout} onValueChange={(v) => handleSecurityChange("sessionTimeout", v)}>
                  <SelectTrigger><SelectValue placeholder="Select timeout duration" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="8">8 hours</SelectItem>
                    <SelectItem value="24">24 hours (1 day)</SelectItem>
                    <SelectItem value="168">168 hours (7 days)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Automatically log out after a period of inactivity.</p>
              </div>
            </>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Download className="h-5 w-5 mr-2" />Data Management</CardTitle>
          <CardDescription>Export your data</CardDescription> {/* Removed submitter-specific part */}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><Label>Export Data</Label><p className="text-sm text-gray-500">Download a copy of all your data</p></div>
              <Button variant="outline" onClick={handleExportData} disabled={isSaving}><Download className="h-4 w-4 mr-2" />Export</Button>
            </div>
            {/* Removed Delete Account button */}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isSaving} className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors">
          {isSaving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  )
}
