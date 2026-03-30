"use client";

import { useState } from "react";
import type { AdminBook, AdminProfile, AdminReadingGroup } from "@/lib/supabase";
import {
  AdminModal,
  fieldClass,
  labelClass,
  primaryBtnClass,
  secondaryBtnClass,
  tableClass,
  tableIconVariants,
  tableScrollClass,
  tableShellClass,
  tdClass,
  thClass,
  trRowClass,
} from "./AdminModal";
import { IconEye, IconPencil, IconTrash } from "./icons";

type Props = {
  groups: AdminReadingGroup[];
  users: AdminProfile[];
  books: AdminBook[];
  updateGroupAction: (formData: FormData) => Promise<void>;
  deleteGroupAction: (formData: FormData) => Promise<void>;
};

function userLabel(users: AdminProfile[], id: string) {
  return users.find((u) => u.id === id)?.username ?? `${id.slice(0, 8)}…`;
}

function bookTitle(books: AdminBook[], id: number | null) {
  if (id == null) return "—";
  return books.find((b) => b.id === id)?.title ?? `#${id}`;
}

function shortDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function GroupsTable({
  groups,
  users,
  books,
  updateGroupAction,
  deleteGroupAction,
}: Props) {
  const [mode, setMode] = useState<"view" | "edit" | null>(null);
  const [active, setActive] = useState<AdminReadingGroup | null>(null);

  const close = () => {
    setMode(null);
    setActive(null);
  };

  return (
    <>
      <div className={tableShellClass()}>
        <div className={tableScrollClass()}>
          <table className={tableClass()}>
            <thead>
              <tr>
                <th className={thClass()}>ID</th>
                <th className={thClass()}>Nom</th>
                <th className={thClass()}>Créateur</th>
                <th className={thClass()}>Livre courant</th>
                <th className={thClass()}>Visibilité</th>
                <th className={thClass()}>Mise à jour</th>
                <th className={`${thClass()} w-[1%] whitespace-nowrap text-right`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className={`${tdClass()} py-12 text-center text-slate-500`}
                  >
                    Aucun groupe. Utilisez « Nouveau groupe » pour en créer un.
                  </td>
                </tr>
              ) : (
                groups.map((g, i) => (
                  <tr
                    key={g.id}
                    className={`${trRowClass(i)} transition-colors hover:bg-violet-500/[0.06]`}
                  >
                    <td className={`${tdClass()} font-mono text-xs text-slate-500`}>
                      {g.id}
                    </td>
                    <td className={`${tdClass()} max-w-[200px]`}>
                      <span className="block truncate font-medium text-white">{g.name}</span>
                    </td>
                    <td className={`${tdClass()} text-xs`}>{userLabel(users, g.creator_id)}</td>
                    <td className={`${tdClass()} max-w-[160px] truncate text-xs`}>
                      {bookTitle(books, g.current_book_id)}
                    </td>
                    <td className={tdClass()}>
                      {g.is_private ? (
                        <span className="rounded-md bg-slate-600/40 px-2 py-0.5 text-xs text-slate-200">
                          Privé
                        </span>
                      ) : (
                        <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-xs text-sky-200">
                          Public
                        </span>
                      )}
                    </td>
                    <td className={`${tdClass()} whitespace-nowrap text-xs text-slate-500`}>
                      {shortDate(g.updated_at)}
                    </td>
                    <td className={`${tdClass()} text-right`}>
                      <div className="inline-flex justify-end gap-1">
                        <button
                          type="button"
                          className={tableIconVariants.view}
                          onClick={() => {
                            setActive(g);
                            setMode("view");
                          }}
                          aria-label="Voir le détail"
                          title="Voir le détail"
                        >
                          <IconEye />
                        </button>
                        <button
                          type="button"
                          className={tableIconVariants.edit}
                          onClick={() => {
                            setActive(g);
                            setMode("edit");
                          }}
                          aria-label="Modifier"
                          title="Modifier"
                        >
                          <IconPencil />
                        </button>
                        <form
                          action={deleteGroupAction}
                          className="inline"
                          onSubmit={(e) => {
                            if (
                              !confirm(
                                `Supprimer « ${g.name} » ? Cette action est irréversible.`,
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={g.id} />
                          <button
                            type="submit"
                            className={tableIconVariants.danger}
                            aria-label="Supprimer"
                            title="Supprimer"
                          >
                            <IconTrash />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModal
        open={mode === "view" && active != null}
        onClose={close}
        title={active ? active.name : ""}
        subtitle={active ? `Groupe n°${active.id}` : undefined}
        wide
      >
        {active && (
          <dl className="grid gap-4 text-sm">
            {[
              ["Nom", active.name],
              ["Description", active.description || "—"],
              ["Créateur", userLabel(users, active.creator_id)],
              ["Livre courant", bookTitle(books, active.current_book_id)],
              ["Couverture", active.cover_image_url || "—"],
              ["Visibilité", active.is_private ? "Privé" : "Public"],
              ["Mis à jour", shortDate(active.updated_at)],
            ].map(([k, v]) => (
              <div
                key={k}
                className="grid gap-1 border-b border-slate-800/80 pb-3 last:border-0 sm:grid-cols-[minmax(0,140px)_1fr]"
              >
                <dt className="text-slate-500">{k}</dt>
                <dd className="break-words text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </AdminModal>

      <AdminModal
        open={mode === "edit" && active != null}
        onClose={close}
        title="Modifier le groupe"
        subtitle={active ? active.name : undefined}
        wide
      >
        {active && (
          <form
            action={async (fd) => {
              await updateGroupAction(fd);
              close();
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <input type="hidden" name="id" value={active.id} />
            <div className="sm:col-span-2">
              <label className={labelClass}>Nom</label>
              <input
                name="name"
                defaultValue={active.name}
                className={`${fieldClass} mt-1.5`}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Créateur</label>
              <select
                name="creator_id"
                defaultValue={active.creator_id}
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
              <label className={labelClass}>Livre courant</label>
              <select
                name="current_book_id"
                defaultValue={active.current_book_id ?? ""}
                className={`${fieldClass} mt-1.5`}
              >
                <option value="">Aucun</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Image (URL)</label>
              <input
                name="cover_image_url"
                defaultValue={active.cover_image_url ?? ""}
                className={`${fieldClass} mt-1.5`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                defaultValue={active.description ?? ""}
                rows={4}
                className={`${fieldClass} mt-1.5 resize-y`}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 sm:col-span-2">
              <input
                type="checkbox"
                name="is_private"
                defaultChecked={Boolean(active.is_private)}
              />
              <span className="text-sm text-slate-200">Groupe privé</span>
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button type="submit" className={primaryBtnClass}>
                Enregistrer
              </button>
              <button type="button" onClick={close} className={secondaryBtnClass}>
                Retour
              </button>
            </div>
          </form>
        )}
      </AdminModal>
    </>
  );
}
