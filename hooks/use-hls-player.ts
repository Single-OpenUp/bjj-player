import { useCallback, useRef, useEffect } from "react";
import type Hls from "hls.js";
import type { Camera } from "@/types";

interface UseHLSPlayerProps {
  cameras: Camera[];
  videoRefs: React.MutableRefObject<(HTMLVideoElement | null)[]>;
  activeIndex: number;
}

export const useHLSPlayer = ({ cameras, videoRefs, activeIndex }: UseHLSPlayerProps) => {
  const hlsConstructorRef = useRef<null | typeof import("hls.js").default>(null);
  const hlsInstances = useRef<(Hls | null)[]>([]);
  const isLiveStream = useRef<boolean[]>(cameras.map(() => false));
  const activeIndexRef = useRef(activeIndex);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const destroyInstance = useCallback((index: number) => {
    const existing = hlsInstances.current[index];
    if (existing) {
      existing.destroy();
      hlsInstances.current[index] = null;
    }
  }, []);

  const attachStream = useCallback(
    (index: number, src: string) => {
      const video = videoRefs.current[index];
      if (!video || !src) return;
      if (video.dataset.hlsSrc === src) return;
      video.dataset.hlsSrc = src;
      destroyInstance(index);

      const requestAutoplay = () => {
        if (video.paused) {
          const playPromise = video.play();
          if (playPromise) {
            playPromise.catch(() => undefined);
          }
        }
      };

      const ensureAutoplay = () => {
        if (video.readyState >= 2) {
          requestAutoplay();
        } else {
          video.addEventListener("loadedmetadata", requestAutoplay, { once: true });
          video.addEventListener("canplay", requestAutoplay, { once: true });
        }
      };

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.load();
        ensureAutoplay();
        return;
      }

      let active = true;
      const expectedSrc = src;

      const setupHls = async () => {
        if (!hlsConstructorRef.current) {
          const mod = await import("hls.js");
          hlsConstructorRef.current = mod.default;
        }
        if (!active || video.dataset.hlsSrc !== expectedSrc) {
          return;
        }
        const HlsConstructor = hlsConstructorRef.current;
        if (!HlsConstructor || !HlsConstructor.isSupported()) {
          video.src = src;
          video.load();
          ensureAutoplay();
          return;
        }

        const hls = new HlsConstructor({
          enableWorker: true,
          lowLatencyMode: false,
          startLevel: -1,
          capLevelToPlayerSize: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          backBufferLength: 10,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
        });
        hlsInstances.current[index] = hls;
        hls.attachMedia(video);

        hls.on(HlsConstructor.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(src);
        });

        hls.on(HlsConstructor.Events.MANIFEST_PARSED, (_event, data) => {
          isLiveStream.current[index] = !data.levels[0]?.details?.live ? false : true;

          if (index !== activeIndexRef.current && hls.levels.length > 0) {
            hls.nextLevel = 0;
          }
          ensureAutoplay();
        });

        hls.on(HlsConstructor.Events.ERROR, (_event, data) => {
          if (data?.fatal) {
            hls.destroy();
            hlsInstances.current[index] = null;
          }
        });

        video.addEventListener("ended", () => {
          if (!isLiveStream.current[index]) {
            video.currentTime = 0;
            video.play().catch(() => undefined);
          }
        });
      };

      setupHls();

      return () => {
        active = false;
      };
    },
    [destroyInstance, videoRefs]
  );

  useEffect(() => {
    hlsInstances.current.forEach((hls, index) => {
      if (!hls) return;

      if (index === activeIndex) {
        hls.nextLevel = -1;
      } else {
        if (hls.levels.length > 0) {
          hls.nextLevel = 0;
        }
      }
    });
  }, [activeIndex]);

  useEffect(() => {
    const instances = hlsInstances.current;
    return () => {
      instances.forEach((instance) => instance?.destroy());
    };
  }, []);

  return { attachStream, hlsInstances, isLiveStream };
};
