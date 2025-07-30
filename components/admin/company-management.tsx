'use client';

import { useState } from 'react';
import ViewCompanyModal from './view-company-modal';
import EditCompanyModal from './edit-company-modal';
import DeactivateCompanyModal from './DeactivateCompanyModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FullPageLoader from '@/components/full-page-loader';
import { Badge } from '@/components/ui/badge';

interface Company {
  _id: string;
  name: string;
  status: 'active' | 'inactive';
  companyAccount: {
    firstName: string;
    lastName: string;
    name: string;
    email: string;
  };
}

interface CompanyManagementProps {
  companies: Company[];
}

const fetchCompanies = async (): Promise<Company[]> => {
  const res = await fetch('/api/company');
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

const getStatusColor = (status: Company['status']) => {
  switch (status) {
    case 'active':
      return 'bg-success-green text-alabaster hover:bg-success-green/90';
    case 'inactive':
      return 'bg-red-500 text-alabaster hover:bg-red-500/90';
    default:
      return 'bg-warm-gray text-alabaster hover:bg-warm-gray/90';
  }
};

export default function CompanyManagement() {
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const queryClient = useQueryClient();

  const {
    data: companies,
    isLoading,
    error,
  } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  });

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <div
        className="flex-1 space-y-6 p-6 min-h-screen"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <Card className="bg-card border-warm-gray/20">
          <CardHeader>
            <CardTitle className="text-charcoal">Company Management</CardTitle>
            <CardDescription className="text-warm-gray">
              Manage all companies on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">Could not load companies.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="flex-1 space-y-6 p-6 min-h-screen"
      style={{ backgroundColor: '#f5f4ed' }}
    >
      <Card className="bg-card border-warm-gray/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-charcoal">Company Management</CardTitle>
            <CardDescription className="text-warm-gray">
              Manage all companies on the platform
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies?.map((company) => (
              <div
                key={company._id}
                className="flex items-center gap-4 p-4 rounded-lg bg-alabaster border border-warm-gray/20"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="font-medium text-charcoal truncate capitalize">
                      {company.name}
                    </p>
                    <p className="text-sm text-warm-gray truncate">
                      {company.companyAccount?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-warm-gray">Company Manager</p>
                    <p className="text-sm text-charcoal">
                      {`${company.companyAccount?.firstName} ${company.companyAccount?.lastName}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-warm-gray">Plan</p>
                    <p className="text-sm text-charcoal">Pending</p>
                  </div>
                  <div>
                    <p className="text-sm text-warm-gray">Status</p>
                    <Badge
                      className={`capitalize ${getStatusColor(company.status)}`}
                      variant="secondary"
                    >
                      {company.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
                    onClick={() => {
                      setSelectedCompany(company);
                      setEditModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-warm-gray/30"
                    onClick={() => {
                      setSelectedCompany(company);
                      setViewModalOpen(true);
                    }}
                  >
                    View
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="px-4 py-2 rounded-md"
                    onClick={() => {
                      setSelectedCompany(company);
                      setDeactivateModalOpen(true);
                    }}
                  >
                    Deactivate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {selectedCompany && (
        <>
          <ViewCompanyModal
            isOpen={isViewModalOpen}
            onClose={() => setViewModalOpen(false)}
            company={selectedCompany}
          />
          <EditCompanyModal
            isOpen={isEditModalOpen}
            onClose={() => setEditModalOpen(false)}
            company={selectedCompany}
          />
          <DeactivateCompanyModal
            isOpen={isDeactivateModalOpen}
            onClose={() => setDeactivateModalOpen(false)}
            companyId={selectedCompany._id}
          />
        </>
      )}
    </div>
  );
}
