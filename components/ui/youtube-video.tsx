'use client';

import { AspectRatio } from '@/components/ui/aspect-ratio';

interface YouTubeVideoProps {
  url: string;
  className?: string;
}

export function YouTubeVideo({ url, className }: YouTubeVideoProps) {
  // Extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center p-8 ${className}`}>
        <p className="text-gray-500">Invalid YouTube URL</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className={`w-full ${className}`}>
      <AspectRatio ratio={16 / 9} className="rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        />
      </AspectRatio>
    </div>
  );
} 