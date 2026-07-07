import type { ResourceMedia } from "../data/mvpData";

const maxImageWidth = 1600;
const maxImageHeight = 1200;
const imageQuality = 0.82;
const maxDataUrlLength = 850_000;

export async function readListingMediaFiles(files: File[]): Promise<ResourceMedia[]> {
  return Promise.all(files.map(readListingMediaFile));
}

async function readListingMediaFile(file: File): Promise<ResourceMedia> {
  const id = createMediaId();

  if (file.type.startsWith("image/")) {
    return {
      id,
      type: "image",
      url: await compressImageFile(file),
      name: file.name
    };
  }

  return {
    id,
    type: "video",
    url: await readFileAsDataUrl(file),
    name: file.name
  };
}

async function compressImageFile(file: File) {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const { width, height } = getContainedSize(image.width, image.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return source;

  context.drawImage(image, 0, 0, width, height);
  return createBoundedImageDataUrl(canvas);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read selected media file."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image upload failed."));
    image.src = source;
  });
}

function getContainedSize(width: number, height: number) {
  const scale = Math.min(maxImageWidth / width, maxImageHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

function createBoundedImageDataUrl(canvas: HTMLCanvasElement) {
  let workingCanvas = canvas;
  let quality = imageQuality;
  let output = workingCanvas.toDataURL("image/jpeg", quality);

  while (output.length > maxDataUrlLength && quality > 0.48) {
    quality = Number((quality - 0.08).toFixed(2));
    output = workingCanvas.toDataURL("image/jpeg", quality);
  }

  while (output.length > maxDataUrlLength && workingCanvas.width > 640 && workingCanvas.height > 480) {
    const nextWidth = Math.round(workingCanvas.width * 0.84);
    const nextHeight = Math.round(workingCanvas.height * 0.84);
    const resized = document.createElement("canvas");
    resized.width = nextWidth;
    resized.height = nextHeight;
    const context = resized.getContext("2d");
    if (!context) break;
    context.drawImage(workingCanvas, 0, 0, nextWidth, nextHeight);
    workingCanvas = resized;
    output = workingCanvas.toDataURL("image/jpeg", 0.56);
  }

  return output;
}

function createMediaId() {
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
