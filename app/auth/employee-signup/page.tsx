'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import FullPageLoader from '@/components/full-page-loader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const departments = [
  "Human Resources",
  "Engineering",
  "Marketing",
  "Sales",
  "Finance",
  "Customer Support",
  "Product Management",
  "Design",
  "IT",
  "Operations",
  "Legal",
  "Administration",
];

export default function EmployeeSignupPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setCheckingToken(false);
        return;
      }
      try {
        const response = await fetch(
          `/api/auth/verify-invitation?token=${token}`
        );
        const data = await response.json();
        if (response.ok) {
          setIsTokenValid(true);
          setCompanyName(data.companyName);
        }
      } catch (error) {
        // Token is invalid or other error
      } finally {
        setCheckingToken(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/employee-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          firstName,
          lastName,
          department,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast.success('Your account has been created. You will be redirected to the login page shortly.');

      // Redirect to login page after 5 seconds
      setTimeout(() => {
        window.location.href = '/auth/signin';
      }, 5000);
    } catch (error: any) {
      toast.error(error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return <FullPageLoader placeholder="Verifying invitation..." />;
  }

  if (!isTokenValid) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">
              Invalid or Expired Invitation
            </CardTitle>
            <CardDescription>
              This invitation link is either invalid or has expired. Please
              request a new invitation from your employer.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#fcf8f9' }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-charcoal text-alabaster">
              <span className="text-lg font-bold">P</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-charcoal">
              Welcome to Pulse
            </h1>
            <p className="text-warm-gray">
              Sign in to your intelligent workspace
            </p>
        </div>

        {/* Sign Up Card */}
        <Card className="bg-parchment border-warm-gray/20 shadow-soft-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-charcoal">
              Create your employee account
            </CardTitle>
            <CardDescription className="text-warm-gray">
              You have been invited to join{' '}
              <strong className="capitalize">{companyName}</strong>.
              <br />
              Please complete your registration below.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label className="text-charcoal font-medium"  htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft pr-10"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-charcoal font-medium"  htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft pr-10"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-charcoal font-medium" htmlFor="department">Department</Label>
                <Select onValueChange={setDepartment} value={department}>
                  <SelectTrigger className="w-full bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-charcoal font-medium"  htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft pr-10"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-charcoal font-medium"  htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft pr-10"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-charcoal text-white hover:bg-charcoal/90"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
