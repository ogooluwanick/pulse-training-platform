'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Building2 } from 'lucide-react';

interface CompanySwitcherProps {
  className?: string;
}

export function CompanySwitcher({ className }: CompanySwitcherProps) {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const companyIds = session?.user?.companyIds || [];
  const companyNames = session?.user?.companyNames || [];
  const activeCompanyId = session?.user?.activeCompanyId;

  const activeCompanyName =
    companyNames[companyIds.indexOf(activeCompanyId || '')] || 'Select Company';

  const handleCompanySwitch = async (companyId: string) => {
    if (companyId === activeCompanyId) return;

    setIsLoading(true);
    try {
      // Set cookie (client-side)
      const cookieValue = encodeURIComponent(companyId);
      // Cookie available to all paths, expires in 7 days
      document.cookie = `activeCompanyId=${cookieValue}; path=/; max-age=${7 * 24 * 60 * 60}`;

      // Update the session locally so UI reflects immediately
      await update({
        ...session,
        user: {
          ...session?.user,
          activeCompanyId: companyId,
          companyId: companyId,
          companyName: companyNames[companyIds.indexOf(companyId)] ?? '',
        },
      });
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
          variant="outline"
          className={`flex items-center gap-2 ${className}`}
          disabled={isLoading}
        >
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{activeCompanyName}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {companyIds.map((companyId, index) => (
          <DropdownMenuItem
            key={companyId}
            onClick={() => handleCompanySwitch(companyId)}
            className={`cursor-pointer ${
              companyId === activeCompanyId ? 'bg-accent' : ''
            }`}
          >
            <div className="flex flex-col">
              <span className="font-medium">{companyNames[index]}</span>
              {companyId === activeCompanyId && (
                <span className="text-xs text-muted-foreground">Active</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
