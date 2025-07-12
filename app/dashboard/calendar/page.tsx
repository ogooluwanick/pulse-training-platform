"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ChevronLeft, ChevronRight, Clock, MapPin, Users, Video, CalendarIcon } from "lucide-react"

interface Event {
  id: string
  title: string
  type: "course" | "meeting" | "deadline" | "webinar"
  date: Date
  time: string
  duration: string
  location?: string
  isVirtual: boolean
  attendees?: number
  description: string
  status: "upcoming" | "completed" | "cancelled"
}

const mockEvents: Event[] = [
  {
    id: "1",
    title: "Data Privacy Training Session",
    type: "course",
    date: new Date(2024, 0, 15),
    time: "10:00 AM",
    duration: "2 hours",
    location: "Conference Room A",
    isVirtual: false,
    attendees: 25,
    description: "Interactive session on GDPR compliance and data protection best practices",
    status: "upcoming",
  },
  {
    id: "2",
    title: "Quarterly Learning Review",
    type: "meeting",
    date: new Date(2024, 0, 18),
    time: "2:00 PM",
    duration: "1 hour",
    isVirtual: true,
    attendees: 8,
    description: "Review learning progress and set goals for next quarter",
    status: "upcoming",
  },
  {
    id: "3",
    title: "Cybersecurity Assessment Due",
    type: "deadline",
    date: new Date(2024, 0, 20),
    time: "11:59 PM",
    duration: "Deadline",
    isVirtual: false,
    description: "Final assessment for Cybersecurity Fundamentals course",
    status: "upcoming",
  },
  {
    id: "4",
    title: "Leadership Skills Webinar",
    type: "webinar",
    date: new Date(2024, 0, 22),
    time: "1:00 PM",
    duration: "1.5 hours",
    isVirtual: true,
    attendees: 150,
    description: "Expert-led webinar on modern leadership techniques",
    status: "upcoming",
  },
  {
    id: "5",
    title: "Team Building Workshop",
    type: "course",
    date: new Date(2024, 0, 12),
    time: "9:00 AM",
    duration: "4 hours",
    location: "Training Center",
    isVirtual: false,
    attendees: 30,
    description: "Interactive workshop focused on team collaboration and communication",
    status: "completed",
  },
]

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentView, setCurrentView] = useState<"month" | "week" | "day">("month")

  const getEventTypeColor = (type: Event["type"]) => {
    switch (type) {
      case "course":
        return "bg-charcoal text-alabaster"
      case "meeting":
        return "bg-success-green text-alabaster"
      case "deadline":
        return "bg-red-500 text-alabaster"
      case "webinar":
        return "bg-warning-ochre text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "upcoming":
        return "border-l-charcoal"
      case "completed":
        return "border-l-success-green"
      case "cancelled":
        return "border-l-red-500"
      default:
        return "border-l-warm-gray"
    }
  }

  const upcomingEvents = mockEvents
    .filter((event) => event.status === "upcoming")
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)

  const todayEvents = mockEvents.filter((event) => {
    const today = new Date()
    return event.date.toDateString() === today.toDateString()
  })

  const selectedDateEvents = selectedDate
    ? mockEvents.filter((event) => event.date.toDateString() === selectedDate.toDateString())
    : []

  return (
    <div className="flex-1 space-y-6 p-6" style={{ backgroundColor: "#f5f4ed" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Learning Calendar</h1>
          <p className="text-warm-gray">Manage your learning schedule and upcoming events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-transparent border-warm-gray/30">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent border-warm-gray/30">
            Today
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent border-warm-gray/30">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Today's Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{todayEvents.length}</div>
            <p className="text-xs text-warm-gray">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">This Week</CardTitle>
            <Clock className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">8</div>
            <p className="text-xs text-warm-gray">Learning hours scheduled</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Upcoming Deadlines</CardTitle>
            <Badge className="bg-red-500 text-alabaster">2</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">2</div>
            <p className="text-xs text-warm-gray">Due this week</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Virtual Events</CardTitle>
            <Video className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">3</div>
            <p className="text-xs text-warm-gray">Online sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2 bg-card border-warm-gray/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-charcoal">January 2024</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={currentView === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView("month")}
                  className={
                    currentView === "month" ? "bg-charcoal text-alabaster" : "bg-transparent border-warm-gray/30"
                  }
                >
                  Month
                </Button>
                <Button
                  variant={currentView === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView("week")}
                  className={
                    currentView === "week" ? "bg-charcoal text-alabaster" : "bg-transparent border-warm-gray/30"
                  }
                >
                  Week
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border border-warm-gray/20"
            />
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="bg-card border-warm-gray/20">
          <CardHeader>
            <CardTitle className="text-charcoal">Upcoming Events</CardTitle>
            <CardDescription className="text-warm-gray">Your next learning activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className={`p-3 rounded-lg bg-alabaster border-l-4 ${getStatusColor(event.status)}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-charcoal text-sm">{event.title}</h4>
                  <Badge className={getEventTypeColor(event.type)} variant="secondary">
                    {event.type}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-warm-gray">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{event.date.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {event.time} ({event.duration})
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.isVirtual && (
                    <div className="flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      <span>Virtual Event</span>
                    </div>
                  )}
                  {event.attendees && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{event.attendees} attendees</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Selected Date Events */}
      {selectedDate && selectedDateEvents.length > 0 && (
        <Card className="bg-card border-warm-gray/20">
          <CardHeader>
            <CardTitle className="text-charcoal">Events for {selectedDate.toLocaleDateString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedDateEvents.map((event) => (
                <div key={event.id} className="p-4 rounded-lg bg-alabaster border border-warm-gray/20">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-charcoal">{event.title}</h4>
                    <Badge className={getEventTypeColor(event.type)} variant="secondary">
                      {event.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-warm-gray mb-3">{event.description}</p>
                  <div className="space-y-2 text-sm text-warm-gray">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {event.time} ({event.duration})
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.isVirtual && (
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>Virtual Event</span>
                      </div>
                    )}
                  </div>
                  <Button className="w-full mt-4 bg-charcoal hover:bg-charcoal/90 text-alabaster" size="sm">
                    {event.type === "deadline" ? "View Assignment" : "Join Event"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
