"use client";

import { useCallback, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SupportThread from "./SupportThread";
import { chatRequest, useChatPolling } from "./supportChatClient";

const endpoint = "/api/admin/support";

function SupportInbox() {
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [inbox, setInbox] = useState(null);
  const [error, setError] = useState("");
  const current = inbox?.page === page ? inbox : null;
  const refresh = useCallback(async (signal) => {
    try {
      const result = await chatRequest(endpoint + "?page=" + page, { signal });
      if (!signal.aborted) {
        setInbox({ ...result, page });
        setError("");
      }
    } catch (requestError) {
      if (!signal.aborted) setError(requestError.message);
    }
  }, [page]);
  useChatPolling(true, refresh);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h2 className="border-b border-slate-100 px-5 py-4 text-lg font-semibold text-slate-900">Support Inbox</h2>
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className={`min-w-0 lg:block lg:border-r lg:border-slate-100 ${selected ? "hidden" : ""}`}>
          {error && <p role="alert" className="p-4 text-sm text-red-700">{error}</p>}
          {!current && !error && <p className="p-4 text-sm text-slate-500">Loading conversations…</p>}
          {current?.conversations.length === 0 && (
            <p className="p-4 text-sm text-slate-500">No conversations on this page.</p>
          )}
          <ul className="max-h-[29rem] divide-y divide-slate-100 overflow-y-auto">
            {current?.conversations.map((conversation) => (
              <li key={conversation._id}>
                <button type="button" onClick={() => setSelected(conversation)}
                  aria-pressed={selected?._id === conversation._id}
                  className="block w-full px-4 py-3 text-left hover:bg-slate-50 aria-pressed:bg-emerald-50">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{conversation.name}</span>
                    {conversation.unread > 0 && (
                      <span aria-label={`${conversation.unread} unread messages`}
                        className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs text-white">{conversation.unread}</span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-sm text-slate-600">{conversation.latest}</span>
                </button>
              </li>
            ))}
          </ul>
          {(page > 1 || current?.hasNext) && (
            <div className="flex justify-between gap-2 border-t border-slate-100 p-3 text-sm">
              <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}
                className="rounded-lg px-3 py-2 font-semibold text-emerald-800 disabled:opacity-40">Previous</button>
              <span className="self-center text-slate-600">{page}</span>
              <button type="button" disabled={!current?.hasNext} onClick={() => setPage(page + 1)}
                className="rounded-lg px-3 py-2 font-semibold text-emerald-800 disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
        {selected ? (
          <div className="flex h-[min(34rem,75dvh)] min-w-0 flex-col">
            <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <button type="button" aria-label="Back to conversations" onClick={() => setSelected(null)}
                className="grid size-9 place-items-center rounded-full hover:bg-slate-100 lg:hidden">
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <h3 className="truncate font-semibold text-slate-900">{selected.name}</h3>
            </header>
            <SupportThread key={selected._id} endpoint={endpoint + "?customerId=" + selected._id} role="admin" />
          </div>
        ) : (
          <div className="hidden h-96 flex-col items-center justify-center gap-2 text-sm text-slate-500 lg:flex">
            <MessageCircle size={24} aria-hidden="true" />
            Select a conversation to reply.
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminSupportInbox() {
  const { user } = useAuth();
  return user?.role === "admin" ? <SupportInbox key={user._id} /> : null;
}
