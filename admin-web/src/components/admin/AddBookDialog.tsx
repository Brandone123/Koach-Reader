"use client";

import { useState } from "react";
import type { AdminAuthor } from "@/lib/supabase";
import { AdminModal, fieldClass, labelClass, primaryBtnClass } from "./AdminModal";
import { IconPlus } from "./icons";

type Props = {
  authors: AdminAuthor[];
  createBookAction: (formData: FormData) => Promise<void>;
};

export function AddBookDialog({ authors, createBookAction }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={primaryBtnClass}
      >
        <IconPlus className="opacity-90" />
        Nouveau livre
      </button>

      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau livre"
        subtitle="Les lecteurs verront ce livre dans l’app après enregistrement."
        wide
      >
        <form
          action={async (fd) => {
            await createBookAction(fd);
            setOpen(false);
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className={labelClass}>Titre</label>
            <input
              name="title"
              placeholder="Titre du livre"
              className={`${fieldClass} mt-1.5`}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Auteur</label>
            <select
              name="author_id"
              className={`${fieldClass} mt-1.5`}
              defaultValue=""
            >
              <option value="">Non défini</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Langue</label>
            <input
              name="language"
              placeholder="ex. fr"
              defaultValue="fr"
              className={`${fieldClass} mt-1.5`}
            />
          </div>
          <div>
            <label className={labelClass}>Nombre de pages</label>
            <input
              name="total_pages"
              type="number"
              min={1}
              placeholder="0"
              className={`${fieldClass} mt-1.5`}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>URL couverture</label>
            <input
              name="cover_url"
              placeholder="https://…"
              className={`${fieldClass} mt-1.5`}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>URL PDF</label>
            <input
              name="pdf_url"
              placeholder="https://…"
              className={`${fieldClass} mt-1.5`}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Résumé ou accroche…"
              className={`${fieldClass} mt-1.5 resize-y`}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 sm:col-span-2">
            <input type="checkbox" name="is_free" className="rounded border-slate-600" />
            <span className="text-sm text-slate-200">Livre gratuit</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 sm:col-span-2">
            <input type="checkbox" name="is_featured" className="rounded border-slate-600" />
            <span className="text-sm text-slate-200">Mettre à la une</span>
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" className={primaryBtnClass}>
              Enregistrer
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  );
}
