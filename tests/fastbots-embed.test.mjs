import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

test("the root layout contains one persistent FastBots embed", () => {
  assert.equal(
    layout.match(/src="https:\/\/app\.fastbots\.ai\/embed\.js"/g)?.length,
    1,
  );
  assert.equal(
    layout.match(/data-bot-id="cmuo654ck03ykp61s7ehlyshw"/g)?.length,
    1,
  );
  assert.match(layout, /id="fastbots-chat"/);
  assert.match(layout, /strategy="afterInteractive"/);
  assert.doesNotMatch(layout, /<iframe[^>]+fastbots/i);
});
