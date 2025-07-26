'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload,
  Link,
  X,
  Play,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface MediaUploaderProps {
  lessonType: 'video' | 'image';
  currentUrl?: string;
  moduleId: string;
  lessonId: string;
  onUrlChange: (url: string) => void;
}

interface UploadResponse {
  success: boolean;
  url: string;
  publicId: string;
  fileInfo: {
    originalName: string;
    size: number;
    type: string;
    width?: number;
    height?: number;
    format: string;
    resourceType: string;
    bytes: number;
  };
  message: string;
  error?: string;
  details?: string;
}

export default function MediaUploader({
  lessonType,
  currentUrl = '',
  moduleId,
  lessonId,
  onUrlChange,
}: MediaUploaderProps) {
  const [url, setUrl] = useState(currentUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = () => {
    if (url.trim()) {
      onUrlChange(url.trim());
      toast.success(
        `${lessonType.charAt(0).toUpperCase() + lessonType.slice(1)} URL saved`
      );
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lessonType', lessonType);
      formData.append('moduleId', moduleId);
      formData.append('lessonId', lessonId);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/company/culture/upload-media', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data: UploadResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Upload failed');
      }

      if (data.success && data.url) {
        setUrl(data.url);
        onUrlChange(data.url);
        toast.success(
          data.message ||
            `${lessonType.charAt(0).toUpperCase() + lessonType.slice(1)} uploaded successfully`
        );
      } else {
        throw new Error('Upload failed - no URL returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearMedia = () => {
    setUrl('');
    onUrlChange('');
    toast.success(
      `${lessonType.charAt(0).toUpperCase() + lessonType.slice(1)} removed`
    );
  };

  const getAcceptedTypes = () => {
    return lessonType === 'video'
      ? 'video/mp4,video/webm,video/ogg,video/avi,video/mov'
      : 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
  };

  const getMaxSize = () => {
    return lessonType === 'video' ? '100MB' : '10MB';
  };

  const getSupportedFormats = () => {
    return lessonType === 'video'
      ? 'MP4, WebM, OGG, AVI, MOV'
      : 'JPEG, PNG, GIF, WebP';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          {lessonType === 'video' ? 'Video Content' : 'Image Content'}
        </Label>
        {url && (
          <Button
            onClick={handleClearMedia}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
          >
            <X size={16} className="mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Current Media Preview */}
      {url && !isUploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-warm-gray">Current {lessonType}:</p>
              {lessonType === 'video' ? (
                <div className="relative bg-black rounded-md overflow-hidden">
                  <video
                    src={url}
                    className="w-full h-48 object-contain"
                    controls
                    preload="metadata"
                  />
                </div>
              ) : (
                <div className="relative bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={url}
                    alt="Lesson content"
                    className="w-full h-48 object-contain"
                  />
                </div>
              )}
              <p className="text-xs text-warm-gray break-all">{url}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Uploading {lessonType}...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-charcoal h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-warm-gray">{uploadProgress}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload/URL Input Tabs */}
      {!isUploading && (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="url">Enter URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-warm-gray/30 rounded-lg p-8 text-center cursor-pointer hover:border-charcoal/50 transition-colors"
                    onClick={handleFileSelect}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {lessonType === 'video' ? (
                        <Play className="h-12 w-12 text-warm-gray" />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-warm-gray" />
                      )}
                      <p className="text-lg font-semibold text-charcoal">
                        Click to upload {lessonType}
                      </p>
                      <p className="text-sm text-warm-gray">
                        or drag and drop your file here
                      </p>
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-sm text-warm-gray">
                      Supported formats: {getSupportedFormats()}
                    </p>
                    <p className="text-xs text-warm-gray">
                      Maximum file size: {getMaxSize()}
                    </p>
                  </div>

                  <Button
                    onClick={handleFileSelect}
                    className="w-full"
                    disabled={isUploading}
                  >
                    <Upload size={16} className="mr-2" />
                    Choose {lessonType === 'video' ? 'Video' : 'Image'} File
                  </Button>
                </div>
              </CardContent>
            </Card>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={getAcceptedTypes()}
              onChange={handleFileUpload}
            />
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="media-url">
                      {lessonType === 'video' ? 'Video URL' : 'Image URL'}
                    </Label>
                    <Input
                      id="media-url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={`Enter ${lessonType} URL (e.g., https://example.com/${lessonType}.${lessonType === 'video' ? 'mp4' : 'jpg'})`}
                      className="mt-2"
                    />
                  </div>

                  <p className="text-sm text-warm-gray">
                    Paste a direct link to your {lessonType} file from any
                    hosting service.
                  </p>

                  <Button
                    onClick={handleUrlSubmit}
                    className="w-full"
                    disabled={!url.trim()}
                  >
                    <Link size={16} className="mr-2" />
                    Save {lessonType === 'video' ? 'Video' : 'Image'} URL
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
