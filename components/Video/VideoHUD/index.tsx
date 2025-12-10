import { VolumeControl } from "../../VolumeControl";
import type { Camera } from "@/types";

interface VideoHUDProps {
  camera: Camera;
  showControls: boolean;
  volume: number;
  isFullscreen: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onVolumeChange: (value: number) => void;
  onFullscreenToggle: () => void;
}

export const VideoHUD = ({
  camera,
  showControls,
  volume,
  isFullscreen,
  onPrevious,
  onNext,
  onVolumeChange,
  onFullscreenToggle,
}: VideoHUDProps) => {
  return (
    <>
      {/* Camera Title - Top Left */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <h2 className="text-white text-2xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {camera.name}
        </h2>
      </div>

      {/* Control Bar - Bottom */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"
          }`}
      >
        <div className="bg-linear-to-t from-black/80 to-transparent px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Controls: Previous, Next, Volume */}
            <div className="flex items-center gap-4">
              <button
                onClick={onPrevious}
                className="text-white hover:text-gray-300 transition-colors"
                aria-label="Previous camera"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={onNext}
                className="text-white hover:text-gray-300 transition-colors"
                aria-label="Next camera"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <VolumeControl volume={volume} onVolumeChange={onVolumeChange} />
            </div>

            {/* Right Controls: Fullscreen */}
            <button
              onClick={onFullscreenToggle}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isFullscreen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
