import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users, BarChart3, Award } from 'lucide-react';
import Image from 'next/image';
import AnimatedDiv from '@/components/AnimatedDiv';

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f4ed' }}>
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge
                  variant="secondary"
                  className="bg-parchment text-charcoal border-warm-gray/20"
                >
                  The Intelligent Workspace
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-charcoal leading-tight">
                  Culture Can Often Eat Strategy for Breakfast.
                </h1>
                <p className="text-xl text-warm-gray leading-relaxed max-w-lg">
                  Transform your organization's learning culture with our
                  intelligent corporate training platform. Build skills, track
                  progress, and drive real business outcomes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="px-4 py-2 rounded-md border border-charcoal text-charcoal hover:bg-charcoal hover:text-white transition-colors"
                >
                  Request a Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
                >
                  Watch Overview
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-charcoal">500+</div>
                  <div className="text-sm text-warm-gray">Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-charcoal">50K+</div>
                  <div className="text-sm text-warm-gray">Learners</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-charcoal">95%</div>
                  <div className="text-sm text-warm-gray">Satisfaction</div>
                </div>
              </div>
            </div>

            <div className="relative h-full flex items-center justify-center">
              <div className="relative  flex-1 group">
                <Image
                  src="/hr-meet.jpg"
                  alt="Corporate training workspace illustration"
                  width={600}
                  height={500}
                  className="w-full h-auto rounded-3xl object-cover shadow-lg relative z-10"
                  priority
                />
                <AnimatedDiv className="absolute top-0 left-0 h-full w-full  bg-warm-gray  rounded-3xl" />
              </div>
              {/* Subtle background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-parchment/30 to-transparent rounded-3xl -z-10 transform rotate-3"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20"
        style={{ backgroundColor: 'rgba(245, 244, 237, 0.5)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-charcoal">
              Everything you need to scale learning
            </h2>
            <p className="text-xl text-warm-gray max-w-2xl mx-auto">
              From individual skill development to enterprise-wide training
              programs, Pulse adapts to your organization's unique needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-alabaster border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft">
              <CardContent className="p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-green/10">
                  <Users className="h-6 w-6 text-success-green" />
                </div>
                <h3 className="text-xl font-semibold text-charcoal">
                  Multi-Tenant Architecture
                </h3>
                <p className="text-warm-gray">
                  Secure, scalable platform supporting multiple organizations
                  with role-based access control.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-alabaster border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft">
              <CardContent className="p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-charcoal/10">
                  <BarChart3 className="h-6 w-6 text-charcoal" />
                </div>
                <h3 className="text-xl font-semibold text-charcoal">
                  Advanced Analytics
                </h3>
                <p className="text-warm-gray">
                  Deep insights into learning progress, engagement metrics, and
                  business impact.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-alabaster border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft">
              <CardContent className="p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-ochre/10">
                  <Award className="h-6 w-6 text-warning-ochre" />
                </div>
                <h3 className="text-xl font-semibold text-charcoal">
                  Certification Management
                </h3>
                <p className="text-warm-gray">
                  Automated certification tracking, renewal reminders, and
                  compliance reporting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h2 className="text-2xl font-semibold text-charcoal">
              Trusted by leading organizations worldwide
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
              {/* Placeholder for company logos */}
              <div className="h-12 bg-warm-gray/20 rounded-lg flex items-center justify-center">
                <span className="text-warm-gray font-medium">Company A</span>
              </div>
              <div className="h-12 bg-warm-gray/20 rounded-lg flex items-center justify-center">
                <span className="text-warm-gray font-medium">Company B</span>
              </div>
              <div className="h-12 bg-warm-gray/20 rounded-lg flex items-center justify-center">
                <span className="text-warm-gray font-medium">Company C</span>
              </div>
              <div className="h-12 bg-warm-gray/20 rounded-lg flex items-center justify-center">
                <span className="text-warm-gray font-medium">Company D</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-alabaster">
            Ready to transform your learning culture?
          </h2>
          <p className="text-xl text-alabaster/80 max-w-2xl mx-auto">
            Join hundreds of organizations already using Pulse to build
            stronger, more capable teams through intelligent learning
            experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="border-solid border border-charcoal bg-white hover:border-white hover:bg-charcoal hover:text-white  shadow-soft-lg"
            >
              Request a Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-alabaster/30 text-alabaster hover:text-alabaster hover:bg-alabaster/10 transition-soft bg-transparent"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-parchment border-t border-warm-gray/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-charcoal text-alabaster">
                  <span className="text-sm font-bold">P</span>
                </div>
                <span className="text-xl font-bold text-charcoal">Pulse</span>
              </div>
              <p className="text-warm-gray">
                The intelligent workspace for corporate training and
                development.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-charcoal mb-4">Product</h3>
              <ul className="space-y-2 text-warm-gray">
                <li>
                  <a href="#" className="hover:text-charcoal transition-soft">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-charcoal transition-soft">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-charcoal transition-soft">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-charcoal mb-4">Company</h3>
              <ul className="space-y-2 text-warm-gray">
                <li>
                  <a href="#" className="hover:text-charcoal transition-soft">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-charcoal transition-soft">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-charcoal transition-soft">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-charcoal mb-4">Support</h3>
              <ul className="space-y-2 text-warm-gray">
                <li>
                  <a href="#" className="hover:text-charcoal transition-soft">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-charcoal transition-soft">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-charcoal transition-soft">
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-warm-gray/20 mt-12 pt-8 text-center text-warm-gray">
            <p>&copy; 2024 Pulse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
