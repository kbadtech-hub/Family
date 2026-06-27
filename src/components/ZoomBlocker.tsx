'use client';

import { useEffect } from 'react';

export default function ZoomBlocker() {
  useEffect(() => {
    // 1. Block Ctrl + Mouse Wheel Zoom (Desktop)
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // 2. Block Keyboard Ctrl + Plus/Minus/Zero Zoom (Desktop)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey &&
        (e.key === '=' || e.key === '-' || e.key === '+' || e.key === '0')
      ) {
        e.preventDefault();
      }
    };

    // 3. Block Touchmove Pinch-to-Zoom (Mobile & Tablet)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 4. Block iOS Safari Gesture Zooming (Mobile & Tablet)
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    // Register active listeners (passive: false is required to allow preventDefault)
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('gesturestart', handleGesture, { passive: false });
    document.addEventListener('gesturechange', handleGesture, { passive: false });
    document.addEventListener('gestureend', handleGesture, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('gesturestart', handleGesture);
      document.removeEventListener('gesturechange', handleGesture);
      document.removeEventListener('gestureend', handleGesture);
    };
  }, []);

  return null;
}
