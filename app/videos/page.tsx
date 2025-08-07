'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Play, Clock, User } from 'lucide-react';

interface Video {
  _id: string;
  title: string;
  description: string;
  url: string;
  duration: number;
  // instructor: string;
  topic?: {
    title: string;
  };
  category?: string;
  thumbnail?: string;
  views?: number;
  // rating?: number;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Debug logging for videos state
  useEffect(() => {
    console.log('🔍 Videos state changed:', {
      videos,
      videosType: typeof videos,
      isArray: Array.isArray(videos),
      length: videos?.length,
      videosStringified: JSON.stringify(videos, null, 2),
    });
  }, [videos]);

  // Fetch videos from API
  useEffect(() => {
    const fetchVideos = async () => {
      console.log('🚀 Starting to fetch videos...');
      try {
        setIsLoading(true);
        console.log('📡 Making API request to /api/videos...');

        // Replace with your actual API endpoint
        const response = await fetch('/api/videos');
        console.log('📥 API Response status:', response.status);
        console.log('📥 API Response ok:', response.ok);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch videos: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log('📦 Raw API response data:', data);
        console.log('📦 Data type:', typeof data);
        console.log('📦 Data keys:', Object.keys(data));

        // Check if data.videos exists and is an array
        const videosData = data.videos || data || [];
        console.log('🎬 Videos data before setting:', videosData);
        console.log('🎬 Videos data type:', typeof videosData);
        console.log('🎬 Is videos data array?', Array.isArray(videosData));

        if (!Array.isArray(videosData)) {
          console.error('❌ Videos data is not an array!', videosData);
          throw new Error('Videos data is not an array');
        }

        setVideos(videosData);
        console.log('✅ Successfully set videos state');
      } catch (error) {
        console.error('❌ Error fetching videos:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
        setIsError(true);
        setVideos([]); // Ensure videos is always an array
        console.log('🔄 Set videos to empty array due to error');
      } finally {
        setIsLoading(false);
        console.log('🏁 Finished loading videos');
      }
    };

    fetchVideos();
  }, []);

  // Debug logging for filtering
  console.log('🔍 Before filtering - videos:', {
    videos,
    videosType: typeof videos,
    isArray: Array.isArray(videos),
    length: videos?.length,
  });

  // Filter videos based on category and search query
  const filteredVideos = (() => {
    console.log('🎯 Starting filter process...');
    console.log('🎯 Videos before filter:', videos);
    console.log('🎯 Videos type:', typeof videos);
    console.log('🎯 Is videos array?', Array.isArray(videos));

    if (!Array.isArray(videos)) {
      console.error('❌ Videos is not an array, returning empty array');
      return [];
    }

    console.log('✅ Videos is an array, proceeding with filter');

    const filtered = videos.filter((video) => {
      console.log('🎬 Processing video:', video);

      const matchesCategory =
        selectedCategory === 'All' ||
        (video.topic && video.topic.title === selectedCategory);

      const matchesSearch =
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description.toLowerCase().includes(searchTerm.toLowerCase());

      console.log('🎯 Video filter results:', {
        videoTitle: video.title,
        matchesCategory,
        matchesSearch,
        selectedCategory,
        searchTerm,
      });

      return matchesCategory && matchesSearch;
    });

    console.log('✅ Filtered videos result:', filtered);
    console.log('✅ Filtered videos count:', filtered.length);

    return filtered;
  })();

  // Get unique categories from videos
  const categories = (() => {
    console.log('📂 Generating categories from videos:', videos);
    if (!Array.isArray(videos)) {
      console.log('❌ Videos is not an array, returning default categories');
      return ['All'];
    }

    const categorySet = new Set(
      videos.map((video) => video.topic?.title).filter(Boolean)
    );
    const result = ['All', ...Array.from(categorySet)];
    console.log('📂 Generated categories:', result);
    return result;
  })();

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  console.log('🎨 Rendering component with:', {
    isLoading,
    isError,
    videosLength: videos?.length,
    filteredVideosLength: filteredVideos?.length,
    searchTerm,
    selectedCategory,
  });

  if (isLoading) {
    console.log('⏳ Rendering loading state');
    return (
      <div
        className="flex-1 space-y-6 p-6"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-charcoal mx-auto mb-4"></div>
            <p className="text-warm-gray">Loading videos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    console.log('❌ Rendering error state');
    return (
      <div
        className="flex-1 space-y-6 p-6"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">
              Failed to load videos. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering main content');
  return (
    <div
      className="flex-1 space-y-6 p-6"
      style={{ backgroundColor: '#f5f4ed' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Videos</h1>
          <p className="text-warm-gray">Browse and watch educational videos</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-warm-gray/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
              <Input
                placeholder="Search videos, topics, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-alabaster border-warm-gray/30 focus:border-charcoal"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-48 bg-alabaster border-warm-gray/30">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <Card className="bg-card border-warm-gray/20">
          <CardContent className="p-12">
            <div className="text-center">
              <p className="text-warm-gray text-lg mb-2">
                {searchTerm || selectedCategory !== 'All'
                  ? 'No videos found matching your criteria.'
                  : 'No videos available.'}
              </p>
              {(searchTerm || selectedCategory !== 'All') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <Card
              key={video._id}
              className="bg-card border-warm-gray/20 hover:shadow-lg transition-shadow"
            >
              <CardHeader className="p-0">
                <div className="relative">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-warm-gray/20 rounded-t-lg flex items-center justify-center">
                      <Play className="h-12 w-12 text-warm-gray" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-charcoal text-alabaster text-xs">
                      {formatDuration(video.duration)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg font-semibold text-charcoal mb-2 line-clamp-2">
                  {video.title}
                </CardTitle>
                <p className="text-sm text-warm-gray mb-3 line-clamp-2">
                  {video.description}
                </p>
                <div className="flex items-center justify-between text-xs text-warm-gray">
                  {/* <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{video.instructor}</span>
                  </div> */}
                  {video.views && (
                    <div className="flex items-center gap-1">
                      <span>{video.views} views</span>
                    </div>
                  )}
                </div>
                {video.topic && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {video.topic.title}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
