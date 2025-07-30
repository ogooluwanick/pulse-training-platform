'use client';

import {
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CompletionChartProps {
  data?: { courseName: string; completion: number }[];
  loading?: boolean;
}

export default function CompletionChart({
  data,
  loading,
}: CompletionChartProps) {
  if (loading) {
    return (
      <Card className="bg-card text-card-foreground shadow-neumorphic">
        <CardHeader className="p-3 sm:p-4">
          <Skeleton className="h-5 sm:h-6 w-48 bg-muted/60" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="h-[250px] sm:h-[300px] lg:h-[350px] flex flex-col">
            {/* Chart area with bars */}
            <div className="flex-1 flex items-end justify-around gap-4 px-4 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center space-y-2 flex-1 max-w-16"
                >
                  {/* Bar */}
                  <Skeleton
                    className={`w-full ${
                      i === 0 ? 'h-32' : i === 1 ? 'h-24' : 'h-16'
                    } rounded-t-sm bg-muted/60`}
                  />
                  {/* Label */}
                  <div className="space-y-1 w-full">
                    <Skeleton className="h-3 w-full bg-muted/50" />
                    <Skeleton className="h-3 w-3/4 mx-auto bg-muted/50" />
                  </div>
                </div>
              ))}
            </div>
            {/* Y-axis labels */}
            <div className="flex justify-between px-2 pt-2 border-t border-border/30">
              <Skeleton className="h-3 w-8 bg-muted/50" />
              <Skeleton className="h-3 w-8 bg-muted/50" />
              <Skeleton className="h-3 w-8 bg-muted/50" />
              <Skeleton className="h-3 w-8 bg-muted/50" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground shadow-neumorphic">
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="text-base sm:text-lg font-semibold">
          Course Completion Rates
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        <div className="h-[250px] sm:h-[300px] lg:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 10,
                left: 10,
                bottom: 60,
              }}
            >
              <XAxis
                dataKey="courseName"
                stroke="hsl(var(--foreground))"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis
                stroke="hsl(var(--foreground))"
                tick={{ fontSize: 10 }}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                width={30}
              />
              <Tooltip
                content={({ active, payload }) => (
                  <Card className="bg-card text-card-foreground shadow-neumorphic border">
                    {active && payload?.length && (
                      <CardContent className="p-2 sm:p-3">
                        <div className="space-y-1">
                          <div className="font-medium text-xs sm:text-sm">
                            {payload[0]?.payload?.courseName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Completion Rate: {payload[0]?.value}%
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )}
              />
              <Bar
                dataKey="completion"
                fill="hsl(var(--primary))"
                radius={[2, 2, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
