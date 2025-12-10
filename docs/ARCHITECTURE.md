# Video Player - Modular Architecture

## Overview
This project has been refactored into a modular architecture following React best practices with separation of concerns.

## Project Structure

```
video-player/
├── app/
│   └── page.tsx                 # Main entry point (109 lines, down from 624)
├── components/                  # React components
│   ├── index.ts                # Barrel export
│   ├── Header/
│   │   └── index.tsx           # App header with title
│   ├── Video/                  # Main video player container
│   │   ├── index.tsx           # Parent wrapper
│   │   ├── VideoPlayer/
│   │   │   └── index.tsx       # Video element container
│   │   └── VideoHUD/
│   │       └── index.tsx       # Overlay with controls and title
│   ├── CameraSelector/
│   │   └── index.tsx           # Tatame visual + camera list
│   └── VolumeControl/
│       └── index.tsx           # Volume slider with expand/collapse
├── hooks/                       # Custom React hooks
│   ├── index.ts                # Barrel export
│   ├── use-controls-visibility.ts  # Auto-hide controls logic
│   ├── use-fullscreen.ts           # Fullscreen state management
│   ├── use-hls-player.ts           # HLS.js instance management
│   └── use-video-sync.ts           # Time synchronization
├── utils/                       # Pure utility functions
│   ├── index.ts                # Barrel export
│   ├── video-sources.ts        # URL builders for videos
│   └── camera-config.ts        # Camera data configuration
└── types/                       # TypeScript interfaces
    ├── index.ts                # Barrel export
    └── camera.ts               # Camera, VideoState, PendingSeek types
```

## Architecture Principles

### 1. Separation of Concerns
- **Types**: Pure TypeScript interfaces and type definitions
- **Utils**: Pure functions with no side effects (video URL building, camera config)
- **Hooks**: Stateful logic and side effects (HLS management, sync, fullscreen, controls)
- **Components**: UI rendering with props (no business logic)

### 2. Naming Conventions
- **Files**: kebab-case (e.g., `use-hls-player.ts`, `camera-config.ts`)
- **Components**: PascalCase (e.g., `VideoPlayer`, `CameraSelector`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useHLSPlayer`, `useVideoSync`)
- **Functions**: camelCase (e.g., `buildVideoSrc`, `syncTime`)

### 3. File Organization
- Component folders contain `index.tsx` (no separate files for styles/tests currently)
- Barrel exports (`index.ts`) in each folder for clean imports
- Pure functions in `.ts` files, React components in `.tsx` files
- Nested components allowed (e.g., VideoHUD inside Video parent folder)

## Component Responsibilities

### Header
- Displays app title and description
- Static content, no props

### Video (Parent)
- Orchestrates VideoPlayer and VideoHUD
- Handles mouse events for control visibility
- Props: cameras, activeIndex, videoRefs, showControls, volume, etc.

### VideoPlayer
- Renders all video elements with show/hide logic
- Manages video refs array
- Props: cameras, activeIndex, videoRefs

### VideoHUD
- Displays camera title (top-left overlay)
- Control bar with Previous/Next/Volume/Fullscreen buttons
- Auto-hide behavior based on showControls prop
- Props: camera, showControls, volume, isFullscreen, callbacks

### CameraSelector
- Tatame visual with circular numbered buttons
- Camera list with thumbnails
- Props: cameras, activeIndex, onSelectCamera

### VolumeControl
- Volume icon that expands to show slider on hover
- Displays percentage and current volume
- Props: volume, onVolumeChange

## Hook Responsibilities

### useControlsVisibility
- Manages showControls state
- Returns: showControls, handleMouseMove, handleMouseLeave
- Timers: 3s after mouse stop, 1s after mouse leave

### useFullscreen
- Manages fullscreen state
- Handles fullscreen API calls
- Returns: isFullscreen, toggleFullscreen

### useHLSPlayer
- Creates and manages HLS.js instances per camera
- Handles autoplay, quality switching, error recovery
- Detects live vs VOD streams
- Returns: attachStream, hlsInstances, isLiveStream

### useVideoSync
- Synchronizes playback time across all cameras
- Handles pending seeks for videos not yet ready
- Continuous 1-second sync interval with 0.5s drift threshold
- Returns: syncTime

## Utility Functions

### video-sources.ts
- `buildVideoSrc`: Direct video file URL
- `buildPreviewSrc`: Preview/thumbnail URL
- `buildHlsMasterSrc`: Master playlist URL
- `buildHlsVariantSrc`: Variant playlist URL
- `slugFromFilename`: Convert filename to slug

### camera-config.ts
- `cameraFiles`: Array of camera file data
- `PREVIEW_VARIANT`: Constant for preview quality ("480p")
- `buildCameraList`: Generate camera objects with slugs

## Types

### Camera
```typescript
interface Camera {
  name: string;
  file: {
    label: string;
    filename: string;
    slug: string;
  };
}
```

### PendingSeek
```typescript
type PendingSeek = {
  time: number;
  retry: number;
} | null;
```

### VideoState
```typescript
interface VideoState {
  currentTime: number;
  paused: boolean;
  volume: number;
}
```

## Key Features Preserved

1. ✅ Adaptive bitrate streaming with HLS.js
2. ✅ Time synchronization across cameras
3. ✅ VOD and live stream support
4. ✅ Auto-hide controls with hover
5. ✅ Volume control with expand/collapse animation
6. ✅ Fullscreen toggle
7. ✅ Camera navigation (Previous/Next/Selector)
8. ✅ Large main player + tatame selector layout
9. ✅ Camera title overlay (top-left)
10. ✅ Quality management (auto for active, lowest for inactive)

## Benefits of Modularization

1. **Maintainability**: Easy to locate and update specific functionality
2. **Reusability**: Components and hooks can be used in other projects
3. **Testability**: Each module can be tested in isolation
4. **Readability**: Main page.tsx is clean and declarative (109 lines vs 624)
5. **Scalability**: Easy to add new features without cluttering existing code
6. **Type Safety**: Proper TypeScript interfaces throughout
7. **Developer Experience**: Barrel exports make imports clean and simple

## Import Examples

```typescript
// Clean barrel exports
import { Video, CameraSelector, Header } from "@/components";
import { useHLSPlayer, useVideoSync, useFullscreen } from "@/hooks";
import { buildCameraList, buildHlsMasterSrc } from "@/utils";
import type { Camera, PendingSeek } from "@/types";
```

## Next Steps for Further Improvements

1. Add unit tests for hooks and utility functions
2. Add integration tests for components
3. Consider adding Storybook for component documentation
4. Add error boundary components
5. Extract keyboard navigation into a separate hook
6. Add loading states and skeleton screens
7. Consider splitting larger components further if needed
8. Add performance monitoring and analytics
