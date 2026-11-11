import { useState } from "react";
import { HOTEL_AMENITIES, HOTEL_AMENITY_KEYS } from "../../lib/hotelAmenities";

export default function HotelAmenitiesForm({ initialAmenities, onSaved }) {
  const [amenities, setAmenities] = useState(initialAmenities ?? []);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  async function save(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/vendor/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelAmenities: amenities }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save hotel amenities.");
      }

      const savedAmenities = data.data.shop.hotelAmenities;
      setAmenities(savedAmenities);
      onSaved(savedAmenities);
      setStatus({ message: "Hotel amenities saved." });
    } catch (error) {
      setStatus({ error: true, message: error.message || "Unable to save hotel amenities." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <fieldset disabled={saving}>
        <legend className="text-sm font-semibold text-gray-900">Hotel amenities</legend>
        <p className="mt-1 text-sm text-gray-600">Select amenities available to all hotel guests.</p>
        <div className="my-3 flex flex-wrap gap-x-5">
          {HOTEL_AMENITY_KEYS.map((key) => (
            <label key={key} className="flex min-h-11 items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={amenities.includes(key)}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setAmenities((current) => checked
                    ? [...current, key]
                    : current.filter((amenity) => amenity !== key));
                  setStatus(null);
                }}
              />
              {HOTEL_AMENITIES[key]}
            </label>
          ))}
        </div>
        <button type="submit" className="min-h-11 rounded-lg bg-[#0b7a3b] px-4 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? "Saving…" : "Save hotel amenities"}
        </button>
      </fieldset>
      {status && (
        <p role={status.error ? "alert" : "status"} className={`mt-3 text-sm ${status.error ? "text-red-700" : "text-green-700"}`}>
          {status.message}
        </p>
      )}
    </form>
  );
}
