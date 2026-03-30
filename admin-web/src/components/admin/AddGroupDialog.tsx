"use client";

import { useState } from "react";
import type { AdminBook, AdminProfile } from "@/lib/supabase";
import { AdminModal, fieldClass, labelClass, primaryBtnClass } from "./AdminModal";
import { IconPlus } from "./icons";

type Props = {
  users: AdminProfile[];
  books: AdminBook[];
  defaultCreatorId: string;
  createGroupAction: (formData: FormData) => Promise<void>;
};

export function AddGroupDialog({
  users,
  books,
  defaultCreatorId,
  createGroupAction,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={primaryBtnClass}
      >
        <IconPlus className="opacity-90" />
        Nouveau groupe
      </button>

      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau groupe de lecture"
        subtitle="Associez un livre et un animateur au groupe."
        wide
      >
        <form
          action={async (fd) => {
            await createGroupAction(fd);
            setOpen(false);
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className={labelClass}>Nom du groupe</label>
            <input
              name="name"
              className={`${fieldClass} mt-1.5`}
              placeholder="ex. Club lecture — janvier"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Créateur</label>
            <select
              name="creator_id"
              defaultValue={defaultCreatorId}
              className={`${fieldClass} mt-1.5`}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Livre en cours</label>
            <select name="current_book_id" className={`${fieldClass} mt-1.5`} defaultValue="">
              <option value="">Aucun</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Image de couverture (URL)</label>
            <input
              name="cover_image_url"
              className={`${fieldClass} mt-1.5`}
              placeholder="https://…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              name="description"
              rows={4}
              className={`${fieldClass} mt-1.5 resize-y`}
              placeholder="Objectifs, rythme, règles…"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 sm:col-span-2">
            <input type="checkbox" name="is_private" className="rounded border-slate-600" />
            <span className="text-sm text-slate-200">Groupe privé</span>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={primaryBtnClass}>
              Créer
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  );
}
