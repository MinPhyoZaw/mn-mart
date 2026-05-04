"use client";

const MAX_IMAGE_SIDE = 1280;
const OUTPUT_QUALITY = 0.8;

export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the image file."));
    reader.readAsDataURL(file);
  });

export const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to load selected image."));
    img.src = src;
  });

export const compressItemImage = async (file) => {
  const sourceDataUrl = await fileToDataUrl(file);
  const image = await loadImageElement(sourceDataUrl);

  const scale = Math.min(MAX_IMAGE_SIDE / image.width, MAX_IMAGE_SIDE / image.height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/webp", OUTPUT_QUALITY);
};

export default null;
