import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface UserProfileData {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  company?: string;
  bio?: string;
  website?: string;
  createdAt?: string;
  profileImageUrl?: string;
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

export interface PublicProfileViewData {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  role: string;
  bio?: string;
  createdAt?: string;
  image?: string;
  company?: string;
  website?: string;
  registrationNumber?: string;
  sector?: string;
  officeAddress?: string;
  state?: string;
  country?: string;
  businessDescription?: string;
  department?: string;
  reviewerLevel?: string;
  expertise?: string[];
  accuracy?: number;
  profileVisibility?: 'public' | 'private' | 'reviewers-only';
  totalAds?: number;
  approvedAds?: number;
  pendingAds?: number;
  rejectedAds?: number;
  email?: string;
}

const fetchUserProfile = async (): Promise<UserProfileData> => {
  const { data } = await axios.get<UserProfileData>('/api/user/profile');
  return data;
};

export const useUserProfile = () => {
  return useQuery<UserProfileData, Error>({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
  });
};

const fetchPublicUserProfileById = async (
  userId: string
): Promise<PublicProfileViewData> => {
  if (!userId) throw new Error('User ID is required to fetch public profile.');
  const { data } = await axios.get<PublicProfileViewData>(
    `/api/user/profile/${userId}`
  );
  return data;
};

export const usePublicUserProfile = (userId: string | null | undefined) => {
  return useQuery<PublicProfileViewData, Error>({
    queryKey: ['publicUserProfile', userId],
    queryFn: () => {
      if (!userId) {
        return Promise.reject(
          new Error('User ID not provided for public profile fetch.')
        );
      }
      return fetchPublicUserProfileById(userId);
    },
    enabled: !!userId,
  });
};

export interface UpdateUserProfilePayload {
  profileImageUrl?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  bio?: string;
  website?: string;
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
