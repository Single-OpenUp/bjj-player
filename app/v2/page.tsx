"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildCameraList, buildHlsMasterSrc } from "@/utils";
import { useControlsVisibility, useFullscreen, useHLSPlayer, useVideoSync } from "@/hooks";
import { Video, CameraSelector, Header } from "@/components";

export default function Home() {
  const cameras = useMemo(() => buildCameraList(), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [volume, setVolume] = useState(0);

  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Custom hooks
  const { showControls, handleMouseMove, handleMouseLeave } = useControlsVisibility();
  const { isFullscreen, toggleFullscreen } = useFullscreen(videoContainerRef);
  const { attachStream, isLiveStream } = useHLSPlayer({
    cameras,
    videoRefs,
    activeIndex,
  });
  const { syncTime } = useVideoSync({
    cameras,
    videoRefs,
    activeIndex,
    isLiveStream,
  });

  // Camera navigation
  const selectCamera = useCallback(
    (index: number) => {
      const prevIndex = activeIndex;
      setActiveIndex(index);
      syncTime(prevIndex, index);
    },
    [activeIndex, syncTime]
  );

  const nextCamera = useCallback(() => {
    selectCamera((activeIndex + 1) % cameras.length);
  }, [activeIndex, cameras.length, selectCamera]);

  const previousCamera = useCallback(() => {
    selectCamera((activeIndex - 1 + cameras.length) % cameras.length);
  }, [activeIndex, cameras.length, selectCamera]);

  // Volume control
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    videoRefs.current.forEach((video) => {
      if (video) {
        video.volume = newVolume / 100;
        video.muted = newVolume === 0;
      }
    });
  }, []);

  // Initialize HLS streams
  useEffect(() => {
    cameras.forEach((camera, index) => {
      const src = buildHlsMasterSrc(camera.file.slug);
      attachStream(index, src);
    });

    // Initialize volume on mount
    videoRefs.current.forEach((video) => {
      if (video) {
        video.volume = volume / 100;
        video.muted = volume === 0;
      }
    });
  }, [cameras, attachStream, volume]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-[2000px] mx-auto">
        <Header />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Video Player */}
          <div className="flex-1" ref={videoContainerRef}>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <Video
                cameras={cameras}
                activeIndex={activeIndex}
                videoRefs={videoRefs}
                showControls={showControls}
                volume={volume}
                isFullscreen={isFullscreen}
                onPrevious={previousCamera}
                onNext={nextCamera}
                onVolumeChange={handleVolumeChange}
                onFullscreenToggle={toggleFullscreen}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
            </div>
          </div>

          {/* Camera Selector */}
          <CameraSelector
            cameras={cameras}
            activeIndex={activeIndex}
            onSelectCamera={selectCamera}
          />
        </div>
      </div>
    </div>
  );
}
