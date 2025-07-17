"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import FullPageLoader from "@/components/full-page-loader"

interface CompletionRate {
  course: string
  rate: number
}

interface DepartmentBreakdown {
  department: string
  rate: number
}

const fetchCompletionRates = async (): Promise<CompletionRate[]> => {
  const res = await fetch("/api/company/reports/completion-rates")
  if (!res.ok) {
    throw new Error("Network response was not ok")
  }
  return res.json()
}

const fetchDepartmentBreakdown = async (): Promise<DepartmentBreakdown[]> => {
  const res = await fetch("/api/company/reports/department-breakdown")
  if (!res.ok) {
    throw new Error("Network response was not ok")
  }
  return res.json()
}

export default function ReportsPage() {
  const {
    data: completionRates,
    isLoading: isLoadingCompletionRates,
    error: errorCompletionRates,
  } = useQuery<CompletionRate[]>({
    queryKey: ["completionRates"],
    queryFn: fetchCompletionRates,
  })

  const {
    data: departmentBreakdown,
    isLoading: isLoadingDepartmentBreakdown,
    error: errorDepartmentBreakdown,
  } = useQuery<DepartmentBreakdown[]>({
    queryKey: ["departmentBreakdown"],
    queryFn: fetchDepartmentBreakdown,
  })

  if (isLoadingCompletionRates || isLoadingDepartmentBreakdown) {
    return <FullPageLoader />
  }

  return (
    <div className="flex-1 space-y-6 p-6 min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
      <Card className="bg-card border-warm-gray/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-charcoal">Compliance Reports</CardTitle>
            <CardDescription className="text-warm-gray">
              Export detailed compliance and progress reports
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-transparent border-warm-gray/30">
              <FileText className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" className="bg-transparent border-warm-gray/30">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-alabaster border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-lg text-charcoal">Completion Rates</CardTitle>
              </CardHeader>
              <CardContent>
                {errorCompletionRates ? (
                  <p className="text-sm text-red-500">Could not load completion rates.</p>
                ) : (
                  <div className="space-y-3">
                    {completionRates?.map((rate) => (
                      <div key={rate.course} className="flex justify-between items-center">
                        <span className="text-sm text-warm-gray">{rate.course}</span>
                        <span className="text-sm font-medium text-charcoal">{rate.rate}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-alabaster border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-lg text-charcoal">Department Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {errorDepartmentBreakdown ? (
                  <p className="text-sm text-red-500">Could not load department breakdown.</p>
                ) : (
                  <div className="space-y-3">
                    {departmentBreakdown?.map((breakdown) => (
                      <div key={breakdown.department} className="flex justify-between items-center">
                        <span className="text-sm text-warm-gray">{breakdown.department}</span>
                        <span className="text-sm font-medium text-charcoal">{breakdown.rate}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
