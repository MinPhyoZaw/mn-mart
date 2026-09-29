"use client";

const MAX_IMAGE_SIDE = 1280;
const OUTPUT_QUALITY = 0.8;
const SHOP_BANNER_WIDTH = 1200;
const SHOP_BANNER_HEIGHT = 400;

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

  const scale = Math.min(
    MAX_IMAGE_SIDE / image.width,
    MAX_IMAGE_SIDE / image.height,
    1,
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/webp", OUTPUT_QUALITY);
};

export const dataUrlToBlob = async (dataUrl) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

export const compressItemImageBlob = async (file) => {
  const dataUrl = await compressItemImage(file);
  return dataUrlToBlob(dataUrl);
};

export const compressShopBannerBlob = async (file) => {
  const sourceDataUrl = await fileToDataUrl(file);
  const image = await loadImageElement(sourceDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = SHOP_BANNER_WIDTH;
  canvas.height = SHOP_BANNER_HEIGHT;

  const sourceAspect = image.width / image.height;
  const bannerAspect = SHOP_BANNER_WIDTH / SHOP_BANNER_HEIGHT;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  if (sourceAspect > bannerAspect) {
    sourceWidth = image.height * bannerAspect;
    sourceX = (image.width - sourceWidth) / 2;
  } else if (sourceAspect < bannerAspect) {
    sourceHeight = image.width / bannerAspect;
    sourceY = (image.height - sourceHeight) / 2;
  }

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    SHOP_BANNER_WIDTH,
    SHOP_BANNER_HEIGHT,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Unable to process the selected image."))),
      "image/webp",
      0.8,
    );
  });
};
