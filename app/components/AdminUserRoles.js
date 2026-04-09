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
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">User Role Management</h3>

      {message && <p className="text-sm mb-3 text-gray-600">{message}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {visibleUsers.map((u) => (
          <div key={u._id} className="border rounded p-3 bg-gray-50 shadow-sm">
            <div className="mb-3">
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-gray-500 break-all">{u.email}</p>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Role</span>
              <select
                value={u.role}
                disabled={loadingId === u._id}
                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-white"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {users.length > 7 && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="px-4 py-2 bg-gray-800 text-white rounded"
          >
            {showAll ? "Show less" : "See more"}
          </button>
        </div>
      )}
    </div>
  );
}
