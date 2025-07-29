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
}

const deactivateCompany = async (companyId: string) => {
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
}: DeactivateCompanyModalProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deactivateCompany,
    onSuccess: () => {
      toast.success('Company deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onClose();
    },
    onError: () => {
      toast.error('Failed to deactivate company');
    },
  });

  const handleSubmit = () => {
    mutation.mutate(companyId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deactivate Company</DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate this company? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
