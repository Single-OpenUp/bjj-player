// S3 bucket configuration
const S3_BUCKET = "bjj-aulas";
const S3_REGION = "us-east-2"; // Update if your bucket is in a different region
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

export const buildVideoSrc = (filename: string): string =>
  `${S3_BASE_URL}/available_cameras/${encodeURIComponent(filename)}`;

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
  return `${S3_BASE_URL}/available_cameras/hls/${slug}/master.m3u8`;
};

export const buildHlsVariantSrc = (filename: string, variant: string): string => {
  const slug = slugFromFilename(filename);
  return `${S3_BASE_URL}/available_cameras/hls/${slug}/${slug}_${variant}.m3u8`;
};
