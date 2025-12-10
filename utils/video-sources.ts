export const buildVideoSrc = (filename: string): string =>
  `/available_cameras/${encodeURIComponent(filename)}`;

export const buildPreviewSrc = (filename: string): string => {
  const dotIndex = filename.lastIndexOf(".");
  const previewName =
    dotIndex === -1
      ? `${filename}.preview`
      : `${filename.slice(0, dotIndex)}.preview${filename.slice(dotIndex)}`;
  return buildVideoSrc(previewName);
};

export const slugFromFilename = (filename: string): string => {
  const dotIndex = filename.lastIndexOf(".");
  const stem = dotIndex === -1 ? filename : filename.slice(0, dotIndex);
  return stem
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_.-]/g, "");
};

export const buildHlsMasterSrc = (filename: string): string => {
  const slug = slugFromFilename(filename);
  return `/available_cameras/hls/${slug}/master.m3u8`;
};

export const buildHlsVariantSrc = (filename: string, variant: string): string => {
  const slug = slugFromFilename(filename);
  return `/available_cameras/hls/${slug}/${slug}_${variant}.m3u8`;
};
