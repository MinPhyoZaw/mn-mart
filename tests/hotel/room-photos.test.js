import assert from "node:assert/strict";
import test from "node:test";
import { roomPhotos } from "../../app/lib/roomPhotos.js";

const photos = Array.from({ length: 8 }, (_, index) => `https://example.com/room-${index}.jpg`);

test("room gallery preserves photo order and uses the first as cover", () => {
  assert.deepEqual(roomPhotos(photos), { image: photos[0], images: photos });
});

test("legacy room creation accepts a single image", () => {
  assert.deepEqual(roomPhotos(undefined, photos[0]), {
    image: photos[0],
    images: [photos[0]],
  });
});

test("room gallery rejects missing, invalid, and oversized photo lists", () => {
  for (const input of [undefined, null, [], [...photos, photos[0]], ["javascript:alert(1)"]]) {
    assert.throws(() => roomPhotos(input), { status: 400 });
  }
});
