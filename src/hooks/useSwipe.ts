import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
}

export const useSwipe = ({ onSwipeLeft, onSwipeRight }: SwipeHandlers) => {
  const touchState = useRef<TouchState | null>(null);
  const minSwipeDistance = 50;
  const maxSwipeTime = 300;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchState.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      startTime: Date.now(),
    };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchState.current) return;

    const { startX, startY, startTime } = touchState.current;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const elapsedTime = Date.now() - startTime;

    const diffX = endX - startX;
    const diffY = endY - startY;

    // Only trigger if horizontal swipe is greater than vertical (to not interfere with scroll)
    if (Math.abs(diffX) > Math.abs(diffY) && elapsedTime < maxSwipeTime) {
      if (diffX > minSwipeDistance && onSwipeRight) {
        onSwipeRight();
      } else if (diffX < -minSwipeDistance && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    touchState.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart,
    onTouchEnd,
  };
};
