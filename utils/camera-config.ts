import type { CameraFile, Camera } from "@/types";
import { slugFromFilename } from "./video-sources";

export const PREVIEW_VARIANT = "480p";

export const cameraFiles: CameraFile[] = [
  { label: "Câmera 1 · Teto", filename: "Cam1 (teto).mp4" },
  { label: "Câmera 2", filename: "Cam2.mp4" },
  { label: "Câmera 3", filename: "Cam3.mp4" },
  { label: "Câmera 4", filename: "Cam4.mp4" },
  { label: "Câmera 5", filename: "Cam5.mp4" },
  { label: "Câmera 6", filename: "Cam6.mp4" },
  { label: "Câmera 7", filename: "Cam7.mp4" },
  { label: "Câmera 8", filename: "Cam8.mp4" },
];

export const buildCameraList = (): Camera[] => {
  return cameraFiles.map((camera) => ({
    name: camera.label,
    file: {
      label: camera.label,
      filename: camera.filename,
      slug: slugFromFilename(camera.filename),
    },
  }));
};
