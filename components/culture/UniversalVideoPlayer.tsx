'use client';

import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import ReactPlayer from 'react-player'


interface UniversalVideoPlayerProps {
  url: string;
  className?: string;
  width?: string | number;
  height?: string | number;
}

export default function UniversalVideoPlayer({
  url,
  className = '',
  width = '100%',
  height = '240px',
}: UniversalVideoPlayerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            <p className="text-gray-600">Initializing player...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!url || url.trim() === '') {
    return (
      <Card className={`border-dashed border-gray-300 ${className}`}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Play size={48} className="text-gray-400" />
            <p className="text-gray-600 font-medium">No video URL provided</p>
            <p className="text-sm text-gray-500">
              Add a video URL to see the preview
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <ReactPlayer src={url} width={width} height={height} controls />
      </CardContent>
    </Card>
  );
}
