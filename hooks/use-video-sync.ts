import { useRef, useEffect } from "react";
import type { Camera, PendingSeek } from "@/types";

interface UseVideoSyncProps {
  cameras: Camera[];
  videoRefs: React.MutableRefObject<(HTMLVideoElement | null)[]>;
  activeIndex: number;
  isLiveStream: React.MutableRefObject<boolean[]>;
}

export const useVideoSync = ({ cameras, videoRefs, activeIndex, isLiveStream }: UseVideoSyncProps) => {
  const pendingSeeks = useRef<PendingSeek[]>(cameras.map(() => null));

  const syncTime = (sourceIndex: number, targetIndex: number) => {
    const sourceVideo = videoRefs.current[sourceIndex];
    const targetVideo = videoRefs.current[targetIndex];
    if (!sourceVideo || !targetVideo) return;

    const live = isLiveStream.current[targetIndex];
    if (live) {
      return;
    }

    const time = sourceVideo.currentTime;
    if (targetVideo.readyState >= 2) {
      targetVideo.currentTime = time;
      pendingSeeks.current[targetIndex] = null;
    } else {
      pendingSeeks.current[targetIndex] = { time, retry: 3 };
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const activeVideo = videoRefs.current[activeIndex];
      if (!activeVideo) return;

      videoRefs.current.forEach((video, index) => {
        if (index === activeIndex || !video) return;
        if (isLiveStream.current[index]) return;

        const drift = Math.abs(video.currentTime - activeVideo.currentTime);
        if (drift > 0.5) {
          if (video.readyState >= 2) {
            video.currentTime = activeVideo.currentTime;
          } else {
            pendingSeeks.current[index] = { time: activeVideo.currentTime, retry: 3 };
          }
        }

        const pending = pendingSeeks.current[index];
        if (pending && video.readyState >= 2) {
          video.currentTime = pending.time;
          pendingSeeks.current[index] = null;
        } else if (pending) {
          pending.retry -= 1;
          if (pending.retry <= 0) {
            pendingSeeks.current[index] = null;
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeIndex, videoRefs, isLiveStream]);

  return { syncTime };
};
