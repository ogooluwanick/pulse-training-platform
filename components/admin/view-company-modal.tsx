'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Mail,
  Users,
  Calendar,
  TrendingUp,
  Globe,
  User,
  Activity,
} from 'lucide-react';

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
  savedCourses?: any[];
  createdAt?: string;
  updatedAt?: string;
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
  const getFullName = () => {
    if (company.companyAccount) {
      return `${company.companyAccount.firstName} ${company.companyAccount.lastName}`;
    }
    return 'Not specified';
  };

  const getInitials = () => {
    if (company.companyAccount) {
      return `${company.companyAccount.firstName?.charAt(0) || ''}${company.companyAccount.lastName?.charAt(0) || ''}`.toUpperCase();
    }
    return company.name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-charcoal flex items-center gap-3">
            <Building2 className="h-6 w-6 text-charcoal" />
            {company.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Overview Card */}
          <Card className="bg-alabaster border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-lg text-charcoal flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-warm-gray">
                    <Building2 className="h-4 w-4" />
                    Company Name
                  </div>
                  <div className="text-charcoal font-medium">
                    {company.name}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-warm-gray">
                    <Calendar className="h-4 w-4" />
                    Joined
                  </div>
                  <div className="text-charcoal font-medium">
                    {company.createdAt
                      ? formatDate(company.createdAt)
                      : 'Not available'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Account Manager Card */}
          <Card className="bg-alabaster border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-lg text-charcoal flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src="/placeholder-user.jpg"
                    alt={getFullName()}
                  />
                  <AvatarFallback className="bg-charcoal text-alabaster text-lg font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-warm-gray">
                      <User className="h-4 w-4" />
                      Full Name
                    </div>
                    <div className="text-charcoal font-medium text-lg">
                      {getFullName()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-warm-gray">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </div>
                    <div className="text-charcoal font-medium">
                      {company.companyAccount?.email || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Statistics Card */}
          <Card className="bg-alabaster border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-lg text-charcoal flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Company Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-parchment rounded-lg border border-warm-gray/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-charcoal" />
                    <span className="text-sm text-warm-gray">Employees</span>
                  </div>
                  <div className="text-2xl font-bold text-charcoal">
                    {company.employees?.length || 0}
                  </div>
                </div>

                <div className="text-center p-4 bg-parchment rounded-lg border border-warm-gray/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-charcoal" />
                    <span className="text-sm text-warm-gray">
                      Saved Courses
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-charcoal">
                    {company.savedCourses?.length || 0}
                  </div>
                </div>

                <div className="text-center p-4 bg-parchment rounded-lg border border-warm-gray/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-charcoal" />
                    <span className="text-sm text-warm-gray">Last Updated</span>
                  </div>
                  <div className="text-sm font-medium text-charcoal">
                    {company.updatedAt
                      ? formatDate(company.updatedAt)
                      : 'Never'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          <div className="flex items-center gap-2">
            <Badge
              className={
                company.status === 'active'
                  ? 'bg-success-green text-alabaster'
                  : 'bg-red-500 text-alabaster'
              }
            >
              {company.status === 'active' ? 'Active' : 'Deactivated'}
            </Badge>
            <span className="text-sm text-warm-gray">
              {company.status === 'active'
                ? 'Company is currently active and operational'
                : 'Company is currently deactivated and cannot perform actions'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
