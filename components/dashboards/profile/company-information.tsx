"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Country, State } from "country-state-city"

interface CompanyInformationProps {
  profileData: any
  isEditing: boolean
  handleInputChange: (field: string, value: any) => void
}

const sectors = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Retail",
  "Manufacturing",
  "Other",
]

export default function CompanyInformation({
  profileData,
  isEditing,
  handleInputChange,
}: CompanyInformationProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={profileData.company}
            onChange={(e) => handleInputChange("company", e.target.value)}
            disabled={!isEditing}
            className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="registrationNumber">Registration Number</Label>
          <Input
            id="registrationNumber"
            value={profileData.registrationNumber}
            onChange={(e) =>
              handleInputChange("registrationNumber", e.target.value)
            }
            disabled={!isEditing}
            className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sector">Sector</Label>
          <Select
            value={profileData.sector}
            onValueChange={(value) => handleInputChange("sector", value)}
            disabled={!isEditing}
          >
            <SelectTrigger className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft">
              <SelectValue placeholder="Select a sector" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="officeAddress">Office Address</Label>
          <Input
            id="officeAddress"
            value={profileData.officeAddress}
            onChange={(e) => handleInputChange("officeAddress", e.target.value)}
            disabled={!isEditing}
            className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select
            value={profileData.country}
            onValueChange={(value) => handleInputChange("country", value)}
            disabled={!isEditing}
          >
            <SelectTrigger className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              {Country.getAllCountries().map((country) => (
                <SelectItem key={country.isoCode} value={country.isoCode}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select
            value={profileData.state}
            onValueChange={(value) => handleInputChange("state", value)}
            disabled={!isEditing || !profileData.country}
          >
            <SelectTrigger className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft">
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
            <SelectContent>
              {State.getStatesOfCountry(profileData.country).map((state) => (
                <SelectItem key={state.isoCode} value={state.isoCode}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessDescription">Business Description</Label>
        <Textarea
          id="businessDescription"
          rows={4}
          value={profileData.businessDescription}
          onChange={(e) =>
            handleInputChange("businessDescription", e.target.value)
          }
          disabled={!isEditing}
          placeholder="Describe your business..."
          className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
        />
      </div>
    </div>
  )
}
