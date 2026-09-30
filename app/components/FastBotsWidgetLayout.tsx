"use client";

import { useEffect } from "react";

const FASTBOTS_FRAME_SELECTOR = 'iframe[src*="fastbots.ai"]';

function numericPixels(value: string) {
  const match = value.match(/^([\d.]+)px$/);
  return match ? Number(match[1]) : null;
}

/**
 * Coordinates the third-party frame with MN Mart's fixed mobile controls.
 * FastBots owns the cross-origin contents; this component only marks and sizes
 * the iframe that embed.js adds to our document.
 */
export default function FastBotsWidgetLayout() {
  useEffect(() => {
    const root = document.documentElement;
    let frame: HTMLIFrameElement | null = null;

    const updateControlMeasurements = () => {
      const bottomBar = document.querySelector<HTMLElement>(
        "[data-mobile-bottom-bar]",
      );
      const installButton = document.querySelector<HTMLElement>(
        "[data-install-app-button]",
      );

      root.style.setProperty(
        "--mobile-bottom-bar-height",
        `${bottomBar?.getBoundingClientRect().height ?? 0}px`,
      );
      root.style.setProperty(
        "--install-app-button-height",
        `${installButton?.getBoundingClientRect().height ?? 0}px`,
      );
      root.toggleAttribute("data-install-app-visible", Boolean(installButton));
    };

    const updateFrameState = () => {
      if (!frame) return;

      // embed.js changes the iframe's inline dimensions when the conversation
      // opens. Read those authored values (not our CSS override) to retain its
      // existing open/close behaviour.
      const width = numericPixels(frame.style.width);
      const height = numericPixels(frame.style.height);
      const isPanel =
        (width !== null && width > 120) ||
        (height !== null && height > 120) ||
        /^(min|max|clamp|calc)\(/.test(frame.style.width) ||
        /^(min|max|clamp|calc)\(/.test(frame.style.height);

      frame.dataset.fastbotsView = isPanel ? "panel" : "launcher";
    };

    const frameObserver = new MutationObserver(updateFrameState);
    const findFrame = () => {
      const nextFrame = document.querySelector<HTMLIFrameElement>(
        FASTBOTS_FRAME_SELECTOR,
      );
      if (nextFrame === frame) return;

      frameObserver.disconnect();
      frame = nextFrame;
      if (frame) {
        frame.dataset.mnMartFastbots = "";
        updateFrameState();
        frameObserver.observe(frame, {
          attributes: true,
          attributeFilter: ["class", "style"],
        });
      }
    };

    const resizeObserver = new ResizeObserver(updateControlMeasurements);
    const observeControls = () => {
      resizeObserver.disconnect();
      document
        .querySelectorAll<HTMLElement>(
          "[data-mobile-bottom-bar], [data-install-app-button]",
        )
        .forEach((element) => resizeObserver.observe(element));
      updateControlMeasurements();
    };

    findFrame();
    observeControls();

    // FastBots and the install prompt are both added asynchronously. One DOM
    // observer reacts to those lifecycle changes without polling or reinjecting.
    const documentObserver = new MutationObserver(() => {
      findFrame();
      observeControls();
    });
    documentObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      documentObserver.disconnect();
      frameObserver.disconnect();
      resizeObserver.disconnect();
      root.style.removeProperty("--mobile-bottom-bar-height");
      root.style.removeProperty("--install-app-button-height");
      root.removeAttribute("data-install-app-visible");
      frame?.removeAttribute("data-mn-mart-fastbots");
      frame?.removeAttribute("data-fastbots-view");
    };
  }, []);

  return null;
}
