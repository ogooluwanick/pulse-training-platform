'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Mail,
  Calendar,
  AlertTriangle,
  Loader2,
  Briefcase,
  MapPin,
  Award,
  Building,
  Info,
  Globe,
  GitGraph,
  LetterText,
} from 'lucide-react';
import moment from 'moment';
import { Country, State } from 'country-state-city';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  useUserProfile,
  type UpdateUserProfilePayload,
} from '@/hooks/use-user-profile';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import FullPageLoader from '@/components/full-page-loader';
import ProfileTabs from './profile-tabs';
import PersonalInformation from './personal-information';
import CompanyInformation from './company-information';
import SecuritySettings from './security-settings';
import { TabsContent } from '@/components/ui/tabs';

interface UnifiedProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'company' | 'employee' | null;
  image?: string;
  phone: string;
  bio: string;
  createdAt: string;
  company?: any;
  registrationNumber?: string;
  sector?: string;
  officeAddress?: string;
  state?: string;
  country?: string;
  businessDescription?: string;
  department?: string;
  expertise?: string[];
  jobTitle?: string;
  location?: string;
}

const initialUnifiedProfileData: UnifiedProfileData = {
  _id: '',
  firstName: '',
  lastName: '',
  email: '',
  role: null,
  image: undefined,
  phone: '',
  bio: '',
  createdAt: '',
  company: {},
  registrationNumber: '',
  sector: '',
  officeAddress: '',
  state: '',
  country: '',
  businessDescription: '',
  department: 'Quality Assurance',
  expertise: [],
  jobTitle: '',
  location: '',
};

// Removed calculateReviewerLevel function

export default function UnifiedProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<UnifiedProfileData>(
    initialUnifiedProfileData
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newlyUploadedImageUrl, setNewlyUploadedImageUrl] = useState<
    string | null
  >(null);

  const {
    data: fetchedProfileData,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useUserProfile();

  // Removed submitter and reviewer stats hooks
  // const { data: submitterStats, isLoading: isLoadingSubmitterStats, error: submitterStatsError, refetch: refetchSubmitterStats } = useSubmitterDashboardStats({ enabled: !!(profileData.role && profileData.role === 'submitter') });
  // const { data: reviewerProfileApiData, isLoading: isLoadingReviewerProfileData, error: reviewerProfileDataError, refetch: refetchReviewerProfileData } = useReviewerProfileData(fetchedProfileData?._id, { enabled: !!(fetchedProfileData?._id && profileData.role && profileData.role === 'reviewer') });

  useEffect(() => {
    if (fetchedProfileData) {
      // Map roles to the new structure
      const rawRole = fetchedProfileData.role?.toLowerCase() || null;
      let mappedRole: 'admin' | 'company' | 'employee' | null = null;

      if (rawRole === 'admin') {
        mappedRole = 'admin';
      } else if (rawRole === 'company') {
        mappedRole = 'company';
      } else if (rawRole === 'employee') {
        mappedRole = 'employee';
      }

      setProfileData((prev) => ({
        ...initialUnifiedProfileData,
        _id: fetchedProfileData._id || '',
        firstName: fetchedProfileData.firstName || '',
        lastName: fetchedProfileData.lastName || '',
        email: fetchedProfileData.email || '',
        role: mappedRole,
        image:
          fetchedProfileData.profileImageUrl || initialUnifiedProfileData.image,
        phone: fetchedProfileData.phone || '',
        bio: fetchedProfileData.bio || '',
        createdAt: fetchedProfileData.createdAt || '',
        company: fetchedProfileData.company || '', // Generic company field
        // Company specific fields
        registrationNumber:
          fetchedProfileData.registrationNumber ||
          initialUnifiedProfileData.registrationNumber,
        sector: fetchedProfileData.sector || initialUnifiedProfileData.sector,
        officeAddress:
          fetchedProfileData.officeAddress ||
          initialUnifiedProfileData.officeAddress,
        state: fetchedProfileData.state || initialUnifiedProfileData.state,
        country:
          fetchedProfileData.country || initialUnifiedProfileData.country,
        businessDescription:
          fetchedProfileData.businessDescription ||
          initialUnifiedProfileData.businessDescription,
        department:
          fetchedProfileData.department || initialUnifiedProfileData.department,
        expertise:
          fetchedProfileData.expertise || initialUnifiedProfileData.expertise,
        jobTitle:
          fetchedProfileData.jobTitle || initialUnifiedProfileData.jobTitle,
        location:
          fetchedProfileData.location || initialUnifiedProfileData.location,
      }));
      setNewlyUploadedImageUrl(null);
    }
  }, [fetchedProfileData]);

  const handleInputChange = (
    field: keyof UnifiedProfileData,
    value: string | number | string[]
  ) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: async (payload: UpdateUserProfilePayload) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success(
        data.message || 'Your profile has been successfully updated.'
      );
      setIsEditing(false);
      setNewlyUploadedImageUrl(null);
      refetchProfile();
      if (session && session.user) {
        updateSession({
          ...session,
          user: {
            ...session.user,
            firstName: variables.firstName,
            lastName: variables.lastName,
            profileImageUrl: variables.profileImageUrl,
          },
        });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Could not update profile.');
    },
  });

  const handleSave = () => {
    let payload: UpdateUserProfilePayload = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phone: profileData.phone,
      bio: profileData.bio,
      profileImageUrl: newlyUploadedImageUrl || profileData.image,
      company: profileData.company,
      jobTitle: profileData.jobTitle,
      location: profileData.location,
    };

    // Add role-specific fields to payload
    if (profileData.role === 'company') {
      payload = {
        ...payload,
        registrationNumber: profileData.registrationNumber,
        sector: profileData.sector,
        officeAddress: profileData.officeAddress,
        state: profileData.state,
        country: profileData.country,
        businessDescription: profileData.businessDescription,
      };
    } else if (profileData.role === 'employee') {
      payload = {
        ...payload,
        department: profileData.department,
        expertise: profileData.expertise,
      };
    }

    updateProfile(payload);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewlyUploadedImageUrl(null);
    if (fetchedProfileData) {
      const rawRole = fetchedProfileData.role?.toLowerCase() || null;
      let mappedRole: 'admin' | 'company' | 'employee' | null = null;

      if (rawRole === 'admin') {
        mappedRole = 'admin';
      } else if (rawRole === 'company') {
        mappedRole = 'company';
      } else if (rawRole === 'employee') {
        mappedRole = 'employee';
      }

      setProfileData({
        _id: fetchedProfileData._id || '',
        firstName: fetchedProfileData.firstName || '',
        lastName: fetchedProfileData.lastName || '',
        email: fetchedProfileData.email || '',
        role: mappedRole,
        image:
          fetchedProfileData.profileImageUrl || initialUnifiedProfileData.image,
        phone: fetchedProfileData.phone || '',
        bio: fetchedProfileData.bio || '',
        createdAt: fetchedProfileData.createdAt || '',
        company: fetchedProfileData.company || '',
        // Company specific fields
        registrationNumber:
          fetchedProfileData.registrationNumber ||
          initialUnifiedProfileData.registrationNumber,
        sector: fetchedProfileData.sector || initialUnifiedProfileData.sector,
        officeAddress:
          fetchedProfileData.officeAddress ||
          initialUnifiedProfileData.officeAddress,
        state: fetchedProfileData.state || initialUnifiedProfileData.state,
        country:
          fetchedProfileData.country || initialUnifiedProfileData.country,
        businessDescription:
          fetchedProfileData.businessDescription ||
          initialUnifiedProfileData.businessDescription,
        department:
          fetchedProfileData.department || initialUnifiedProfileData.department,
        expertise:
          fetchedProfileData.expertise || initialUnifiedProfileData.expertise,
        jobTitle:
          fetchedProfileData.jobTitle || initialUnifiedProfileData.jobTitle,
        location:
          fetchedProfileData.location || initialUnifiedProfileData.location,
      });
    } else {
      setProfileData(initialUnifiedProfileData);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit
      toast.error('File too large. Please select an image smaller than 2MB.');
      if (event.target) event.target.value = '';
      return;
    }
    if (
      !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
        file.type
      )
    ) {
      toast.error('Invalid File Type. Only JPG, PNG, GIF, WEBP are allowed.');
      if (event.target) event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('profileImage', file);
    uploadImageMutation.mutate(formData);
  };

  const uploadImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/user/upload-profile-image', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Image upload failed.');
      }
      return result;
    },
    onSuccess: (data) => {
      setNewlyUploadedImageUrl(data.imageUrl);
      setProfileData((prev) => ({ ...prev, image: data.imageUrl }));
      if (session && session.user) {
        updateSession({
          ...session,
          user: {
            ...session.user,
            profileImageUrl: data.imageUrl,
          },
        });
      }
      toast.success("Image Uploaded. Ready to save. Click 'Save Changes'.");
    },
    onError: (error: any) => {
      toast.error(error.message || 'Could not upload image.');
    },
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return '';
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
        <Button onClick={() => refetchProfile()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const userRole = profileData.role;

  if (!userRole) {
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
            <Button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
            >
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isUpdatingProfile || isUploadingImage}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUpdatingProfile || isUploadingImage}
                className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isUploadingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 min-h-[75vh]">
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="h-24 w-24 bg-charcoal">
                  <AvatarImage src={profileData.image} alt="Profile" />
                  <AvatarFallback className="text-3xl text-white">
                    {getInitials(profileData.firstName, profileData.lastName)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <>
                    <Button
                      size="icon"
                      variant="outline"
                      className="flex justify-center items-center absolute -bottom-2 -right-2 transform  z-10 bg-alabaster hover:bg-alabaster/90 text-charcoal shadow-soft-lg rounded-full  transition-soft border border-warm-gray/20"
                      onClick={handleImageUploadClick}
                      disabled={uploadImageMutation.isPending}
                    >
                      {uploadImageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className="relative  w-full h-full flex justify-center items-center">
                          <input
                            type="file"
                            ref={fileInputRef}
                              onChange={handleFileChange}
                              style={{display: 'none'}}
                            className="w-full h-full opacity-0 absolute top-0 left-0 cursor-pointer "
                            accept="image/png, image/jpeg, image/gif, image/webp"
                          />
                          <Camera className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
            <CardTitle className="capitalize max-w-[450px] leading-[1.2] tuncate">
              {profileData.firstName} {profileData.lastName}
            </CardTitle>
            <CardDescription>
              {userRole === 'admin' ? (
                <Badge variant="outline">Admin</Badge>
              ) : userRole === 'company' ? (
                <Badge variant="secondary">Company</Badge>
              ) : (
                <Badge variant="secondary">Employee</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              {profileData.email}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              Joined {moment(profileData.createdAt).format('MMMM D, YYYY')}
            </div>
            {userRole === 'company' && (
              <>
                {profileData.company?.companyName && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="h-4 w-4 mr-2" />
                    {profileData.company.companyName}
                  </div>
                )}
                {profileData.sector && (
                  <div className="flex items-center text-sm text-gray-600">
                    <GitGraph className="h-4 w-4 mr-2" />
                    {profileData.sector}
                  </div>
                )}
                {profileData.country && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="h-4 w-4 mr-2" />
                    {Country.getCountryByCode(profileData.country)?.name}{' '}
                    {profileData.state &&
                      `,${State.getStateByCode(profileData.state)?.name}`}
                  </div>
                )}
                {profileData.businessDescription && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Info className="h-4 w-4 mr-2" />
                    {profileData.businessDescription}
                  </div>
                )}
              </>
            )}
            {userRole === 'employee' && (
              <>
                {profileData.jobTitle && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2" />
                    {profileData.jobTitle}
                  </div>
                )}
                {profileData.department && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2" />
                    {profileData.department}
                  </div>
                )}
              </>
            )}
            {profileData.bio && (
              <div className="flex items-center text-sm text-gray-600">
                <LetterText className="h-4 w-4 mr-2" />
                {profileData.bio}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Manage your personal and company information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileTabs role={userRole}>
              <TabsContent value="personal" className="mt-4">
                <PersonalInformation
                  profileData={profileData}
                  isEditing={isEditing}
                  handleInputChange={
                    handleInputChange as (field: string, value: any) => void
                  }
                />
              </TabsContent>
              {userRole === 'company' && (
                <TabsContent value="company" className="mt-4">
                  <CompanyInformation
                    profileData={profileData}
                    isEditing={isEditing}
                    handleInputChange={
                      handleInputChange as (field: string, value: any) => void
                    }
                  />
                </TabsContent>
              )}
              <TabsContent value="security" className="mt-4">
                <SecuritySettings />
              </TabsContent>
            </ProfileTabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
