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

  useEffect(() => {
    setName(company.name);
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
    mutation.mutate({ ...company, name });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Update the details of the company.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="name">Company Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
