'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  // Countdown timer effect
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, countdown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsSuccess(false);
    setCountdown(5);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!token) {
      setMessage('Invalid token.');
      setIsSuccess(false);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setIsSuccess(false);
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      setIsSuccess(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Password set successfully!');
        setIsSuccess(true);
        // Redirect to signin page after 5 seconds
        setTimeout(() => {
          router.push('/auth/signin');
        }, 5000);
      } else {
        setMessage(data.message || 'Failed to set password.');
        setIsSuccess(false);
      }
    } catch (error: any) {
      setMessage(error.message || 'An error occurred.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: '#fcf8f9' }}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-charcoal">
              Invalid Link
            </CardTitle>
            <CardDescription className="text-warm-gray">
              This password setup link is invalid. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/auth/signin')}
              className="w-full bg-charcoal text-white hover:bg-charcoal/90"
            >
              Go to Sign In
            </Button>
          </CardContent>
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
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-charcoal text-alabaster">
              <span className="text-lg font-bold">P</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-charcoal">Welcome to Pulse</h1>
          <p className="text-warm-gray">Set up your account password</p>
        </div>

        <Card className="bg-parchment border-warm-gray/20 shadow-soft-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-charcoal">
              Set Your Password
            </CardTitle>
            <CardDescription className="text-warm-gray">
              Create a secure password for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {message &&
              (isSuccess ? (
                <Alert className="border-success-green/20 bg-success-green/10">
                  <CheckCircle className="h-4 w-4 text-success-green" />
                  <AlertDescription className="text-success-green">
                    {message} Redirecting to signin page in {countdown}{' '}
                    seconds...
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-warning-ochre/20 bg-warning-ochre/10">
                  <AlertCircle className="h-4 w-4 text-warning-ochre" />
                  <AlertDescription className="text-warning-ochre">
                    {message}
                  </AlertDescription>
                </Alert>
              ))}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-charcoal font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft pr-10"
                    required
                    minLength={6}
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
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft pr-10"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-warm-gray" />
                    ) : (
                      <Eye className="h-4 w-4 text-warm-gray" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-charcoal text-white hover:bg-charcoal/90"
                disabled={isLoading}
              >
                {isLoading ? 'Setting Password...' : 'Set Password'}
              </Button>

              {isSuccess && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-charcoal text-charcoal hover:bg-charcoal hover:text-white"
                  onClick={() => router.push('/auth/signin')}
                >
                  Go to Sign In Now
                </Button>
              )}
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
