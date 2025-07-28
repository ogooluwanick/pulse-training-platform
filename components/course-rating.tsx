'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';

interface CourseRatingProps {
  courseId: string;
  averageRating?: number;
  totalRatings?: number;
  userRating?: number | null;
  onRatingSubmit?: (rating: number) => void;
  showRatingForm?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating = ({ rating, setRating, readonly = false, size = 'md' }: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <Star
            key={star}
            className={`${sizeClasses[size]} cursor-pointer transition-colors ${
              isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${readonly ? 'cursor-default' : 'hover:text-yellow-400'}`}
            onClick={() => !readonly && setRating?.(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
          />
        );
      })}
    </div>
  );
};

export default function CourseRating({
  courseId,
  averageRating = 0,
  totalRatings = 0,
  userRating = null,
  onRatingSubmit,
  showRatingForm = false,
  size = 'md',
}: CourseRatingProps) {
  const [currentRating, setCurrentRating] = useState(userRating || 0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(showRatingForm);

  const handleSubmitRating = async () => {
    if (currentRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/course/${courseId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating: currentRating }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit rating');
      }

      const result = await response.json();
      toast.success('Rating submitted successfully!');
      setShowForm(false);
      onRatingSubmit?.(currentRating);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showForm) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">Rate this course</CardTitle>
          <CardDescription>
            Help other learners by sharing your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your rating</label>
            <StarRating
              rating={currentRating}
              setRating={setCurrentRating}
              size={size}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Comments (optional)</label>
            <Textarea
              placeholder="What did you think about this course?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmitRating}
              disabled={isSubmitting || currentRating === 0}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <StarRating rating={averageRating} readonly size={size} />
      <span className="text-sm text-gray-600">
        {averageRating > 0 ? (
          <>
            {averageRating.toFixed(1)} ({totalRatings} rating{totalRatings !== 1 ? 's' : ''})
          </>
        ) : (
          'No ratings yet'
        )}
      </span>
      {userRating && (
        <span className="text-xs text-blue-600 ml-2">
          You rated: {userRating} star{userRating !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

export { StarRating };
