'use client';

import { useState } from 'react';
import ViewCompanyModal from './view-company-modal';
import EditCompanyModal from './edit-company-modal';
import DeactivateCompanyModal from './deactivate-company-modal';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface Company {
  _id: string;
  name: string;
  companyAccount: {
    firstName: any;
    lastName: any;
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Company Manager</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies?.map((company) => (
                <TableRow key={company._id}>
                  <TableCell>{company.name}</TableCell>
                  <TableCell>{`${company.companyAccount?.firstName} ${company.companyAccount?.lastName}`}</TableCell>
                  <TableCell>{company.companyAccount?.email}</TableCell>
                  <TableCell>Pending</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white">
                        <DropdownMenuItem
                          onSelect={() => {
                            setSelectedCompany(company);
                            setViewModalOpen(true);
                          }}
                        >
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setSelectedCompany(company);
                            setEditModalOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setSelectedCompany(company);
                            setDeactivateModalOpen(true);
                          }}
                        >
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
