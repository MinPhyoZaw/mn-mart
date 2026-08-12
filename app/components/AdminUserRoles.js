"use client";

import { useState } from "react";

const ROLE_OPTIONS = ["customer", "vendor", "admin"];

export default function AdminUserRoles({ initialUsers = [] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [showAll, setShowAll] = useState(false);

  const visibleUsers = showAll ? users : users.slice(0, 7);

  const handleRoleChange = async (userId, role) => {
    setLoadingId(userId);
    setMessage("");

    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();

      if (!data.success) {
        setMessage(data.message || "Failed to update role");
        return;
      }

      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role } : u)));
      setMessage("Role updated successfully");
    } catch {
      setMessage("Server error while updating role");
    } finally {
      setLoadingId(null);
    }
  };

  return (
  <section className="space-y-5">
    {/* Header */}
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            User Role Management
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Manage user permissions and assign roles across MN Mart.
          </p>
        </div>

        <div className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600">
          {users.length} users
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}
    </div>

    {/* Users */}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visibleUsers.map((u) => {
        const isLoading = loadingId === u._id;

        const roleStyle =
          u.role === "admin"
            ? "bg-purple-50 text-purple-700 border-purple-100"
            : u.role === "vendor"
            ? "bg-amber-50 text-amber-700 border-amber-100"
            : "bg-blue-50 text-blue-700 border-blue-100";

        return (
          <div
            key={u._id}
            className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            {/* User Top */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {/* Avatar */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold uppercase text-white">
                  {u.name?.charAt(0) || "U"}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {u.name || "Unknown User"}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {u.email}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${roleStyle}`}
              >
                {u.role}
              </span>
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-gray-100" />

            {/* Role Control */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  User Role
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Change access level
                </p>
              </div>

              <div className="relative">
                <select
                  value={u.role}
                  disabled={isLoading}
                  onChange={(e) =>
                    handleRoleChange(u._id, e.target.value)
                  }
                  className="appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2 pl-3 pr-9 text-sm font-medium capitalize text-gray-700 outline-none transition hover:border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Updating State */}
            {isLoading && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
                Updating role...
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* Empty State */}
    {visibleUsers.length === 0 && (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            />
          </svg>
        </div>

        <h4 className="font-semibold text-gray-800">
          No users found
        </h4>

        <p className="mt-1 text-sm text-gray-500">
          User accounts will appear here.
        </p>
      </div>
    )}

    {/* See More */}
    {users.length > 7 && (
      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow"
        >
          {showAll ? (
            <>
              Show less
              <span className="text-base">↑</span>
            </>
          ) : (
            <>
              See all users
              <span className="text-base">↓</span>
            </>
          )}
        </button>
      </div>
    )}
  </section>
);
}
