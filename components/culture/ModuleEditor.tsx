'use client';

import { Module } from '@/types/culture';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import QuizBuilder from './QuizBuilder';
import {
  Trash2,
  Plus,
  GripVertical,
  Save,
  Settings,
  FileText,
  Video,
  Image,
} from 'lucide-react';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import MediaUploader from './MediaUploader';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface Lesson {
  id: string;
  title: string;
  type: 'text' | 'video' | 'image';
  content: string;
  duration: number;
  quiz?: {
    title: string;
    questions: any[];
  };
}

interface ModuleEditorProps {
  module: Module | null;
  onUpdate: (module: Module) => void;
  onDelete: (moduleId: string) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export default function ModuleEditor({
  module,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: ModuleEditorProps) {
  // Basic module info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(
    'draft'
  );
  const [difficulty, setDifficulty] = useState<
    'Beginner' | 'Intermediate' | 'Advanced'
  >('Beginner');

  // Lessons
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Final quiz
  const [finalQuiz, setFinalQuiz] = useState<{
    title: string;
    questions: any[];
  } | null>(null);

  // UI state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description || '');
      setTags(module.tags || []);
      setStatus(module.status || 'draft');
      setDifficulty(module.difficulty || 'Beginner');

      // Load lessons from the module
      if (module.lessons && module.lessons.length > 0) {
        const loadedLessons: Lesson[] = module.lessons.map((lesson, index) => ({
          id: lesson._id || `lesson-${index + 1}`,
          title: lesson.title,
          type: lesson.type,
          content: lesson.content,
          duration: lesson.duration,
          quiz: lesson.quiz
            ? {
                title: lesson.quiz.title,
                questions: lesson.quiz.questions,
              }
            : undefined,
        }));
        setLessons(loadedLessons);
        setSelectedLessonId(loadedLessons[0]?.id || null);
      } else if (module.content || module.quiz.length > 0) {
        // Backward compatibility: convert legacy format to lesson
        const mainLesson: Lesson = {
          id: 'lesson-1',
          title: module.title || 'Main Content',
          type: 'text',
          content: module.content,
          duration: 5,
          quiz:
            module.quiz.length > 0
              ? {
                  title: 'Lesson Quiz',
                  questions: module.quiz,
                }
              : undefined,
        };
        setLessons([mainLesson]);
        setSelectedLessonId('lesson-1');
      } else {
        setLessons([]);
        setSelectedLessonId(null);
      }

      // Load final quiz
      if (module.finalQuiz) {
        setFinalQuiz({
          title: module.finalQuiz.title,
          questions: module.finalQuiz.questions,
        });
      } else {
        setFinalQuiz(null);
      }
    }
  }, [module]);

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-warm-gray p-8">
        <Settings className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-xl mb-2">Select a culture module to begin</p>
        <p className="text-sm">or create a new one to get started</p>
      </div>
    );
  }

  const handleSaveChanges = () => {
    if (module) {
      // Create the full updated module with all new features
      const updatedModule: Module = {
        ...module,
        title,
        description,
        tags,
        status,
        difficulty,
        lessons: lessons.map((lesson) => ({
          _id: lesson.id,
          title: lesson.title,
          type: lesson.type,
          content: lesson.content,
          duration: lesson.duration,
          quiz: lesson.quiz
            ? {
                title: lesson.quiz.title,
                questions: lesson.quiz.questions,
              }
            : undefined,
        })),
        finalQuiz: finalQuiz
          ? {
              title: finalQuiz.title,
              questions: finalQuiz.questions,
            }
          : undefined,
        // For backward compatibility, keep content and quiz from primary lesson
        content: lessons[0]?.content || '',
        quiz: lessons[0]?.quiz?.questions || [],
      };

      onUpdate(updatedModule);
    }
  };

  const handleAddLesson = () => {
    const lessonNumber = lessons.length + 1;
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: `Lesson ${lessonNumber}`,
      type: 'text',
      content: 'Start writing your lesson content here...',
      duration: 5,
    };
    setLessons([...lessons, newLesson]);
    setSelectedLessonId(newLesson.id);
    setActiveTab('lessons');
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessons(lessons.filter((l) => l.id !== lessonId));
    if (selectedLessonId === lessonId) {
      setSelectedLessonId(lessons.length > 1 ? lessons[0].id : null);
    }
  };

  const handleUpdateLesson = (lessonId: string, updates: Partial<Lesson>) => {
    setLessons(
      lessons.map((lesson) => {
        if (lesson.id === lessonId) {
          const updatedLesson = { ...lesson, ...updates };

          // Clear content when switching lesson types
          if (updates.type && updates.type !== lesson.type) {
            if (updates.type === 'text') {
              updatedLesson.content =
                'Start writing your lesson content here...';
            } else {
              updatedLesson.content = ''; // Clear content for media types
            }
          }

          return updatedLesson;
        }
        return lesson;
      })
    );
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const selectedLesson = lessons.find((l) => l.id === selectedLessonId);
  const totalDuration = lessons.reduce(
    (total, lesson) => total + lesson.duration,
    0
  );

  return (
    <div className="h-full flex flex-col bg-parchment">
      <div className="border-b border-warm-gray/20 bg-white">
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-3xl font-bold text-charcoal">
                Culture Module Editor
              </h1>
              <Badge variant={status === 'published' ? 'default' : 'secondary'}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsDeleteModalOpen(true)}
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-600"
                disabled={isUpdating || isDeleting}
              >
                <Trash2 size={16} className="mr-2" />
                Delete Module
              </Button>
              <Button
                onClick={handleSaveChanges}
                className="bg-charcoal text-white hover:bg-charcoal/90"
                disabled={isUpdating || isDeleting}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 gap-1">
              <TabsTrigger
                className="px-4 py-2 rounded-md border border-charcoal text-charcoal data-[state=active]:bg-charcoal data-[state=active]:text-white data-[state=active]:hover:opacity-80 hover:bg-charcoal hover:text-white transition-colors"
                value="overview"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                className="px-4 py-2 rounded-md border border-charcoal text-charcoal data-[state=active]:bg-charcoal data-[state=active]:text-white data-[state=active]:hover:opacity-80 hover:bg-charcoal hover:text-white transition-colors"
                value="lessons"
              >
                Lessons ({lessons.length})
              </TabsTrigger>
              <TabsTrigger
                className="px-4 py-2 rounded-md border border-charcoal text-charcoal data-[state=active]:bg-charcoal data-[state=active]:text-white data-[state=active]:hover:opacity-80 hover:bg-charcoal hover:text-white transition-colors"
                value="final-quiz"
              >
                Final Quiz
              </TabsTrigger>
              <TabsTrigger
                className="px-4 py-2 rounded-md border border-charcoal text-charcoal data-[state=active]:bg-charcoal data-[state=active]:text-white data-[state=active]:hover:opacity-80 hover:bg-charcoal hover:text-white transition-colors"
                value="settings"
              >
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Module Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter module title"
                    className="text-xl font-semibold"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this culture module covers..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button onClick={handleAddTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-xs hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Module Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-charcoal">
                      {lessons.length}
                    </div>
                    <div className="text-sm text-warm-gray">Lessons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-charcoal">
                      {totalDuration}
                    </div>
                    <div className="text-sm text-warm-gray">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-charcoal">
                      {lessons.filter((l) => l.quiz).length +
                        (finalQuiz ? 1 : 0)}
                    </div>
                    <div className="text-sm text-warm-gray">Quizzes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="p-6">
            <div className="flex gap-6 h-full">
              {/* Lessons List */}
              <div className="w-1/3">
                <div className="flex flex-wrapitems-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Lessons</h3>
                  <Button onClick={handleAddLesson} size="sm">
                    <Plus size={16} className="mr-2" />
                    Add Lesson
                  </Button>
                </div>

                <div className="space-y-2">
                  {lessons.map((lesson, index) => (
                    <Card
                      key={lesson.id}
                      className={`cursor-pointer transition-all ${
                        selectedLessonId === lesson.id
                          ? 'ring-2 ring-charcoal'
                          : ''
                      }`}
                      onClick={() => setSelectedLessonId(lesson.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <GripVertical size={16} className="text-warm-gray" />
                          <div className="flex items-center gap-2">
                            {lesson.type === 'video' ? (
                              <Video size={16} className="text-blue-500" />
                            ) : lesson.type === 'image' ? (
                              <Image size={16} className="text-green-500" />
                            ) : (
                              <FileText size={16} className="text-charcoal" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{lesson.title}</div>
                            <div className="text-sm text-warm-gray">
                              {lesson.duration} min •{' '}
                              {lesson.type.charAt(0).toUpperCase() +
                                lesson.type.slice(1)}
                              {lesson.quiz && ' • Has Quiz'}
                              {lesson.type !== 'text' &&
                                lesson.content &&
                                ' • Media Added'}
                            </div>
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLesson(lesson.id);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Lesson Editor */}
              <div className="flex-1">
                {selectedLesson ? (
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Edit Lesson</CardTitle>
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedLesson.type}
                            onValueChange={(
                              value: 'text' | 'video' | 'image'
                            ) =>
                              handleUpdateLesson(selectedLesson.id, {
                                type: value,
                              })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3">
                          <Label>Lesson Title</Label>
                          <Input
                            value={selectedLesson.title}
                            onChange={(e) =>
                              handleUpdateLesson(selectedLesson.id, {
                                title: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            value={selectedLesson.duration}
                            onChange={(e) =>
                              handleUpdateLesson(selectedLesson.id, {
                                duration: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Content</Label>
                          <span className="text-xs text-warm-gray">
                            {selectedLesson.type === 'text' &&
                              'Rich text editor with formatting options'}
                            {selectedLesson.type === 'video' &&
                              'Upload video file or provide video URL'}
                            {selectedLesson.type === 'image' &&
                              'Upload image file or provide image URL'}
                          </span>
                        </div>
                        {selectedLesson.type === 'text' ? (
                          <div className="quill-light-theme">
                            <ReactQuill
                              value={selectedLesson.content}
                              onChange={(content) =>
                                handleUpdateLesson(selectedLesson.id, {
                                  content,
                                })
                              }
                              theme="snow"
                              modules={{
                                toolbar: [
                                  [{ header: [1, 2, false] }],
                                  [
                                    'bold',
                                    'italic',
                                    'underline',
                                    'strike',
                                    'blockquote',
                                  ],
                                  [{ list: 'ordered' }, { list: 'bullet' }],
                                  ['link', 'image'],
                                  ['clean'],
                                ],
                              }}
                            />
                          </div>
                        ) : (
                          <MediaUploader
                            lessonType={selectedLesson.type}
                            currentUrl={selectedLesson.content}
                            moduleId={module.id}
                            lessonId={selectedLesson.id}
                            onUrlChange={(url) =>
                              handleUpdateLesson(selectedLesson.id, {
                                content: url,
                              })
                            }
                          />
                        )}
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-base font-semibold">
                          Lesson Quiz
                        </Label>
                        <QuizBuilder
                          quiz={selectedLesson.quiz?.questions || []}
                          onUpdateQuiz={(questions) =>
                            handleUpdateLesson(selectedLesson.id, {
                              quiz:
                                questions.length > 0
                                  ? {
                                      title: 'Lesson Quiz',
                                      questions,
                                    }
                                  : undefined,
                            })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent>
                      <div className="text-center text-warm-gray">
                        <Plus size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Select a lesson to edit or create a new one</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Final Quiz Tab */}
          <TabsContent value="final-quiz" className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Final Quiz</CardTitle>
                <p className="text-sm text-warm-gray">
                  Create a comprehensive quiz that covers the entire culture
                  module
                </p>
              </CardHeader>
              <CardContent>
                <QuizBuilder
                  quiz={finalQuiz?.questions || []}
                  onUpdateQuiz={(questions) =>
                    setFinalQuiz(
                      questions.length > 0
                        ? {
                            title: 'Final Assessment',
                            questions,
                          }
                        : null
                    )
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Module Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value: any) => setStatus(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Difficulty</Label>
                    <Select
                      value={difficulty}
                      onValueChange={(value: any) => setDifficulty(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDelete(module.id);
          setIsDeleteModalOpen(false);
        }}
      />
    </div>
  );
}
