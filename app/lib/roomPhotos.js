export const MAX_ROOM_PHOTOS = 8;

export function roomPhotos(images, legacyImage) {
  const photos = images === undefined ? [legacyImage] : images;
  if (!Array.isArray(photos) || photos.length < 1 || photos.length > MAX_ROOM_PHOTOS) {
    throw Object.assign(new Error("A room needs 1 to 8 photos."), { status: 400 });
  }

  const normalized = photos.map((photo) => {
    const url = typeof photo === "string" ? photo.trim() : "";
    if (!/^https?:\/\/[^\s]+$/i.test(url) && !/^\/(?!\/)[^\s]+$/.test(url)) {
      throw Object.assign(new Error("Each room photo needs a valid image URL."), { status: 400 });
    }
    return url;
  });
  const unique = [...new Set(normalized)];
  return { image: unique[0], images: unique };
}
