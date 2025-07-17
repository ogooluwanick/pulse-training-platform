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

  const getCategoryColorHex = (category: string) => {
    switch (category) {
      case 'compliance':
        return '#D97706'; // warning-ochre
      case 'skills':
        return '#374151'; // charcoal
      case 'culture':
        return '#059669'; // success-green
      case 'technical':
        return '#374151'; // charcoal
      default:
        return '#6B7280'; // warm-gray
    }
  };

  // Prepare data for pie chart
  const pieChartData = Object.keys(skillProgress).map((category) => ({
    category,
    value: skillProgress[category].total,
    color: getCategoryColorHex(category),
    progress: skillProgress[category].averageProgress,
  }));

  const totalCourses = pieChartData.reduce((sum, item) => sum + item.value, 0);

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
          {Object.keys(skillProgress).length > 0 && (
            <div className="flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Pie Chart */}
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  {pieChartData.map((item, index) => {
                    const percentage = (item.value / totalCourses) * 100;
                    const startAngle = pieChartData
                      .slice(0, index)
                      .reduce(
                        (sum, d) => sum + (d.value / totalCourses) * 360,
                        0
                      );
                    const endAngle = startAngle + (percentage * 360) / 100;

                    const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                    const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

                    const largeArcFlag = percentage > 50 ? 1 : 0;

                    return (
                      <path
                        key={item.category}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={item.color}
                        className="transition-all duration-500 ease-out"
                      />
                    );
                  })}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-charcoal">
                      {totalCourses}
                    </div>
                    <div className="text-xs text-warm-gray">Total Courses</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category Legend */}
          <div className="space-y-3">
            {pieChartData.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-charcoal capitalize">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-warm-gray">
                  <span>{item.value} courses</span>
                  <span className="font-medium text-charcoal">
                    {item.progress}% avg
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-warm-gray/20">
        <CardHeader>
          <CardTitle className="text-charcoal">Skill Development</CardTitle>
          <CardDescription className="text-warm-gray">
            Categories and areas of expertise you're building
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Areas of Expertise */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-charcoal">
              Areas of Expertise
            </h4>
            {Object.keys(skillProgress).map((category) => (
              <div
                key={category}
                className="flex items-center justify-between p-3 rounded-lg bg-alabaster border border-warm-gray/20"
              >
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <span className="text-sm font-medium text-charcoal capitalize">
                    {category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-warm-gray">
                    {skillProgress[category].completed}/
                    {skillProgress[category].total}
                  </span>
                  <span className="text-xs font-medium text-charcoal">
                    {skillProgress[category].averageProgress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
