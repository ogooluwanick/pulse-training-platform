"use client";

import React, { useRef, useEffect, useState } from 'react';
import clsx from 'clsx';

export default function AnimatedDiv({ children, className, ...props }: { children?: React.ReactNode; className?: string; } & React.ComponentProps<'div'>) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Optional: unobserve after it becomes visible if you only want the animation once
          // observer.unobserve(ref.current);
        }
      },
      {
        threshold: 0.1 // Trigger when 10% of the element is visible
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    // Cleanup the observer on component unmount
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  // Base classes for the element
  const baseClasses = "absolute h-full w-full bg-red-100 rounded-3xl transition-transform duration-300";
  // Classes to apply when the element is in view
  const inViewClasses = "translate-x-3 translate-y-3";
  // Classes to apply on hover to revert the translation
  const hoverClasses = "group-hover:translate-x-0 group-hover:translate-y-0";

  // Combine all classes, applying inViewClasses only when isVisible is true
  const combinedClasses = clsx(
    baseClasses,
    isVisible ? inViewClasses : "", // Apply translation when visible
    hoverClasses, // Apply hover effect
    className // User-provided classes
  );

  return (
    <div ref={ref} className={combinedClasses} {...props}>
      {children}
    </div>
  );
}
