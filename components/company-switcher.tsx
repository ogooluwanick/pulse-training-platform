'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Building2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface CompanySwitcherProps {
  className?: string;
}

export function CompanySwitcher({ className }: CompanySwitcherProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number>(0);

  const companyIds = session?.user?.companyIds || [];
  const companyNames = session?.user?.companyNames || [];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (triggerRef.current) {
      setDropdownWidth(triggerRef.current.offsetWidth);
    }
  }, [mounted]);

  // Get active company ID from cookie on mount
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const cookieActiveCompanyId = getCookie('activeCompanyId');
    if (cookieActiveCompanyId) {
      setActiveCompanyId(decodeURIComponent(cookieActiveCompanyId));
    } else if (companyIds.length > 0) {
      // Set first company as default if no cookie exists
      setActiveCompanyId(companyIds[0]);
      document.cookie = `activeCompanyId=${encodeURIComponent(companyIds[0])}; path=/; max-age=${7 * 24 * 60 * 60}`;
    }
  }, [companyIds]);

  // Debug logging
  console.log('CompanySwitcher Debug:', {
    companyIds,
    companyNames,
    activeCompanyId,
    hasMultipleCompanies: companyIds.length > 1,
  });

  const activeCompanyName =
    companyNames[companyIds.indexOf(activeCompanyId || '')] || 'Select Company';

  const handleCompanySwitch = async (companyId: string) => {
    if (companyId === activeCompanyId) return;

    console.log('Switching to company:', companyId);
    setIsLoading(true);

    try {
      // Set cookie with new company ID
      document.cookie = `activeCompanyId=${encodeURIComponent(companyId)}; path=/; max-age=${7 * 24 * 60 * 60}`;

      // Update local state
      setActiveCompanyId(companyId);

      console.log('Cookie updated, invalidating queries...');

      // Invalidate all queries to force refetch with new company context
      await queryClient.invalidateQueries();

      // Force refetch critical queries
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['learningData'] }),
        queryClient.refetchQueries({ queryKey: ['courseAssignments'] }),
        queryClient.refetchQueries({ queryKey: ['dashboardMetrics'] }),
        queryClient.refetchQueries({ queryKey: ['employeesAtRisk'] }),
        queryClient.refetchQueries({ queryKey: ['recentActivity'] }),
        queryClient.refetchQueries({ queryKey: ['userSettings'] }),
        queryClient.refetchQueries({ queryKey: ['course'] }), // Invalidate course page queries
        queryClient.refetchQueries({ queryKey: ['assignment'] }), // Invalidate assignment queries
        queryClient.refetchQueries({ queryKey: ['assignmentWithCourse'] }), // Invalidate new assignment queries
      ]);

      console.log('Queries invalidated and refetched');
    } catch (error) {
      console.error('Error switching company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (companyIds.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          className={`flex items-center gap-2 ${className}`}
          disabled={isLoading}
        >
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{activeCompanyName}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      {mounted &&
        typeof window !== 'undefined' &&
        createPortal(
          <DropdownMenuContent
            align="end"
            className="max-h-60 overflow-y-auto z-[99] bg-white border shadow-lg"
            style={{ width: `${dropdownWidth}px` }}
            side="bottom"
            sideOffset={8}
            alignOffset={0}
            avoidCollisions={true}
            collisionPadding={20}
            collisionBoundary={document.body}
          >
            {companyIds.map((companyId, index) => (
              <DropdownMenuItem
                key={companyId}
                onClick={() => handleCompanySwitch(companyId)}
                className={`cursor-pointer ${
                  companyId === activeCompanyId ? 'bg-accent' : ''
                }`}
              >
                <div className="flex flex-col w-full">
                  <span className="font-medium">{companyNames[index]}</span>
                  {companyId === activeCompanyId && (
                    <span className="text-xs text-muted-foreground">
                      Active
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>,
          document.body
        )}
    </DropdownMenu>
  );
}
