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
}

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
}

const updateCompany = async (company: Company) => {
  const res = await fetch(`/api/company/${company._id}`, {
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

  useEffect(() => {
    setName(company.name);
    setEmail(company.companyAccount?.email || '');
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
