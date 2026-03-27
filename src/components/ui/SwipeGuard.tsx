"use client";

import { useEffect } from "react";

/**
 * Blocks iOS Safari's edge-swipe back/forward navigation gesture.
 * CSS touch-action/overscroll-behavior cannot suppress the system-level
 * edge zones (~30px from screen edge), so we use a passive:false touchmove
 * listener that only cancels touches that started near the edge and are
 * moving more horizontally than vertically.
 */
export default function SwipeGuard() {
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onMove = (e: TouchEvent) => {
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      const nearEdge = startX < 30 || startX > window.innerWidth - 30;
      if (nearEdge && dx > dy && dx > 5) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
    };
  }, []);

  return null;
}
