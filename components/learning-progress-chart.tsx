'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Clock, Award, BookOpen } from 'lucide-react';

interface SkillProgress {
  [key: string]: {
    total: number;
    completed: number;
    progress: number;
    averageProgress: number;
  };
}

interface LearningProgressChartProps {
  skillProgress: SkillProgress;
  totalTimeInvested: number;
  completedThisMonth: number;
  certificatesEarned: number;
}

export function LearningProgressChart({
  skillProgress,
  totalTimeInvested,
  completedThisMonth,
  certificatesEarned,
}: LearningProgressChartProps) {
  const [animatedProgress, setAnimatedProgress] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
    // Animate progress bars
    const newProgress: { [key: string]: number } = {};
    Object.keys(skillProgress).forEach((category) => {
      newProgress[category] = 0;
    });
    setAnimatedProgress(newProgress);
    const timers: NodeJS.Timeout[] = [];
    Object.keys(skillProgress).forEach((category, index) => {
      timers.push(
        setTimeout(() => {
          setAnimatedProgress((prev) => ({
            ...prev,
            [category]: skillProgress[category].averageProgress,
          }));
        }, 200 * index)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [skillProgress]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'compliance':
        return <Award className="h-4 w-4 text-warning-ochre" />;
      case 'skills':
        return <TrendingUp className="h-4 w-4 text-charcoal" />;
      case 'culture':
        return <BookOpen className="h-4 w-4 text-success-green" />;
      case 'technical':
        return <BookOpen className="h-4 w-4 text-charcoal" />;
      default:
        return <BookOpen className="h-4 w-4 text-charcoal" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'compliance':
        return 'bg-warning-ochre';
      case 'skills':
        return 'bg-charcoal';
      case 'culture':
        return 'bg-success-green';
      case 'technical':
        return 'bg-charcoal';
      default:
        return 'bg-warm-gray';
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-card border-warm-gray/20">
        <CardHeader>
          <CardTitle className="text-charcoal">Learning Progress</CardTitle>
          <CardDescription className="text-warm-gray">
            Your learning activity by category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(skillProgress).length === 0 && (
            <div className="text-center text-warm-gray">
              No learning data yet.
            </div>
          )}
          {Object.keys(skillProgress).map((category) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <span className="text-sm font-medium text-charcoal capitalize">
                    {category}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-warm-gray">
                  <span>
                    {skillProgress[category].completed} of{' '}
                    {skillProgress[category].total} completed
                  </span>
                  <span className="font-medium text-charcoal">
                    {animatedProgress[category] || 0}%
                  </span>
                </div>
              </div>
              <div className="relative">
                <Progress
                  value={animatedProgress[category] || 0}
                  className={`h-3 ${getCategoryColor(category)}`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse pointer-events-none" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card border-warm-gray/20">
        <CardHeader>
          <CardTitle className="text-charcoal">Learning Analytics</CardTitle>
          <CardDescription className="text-warm-gray">
            Key metrics from your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-alabaster border border-warm-gray/20">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-charcoal" />
              </div>
              <div className="text-2xl font-bold text-charcoal">
                {Math.round(totalTimeInvested / 60)}h
              </div>
              <div className="text-xs text-warm-gray">Time Invested</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-alabaster border border-warm-gray/20">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-warning-ochre" />
              </div>
              <div className="text-2xl font-bold text-charcoal">
                {certificatesEarned}
              </div>
              <div className="text-xs text-warm-gray">Certificates</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-alabaster border border-warm-gray/20">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-success-green" />
              </div>
              <div className="text-2xl font-bold text-charcoal">
                {completedThisMonth}
              </div>
              <div className="text-xs text-warm-gray">This Month</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-alabaster border border-warm-gray/20">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-charcoal" />
              </div>
              <div className="text-2xl font-bold text-charcoal">
                {Object.keys(skillProgress).length}
              </div>
              <div className="text-xs text-warm-gray">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
