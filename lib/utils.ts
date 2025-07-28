import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// YouTube URL validation
export const isYouTubeUrl = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+(&[\w=]*)?$/;
  return youtubeRegex.test(url);
};

// Utility function to consistently format instructor names
export const getInstructorName = (instructor: { name: string } | string | null | undefined): string => {
  if (!instructor) return 'Pulse Platform';
  if (typeof instructor === 'string') return instructor || 'Pulse Platform';
  return instructor.name || 'Pulse Platform';
};
