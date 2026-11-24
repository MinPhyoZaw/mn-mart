"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { chatRequest, useChatPolling } from "./supportChatClient";

function mergeMessages(current, incoming) {
  const byId = new Map([...current, ...incoming].map((message) => [message._id, message]));
  return [...byId.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt) || a._id.localeCompare(b._id));
}

export default function SupportThread({ endpoint, role }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const scrollbox = useRef(null);
  const readThrough = useRef(null);
  const loadedHistory = useRef(false);
  const retry = useRef(null);
  const stickToBottom = useRef(true);
  const olderHeight = useRef(null);
  const latest = messages.at(-1)?._id;

  const refresh = useCallback(async (signal) => {
    try {
      const result = await chatRequest(endpoint, { signal });
      if (signal.aborted) return;
      setMessages((current) => mergeMessages(current, result.messages));
      if (!loadedHistory.current) {
        setHasOlder(result.hasOlder);
        loadedHistory.current = result.messages.length > 0;
      }
      setLoading(false);
      setLoadError("");

      const through = result.messages.at(-1)?._id;
      if (through && through !== readThrough.current && stickToBottom.current && !document.hidden) {
        await chatRequest(endpoint, { method: "PATCH", body: { through }, signal });
        readThrough.current = through;
      }
    } catch (error) {
      if (!signal.aborted) {
        setLoading(false);
        setLoadError(error.message);
      }
    }
  }, [endpoint]);
  useChatPolling(true, refresh);

  useEffect(() => {
    const box = scrollbox.current;
    if (olderHeight.current !== null) {
      box.scrollTop += box.scrollHeight - olderHeight.current;
      olderHeight.current = null;
    } else if (stickToBottom.current) {
      box.scrollTop = box.scrollHeight;
    }
  }, [messages]);

  async function loadOlder() {
    setLoadingOlder(true);
    setActionError("");
    try {
      const query = endpoint.includes("?") ? "&" : "?";
      const result = await chatRequest(endpoint + query + "before=" + messages[0]._id);
      if (!scrollbox.current) return;
      olderHeight.current = scrollbox.current.scrollHeight;
      setMessages((current) => mergeMessages(current, result.messages));
      setHasOlder(result.hasOlder);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setLoadingOlder(false);
    }
  }

  async function send(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    if (retry.current?.body !== body) {
      retry.current = { body, requestId: crypto.randomUUID() };
    }
    setSending(true);
    setActionError("");
    try {
      const result = await chatRequest(endpoint, { method: "POST", body: retry.current });
      stickToBottom.current = true;
      setMessages((current) => mergeMessages(current, [result.message]));
      setDraft("");
      retry.current = null;
    } catch (error) {
      if (error.message === "Send the message again.") retry.current = null;
      setActionError(error.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div ref={scrollbox} role="region" aria-label="Message history" tabIndex={0}
        onScroll={(event) => {
          const box = event.currentTarget;
          stickToBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < 64;
        }}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4">
        {hasOlder && (
          <button type="button" onClick={loadOlder} disabled={loadingOlder}
            className="self-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {loadingOlder ? "Loading…" : "Load earlier messages"}
          </button>
        )}
        <div aria-live="polite" className="sr-only">
          {latest && messages.at(-1).senderRole !== role ? "New message received." : ""}
        </div>
        {loading && <p className="py-6 text-center text-sm text-slate-500">Loading messages…</p>}
        {!loading && !loadError && !messages.length && (
          <p className="py-6 text-center text-sm text-slate-500">How can we help? Send us a message.</p>
        )}
        {messages.map((message) => {
          const own = message.senderRole === role;
          return (
            <div key={message._id} className={`max-w-[85%] ${own ? "self-end text-right" : "self-start"}`}>
              <p className={`whitespace-pre-wrap [overflow-wrap:anywhere] rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed
                ${own ? "rounded-br-md bg-emerald-700 text-white" : "rounded-bl-md bg-slate-100 text-slate-900"}`}>
                {message.body}
              </p>
              <time className="mt-1 block px-1 text-[11px] text-slate-500" dateTime={message.createdAt}>
                {new Date(message.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
              </time>
            </div>
          );
        })}
      </div>
      {(actionError || loadError) && (
        <p role="alert" className="px-4 pb-2 text-sm text-red-700">{actionError || loadError}</p>
      )}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input aria-label="Message" placeholder="Write a message…" value={draft} maxLength={2000}
          readOnly={sending} onChange={(event) => {
            setDraft(event.target.value);
            setActionError("");
          }}
          className="min-w-0 flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-base text-slate-900 outline-emerald-700"
        />
        <button type="submit" aria-label={sending ? "Sending message" : "Send message"} disabled={sending || !draft.trim()}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-700 text-white disabled:opacity-50">
          <Send size={18} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
