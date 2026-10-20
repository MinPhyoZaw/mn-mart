"use client";

import { useEffect, useRef, useState } from "react";

const START = [25.3833, 97.4]; // Myitkyina browsing center only; never a selected location.

export default function DeliveryLocationPicker({ value, onConfirm }) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const valueRef = useRef(value);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [gpsStatus, setGpsStatus] = useState("");
  const [mapError, setMapError] = useState("");

  useEffect(() => { valueRef.current = value; }, [value]);

  useEffect(() => {
    if (!open || !mapElement.current || mapRef.current) return;
    let cancelled = false;
    const load = async () => {
      try {
        if (!window.L) {
          await new Promise((resolve, reject) => {
            const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(css);
            const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = resolve; script.onerror = reject; document.body.appendChild(script);
          });
        }
        if (cancelled) return;
        const L = window.L;
        const selected = valueRef.current;
        const map = L.map(mapElement.current).setView(selected ? [selected.latitude, selected.longitude] : START, selected ? 16 : 13);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
        const setPin = (latlng) => {
          const coords = { latitude: latlng.lat, longitude: latlng.lng }; setDraft(coords);
          if (markerRef.current) markerRef.current.setLatLng(latlng);
          else markerRef.current = L.marker(latlng, { draggable: true }).addTo(map).on("dragend", (event) => setPin(event.target.getLatLng()));
        };
        map.on("click", (event) => setPin(event.latlng));
        if (selected) setPin({ lat: selected.latitude, lng: selected.longitude });
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 100);
      } catch { setMapError("Map tiles could not be loaded. You can still enter your written address."); }
    };
    load();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; markerRef.current = null; };
  }, [open]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setGpsStatus("Location is unavailable in this browser."); return; }
    setGpsStatus("Getting your location…");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const point = [coords.latitude, coords.longitude]; setDraft({ latitude: point[0], longitude: point[1] });
      mapRef.current?.setView(point, 17);
      if (window.L && mapRef.current) {
        if (markerRef.current) markerRef.current.setLatLng(point);
        else markerRef.current = window.L.marker(point, { draggable: true }).addTo(mapRef.current).on("dragend", (event) => setDraft({ latitude: event.target.getLatLng().lat, longitude: event.target.getLatLng().lng }));
      }
      setGpsStatus("Location found. Adjust the pin if needed, then confirm.");
    }, (error) => setGpsStatus(error.code === 1 ? "Location permission was denied. Tap the map to choose a location." : error.code === 3 ? "Location request timed out. Try again or tap the map." : "Location is unavailable. Tap the map to choose a location."), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  return <div className="rounded-2xl border border-gray-200 p-4 sm:col-span-2">
    <h3 className="font-semibold text-gray-900">Delivery location</h3>
    <p className="mt-1 text-xs text-gray-500">Adding a pin helps the rider find your house. It’s optional; your written address is still required.</p>
    {value ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3 text-sm"><span className="text-emerald-800">Location confirmed · {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}</span><button type="button" className="font-semibold text-emerald-700 underline" onClick={() => { setDraft(value); setOpen(true); }}>Change</button></div> : <button type="button" onClick={() => { setDraft(null); setMapError(""); setOpen(true); }} className="mt-3 rounded-xl border border-emerald-600 px-4 py-2.5 text-sm font-semibold text-emerald-700">Choose location on map</button>}
    {open && <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Choose delivery location">
      <div className="w-full rounded-t-3xl bg-white p-4 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-6"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Choose delivery location</h3><button type="button" onClick={() => setOpen(false)} aria-label="Close map" className="rounded-lg px-3 py-2 text-gray-600">Close</button></div>
        <p className="my-2 text-sm text-gray-600">Tap the map or move the pin to your delivery point. The starting map view is not selected.</p><div ref={mapElement} className="h-[52vh] min-h-64 rounded-xl bg-gray-100" />
        {mapError && <p className="mt-2 text-sm text-amber-700">{mapError}</p>}<div className="mt-3 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={useCurrentLocation} className="rounded-xl border px-4 py-2.5 text-sm font-medium">Use my current location</button><span className="text-xs text-gray-500" role="status">{gpsStatus}</span></div>
        <button type="button" disabled={!draft} onClick={() => { onConfirm(draft); setOpen(false); }} className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-50">Confirm this location</button>
      </div></div>}
  </div>;
}
