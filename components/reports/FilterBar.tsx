'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FilterBarProps {
  onApplyFilters: (filters: ReportFilters) => void
  onExport: (format: 'csv' | 'pdf') => void
}

export default function FilterBar({ onApplyFilters, onExport }: FilterBarProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')

  const handleApplyFilters = () => {
    const filters: ReportFilters = {
      startDate: dateRange?.from,
      endDate: dateRange?.to,
      department: selectedDepartment,
      courseId: selectedCourse
    }
    onApplyFilters(filters)
  }

  return (
    <Card className="bg-card text-card-foreground shadow-neumorphic p-4">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-4">
        <DayPicker
          mode="range"
          selected={dateRange}
          onSelect={setDateRange}
          fromYear={2020}
          toYear={2025}
          className="shadow-neumorphic"
        />
        
        <Select onValueChange={setSelectedDepartment}>
          <SelectTrigger className="shadow-neumorphic">
            <SelectValue placeholder="Select Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="engineering">Engineering</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setSelectedCourse}>
          <SelectTrigger className="shadow-neumorphic">
            <SelectValue placeholder="Select Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="safety-training">Safety Training</SelectItem>
            <SelectItem value="compliance">Compliance 101</SelectItem>
            <SelectItem value="leadership">Leadership Development</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          onClick={handleApplyFilters} 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Apply Filters
        </Button>

        <Button 
          variant="outline" 
          onClick={() => onExport('csv')}
          className="border-border hover:bg-accent"
        >
          Export as CSV
        </Button>

        <Button 
          variant="outline" 
          onClick={() => onExport('pdf')}
          className="border-border hover:bg-accent"
        >
          Export as PDF
        </Button>
      </CardContent>
    </Card>
  )
}

interface ReportFilters {
  startDate?: Date
  endDate?: Date
  department?: string
  courseId?: string
}
