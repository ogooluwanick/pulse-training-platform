'use client';

import type React from 'react';
import { useState, useEffect } from 'react'; // Added useEffect
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; // Import useSession
import toast from 'react-hot-toast';

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { data: session } = useSession(); // Get session data

  // Redirect if user is already logged in
  useEffect(() => {
    if (session?.user) {
      let redirectPath = '/dashboard'; // Default redirect path
      router.push(redirectPath);
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const name = formData.get('name') as string;
    const organizationName = formData.get('organizationName') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' '),
          email,
          password,
          role: 'COMPANY', // Explicitly set role to COMPANY for this signup page
          organizationName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast.success('Your account has been created. You will be redirected to the login page shortly.');

      // Redirect to login page after 5 seconds
      setTimeout(() => {
        router.push('/auth/signin');
      }, 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
              Create your company account
            </CardTitle>
            <CardDescription className="text-warm-gray">
              Fill in your company's details to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-warning-ochre/20 bg-warning-ochre/10">
                <AlertCircle className="h-4 w-4 text-warning-ochre" />
                <AlertDescription className="text-warning-ochre">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-charcoal font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-charcoal font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="organizationName"
                  className="text-charcoal font-medium"
                >
                  Organization Name
                </Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  placeholder="Enter your organization name"
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-charcoal font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-warm-gray" />
                    ) : (
                      <Eye className="h-4 w-4 text-warm-gray" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-charcoal font-medium"
                >
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-charcoal text-white hover:bg-charcoal/90"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="text-center text-sm text-warm-gray">
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                className="text-charcoal hover:underline font-medium transition-soft"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
