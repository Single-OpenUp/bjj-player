import { useRef, useState } from "react";

export const useControlsVisibility = () => {
  const [showControls, setShowControls] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = () => {
    setShowControls(true);

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    hideTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    leaveTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 1000);
  };

  return { showControls, handleMouseMove, handleMouseLeave };
};
