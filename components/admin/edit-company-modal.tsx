'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Company {
  _id: string;
  name: string;
  status?: 'active' | 'deactivated';
  companyAccount?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  address?: string;
  description?: string;
  plan?: string;
}

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
}

const updateCompany = async (company: Company) => {
  const res = await fetch(`/api/admin/companies/${company._id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(company),
  });
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

export default function EditCompanyModal({
  isOpen,
  onClose,
  company,
}: EditCompanyModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(company.name);
  const [email, setEmail] = useState(company.companyAccount?.email || '');
  const [industry, setIndustry] = useState(company.industry || '');
  const [size, setSize] = useState(company.size || '');
  const [website, setWebsite] = useState(company.website || '');
  const [phone, setPhone] = useState(company.phone || '');
  const [address, setAddress] = useState(company.address || '');
  const [description, setDescription] = useState(company.description || '');
  const [plan, setPlan] = useState(company.plan || 'Trial');

  useEffect(() => {
    setName(company.name);
    setEmail(company.companyAccount?.email || '');
    setIndustry(company.industry || '');
    setSize(company.size || '');
    setWebsite(company.website || '');
    setPhone(company.phone || '');
    setAddress(company.address || '');
    setDescription(company.description || '');
    setPlan(company.plan || 'Trial');
  }, [company]);

  const mutation = useMutation({
    mutationFn: updateCompany,
    onSuccess: () => {
      toast.success('Company updated successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onClose();
    },
    onError: () => {
      toast.error('Failed to update company');
    },
  });

  const handleSubmit = () => {
    mutation.mutate({
      ...company,
      name,
      industry,
      size,
      website,
      phone,
      address,
      description,
      plan,
      companyAccount: {
        _id: company.companyAccount?._id || '',
        firstName: company.companyAccount?.firstName || '',
        lastName: company.companyAccount?.lastName || '',
        email,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-charcoal">
            Edit Company
          </DialogTitle>
          <DialogDescription className="text-warm-gray">
            Update the details for{' '}
            <span className="capitalize">{company.name}.</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-2 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-charcoal font-medium">
                Company Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-charcoal font-medium">
                Company Email
              </Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                placeholder="Enter company email address"
                type="email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-charcoal font-medium">
                Industry
              </Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                placeholder="e.g., Technology, Healthcare"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size" className="text-charcoal font-medium">
                Company Size
              </Label>
              <Input
                id="size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                placeholder="e.g., 50-100 employees"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website" className="text-charcoal font-medium">
                Website
              </Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                placeholder="https://company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-charcoal font-medium">
                Phone Number
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-charcoal font-medium">
              Address
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
              placeholder="123 Business St, City, State 12345"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-charcoal font-medium">
              Description
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-alabaster border border-warm-gray/30 focus:border-charcoal rounded-md resize-none"
              placeholder="Brief description of the company"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan" className="text-charcoal font-medium">
              Plan
            </Label>
            <select
              id="plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full p-3 bg-alabaster border border-warm-gray/30 focus:border-charcoal rounded-md"
            >
              <option value="Trial">Trial</option>
              <option value="Basic">Basic</option>
              <option value="Professional">Professional</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
        </div>
        <DialogFooter className="flex flex-row-reverse gap-2 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="bg-charcoal text-alabaster hover:bg-charcoal/90 transition-soft"
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-alabaster border-warm-gray/30 hover:bg-warm-gray/10 transition-soft"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
