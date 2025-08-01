'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerificationResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get('success') === 'true';
  const error = searchParams.get('error');

  useEffect(() => {
    if (success) {
      toast.success('Email verified successfully! Redirecting to sign in...');
      const timer = setTimeout(() => {
        router.push('/auth/signin');
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      let errorMessage = 'Email verification failed. Please try again.';
      if (error === 'notoken') {
        errorMessage = 'No verification token provided. Please check your email link.';
      } else if (error === 'invalid') {
        errorMessage = 'Invalid or expired verification token. Please request a new verification email.';
      } else if (error === 'resent') {
        errorMessage = 'Your verification link has expired. A new one has been sent to your email address.';
      }
      toast.error(errorMessage);
    }
  }, [success, error, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf8f9' }}>
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            {success ? (
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500 mr-2" />
            )}
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <CardDescription>
              Your email has been successfully verified. You will be redirected to the sign-in page shortly.
            </CardDescription>
          ) : (
            <CardDescription>
              {error === 'notoken' && 'No verification token was found in the link. Please make sure you copied the entire link from your email.'}
              {error === 'invalid' && 'The verification link is invalid or has expired. Please try signing up again to receive a new link.'}
              {error === 'resent' && 'Your verification link has expired. A new verification email has been sent to your email address. Please check your inbox.'}
              {!error && 'An unknown error occurred during email verification. Please try again.'}
            </CardDescription>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
