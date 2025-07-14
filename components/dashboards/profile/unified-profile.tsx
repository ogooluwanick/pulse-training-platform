"use client"

import { useState, useEffect, useRef } from "react";
import { Camera, Mail, Calendar, MapPin, Award, AlertTriangle, Loader2, CheckCircle, XCircle, Briefcase, Link as LinkIcon, Clock, ChartBarStacked, Earth } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useUserProfile, useUpdateUserProfile, type UserProfileData, type UpdateUserProfilePayload } from "@/hooks/use-user-profile";
// Removed submitter and reviewer specific hooks
// import { useSubmitterDashboardStats } from "'hooks/use-submitter-dashboard-stats'";
// import { useReviewerProfileData, type ReviewerPerformanceStats, type RecentActivityItem } from "'hooks/use-reviewer-profile-data'";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { toast } from "@/components/ui/use-toast";
import FullPageLoader from "@/components/full-page-loader";

// Define a simplified interface for the refactored profile data
interface UnifiedProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "company" | "employee" | null; // Role can be 'admin', 'company', or 'employee'
  image?: string;
  phone: string;
  bio: string;
  joinDate: string;
  company?: string; // Generic field for company name or affiliation
  // Company specific fields
  submitterType?: "business" | "agency" | "";
  registrationNumber?: string;
  sector?: string;
  officeAddress?: string;
  state?: string;
  country?: string;
  businessDescription?: string;
  letterOfAuthorityUrl?: string | null;
  letterOfAuthorityPublicId?: string | null;
  // Employee specific fields
  department?: string;
  expertise?: string[];
}

const initialUnifiedProfileData: UnifiedProfileData = {
  _id: "",
  firstName: "",
  lastName: "",
  email: "",
  role: null,
  image: undefined,
  phone: "",
  bio: "",
  joinDate: "",
  company: "",
  // Company specific defaults
  submitterType: "",
  registrationNumber: "",
  sector: "",
  officeAddress: "",
  state: "",
  country: "",
  businessDescription: "",
  letterOfAuthorityUrl: null,
  letterOfAuthorityPublicId: null,
  // Employee specific defaults
  department: "Quality Assurance", 
  expertise: [], 
};

// Removed calculateReviewerLevel function

export default function UnifiedProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<UnifiedProfileData>(initialUnifiedProfileData);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newlyUploadedImageUrl, setNewlyUploadedImageUrl] = useState<string | null>(null);

  const {
    data: fetchedProfileData,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile
  } = useUserProfile();

  const {
    mutate: updateProfile,
    isPending: isUpdatingProfile
  } = useUpdateUserProfile();

  // Removed submitter and reviewer stats hooks
  // const { data: submitterStats, isLoading: isLoadingSubmitterStats, error: submitterStatsError, refetch: refetchSubmitterStats } = useSubmitterDashboardStats({ enabled: !!(profileData.role && profileData.role === 'submitter') });
  // const { data: reviewerProfileApiData, isLoading: isLoadingReviewerProfileData, error: reviewerProfileDataError, refetch: refetchReviewerProfileData } = useReviewerProfileData(fetchedProfileData?._id, { enabled: !!(fetchedProfileData?._id && profileData.role && profileData.role === 'reviewer') });

  useEffect(() => {
    if (fetchedProfileData) {
      // Map roles to the new structure
      const rawRole = fetchedProfileData.role?.toLowerCase() || null;
      let mappedRole: "admin" | "company" | "employee" | null = null;

      if (rawRole === "admin") {
          mappedRole = "admin";
      } else if (rawRole === "company") {
          mappedRole = "company";
      } else if (rawRole === "employee") {
          mappedRole = "employee";
      }

      setProfileData(prev => ({
        ...initialUnifiedProfileData,
        _id: fetchedProfileData._id || "",
        firstName: fetchedProfileData.firstName || "",
        lastName: fetchedProfileData.lastName || "",
        email: fetchedProfileData.email || "",
        role: mappedRole,
        image: fetchedProfileData.profileImageUrl || initialUnifiedProfileData.image,
        phone: fetchedProfileData.phone || "",
        bio: fetchedProfileData.bio || "",
        joinDate: fetchedProfileData.joinDate || "",
        company: fetchedProfileData.company || "", // Generic company field
        // Company specific fields
        submitterType: fetchedProfileData.submitterType || initialUnifiedProfileData.submitterType,
        registrationNumber: fetchedProfileData.registrationNumber || initialUnifiedProfileData.registrationNumber,
        sector: fetchedProfileData.sector || initialUnifiedProfileData.sector,
        officeAddress: fetchedProfileData.officeAddress || initialUnifiedProfileData.officeAddress,
        state: fetchedProfileData.state || initialUnifiedProfileData.state,
        country: fetchedProfileData.country || initialUnifiedProfileData.country,
        businessDescription: fetchedProfileData.businessDescription || initialUnifiedProfileData.businessDescription,
        letterOfAuthorityUrl: fetchedProfileData.letterOfAuthorityUrl || initialUnifiedProfileData.letterOfAuthorityUrl,
        letterOfAuthorityPublicId: fetchedProfileData.letterOfAuthorityPublicId || initialUnifiedProfileData.letterOfAuthorityPublicId,
        // Employee specific fields
        department: fetchedProfileData.department || initialUnifiedProfileData.department,
        expertise: fetchedProfileData.expertise || initialUnifiedProfileData.expertise,
      }));
      setNewlyUploadedImageUrl(null);
    }
  }, [fetchedProfileData]);

  const handleInputChange = (field: keyof UnifiedProfileData, value: string | number | string[]) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    let payload: UpdateUserProfilePayload = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phone: profileData.phone,
      bio: profileData.bio,
      profileImageUrl: newlyUploadedImageUrl || profileData.image,
      company: profileData.company, // Save company field
      // Add other common fields if they exist and are editable
    };

    // Add role-specific fields to payload
    if (profileData.role === "company") {
      payload = {
        ...payload,
        submitterType: profileData.submitterType,
        registrationNumber: profileData.registrationNumber,
        sector: profileData.sector,
        officeAddress: profileData.officeAddress,
        state: profileData.state,
        country: profileData.country,
        businessDescription: profileData.businessDescription,
        newLetterOfAuthorityUrl: profileData.letterOfAuthorityUrl, // Corrected property name
        newLetterOfAuthorityPublicId: profileData.letterOfAuthorityPublicId,
      };
    } else if (profileData.role === "employee") {
      payload = {
        ...payload,
        department: profileData.department,
        expertise: profileData.expertise,
      };
    }

    updateProfile(payload, {
      onSuccess: (data) => {
        toast({ title: "Profile Updated", description: data.message || "Your profile has been successfully updated." });
        setIsEditing(false);
        setNewlyUploadedImageUrl(null);
        refetchProfile(); 
      },
      onError: (error: Error) => {
        toast({ title: "Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
      }
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewlyUploadedImageUrl(null);
    if (fetchedProfileData) {
       const rawRole = fetchedProfileData.role?.toLowerCase() || null;
       let mappedRole: "admin" | "company" | "employee" | null = null;

       if (rawRole === "admin") {
           mappedRole = "admin";
       } else if (rawRole === "company") {
           mappedRole = "company";
       } else if (rawRole === "employee") {
           mappedRole = "employee";
       }

       setProfileData({
        _id: fetchedProfileData._id || "",
        firstName: fetchedProfileData.firstName || "",
        lastName: fetchedProfileData.lastName || "",
        email: fetchedProfileData.email || "",
        role: mappedRole,
        image: fetchedProfileData.profileImageUrl || initialUnifiedProfileData.image,
        phone: fetchedProfileData.phone || "",
        bio: fetchedProfileData.bio || "",
        joinDate: fetchedProfileData.joinDate || "",
        company: fetchedProfileData.company || "",
        // Company specific fields
        submitterType: fetchedProfileData.submitterType || initialUnifiedProfileData.submitterType,
        registrationNumber: fetchedProfileData.registrationNumber || initialUnifiedProfileData.registrationNumber,
        sector: fetchedProfileData.sector || initialUnifiedProfileData.sector,
        officeAddress: fetchedProfileData.officeAddress || initialUnifiedProfileData.officeAddress,
        state: fetchedProfileData.state || initialUnifiedProfileData.state,
        country: fetchedProfileData.country || initialUnifiedProfileData.country,
        businessDescription: fetchedProfileData.businessDescription || initialUnifiedProfileData.businessDescription,
        letterOfAuthorityUrl: fetchedProfileData.letterOfAuthorityUrl || initialUnifiedProfileData.letterOfAuthorityUrl,
        letterOfAuthorityPublicId: fetchedProfileData.letterOfAuthorityPublicId || initialUnifiedProfileData.letterOfAuthorityPublicId,
        // Employee specific fields
        department: fetchedProfileData.department || initialUnifiedProfileData.department,
        expertise: fetchedProfileData.expertise || initialUnifiedProfileData.expertise,
      });
    } else {
      setProfileData(initialUnifiedProfileData);
    }
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({ title: "File too large", description: "Please select an image smaller than 2MB.", variant: "destructive" });
      if(event.target) event.target.value = "";
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Only JPG, PNG, GIF, WEBP are allowed.", variant: "destructive" });
        if(event.target) event.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('profileImage', file);
    setIsUploadingImage(true);
    setNewlyUploadedImageUrl(null);

    try {
      // Assuming this endpoint handles image uploads and returns a URL
      const response = await fetch('/api/user/upload-profile-image', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Image upload failed.');
      
      setNewlyUploadedImageUrl(result.imageUrl);
      setProfileData((prev) => ({ ...prev, image: result.imageUrl }));
      toast({ title: "Image Uploaded", description: "Ready to save. Click 'Save Changes'." });
    } catch (uploadError: any) {
      toast({ title: "Upload Failed", description: uploadError.message || "Could not upload image.", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
      if(event.target) event.target.value = ""; 
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  // Removed getReviewerLevelColor

  if (isLoadingProfile) {
    return <FullPageLoader placeholder="profile" />;
  }

  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-600">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-lg">Error loading profile: {profileError.message}</p>
        <Button onClick={() => refetchProfile()} className="mt-4">Try Again</Button>
      </div>
    );
  }
  
  const userRole = profileData.role?.toLowerCase(); // Use the mapped role

  if (!userRole) { // Handle cases where role might be null or undefined after mapping
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p>User role not determined. Please log in again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <div className="mt-2 sm:mt-0">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors">Edit Profile</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelEdit} disabled={isUpdatingProfile || isUploadingImage}>Cancel</Button>
              <Button onClick={handleSave} disabled={isUpdatingProfile || isUploadingImage}  className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors">
                {isUpdatingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 
                 isUploadingImage ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : 
                 "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="h-24 w-24 bg-charcoal">
                  <AvatarImage src={profileData.image} alt="Profile" />
                  <AvatarFallback className="text-lg text-white">{getInitials(profileData.firstName, profileData.lastName)}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept="image/png, image/jpeg, image/gif, image/webp" />
                    <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full" onClick={handleImageUploadClick} disabled={isUploadingImage}>
                      <Camera className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <CardTitle className="capitalize">{profileData.firstName} {profileData.lastName}</CardTitle>
            <CardDescription>
              {userRole === 'admin' ? <Badge variant="outline">Admin</Badge> : userRole === 'company' ? <Badge variant="secondary">Company</Badge> : <Badge variant="secondary">Employee</Badge>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-sm text-gray-600"><Mail className="h-4 w-4 mr-2" />{profileData.email}</div>
            <div className="flex items-center text-sm text-gray-600"><Calendar className="h-4 w-4 mr-2" />Joined {profileData.joinDate ? new Date(profileData.joinDate).toLocaleDateString() : "N/A"}</div>
            {profileData.company && (
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase className="h-4 w-4 mr-2" />
                {isEditing ? 
                  <Input value={profileData.company || ""} onChange={(e) => handleInputChange("company", e.target.value)} className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} placeholder="Company Name" /> 
                  : profileData.company}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>Manage your personal information.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" value={profileData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
              <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" value={profileData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={profileData.email} readOnly className="bg-gray-100 cursor-not-allowed" /></div>
              <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" value={profileData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
            </div>
            
            {/* Common Bio */}
            <div className="space-y-2"><Label htmlFor="bio">Bio</Label><Textarea id="bio" rows={4} value={profileData.bio} onChange={(e) => handleInputChange("bio", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} placeholder="Tell us about yourself..." /></div>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
