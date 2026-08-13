"use client";

import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
  }>;
}

function detectIOS() {
  if (typeof window === "undefined") return false;

  return (
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1)
  );
}

function detectStandalone() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean })
      .standalone === true
  );
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isIOS] = useState(() => detectIOS());
  const [isInstalled, setIsInstalled] = useState(() =>
    detectStandalone()
  );

  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      const e = event as BeforeInstallPromptEvent;

      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, []);

  const handleInstall = async () => {
    // iPhone / iPad
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // Android / supported browser
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return null;
  }

  if (!isIOS && !deferredPrompt) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="
          fixed bottom-24 right-4 z-50
          flex items-center gap-2
          rounded-full
          bg-green-600
          px-4 py-3
          text-sm font-semibold text-white
          shadow-lg
          transition
          hover:bg-green-700
          active:scale-95
        "
      >
        <Download size={18} />
        Install MN Mart
      </button>

      {showIOSModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setShowIOSModal(false)}
            aria-label="Close install instructions"
          />

          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
            >
              <X size={18} />
            </button>

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600">
              <Download size={26} />
            </div>

            <h3 className="text-xl font-bold text-gray-900">
              Install MN Mart
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Install MN Mart on your iPhone home screen for faster
              access and an app-like experience.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                  1
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Tap the Share button
                  </p>

                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    Look for
                    <Share2 size={15} />
                    in Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                  2
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Select Add to Home Screen
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Scroll down in the Share menu if needed.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                  3
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Tap Add
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    MN Mart will appear on your iPhone home screen.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="mt-6 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}