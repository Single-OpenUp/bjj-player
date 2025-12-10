import { useState, useCallback } from "react";

export const useFullscreen = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, [containerRef]);

  return { isFullscreen, toggleFullscreen };
};
