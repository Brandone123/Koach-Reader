"use client";

import { useEffect } from "react";
import { IconX } from "./icons";

export function AdminModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-label="Fermer la fenêtre"
      />
      <div
        className={`relative z-10 flex max-h-[min(90vh,880px)] w-full flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40 ring-1 ring-white/5 ${
          wide ? "max-w-3xl" : "max-w-md"
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-700/60 bg-slate-900/95 px-5 py-4">
          <div className="min-w-0 pr-2">
            <h3
              id="admin-modal-title"
              className="truncate text-base font-semibold tracking-tight text-white"
            >
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="group shrink-0 rounded-lg border border-transparent p-2 text-slate-400 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            aria-label="Fermer"
          >
            <IconX className="transition group-hover:scale-105" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

const tableIconBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

export const tableIconVariants = {
  view: `${tableIconBtn} border-slate-600/70 bg-slate-800/40 text-sky-300 hover:border-sky-500/40 hover:bg-sky-500/10`,
  edit: `${tableIconBtn} border-slate-600/70 bg-slate-800/40 text-violet-300 hover:border-violet-500/40 hover:bg-violet-500/10`,
  danger: `${tableIconBtn} border-slate-600/70 bg-slate-800/40 text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10`,
};

export function tableShellClass() {
  return "w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950/30 shadow-lg shadow-black/20";
}

export function tableScrollClass() {
  return "max-h-[min(70vh,720px)] w-full min-w-0 max-w-full overflow-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]";
}

export function tableClass() {
  return "w-full min-w-[640px] border-collapse text-left text-sm lg:min-w-[760px]";
}

export function thClass() {
  return "sticky top-0 z-[1] border-b border-slate-700/80 bg-slate-800/95 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400 backdrop-blur-sm";
}

export function tdClass() {
  return "border-b border-slate-800/80 px-4 py-3 align-middle text-slate-300";
}

export function trRowClass(i: number) {
  return i % 2 === 0 ? "bg-transparent" : "bg-slate-900/35";
}

export const fieldClass =
  "w-full rounded-xl border border-slate-600/70 bg-slate-950/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/25";

export const labelClass = "text-xs font-medium text-slate-400";

export const primaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-950/30 transition hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

export const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40";
