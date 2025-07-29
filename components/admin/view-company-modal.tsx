'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Company {
  _id: string;
  name: string;
  companyAccount: {
    name: string;
    email: string;
  };
}

interface ViewCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
}

export default function ViewCompanyModal({
  isOpen,
  onClose,
  company,
}: ViewCompanyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company.name}</DialogTitle>
          <DialogDescription>
            Viewing company details.
          </DialogDescription>
        </DialogHeader>
        <div>
          <p><strong>Company Name:</strong> {company.name}</p>
          <p><strong>Manager:</strong> {company.companyAccount?.name}</p>
          <p><strong>Email:</strong> {company.companyAccount?.email}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
