'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StatsWidgetsProps {
  overallCompletion?: number
  coursesInProgress?: number
  overdueEmployeesCount?: number
}

export default function StatsWidgets({
  overallCompletion,
  coursesInProgress,
  overdueEmployeesCount
}: StatsWidgetsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-card text-card-foreground shadow-neumorphic">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Overall Completion Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{overallCompletion?.toFixed(1)}%</div>
        </CardContent>
      </Card>

      <Card className="bg-card text-card-foreground shadow-neumorphic">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Courses In Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{coursesInProgress}</div>
        </CardContent>
      </Card>

      <Card className="bg-card text-card-foreground shadow-neumorphic">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Overdue Employees
          </CardTitle>
          <Badge variant="destructive" className="text-sm">
            {overdueEmployeesCount}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-destructive">{overdueEmployeesCount}</div>
        </CardContent>
      </Card>
    </div>
  )
}
