"use client";

import { useEffect } from "react";

/**
 * Prevents the browser's swipe-left/right navigation gesture
 * by intercepting horizontal touch movements near screen edges.
 */
export function usePreventSwipeBack() {
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      // If horizontal swipe is dominant and started near left/right edge, prevent it
      if (Math.abs(dx) > Math.abs(dy)) {
        const edgeThreshold = 30;
        if (startX < edgeThreshold || startX > window.innerWidth - edgeThreshold) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);
}
