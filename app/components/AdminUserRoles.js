"use client";

import { useState } from "react";

const ROLE_OPTIONS = ["customer", "vendor", "admin"];

export default function AdminUserRoles({ initialUsers = [] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState("");

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

      <div className="space-y-3">
        {users.map((u) => (
          <div key={u._id} className="flex items-center justify-between border rounded p-3">
            <div>
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-gray-500">{u.email}</p>
            </div>

            <select
              value={u.role}
              disabled={loadingId === u._id}
              onChange={(e) => handleRoleChange(u._id, e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
