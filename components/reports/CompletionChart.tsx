'use client'

import { BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CompletionChartProps {
  data?: { courseName: string; completion: number }[]
}

export default function CompletionChart({ data }: CompletionChartProps) {
  return (
    <Card className="bg-card text-card-foreground shadow-neumorphic p-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Course Completion Rates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <XAxis
                dataKey="courseName"
                stroke="hsl(var(--foreground))"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                stroke="hsl(var(--foreground))"
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                content={({ active, payload }) => (
                  <Card className="bg-card text-card-foreground shadow-neumorphic p-3">
                    {active && payload?.length && (
                      <div className="space-y-1">
                        <div className="font-medium">{payload[0]?.payload?.courseName}</div>
                        <div className="text-sm text-muted-foreground">
                          Completion Rate: {payload[0]?.value}%
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              />
              <Bar dataKey="completion" fill="hsl(var(--primary))" barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
