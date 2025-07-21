'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PersonalInformationProps {
  profileData: any;
  isEditing: boolean;
  handleInputChange: (field: string, value: any) => void;
}

export default function PersonalInformation({
  profileData,
  isEditing,
  handleInputChange,
}: PersonalInformationProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={profileData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            disabled={!isEditing}
            className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={profileData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            disabled={!isEditing}
            className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={profileData.email}
            readOnly
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <PhoneInput
            id="phone"
            value={profileData.phone}
            onChange={(value) => handleInputChange('phone', value)}
            disabled={!isEditing}
            inputComponent={Input}
            className="input bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={4}
          value={profileData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          disabled={!isEditing}
          placeholder="Tell us about yourself..."
          className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Job Title</Label>
          <Input
            id="jobTitle"
            value={profileData.jobTitle}
            onChange={(e) => handleInputChange('jobTitle', e.target.value)}
            disabled={!isEditing}
            className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={profileData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            disabled={!isEditing}
            className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
          />
        </div>
      </div>
    </div>
  );
}
