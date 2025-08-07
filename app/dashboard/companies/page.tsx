'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building2,
  Users,
  TrendingUp,
  Search,
  Edit,
  Plus,
  Mail,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import Link from 'next/link';
import EditCompanyModal from '@/components/admin/edit-company-modal';
import ViewCompanyModal from '@/components/admin/view-company-modal';

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
  employees?: any[];
  // savedCourses?: any[];
  createdAt?: string;
  updatedAt?: string;
}

interface PlatformStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  monthlyRevenue: number;
  averageCompletion: number;
  newSignups: number;
}

export default function CompanyManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(
    null
  );

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/company');
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        } else {
          console.error('Failed to fetch companies');
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    const fetchPlatformStats = async () => {
      try {
        const response = await fetch('/api/company/dashboard-metrics');
        if (response.ok) {
          const data = await response.json();
          setPlatformStats(data);
        } else {
          console.error('Failed to fetch platform stats');
        }
      } catch (error) {
        console.error('Error fetching platform stats:', error);
      }
    };

    fetchCompanies();
    fetchPlatformStats();
  }, []);

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsEditDialogOpen(true);
  };

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsViewDialogOpen(true);
  };

  const handleContactCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsContactDialogOpen(true);
  };

  const handleToggleCompanyStatus = async (company: Company) => {
    try {
      const response = await fetch(`/api/company/${company._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh the companies list
        const companiesResponse = await fetch('/api/company');
        if (companiesResponse.ok) {
          const updatedCompanies = await companiesResponse.json();
          setCompanies(updatedCompanies);
        }
        console.log(data.message);
      } else {
        console.error('Failed to toggle company status');
      }
    } catch (error) {
      console.error('Error toggling company status:', error);
    }
  };

  const handleSendMessage = () => {
    console.log('Sending message to:', selectedCompany?.name, contactMessage);
    setIsContactDialogOpen(false);
    setContactMessage('');
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.companyAccount?.email &&
        company.companyAccount.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (company.companyAccount &&
        `${company.companyAccount.firstName} ${company.companyAccount.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div
        className="flex-1 space-y-6 p-6 min-h-screen"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">
              Company Management
            </h1>
            <p className="text-warm-gray">
              Manage all organizations on the platform
            </p>
          </div>
          <Button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>

        {/* Platform Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">
                Total Companies
              </CardTitle>
              <Building2 className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">
                {platformStats?.totalCompanies}
              </div>
              <p className="text-xs text-success-green">
                +{platformStats?.newSignups} this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">
                Active Companies
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">
                {platformStats?.activeCompanies}
              </div>
              <p className="text-xs text-warm-gray">
                {platformStats &&
                  Math.round(
                    (platformStats.activeCompanies /
                      platformStats.totalCompanies) *
                      100
                  )}
                % active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">
                {platformStats?.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-success-green">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">
                Monthly Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">
                ${platformStats?.monthlyRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-success-green">+8% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">
                Avg Completion
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">
                {platformStats?.averageCompletion}%
              </div>
              <p className="text-xs text-success-green">+3% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">
                New Signups
              </CardTitle>
              <Plus className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">
                {platformStats?.newSignups}
              </div>
              <p className="text-xs text-warm-gray">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Company Management */}
        <Card className="bg-card border-warm-gray/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-charcoal">
                  Company Directory
                </CardTitle>
                <CardDescription className="text-warm-gray">
                  Manage all organizations and their subscriptions
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
                  <Input
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-alabaster border-warm-gray/30 focus:border-charcoal"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCompanies.map((company) => (
                <div
                  key={company._id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-alabaster border border-warm-gray/20"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="font-medium text-charcoal">
                        {company.name}
                      </p>
                      <p className="text-sm text-warm-gray">
                        {company.companyAccount
                          ? `${company.companyAccount.firstName} ${company.companyAccount.lastName}`
                          : 'No manager assigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-warm-gray">Manager Email</p>
                      <p className="text-sm text-charcoal">
                        {company.companyAccount?.email || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-warm-gray">Employees</p>
                      <p className="text-sm text-charcoal">
                        {company.employees?.length || 0}
                      </p>
                    </div>
                    {/* <div>
                      <p className="text-sm text-warm-gray">Courses</p>
                      <p className="text-sm text-charcoal">
                        {company.savedCourses?.length || 0}
                      </p>
                    </div> */}
                    <div>
                      <p className="text-sm text-warm-gray">Status</p>
                      <Badge
                        className={
                          company.status === 'active'
                            ? 'bg-success-green text-alabaster'
                            : 'bg-red-500 text-alabaster'
                        }
                        variant="secondary"
                      >
                        {company.status === 'active' ? 'Active' : 'Deactivated'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-alabaster border-warm-gray/30"
                      onClick={() => handleViewCompany(company)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-alabaster border-warm-gray/30"
                      onClick={() => handleEditCompany(company)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-alabaster border-warm-gray/30"
                      onClick={() => handleContactCompany(company)}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={
                        company.status === 'active'
                          ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-alabaster'
                          : 'border-success-green text-success-green hover:bg-success-green hover:text-alabaster'
                      }
                      onClick={() => handleToggleCompanyStatus(company)}
                    >
                      {company.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit Company Modal */}
        {selectedCompany && (
          <EditCompanyModal
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            company={selectedCompany}
          />
        )}

        {/* View Company Modal */}
        {selectedCompany && (
          <ViewCompanyModal
            isOpen={isViewDialogOpen}
            onClose={() => setIsViewDialogOpen(false)}
            company={selectedCompany}
          />
        )}

        {/* Contact Company Dialog */}
        <Dialog
          open={isContactDialogOpen}
          onOpenChange={setIsContactDialogOpen}
        >
          <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-charcoal">
                Contact Company
              </DialogTitle>
              <DialogDescription className="text-warm-gray">
                Send a message to {selectedCompany?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact-message" className="text-charcoal">
                  Message
                </Label>
                <Textarea
                  id="contact-message"
                  placeholder="Enter your message..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSendMessage} className="btn-primary">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsContactDialogOpen(false)}
                  className="bg-alabaster"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
