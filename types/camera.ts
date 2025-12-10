export interface CameraFile {
  label: string;
  filename: string;
}

export interface Camera {
  name: string;
  file: {
    label: string;
    filename: string;
    slug: string;
  };
}

export interface VideoState {
  currentTime: number;
  paused: boolean;
  volume: number;
}

export type PendingSeek = {
  time: number;
  retry: number;
} | null;
