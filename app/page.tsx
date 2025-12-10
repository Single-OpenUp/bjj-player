"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type Hls from "hls.js";

const cameraFiles = [
  { label: "Câmera 1 · Teto", filename: "Cam1 (teto).mp4" },
  { label: "Câmera 2", filename: "Cam2.mp4" },
  { label: "Câmera 3", filename: "Cam3.mp4" },
  { label: "Câmera 4", filename: "Cam4.mp4" },
  { label: "Câmera 5", filename: "Cam5.mp4" },
  { label: "Câmera 6", filename: "Cam6.mp4" },
  { label: "Câmera 7", filename: "Cam7.mp4" },
  { label: "Câmera 8", filename: "Cam8.mp4" },
];

const PREVIEW_VARIANT = "480p";

const buildVideoSrc = (filename: string) =>
  `/available_cameras/${encodeURIComponent(filename)}`;

const buildPreviewSrc = (filename: string) => {
  const dotIndex = filename.lastIndexOf(".");
  const previewName =
    dotIndex === -1
      ? `${filename}.preview`
      : `${filename.slice(0, dotIndex)}.preview${filename.slice(dotIndex)}`;
  return buildVideoSrc(previewName);
};

const slugFromFilename = (filename: string) => {
  const dotIndex = filename.lastIndexOf(".");
  const stem = dotIndex === -1 ? filename : filename.slice(0, dotIndex);
  return stem
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_.-]/g, "");
};

const buildHlsMasterSrc = (filename: string) => {
  const slug = slugFromFilename(filename);
  return `/available_cameras/hls/${slug}/master.m3u8`;
};

const buildHlsVariantSrc = (filename: string, variant: string) => {
  const slug = slugFromFilename(filename);
  return `/available_cameras/hls/${slug}/${slug}_${variant}.m3u8`;
};

export default function Home() {
  const cameras = useMemo(
    () =>
      cameraFiles.map((camera) => ({
        ...camera,
        src: buildVideoSrc(camera.filename),
        previewSrc: buildPreviewSrc(camera.filename),
        hlsMasterSrc: buildHlsMasterSrc(camera.filename),
        hlsPreviewSrc: buildHlsVariantSrc(camera.filename, PREVIEW_VARIANT),
      })),
    [],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [volume, setVolume] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const pendingSeekRef = useRef<{ index: number; time: number } | null>(null);
  const activeIndexRef = useRef(activeIndex);
  const hlsConstructorRef = useRef<null | typeof import("hls.js").default>(null);
  const hlsInstances = useRef<(Hls | null)[]>([]);
  const isLiveStream = useRef<boolean[]>(cameras.map(() => false));

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 1000);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!videoContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }, []);

  const videoSources = useMemo(
    () =>
      cameras.map((camera) => {
        return camera.hlsMasterSrc ?? camera.src;
      }),
    [cameras],
  );

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

        video.addEventListener('ended', () => {
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
    [destroyInstance],
  );

  const selectCamera = useCallback(
    (nextIndex: number) => {
      if (nextIndex === activeIndex) return;

      const currentVideo = videoRefs.current[activeIndex];
      const nextVideo = videoRefs.current[nextIndex];
      const isNextLive = isLiveStream.current[nextIndex];
      const isCurrentLive = isLiveStream.current[activeIndex];

      if (currentVideo && nextVideo && !isNextLive && !isCurrentLive) {
        const anchorTime = currentVideo.currentTime;
        if (Number.isFinite(anchorTime) && anchorTime > 0) {
          const duration = nextVideo.duration;
          if (Number.isFinite(duration) && duration > 0) {
            const safeTime = Math.min(anchorTime, Math.max(duration - 0.1, 0));
            nextVideo.currentTime = safeTime;
          } else {
            pendingSeekRef.current = { index: nextIndex, time: anchorTime };
          }
        }
      }

      setActiveIndex(nextIndex);
    },
    [activeIndex],
  );

  const cycleCamera = useCallback(
    (direction: 1 | -1) => {
      const nextIndex =
        (activeIndex + direction + cameras.length) % cameras.length;
      selectCamera(nextIndex);
    },
    [activeIndex, cameras.length, selectCamera],
  );

  useEffect(() => {
    const video = videoRefs.current[activeIndex];
    if (!video) return;

    video.muted = volume === 0;
    video.volume = volume / 100;

    const attemptPlayback = () => {
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise) {
          playPromise.catch(() => {
            /* ignore autoplay rejection */
          });
        }
      }
    };

    if (video.readyState >= 2) {
      attemptPlayback();
    } else {
      video.addEventListener("loadedmetadata", attemptPlayback, { once: true });
      video.addEventListener("canplay", attemptPlayback, { once: true });
    }
  }, [activeIndex, volume]);

  useEffect(() => {
    const activeVideo = videoRefs.current[activeIndex];
    if (!activeVideo) return;

    const isAnyLive = isLiveStream.current.some(live => live);

    if (isAnyLive) {
      const syncInterval = setInterval(() => {
        const activeHls = hlsInstances.current[activeIndex];
        if (!activeHls) return;

        const isActiveLive = isLiveStream.current[activeIndex];
        const targetLatency = isActiveLive && activeHls.latency
          ? activeHls.latency
          : activeVideo.currentTime;

        hlsInstances.current.forEach((hls, index) => {
          if (!hls || index === activeIndex) return;

          const video = videoRefs.current[index];
          if (!video || video.paused) return;

          const isThisLive = isLiveStream.current[index];

          if (isActiveLive && isThisLive) {
            const currentLatency = hls.latency;
            if (currentLatency && Math.abs(currentLatency - targetLatency) > 1.0) {
              const targetLevel = hls.levels.length > 0 ? 0 : -1;
              hls.nextLevel = targetLevel;
            }
          } else if (!isActiveLive && !isThisLive) {
            const timeDiff = Math.abs(video.currentTime - targetLatency);
            if (timeDiff > 0.5) {
              const duration = video.duration;
              if (Number.isFinite(duration) && duration > 0) {
                const safeTime = Math.min(targetLatency, Math.max(duration - 0.1, 0));
                video.currentTime = safeTime;
              }
            }
          }
        });
      }, 1000);

      return () => clearInterval(syncInterval);
    } else {
      const syncInterval = setInterval(() => {
        const activeTime = activeVideo.currentTime;
        if (!Number.isFinite(activeTime) || activeTime <= 0) return;

        videoRefs.current.forEach((video, index) => {
          if (!video || index === activeIndex || video.paused) return;

          const timeDiff = Math.abs(video.currentTime - activeTime);
          if (timeDiff > 0.5) {
            const duration = video.duration;
            if (Number.isFinite(duration) && duration > 0) {
              const safeTime = Math.min(activeTime, Math.max(duration - 0.1, 0));
              video.currentTime = safeTime;
            }
          }
        });
      }, 1000);

      return () => clearInterval(syncInterval);
    }
  }, [activeIndex]);

  useEffect(() => {
    videoSources.forEach((src, index) => {
      attachStream(index, src);
    });
  }, [videoSources, attachStream]);

  useEffect(() => {
    console.log("Updating active Index to", activeIndex);

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

  const handleKeyPress = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        cycleCamera(1);
      } else if (event.key === "ArrowLeft") {
        cycleCamera(-1);
      }
    },
    [cycleCamera],
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-zinc-900 px-4 py-8 text-white lg:px-8 lg:py-12">
      <main
        className="mx-auto flex w-full max-w-7xl flex-col gap-8"
        onKeyDown={handleKeyPress}
        tabIndex={0}
        role="application"
        aria-label="Visualizador multicanais"
      >
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl backdrop-blur sm:p-8 sm:text-left">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50 sm:text-sm">
            câmeras sincronizadas
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Reprodução perfeita em múltiplos ângulos
          </h1>
          <p className="mt-4 text-sm text-white/70 sm:max-w-xl sm:text-base">
            Circule ao redor do tatame e troque de câmera sem perder o instante.
            Cada mudança mantém o mesmo timestamp para analisar cada posição em
            qualquer perspectiva imediatamente.
          </p>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr,auto]">
          <section className="flex flex-col gap-4">
            <div
              ref={videoContainerRef}
              className="group relative w-full overflow-hidden rounded-3xl border border-white/20 bg-black shadow-2xl"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {cameras.map((camera, index) => (
                <video
                  key={camera.filename}
                  ref={(node) => {
                    videoRefs.current[index] = node;
                  }}
                  className={`aspect-video w-full object-cover ${index === activeIndex ? 'block' : 'hidden'}`}
                  playsInline
                  autoPlay
                  muted={index !== activeIndex}
                  preload="auto"
                  controls={false}
                  onLoadedMetadata={(event) => {
                    const video = event.currentTarget;
                    const pendingSeek = pendingSeekRef.current;
                    if (pendingSeek && pendingSeek.index === index) {
                      const duration = video.duration || pendingSeek.time;
                      const safeTime = duration
                        ? Math.min(pendingSeek.time, Math.max(duration - 0.15, 0))
                        : pendingSeek.time;
                      try {
                        video.currentTime = safeTime;
                      } catch (seekError) {
                        console.warn("Unable to sync camera", seekError);
                      } finally {
                        pendingSeekRef.current = null;
                      }
                    }
                  }}
                />
              ))}
              <div className="absolute left-6 top-6 rounded-full bg-black/70 px-4 py-2 backdrop-blur-sm">
                <h2 className="text-lg font-bold text-emerald-200">
                  {cameras[activeIndex].label}
                </h2>
              </div>

              <div className={`absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/60 to-transparent p-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className="flex items-center gap-2 rounded-full border border-white/40 bg-black/60 px-4 py-2 text-sm font-medium uppercase tracking-wide text-white backdrop-blur-sm transition hover:border-white hover:bg-black/80"
                      onClick={() => cycleCamera(-1)}
                    >
                      <span className="text-lg">←</span> Anterior
                    </button>
                    <button
                      className="flex items-center gap-2 rounded-full border border-white/40 bg-black/60 px-4 py-2 text-sm font-medium uppercase tracking-wide text-white backdrop-blur-sm transition hover:border-white hover:bg-black/80"
                      onClick={() => cycleCamera(1)}
                    >
                      Próxima <span className="text-lg">→</span>
                    </button>

                    <div className="group/volume relative flex items-center gap-2 rounded-full border border-white/40 bg-black/60 backdrop-blur-sm transition-all hover:px-4 px-2.5 py-2">
                      <button
                        onClick={() => setVolume(volume === 0 ? 50 : 0)}
                        className="text-white transition hover:text-emerald-200"
                        aria-label={volume === 0 ? "Ativar som" : "Silenciar"}
                      >
                        {volume === 0 ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                          </svg>
                        ) : volume < 50 ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        )}
                      </button>
                      <div className="flex items-center gap-2 overflow-hidden transition-all duration-300 group-hover/volume:max-w-40 group-hover/volume:opacity-100 max-w-0 opacity-0">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={(e) => setVolume(Number(e.target.value))}
                          className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/30 accent-emerald-500 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
                          aria-label="Volume"
                        />
                        <span className="min-w-10 text-xs font-medium text-white">{volume}%</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white backdrop-blur-sm transition hover:border-white hover:bg-black/80"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                  >
                    {isFullscreen ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <h3 className="mb-6 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
              Seleção de Câmeras
            </h3>
            <div className="relative mx-auto aspect-square w-full max-w-[400px]">
              <div className="absolute inset-[15%] rounded-2xl border-4 border-dashed border-emerald-500/30 bg-linear-to-br from-emerald-950/20 to-emerald-900/10 shadow-inner">
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <div className="text-4xl font-bold text-emerald-400/40">畳</div>
                    <p className="mt-2 text-xs uppercase tracking-widest text-white/30">Tatame</p>
                  </div>
                </div>
              </div>

              {cameras.map((camera, index) => {
                const angle = (index / cameras.length) * 360;
                const radians = ((angle - 90) * Math.PI) / 180;
                const x = 50 + Math.cos(radians) * 42;
                const y = 50 + Math.sin(radians) * 42;
                const isActive = index === activeIndex;

                return (
                  <button
                    key={camera.filename}
                    type="button"
                    onClick={() => selectCamera(index)}
                    className={`absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-bold transition-all duration-300 ${isActive
                      ? "border-emerald-400 bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-110"
                      : "border-white/30 bg-slate-800/80 text-white/70 hover:border-white hover:bg-slate-700 hover:scale-105"
                      }`}
                    style={{
                      top: `${y}%`,
                      left: `${x}%`,
                    }}
                    aria-pressed={isActive}
                    aria-label={`Selecionar ${camera.label}`}
                  >
                    <div className="text-center">
                      <div className="text-lg leading-none">{index + 1}</div>
                      {isActive && (
                        <div className="text-[8px] leading-none opacity-80">ATIVA</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2">
              {cameras.map((camera, index) => (
                <button
                  key={`label-${camera.filename}`}
                  onClick={() => selectCamera(index)}
                  className={`w-full rounded-lg px-4 py-2 text-left text-sm transition-all ${index === activeIndex
                    ? "bg-emerald-500/20 font-semibold text-emerald-200 border border-emerald-400/50"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-transparent"
                    }`}
                >
                  <span className="font-mono text-xs opacity-60">{index + 1}</span> {camera.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
