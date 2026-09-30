import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const widgetLayout = await readFile(
  new URL("../app/components/FastBotsWidgetLayout.tsx", import.meta.url),
  "utf8",
);
const globalStyles = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

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

test("FastBots layout is scoped and responds to measured fixed controls", () => {
  assert.match(widgetLayout, /iframe\[src\*="fastbots\.ai"\]/);
  assert.match(widgetLayout, /ResizeObserver/);
  assert.match(widgetLayout, /MutationObserver/);
  assert.doesNotMatch(widgetLayout, /setInterval|setTimeout/);

  assert.match(globalStyles, /--floating-control-gap: 12px/);
  assert.match(globalStyles, /--mobile-bottom-bar-height/);
  assert.match(globalStyles, /--install-app-button-height/);
  assert.match(
    globalStyles,
    /iframe\[data-mn-mart-fastbots\]\[data-fastbots-view="launcher"\]/,
  );
  assert.doesNotMatch(globalStyles, /(^|\n)button\s*\{/);
  assert.doesNotMatch(globalStyles, /(^|\n)svg\s*\{/);
});
