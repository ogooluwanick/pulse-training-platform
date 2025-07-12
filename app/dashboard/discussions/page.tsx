"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, ThumbsUp, ReplyIcon, Search, Plus, Pin } from "lucide-react"

interface Discussion {
  id: string
  title: string
  content: string
  author: {
    name: string
    avatar?: string
    role: string
  }
  category: "general" | "course-specific" | "help" | "announcements"
  courseTitle?: string
  createdAt: string
  replies: number
  likes: number
  isPinned: boolean
  isAnswered: boolean
  tags: string[]
}

interface DiscussionReply {
  id: string
  content: string
  author: {
    name: string
    avatar?: string
    role: string
  }
  createdAt: string
  likes: number
}

const mockDiscussions: Discussion[] = [
  {
    id: "1",
    title: "Best practices for data encryption in financial services",
    content:
      "I'm working through the Data Privacy course and wondering about industry-specific encryption standards. What are the current best practices for financial institutions?",
    author: {
      name: "Sarah Johnson",
      role: "Analyst",
    },
    category: "course-specific",
    courseTitle: "Data Privacy & GDPR Compliance",
    createdAt: "2 hours ago",
    replies: 8,
    likes: 12,
    isPinned: false,
    isAnswered: true,
    tags: ["encryption", "financial-services", "best-practices"],
  },
  {
    id: "2",
    title: "New Learning Platform Features - January Update",
    content:
      "We're excited to announce new features including improved mobile learning, enhanced progress tracking, and AI-powered course recommendations. Check out the details below!",
    author: {
      name: "Platform Team",
      role: "Administrator",
    },
    category: "announcements",
    createdAt: "1 day ago",
    replies: 15,
    likes: 45,
    isPinned: true,
    isAnswered: false,
    tags: ["announcements", "features", "updates"],
  },
  {
    id: "3",
    title: "Study group for Cybersecurity Fundamentals?",
    content:
      "Anyone interested in forming a study group for the Cybersecurity Fundamentals course? I find it helpful to discuss concepts with peers.",
    author: {
      name: "Mike Chen",
      role: "Developer",
    },
    category: "general",
    courseTitle: "Cybersecurity Fundamentals",
    createdAt: "3 days ago",
    replies: 6,
    likes: 8,
    isPinned: false,
    isAnswered: false,
    tags: ["study-group", "cybersecurity", "collaboration"],
  },
  {
    id: "4",
    title: "Can't access course materials on mobile app",
    content:
      "I'm having trouble accessing course videos on the mobile app. The content loads fine on desktop but won't play on my phone. Has anyone else experienced this?",
    author: {
      name: "Jennifer Park",
      role: "Marketing Specialist",
    },
    category: "help",
    createdAt: "5 days ago",
    replies: 4,
    likes: 3,
    isPinned: false,
    isAnswered: true,
    tags: ["mobile", "technical-issue", "video"],
  },
]

export default function DiscussionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showNewDiscussion, setShowNewDiscussion] = useState(false)

  const getCategoryColor = (category: Discussion["category"]) => {
    switch (category) {
      case "announcements":
        return "bg-warning-ochre text-alabaster"
      case "course-specific":
        return "bg-charcoal text-alabaster"
      case "help":
        return "bg-red-500 text-alabaster"
      case "general":
        return "bg-success-green text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  const filteredDiscussions = mockDiscussions.filter((discussion) => {
    const matchesSearch =
      discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discussion.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discussion.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || discussion.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const pinnedDiscussions = filteredDiscussions.filter((d) => d.isPinned)
  const regularDiscussions = filteredDiscussions.filter((d) => !d.isPinned)

  return (
    <div className="flex-1 space-y-6 p-6" style={{ backgroundColor: "#f5f4ed" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Discussions</h1>
          <p className="text-warm-gray">Connect with peers and get help with your learning</p>
        </div>
        <Button onClick={() => setShowNewDiscussion(true)} className="bg-charcoal hover:bg-charcoal/90 text-alabaster">
          <Plus className="h-4 w-4 mr-2" />
          New Discussion
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3 bg-card border-warm-gray/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
                <Input
                  placeholder="Search discussions, topics, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-alabaster border-warm-gray/30 focus:border-charcoal"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Active Discussions</CardTitle>
            <MessageSquare className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{mockDiscussions.length}</div>
            <p className="text-xs text-warm-gray">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-parchment border border-warm-gray/20">
          <TabsTrigger value="all" className="data-[state=active]:bg-alabaster">
            All Discussions
          </TabsTrigger>
          <TabsTrigger value="course-specific" className="data-[state=active]:bg-alabaster">
            Course Related
          </TabsTrigger>
          <TabsTrigger value="help" className="data-[state=active]:bg-alabaster">
            Help & Support
          </TabsTrigger>
          <TabsTrigger value="announcements" className="data-[state=active]:bg-alabaster">
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Pinned Discussions */}
          {pinnedDiscussions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                <Pin className="h-4 w-4" />
                Pinned Discussions
              </h3>
              {pinnedDiscussions.map((discussion) => (
                <Card key={discussion.id} className="bg-card border-warm-gray/20 shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={discussion.author.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-charcoal text-alabaster">
                          {discussion.author.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-charcoal">{discussion.title}</h3>
                              <Pin className="h-4 w-4 text-warning-ochre" />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-warm-gray">
                              <span>{discussion.author.name}</span>
                              <span>•</span>
                              <span>{discussion.author.role}</span>
                              <span>•</span>
                              <span>{discussion.createdAt}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryColor(discussion.category)} variant="secondary">
                              {discussion.category.replace("-", " ")}
                            </Badge>
                            {discussion.isAnswered && (
                              <Badge className="bg-success-green text-alabaster" variant="secondary">
                                Answered
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-warm-gray">{discussion.content}</p>
                        {discussion.courseTitle && (
                          <Badge variant="outline" className="bg-alabaster border-warm-gray/30">
                            {discussion.courseTitle}
                          </Badge>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {discussion.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs bg-alabaster border-warm-gray/30">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-warm-gray">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{discussion.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ReplyIcon className="h-4 w-4" />
                            <span>{discussion.replies} replies</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-charcoal hover:bg-alabaster">
                            View Discussion
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Regular Discussions */}
          <div className="space-y-4">
            {pinnedDiscussions.length > 0 && (
              <h3 className="text-lg font-semibold text-charcoal">Recent Discussions</h3>
            )}
            {regularDiscussions.map((discussion) => (
              <Card
                key={discussion.id}
                className="bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={discussion.author.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-charcoal text-alabaster">
                        {discussion.author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-charcoal">{discussion.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-warm-gray">
                            <span>{discussion.author.name}</span>
                            <span>•</span>
                            <span>{discussion.author.role}</span>
                            <span>•</span>
                            <span>{discussion.createdAt}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(discussion.category)} variant="secondary">
                            {discussion.category.replace("-", " ")}
                          </Badge>
                          {discussion.isAnswered && (
                            <Badge className="bg-success-green text-alabaster" variant="secondary">
                              Answered
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-warm-gray">{discussion.content}</p>
                      {discussion.courseTitle && (
                        <Badge variant="outline" className="bg-alabaster border-warm-gray/30">
                          {discussion.courseTitle}
                        </Badge>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {discussion.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs bg-alabaster border-warm-gray/30">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-warm-gray">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{discussion.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ReplyIcon className="h-4 w-4" />
                          <span>{discussion.replies} replies</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-charcoal hover:bg-alabaster">
                          View Discussion
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="course-specific" className="space-y-6">
          <div className="space-y-4">
            {mockDiscussions
              .filter((d) => d.category === "course-specific")
              .map((discussion) => (
                <Card
                  key={discussion.id}
                  className="bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={discussion.author.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-charcoal text-alabaster">
                          {discussion.author.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-charcoal">{discussion.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-warm-gray">
                              <span>{discussion.author.name}</span>
                              <span>•</span>
                              <span>{discussion.author.role}</span>
                              <span>•</span>
                              <span>{discussion.createdAt}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryColor(discussion.category)} variant="secondary">
                              Course Related
                            </Badge>
                            {discussion.isAnswered && (
                              <Badge className="bg-success-green text-alabaster" variant="secondary">
                                Answered
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-warm-gray">{discussion.content}</p>
                        {discussion.courseTitle && (
                          <Badge variant="outline" className="bg-alabaster border-warm-gray/30">
                            {discussion.courseTitle}
                          </Badge>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {discussion.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs bg-alabaster border-warm-gray/30">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-warm-gray">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{discussion.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ReplyIcon className="h-4 w-4" />
                            <span>{discussion.replies} replies</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-charcoal hover:bg-alabaster">
                            View Discussion
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="help" className="space-y-6">
          <div className="space-y-4">
            {mockDiscussions
              .filter((d) => d.category === "help")
              .map((discussion) => (
                <Card
                  key={discussion.id}
                  className="bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={discussion.author.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-charcoal text-alabaster">
                          {discussion.author.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-charcoal">{discussion.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-warm-gray">
                              <span>{discussion.author.name}</span>
                              <span>•</span>
                              <span>{discussion.author.role}</span>
                              <span>•</span>
                              <span>{discussion.createdAt}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryColor(discussion.category)} variant="secondary">
                              Help & Support
                            </Badge>
                            {discussion.isAnswered && (
                              <Badge className="bg-success-green text-alabaster" variant="secondary">
                                Answered
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-warm-gray">{discussion.content}</p>
                        <div className="flex flex-wrap gap-1">
                          {discussion.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs bg-alabaster border-warm-gray/30">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-warm-gray">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{discussion.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ReplyIcon className="h-4 w-4" />
                            <span>{discussion.replies} replies</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-charcoal hover:bg-alabaster">
                            View Discussion
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <div className="space-y-4">
            {mockDiscussions
              .filter((d) => d.category === "announcements")
              .map((discussion) => (
                <Card key={discussion.id} className="bg-card border-warm-gray/20 shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={discussion.author.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-charcoal text-alabaster">
                          {discussion.author.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-charcoal">{discussion.title}</h3>
                              {discussion.isPinned && <Pin className="h-4 w-4 text-warning-ochre" />}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-warm-gray">
                              <span>{discussion.author.name}</span>
                              <span>•</span>
                              <span>{discussion.author.role}</span>
                              <span>•</span>
                              <span>{discussion.createdAt}</span>
                            </div>
                          </div>
                          <Badge className={getCategoryColor(discussion.category)} variant="secondary">
                            Announcement
                          </Badge>
                        </div>
                        <p className="text-warm-gray">{discussion.content}</p>
                        <div className="flex flex-wrap gap-1">
                          {discussion.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs bg-alabaster border-warm-gray/30">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-warm-gray">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{discussion.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ReplyIcon className="h-4 w-4" />
                            <span>{discussion.replies} replies</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-charcoal hover:bg-alabaster">
                            View Discussion
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Discussion Modal */}
      {showNewDiscussion && (
        <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-parchment border-warm-gray/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-charcoal">Start a New Discussion</CardTitle>
              <CardDescription className="text-warm-gray">
                Share your thoughts, ask questions, or start a conversation with the community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-charcoal">Title</label>
                <Input
                  placeholder="What would you like to discuss?"
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-charcoal">Content</label>
                <Textarea
                  placeholder="Share your thoughts, questions, or ideas..."
                  rows={6}
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-charcoal">Tags</label>
                <Input
                  placeholder="Add tags separated by commas (e.g., cybersecurity, help, discussion)"
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="bg-charcoal hover:bg-charcoal/90 text-alabaster">Post Discussion</Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewDiscussion(false)}
                  className="bg-alabaster border-warm-gray/30 hover:bg-parchment"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
