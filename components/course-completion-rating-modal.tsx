'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Star, Award, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

interface CourseCompletionRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  onRatingSubmit?: (rating: number) => void;
}

const ratingLabels = {
  1: {
    label: 'Poor',
    description: 'Not what I expected',
    color: 'text-red-600',
  },
  2: {
    label: 'Fair',
    description: 'Below average quality',
    color: 'text-orange-600',
  },
  3: {
    label: 'Good',
    description: 'Meets expectations',
    color: 'text-yellow-600',
  },
  4: {
    label: 'Very Good',
    description: 'Above average quality',
    color: 'text-blue-600',
  },
  5: {
    label: 'Excellent',
    description: 'Outstanding course!',
    color: 'text-green-600',
  },
};

export default function CourseCompletionRatingModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  onRatingSubmit,
}: CourseCompletionRatingModalProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleStarHover = (rating: number) => {
    setHoverRating(rating);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const ratingMutation = useMutation({
    mutationFn: async (rating: number) => {
      const response = await fetch(`/api/course/${courseId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit rating');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      onRatingSubmit?.(selectedRating);
      onClose();
    },
    onError: (error) => {
      console.error('Error submitting rating:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit rating'
      );
    },
  });

  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    ratingMutation.mutate(selectedRating);
  };

  const handleSkip = () => {
    onClose();
  };

  const currentRating = hoverRating || selectedRating;
  const currentLabel =
    currentRating > 0
      ? ratingLabels[currentRating as keyof typeof ratingLabels]
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-parchment border-warm-gray/20 shadow-xl max-w-md max-h-[90vh] overflow-y-auto rounded-lg p-0"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <div className="p-6 space-y-6">
          {/* Header with Success Icon */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-success-green/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success-green" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-charcoal">
                Congratulations!
              </h2>
              <p className="text-warm-gray">You've successfully completed</p>
              <h3 className="text-lg font-semibold text-charcoal px-2">
                {courseTitle}
              </h3>
            </div>

            <Badge className="bg-success-green/10 text-success-green border-success-green/20">
              <Award className="w-3 h-3 mr-1" />
              Course Completed
            </Badge>
          </div>

          {/* Rating Section */}
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-charcoal mb-2">
                How would you rate this course?
              </h4>
              <p className="text-sm text-warm-gray">
                Your feedback helps us improve the learning experience
              </p>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= currentRating;
                const isActive = star <= selectedRating;

                return (
                  <button
                    key={star}
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    onMouseLeave={handleStarLeave}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-success-green/20 rounded"
                    disabled={ratingMutation.isPending}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        isFilled
                          ? 'fill-warning-ochre text-warning-ochre'
                          : 'text-warm-gray/40 hover:text-warning-ochre/60'
                      } ${isActive ? 'drop-shadow-sm' : ''}`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Rating Label */}
            {currentLabel && (
              <div className="text-center space-y-2 min-h-[60px] flex flex-col justify-center">
                <div className={`text-lg font-semibold ${currentLabel.color}`}>
                  {currentLabel.label}
                </div>
                <div className="text-sm text-warm-gray">
                  {currentLabel.description}
                </div>
              </div>
            )}

            {!currentLabel && (
              <div className="min-h-[60px] flex items-center justify-center">
                <p className="text-sm text-warm-gray/60">
                  Click on the stars to rate
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={ratingMutation.isPending}
              className="flex-1 border-warm-gray/30 bg-transparent hover:bg-warm-gray/5 text-warm-gray"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={ratingMutation.isPending || selectedRating === 0}
              className="flex-1 bg-charcoal hover:bg-charcoal/90 text-alabaster disabled:opacity-50"
            >
              {ratingMutation.isPending ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>

          {/* Footer Message */}
          <div className="text-center">
            <p className="text-xs text-warm-gray/60">
              Keep up the great work on your learning journey!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
