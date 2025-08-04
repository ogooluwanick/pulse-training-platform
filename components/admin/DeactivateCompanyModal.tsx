'use client';

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

interface DeactivateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyStatus?: 'active' | 'deactivated';
}

const toggleCompanyStatus = async (companyId: string) => {
  const res = await fetch(`/api/company/${companyId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

export default function DeactivateCompanyModal({
  isOpen,
  onClose,
  companyId,
  companyStatus = 'active',
}: DeactivateCompanyModalProps) {
  const queryClient = useQueryClient();
  const isActive = companyStatus === 'active';
  const action = isActive ? 'Deactivate' : 'Activate';

  const mutation = useMutation({
    mutationFn: toggleCompanyStatus,
    onSuccess: (data) => {
      toast.success(`Company ${data.message}`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onClose();
    },
    onError: () => {
      toast.error(`Failed to ${action} company`);
    },
  });

  const handleSubmit = () => {
    mutation.mutate(companyId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-charcoal">
            {isActive ? 'Deactivate' : 'Activate'} Company
          </DialogTitle>
          <DialogDescription className="text-warm-gray">
            {isActive
              ? 'Are you sure you want to deactivate this company? Deactivated companies cannot perform actions but their data will be preserved.'
              : 'Are you sure you want to activate this company? Activated companies can perform all actions normally.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row-reverse gap-2 pt-4">
          <Button
            variant={isActive ? 'destructive' : 'default'}
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className={
              isActive
                ? 'bg-red-500 text-alabaster hover:bg-red-600'
                : 'bg-success-green text-alabaster hover:bg-success-green/90'
            }
          >
            {mutation.isPending
              ? `${isActive ? 'Deactivating' : 'Activating'}...`
              : action}
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
