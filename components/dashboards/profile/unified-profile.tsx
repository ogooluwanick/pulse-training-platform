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
import { useToast } from "@/hooks/use-toast";
import { useUserProfile, useUpdateUserProfile, type UserProfileData, type UpdateUserProfilePayload } from "@/hooks/use-user-profile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UnifiedProfileData extends UserProfileData {
  image?: string;
  phone: string;
  bio: string;
  joinDate: string;
  company?: string;
  website?: string;
  department?: string;
  expertise?: string[];
  reviewerLevel?: string;
  submitterType?: "business" | "agency" | "";
  registrationNumber?: string;
  sector?: string;
  officeAddress?: string;
  state?: string;
  country?: string;
  businessDescription?: string;
  letterOfAuthorityUrl?: string | null;
  letterOfAuthorityPublicId?: string | null;
  totalAds?: number;
  approvedAds?: number;
  rejectedAds?: number;
  pendingAds?: number;
  totalReviews?: number;
  approvedReviews?: number;
  rejectedReviews?: number;
  avgReviewTimeMs?: number;
  avgReviewTimeDisplay?: string;
  accuracy?: number;
  recentActivities?: any[];
}

const initialUnifiedProfileData: UnifiedProfileData = {
  _id: "",
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  image: undefined,
  phone: "",
  bio: "",
  joinDate: "",
  company: "",
  website: "",
  department: "Quality Assurance", 
  expertise: [], 
  reviewerLevel: "Junior", 
  submitterType: "",
  registrationNumber: "",
  sector: "",
  officeAddress: "",
  state: "",
  country: "",
  businessDescription: "",
  totalAds: 0,
  approvedAds: 0,
  rejectedAds: 0,
  pendingAds: 0,
  totalReviews: 0,
  approvedReviews: 0,
  rejectedReviews: 0,
  avgReviewTimeMs: 0,
  avgReviewTimeDisplay: "0 minutes",
  accuracy: 0,
  recentActivities: [],
};

const businessSectors = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Education",
  "Real Estate",
  "Hospitality",
  "Agriculture",
  "Other",
];

export default function UnifiedProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<UnifiedProfileData>(initialUnifiedProfileData);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newlyUploadedImageUrl, setNewlyUploadedImageUrl] = useState<string | null>(null);
  const [newLetterOfAuthority, setNewLetterOfAuthority] = useState<{ file: File, url?: string, publicId?: string} | null>(null);
  const [isUploadingLoA, setIsUploadingLoA] = useState(false);


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

  useEffect(() => {
    if (fetchedProfileData) {
      setProfileData(prev => ({
        ...initialUnifiedProfileData,
        ...fetchedProfileData,
        role: fetchedProfileData.role || initialUnifiedProfileData.role,
        image: fetchedProfileData.profileImageUrl || initialUnifiedProfileData.image,
        phone: fetchedProfileData.phone || initialUnifiedProfileData.phone,
        bio: fetchedProfileData.bio || initialUnifiedProfileData.bio,
        joinDate: fetchedProfileData.joinDate || initialUnifiedProfileData.joinDate,
        company: fetchedProfileData.company || initialUnifiedProfileData.company,
        website: fetchedProfileData.website || initialUnifiedProfileData.website,
        submitterType: fetchedProfileData.submitterType || initialUnifiedProfileData.submitterType,
        registrationNumber: fetchedProfileData.registrationNumber || initialUnifiedProfileData.registrationNumber,
        sector: fetchedProfileData.sector || initialUnifiedProfileData.sector,
        officeAddress: fetchedProfileData.officeAddress || initialUnifiedProfileData.officeAddress,
        state: fetchedProfileData.state || initialUnifiedProfileData.state,
        country: fetchedProfileData.country || initialUnifiedProfileData.country,
        businessDescription: fetchedProfileData.businessDescription || initialUnifiedProfileData.businessDescription,
        department: fetchedProfileData.department || initialUnifiedProfileData.department,
        expertise: fetchedProfileData.expertise || initialUnifiedProfileData.expertise,
        letterOfAuthorityUrl: fetchedProfileData.letterOfAuthorityUrl || initialUnifiedProfileData.letterOfAuthorityUrl,
        letterOfAuthorityPublicId: fetchedProfileData.letterOfAuthorityPublicId || initialUnifiedProfileData.letterOfAuthorityPublicId,
      }));
      setNewlyUploadedImageUrl(null);
      setNewLetterOfAuthority(null);
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
      newLetterOfAuthorityUrl: newLetterOfAuthority?.url,
      newLetterOfAuthorityPublicId: newLetterOfAuthority?.publicId,
      currentLetterOfAuthorityPublicId: !newLetterOfAuthority && profileData.submitterType === 'agency' ? profileData.letterOfAuthorityPublicId : undefined,
    };

    if (profileData.role === "submitter") {
      payload = { 
        ...payload, 
        company: profileData.company,
        website: profileData.website,
        submitterType: profileData.submitterType,
        registrationNumber: profileData.registrationNumber,
        sector: profileData.submitterType === 'business' ? profileData.sector : undefined,
        officeAddress: profileData.submitterType === 'business' ? profileData.officeAddress : undefined,
        state: profileData.submitterType === 'business' ? profileData.state : undefined,
        country: profileData.submitterType === 'business' ? profileData.country : undefined,
        businessDescription: profileData.submitterType === 'business' ? profileData.businessDescription : undefined,
      };
    } else if (profileData.role === "reviewer") {
      payload = { 
        ...payload, 
        department: profileData.department,
        company: profileData.company,
        expertise: profileData.expertise || [] 
      };
    }

    updateProfile(payload, {
      onSuccess: (data) => {
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
        setIsEditing(false);
        setNewlyUploadedImageUrl(null);
        setNewLetterOfAuthority(null);
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
    setNewLetterOfAuthority(null);
    if (fetchedProfileData) {
       setProfileData(prev => ({
        ...initialUnifiedProfileData,
        ...fetchedProfileData,
        image: fetchedProfileData.profileImageUrl || initialUnifiedProfileData.image,
        role: fetchedProfileData.role || initialUnifiedProfileData.role,
        submitterType: fetchedProfileData.submitterType || initialUnifiedProfileData.submitterType,
        registrationNumber: fetchedProfileData.registrationNumber || initialUnifiedProfileData.registrationNumber,
        sector: fetchedProfileData.sector || initialUnifiedProfileData.sector,
        officeAddress: fetchedProfileData.officeAddress || initialUnifiedProfileData.officeAddress,
        state: fetchedProfileData.state || initialUnifiedProfileData.state,
        country: fetchedProfileData.country || initialUnifiedProfileData.country,
        businessDescription: fetchedProfileData.businessDescription || initialUnifiedProfileData.businessDescription,
        department: fetchedProfileData.department || initialUnifiedProfileData.department,
        expertise: fetchedProfileData.expertise || initialUnifiedProfileData.expertise,
      }));
    } else {
      setProfileData(initialUnifiedProfileData);
    }
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loaInputRef = useRef<HTMLInputElement>(null);

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleLoAUploadClick = () => {
    loaInputRef.current?.click();
  };

  const handleLoAFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid File Type", description: "Please upload PDF, DOC, DOCX, JPG, or PNG.", variant: "destructive" });
      if(event.target) event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Letter of Authority must be smaller than 5MB.", variant: "destructive" });
      if(event.target) event.target.value = "";
      return;
    }

    setNewLetterOfAuthority({ file });
    setIsUploadingLoA(true);

    const formData = new FormData();
    formData.append('letterOfAuthority', file);

    try {
      const response = await fetch('/api/user/upload-letter-of-authority', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Letter of Authority upload failed.');
      
      setNewLetterOfAuthority(prev => prev ? { ...prev, url: result.fileUrl, publicId: result.publicId } : null);
      setProfileData(prev => ({ ...prev, letterOfAuthorityUrl: result.fileUrl })); 
      toast({ title: "Letter of Authority Uploaded", description: "Ready to save. Click 'Save Changes' to finalize." });
    } catch (uploadError: any) {
      toast({ title: "LoA Upload Failed", description: uploadError.message || "Could not upload Letter of Authority.", variant: "destructive" });
      setNewLetterOfAuthority(null);
    } finally {
      setIsUploadingLoA(false);
      if(event.target) event.target.value = ""; 
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
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
  
  const getReviewerLevelColor = (level?: string) => {
    switch (level) {
      case "Lead": return "bg-indigo-100 text-indigo-800";
      case "Senior": return "bg-purple-100 text-purple-800";
      case "Mid-Level": return "bg-green-100 text-green-800";
      case "Junior": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        <p className="ml-4 text-lg">Loading profile...</p>
      </div>
    );
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
  
  const userRole = profileData.role?.toLowerCase();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <div className="mt-2 sm:mt-0">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="bg-green-600 hover:bg-green-700">Edit Profile</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelEdit} disabled={isUpdatingProfile || isUploadingImage}>Cancel</Button>
              <Button onClick={handleSave} disabled={isUpdatingProfile || isUploadingImage} className="bg-green-600 hover:bg-green-700">
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
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData.image} alt="Profile" />
                  <AvatarFallback className="text-lg">{getInitials(profileData.firstName, profileData.lastName)}</AvatarFallback>
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
              {userRole === 'reviewer' && profileData.reviewerLevel && (<Badge className={getReviewerLevelColor(profileData.reviewerLevel)}>{profileData.reviewerLevel} Reviewer</Badge>)}
              {userRole === 'submitter' && (<Badge variant="secondary">Submitter {profileData.submitterType && `(${profileData.submitterType.charAt(0).toUpperCase() + profileData.submitterType.slice(1)})`}</Badge>)}
              {!userRole && <Badge variant="outline">User</Badge>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-sm text-gray-600"><Mail className="h-4 w-4 mr-2" />{profileData.email}</div>
            <div className="flex items-center text-sm text-gray-600"><Calendar className="h-4 w-4 mr-2" />Joined {profileData.joinDate ? new Date(profileData.joinDate).toLocaleDateString() : "N/A"}</div>
            
            {userRole === 'reviewer' && (
              <>
                {profileData.accuracy !== undefined && (<div className="flex items-center text-sm text-gray-600"><Award className="h-4 w-4 mr-2" />{profileData.accuracy}% Accuracy Rate</div>)}
                {profileData.department && (<div className="flex items-center text-sm text-gray-600"><Briefcase className="h-4 w-4 mr-2" />{isEditing ? <Input value={profileData.department || ""} onChange={(e) => handleInputChange("department", e.target.value)} className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> : profileData.department}</div>)}
                {profileData.company && (<div className="flex items-center text-sm text-gray-600"><Briefcase className="h-4 w-4 mr-2" />Affiliated: {isEditing ? <Input value={profileData.company || ""} onChange={(e) => handleInputChange("company", e.target.value)} className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> : profileData.company}</div>)}
              </>
            )}

            {userRole === 'submitter' && (
              <>
                <div className="flex items-center text-sm text-gray-600"><Briefcase className="h-4 w-4 mr-2" />
                  {isEditing ? 
                    <Input value={profileData.company || ""} onChange={(e) => handleInputChange("company", e.target.value)} placeholder="Company Name" className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> 
                    : profileData.company || "Company Name N/A"}
                  {profileData.submitterType && <Badge variant="outline" className="ml-2">{profileData.submitterType.charAt(0).toUpperCase() + profileData.submitterType.slice(1)}</Badge>}
                </div>
                {profileData.registrationNumber && (<div className="flex items-center text-sm text-gray-600"><Award className="h-4 w-4 mr-2" />Reg No: {isEditing ? <Input value={profileData.registrationNumber || ""} onChange={(e) => handleInputChange("registrationNumber", e.target.value)} className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> : profileData.registrationNumber}</div>)}
                {profileData.website && (<div className="flex items-center text-sm text-gray-600"><LinkIcon className="h-4 w-4 mr-2" />{isEditing ? <Input value={profileData.website || ""} onChange={(e) => handleInputChange("website", e.target.value)} className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> : <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{profileData.website}</a>}</div>)}
                {profileData.submitterType === 'business' && (
                  <>
                    {profileData.sector && (<div className="flex items-center text-sm text-gray-600"><ChartBarStacked  className="h-4 w-4 mr-2" />Sector: {isEditing ? <Input value={profileData.sector || ""} onChange={(e) => handleInputChange("sector", e.target.value)} className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> : profileData.sector}</div>)}
                    {profileData.officeAddress && (<div className="flex items-center text-sm text-gray-600"><MapPin className="h-4 w-4 mr-2" />Address: {isEditing ? <Textarea value={profileData.officeAddress || ""} onChange={(e) => handleInputChange("officeAddress", e.target.value)} className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> : profileData.officeAddress}</div>)}
                    <div className="flex items-center text-sm text-gray-600">
                      <Earth className="h-4 w-4 mr-2" />
                      Address:
                      {isEditing ? (
                        <div className="flex ml-1 space-x-1 flex-grow">
                          <Input
                            value={profileData.state || ""}
                            onChange={(e) => handleInputChange("state", e.target.value)}
                            placeholder="State"
                            className="text-sm p-1 h-auto flex-1 min-w-0"
                            disabled={isUpdatingProfile || isUploadingImage}
                          />
                          <Input
                            value={profileData.country || ""}
                            onChange={(e) => handleInputChange("country", e.target.value)}
                            placeholder="Country"
                            className="text-sm p-1 h-auto flex-1 min-w-0"
                            disabled={isUpdatingProfile || isUploadingImage}
                          />
                        </div>
                      ) : (
                        <span className="ml-1">
                          {(profileData.state && profileData.country)
                            ? `${profileData.state}, ${profileData.country}`
                            : profileData.state
                            ? profileData.state
                            : profileData.country
                            ? profileData.country
                            : "Unknown"}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>Manage your personal and role-specific information.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" value={profileData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
              <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" value={profileData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={profileData.email} readOnly className="bg-gray-100 cursor-not-allowed" /></div>
              <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" value={profileData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
            </div>
            
            {userRole === 'reviewer' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="department">Department</Label><Input id="department" value={profileData.department || ""} onChange={(e) => handleInputChange("department", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
                  <div className="space-y-2"><Label htmlFor="companyReviewer">Affiliated Company (Optional)</Label><Input id="companyReviewer" value={profileData.company || ""} onChange={(e) => handleInputChange("company", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} placeholder="e.g. Partner Org Inc." /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="expertise">Areas of Expertise (comma-separated)</Label><Input id="expertise" value={profileData.expertise?.join(", ") || ""} onChange={(e) => handleInputChange("expertise", e.target.value.split(",").map(s => s.trim()))} disabled={!isEditing || isUpdatingProfile || isUploadingImage} placeholder="e.g. Finance, Healthcare Ads, E-commerce" /></div>
              </>
            )}

            {userRole === 'submitter' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="submitterType">Submitter Type</Label>
                    {isEditing ? (
                      <select id="submitterType" value={profileData.submitterType || ""} onChange={(e) => handleInputChange("submitterType", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="">Select Type</option>
                        <option value="business">Business</option>
                        <option value="agency">Agency</option>
                      </select>
                    ) : (
                      <Input value={profileData.submitterType ? profileData.submitterType.charAt(0).toUpperCase() + profileData.submitterType.slice(1) : "N/A"} readOnly className="bg-gray-100 cursor-not-allowed" />
                    )}
                  </div>
                  <div className="space-y-2"><Label htmlFor="companySubmitter">{profileData.submitterType === 'agency' ? 'Agency Name' : 'Business Name'}</Label><Input id="companySubmitter" value={profileData.company || ""} onChange={(e) => handleInputChange("company", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="registrationNumber">{profileData.submitterType === 'agency' ? 'Agency Reg. No.' : 'CAC Reg. No.'}</Label><Input id="registrationNumber" value={profileData.registrationNumber || ""} onChange={(e) => handleInputChange("registrationNumber", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
                  <div className="space-y-2"><Label htmlFor="website">Website</Label><Input id="website" value={profileData.website || ""} onChange={(e) => handleInputChange("website", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} placeholder="https://example.com" /></div>
                </div>

                {profileData.submitterType === 'business' && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sector">Sector</Label>
                        {isEditing ? (
                          <Select name="sector" onValueChange={(value) => handleInputChange("sector", value)} value={profileData.sector || ""} disabled={isUpdatingProfile || isUploadingImage}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a sector" />
                            </SelectTrigger>
                            <SelectContent>
                              {businessSectors.map((sector) => (
                                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input id="sector" value={profileData.sector || "N/A"} readOnly className="bg-gray-100 cursor-not-allowed" />
                        )}
                      </div>
                      <div className="space-y-2"><Label htmlFor="officeAddress">Office Address</Label><Input id="officeAddress" value={profileData.officeAddress || ""} onChange={(e) => handleInputChange("officeAddress", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2"><Label htmlFor="state">State</Label><Input id="state" value={profileData.state || ""} onChange={(e) => handleInputChange("state", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
                      <div className="space-y-2"><Label htmlFor="country">Country</Label><Input id="country" value={profileData.country || ""} onChange={(e) => handleInputChange("country", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="businessDescription">Business Description</Label><Textarea id="businessDescription" rows={3} value={profileData.businessDescription || ""} onChange={(e) => handleInputChange("businessDescription", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage || isUploadingLoA} placeholder="Describe your business..." /></div>
                  </>
                )}

                {profileData.submitterType === 'agency' && (
                  <div className="space-y-2">
                    <Label htmlFor="letterOfAuthority">Letter of Authority</Label>
                    {isEditing ? (
                      <div>
                        <input type="file" ref={loaInputRef} onChange={handleLoAFileChange} style={{ display: "none" }} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                        <Button variant="outline" onClick={handleLoAUploadClick} disabled={isUploadingLoA || isUpdatingProfile || isUploadingImage} className="mb-2">
                          {isUploadingLoA ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading LoA...</> : "Upload New LoA"}
                        </Button>
                        {newLetterOfAuthority?.file && <p className="text-sm text-gray-600 mt-1">New file selected: {newLetterOfAuthority.file.name} (Pending save)</p>}
                        {(!newLetterOfAuthority && profileData.letterOfAuthorityUrl) && (
                          <p className="text-sm text-gray-600 mt-1">
                            Current: <a href={profileData.letterOfAuthorityUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">View Document</a>
                          </p>
                        )}
                         {(!newLetterOfAuthority && !profileData.letterOfAuthorityUrl) && (
                            <p className="text-sm text-gray-500 mt-1">No document uploaded.</p>
                        )}
                      </div>
                    ) : (
                      profileData.letterOfAuthorityUrl ? (
                        <a href={profileData.letterOfAuthorityUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">
                          View Document
                        </a>
                      ) : (
                        <p className="text-sm text-gray-500">Not uploaded.</p>
                      )
                    )}
                  </div>
                )}
              </>
            )}
            <div className="space-y-2"><Label htmlFor="bio">Bio</Label><Textarea id="bio" rows={4} value={profileData.bio} onChange={(e) => handleInputChange("bio", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage || isUploadingLoA} placeholder={userRole === 'reviewer' ? "Tell us about your reviewing experience..." : "Tell us about yourself or your company..."} /></div>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
