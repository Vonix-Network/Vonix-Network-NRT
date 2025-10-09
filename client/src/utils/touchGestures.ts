import React from 'react';

export interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
}

export class TouchGestureHandler {
  private element: HTMLElement;
  private options: TouchGestureOptions;
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;
  private longPressTimer: NodeJS.Timeout | null = null;
  private lastTapTime: number = 0;
  private tapCount: number = 0;

  constructor(element: HTMLElement, options: TouchGestureOptions) {
    this.element = element;
    this.options = {
      swipeThreshold: 50,
      longPressDelay: 500,
      ...options
    };

    this.bindEvents();
  }

  private bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
  }

  private handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();

    // Start long press timer
    if (this.options.onLongPress) {
      this.longPressTimer = setTimeout(() => {
        this.options.onLongPress?.();
        this.longPressTimer = null;
      }, this.options.longPressDelay);
    }
  }

  private handleTouchMove(event: TouchEvent) {
    // Cancel long press if finger moves
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // Prevent default scrolling for certain gestures
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.startX);
    const deltaY = Math.abs(touch.clientY - this.startY);

    // If horizontal swipe is more prominent, prevent vertical scroll
    if (deltaX > deltaY && deltaX > 20) {
      event.preventDefault();
    }
  }

  private handleTouchEnd(event: TouchEvent) {
    // Cancel long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const touch = event.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const deltaTime = endTime - this.startTime;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check for swipe gestures
    if (absDeltaX > (this.options.swipeThreshold || 50) || absDeltaY > (this.options.swipeThreshold || 50)) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.options.onSwipeRight?.();
        } else {
          this.options.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.options.onSwipeDown?.();
        } else {
          this.options.onSwipeUp?.();
        }
      }
      return;
    }

    // Check for tap gestures (small movement and quick)
    if (absDeltaX < 10 && absDeltaY < 10 && deltaTime < 300) {
      const currentTime = Date.now();
      
      if (currentTime - this.lastTapTime < 300) {
        // Double tap
        this.tapCount++;
        if (this.tapCount === 2) {
          this.options.onDoubleTap?.();
          this.tapCount = 0;
          return;
        }
      } else {
        this.tapCount = 1;
      }

      this.lastTapTime = currentTime;

      // Single tap (with delay to check for double tap)
      setTimeout(() => {
        if (this.tapCount === 1) {
          this.options.onTap?.();
          this.tapCount = 0;
        }
      }, 300);
    }
  }

  private handleTouchCancel() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
  }
}

// React hook for touch gestures
export const useTouchGestures = (options: TouchGestureOptions) => {
  const ref = React.useRef<HTMLElement>(null);
  const gestureHandler = React.useRef<TouchGestureHandler | null>(null);

  React.useEffect(() => {
    if (ref.current) {
      gestureHandler.current = new TouchGestureHandler(ref.current, options);
    }

    return () => {
      gestureHandler.current?.destroy();
    };
  }, [options]);

  return ref;
};

// Utility functions for common mobile interactions
export const addPullToRefresh = (
  element: HTMLElement,
  onRefresh: () => Promise<void>,
  threshold: number = 80
) => {
  let startY = 0;
  let currentY = 0;
  let isRefreshing = false;

  const handleTouchStart = (e: TouchEvent) => {
    if (element.scrollTop === 0) {
      startY = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (element.scrollTop === 0 && !isRefreshing) {
      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      if (pullDistance > 0) {
        e.preventDefault();
        
        // Add visual feedback
        element.style.transform = `translateY(${Math.min(pullDistance * 0.5, threshold)}px)`;
        element.style.transition = 'none';

        if (pullDistance > threshold) {
          element.style.background = 'rgba(0, 217, 126, 0.1)';
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    if (element.scrollTop === 0 && !isRefreshing) {
      const pullDistance = currentY - startY;

      element.style.transition = 'transform 0.3s ease, background 0.3s ease';

      if (pullDistance > threshold) {
        isRefreshing = true;
        element.style.transform = `translateY(${threshold * 0.5}px)`;
        
        try {
          await onRefresh();
        } finally {
          isRefreshing = false;
          element.style.transform = 'translateY(0)';
          element.style.background = '';
        }
      } else {
        element.style.transform = 'translateY(0)';
        element.style.background = '';
      }
    }
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: false });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd);

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
};

// Add haptic feedback for supported devices
export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    navigator.vibrate(patterns[type]);
  }
};
