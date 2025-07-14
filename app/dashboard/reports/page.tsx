"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

export default function ReportsPage() {
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
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-gray">Data Privacy</span>
                    <span className="text-sm font-medium text-charcoal">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-gray">AML Training</span>
                    <span className="text-sm font-medium text-charcoal">72%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-gray">Cybersecurity</span>
                    <span className="text-sm font-medium text-charcoal">68%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-alabaster border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-lg text-charcoal">Department Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-gray">Engineering</span>
                    <span className="text-sm font-medium text-charcoal">92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-gray">Marketing</span>
                    <span className="text-sm font-medium text-charcoal">78%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-gray">Sales</span>
                    <span className="text-sm font-medium text-charcoal">65%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
