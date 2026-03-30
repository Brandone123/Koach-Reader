"use client";

import { useState } from "react";
import type { AdminAuthor, AdminBook } from "@/lib/supabase";
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
  books: AdminBook[];
  authors: AdminAuthor[];
  updateBookAction: (formData: FormData) => Promise<void>;
  deleteBookAction: (formData: FormData) => Promise<void>;
};

function authorName(authors: AdminAuthor[], id: number | null) {
  if (id == null) return "—";
  return authors.find((a) => a.id === id)?.name ?? `#${id}`;
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

export function BooksTable({
  books,
  authors,
  updateBookAction,
  deleteBookAction,
}: Props) {
  const [mode, setMode] = useState<"view" | "edit" | null>(null);
  const [active, setActive] = useState<AdminBook | null>(null);

  const close = () => {
    setMode(null);
    setActive(null);
  };

  return (
    <>
      <div className="space-y-3 md:hidden">
        {books.length === 0 ? (
          <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-4 py-10 text-center text-sm text-slate-500">
            Aucun livre. Utilisez « Nouveau livre » pour en ajouter un.
          </div>
        ) : (
          books.map((book) => (
            <article
              key={book.id}
              className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 shadow-sm"
            >
              <div className="flex gap-3">
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium leading-snug text-white">
                    {book.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    #{book.id} · {authorName(authors, book.author_id)} · {book.total_pages}{" "}
                    p. · {book.language ?? "—"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {book.is_free ? (
                      <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-200">
                        Gratuit
                      </span>
                    ) : null}
                    {book.is_featured ? (
                      <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-xs text-violet-200">
                        À la une
                      </span>
                    ) : null}
                    <span className="text-xs text-slate-500">{shortDate(book.updated_at)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end justify-start gap-1">
                  <button
                    type="button"
                    className={tableIconVariants.view}
                    onClick={() => {
                      setActive(book);
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
                      setActive(book);
                      setMode("edit");
                    }}
                    aria-label="Modifier"
                    title="Modifier"
                  >
                    <IconPencil />
                  </button>
                  <form
                    action={deleteBookAction}
                    className="inline"
                    onSubmit={(e) => {
                      if (
                        !confirm(
                          `Supprimer « ${book.title} » ? Cette action est irréversible.`,
                        )
                      ) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={book.id} />
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
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden min-w-0 w-full md:block">
        <div className={tableShellClass()}>
          <div className={tableScrollClass()}>
            <table className={tableClass()}>
            <thead>
              <tr>
                <th className={thClass()}>ID</th>
                <th className={thClass()}>Titre</th>
                <th className={thClass()}>Auteur</th>
                <th className={thClass()}>Lang.</th>
                <th className={thClass()}>Pages</th>
                <th className={thClass()}>Gratuit</th>
                <th className={thClass()}>À la une</th>
                <th className={thClass()}>Mise à jour</th>
                <th className={`${thClass()} w-[1%] whitespace-nowrap text-right`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className={`${tdClass()} py-12 text-center text-slate-500`}
                  >
                    Aucun livre. Utilisez « Nouveau livre » pour en ajouter un.
                  </td>
                </tr>
              ) : (
                books.map((book, i) => (
                  <tr
                    key={book.id}
                    className={`${trRowClass(i)} transition-colors hover:bg-violet-500/[0.06]`}
                  >
                    <td className={`${tdClass()} font-mono text-xs text-slate-500`}>
                      {book.id}
                    </td>
                    <td className={`${tdClass()} max-w-[220px]`}>
                      <span className="block truncate font-medium text-white">
                        {book.title}
                      </span>
                    </td>
                    <td className={tdClass()}>{authorName(authors, book.author_id)}</td>
                    <td className={tdClass()}>{book.language ?? "—"}</td>
                    <td className={tdClass()}>{book.total_pages}</td>
                    <td className={tdClass()}>
                      {book.is_free ? (
                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-200">
                          Oui
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className={tdClass()}>
                      {book.is_featured ? (
                        <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-xs text-violet-200">
                          Oui
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className={`${tdClass()} whitespace-nowrap text-xs text-slate-500`}>
                      {shortDate(book.updated_at)}
                    </td>
                    <td className={`${tdClass()} text-right`}>
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className={tableIconVariants.view}
                          onClick={() => {
                            setActive(book);
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
                            setActive(book);
                            setMode("edit");
                          }}
                          aria-label="Modifier"
                          title="Modifier"
                        >
                          <IconPencil />
                        </button>
                        <form
                          action={deleteBookAction}
                          className="inline"
                          onSubmit={(e) => {
                            if (
                              !confirm(
                                `Supprimer « ${book.title} » ? Cette action est irréversible.`,
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={book.id} />
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
      </div>

      <AdminModal
        open={mode === "view" && active != null}
        onClose={close}
        title={active ? active.title : ""}
        subtitle={active ? `Livre n°${active.id}` : undefined}
        wide
      >
        {active && (
          <dl className="grid gap-4 text-sm">
            {[
              ["Titre", active.title],
              ["Description", active.description || "—"],
              ["Langue", active.language || "—"],
              ["Pages", String(active.total_pages)],
              ["Auteur", authorName(authors, active.author_id)],
              ["Couverture", active.cover_url || "—"],
              ["PDF", active.pdf_url || "—"],
              ["Gratuit", active.is_free ? "Oui" : "Non"],
              ["À la une", active.is_featured ? "Oui" : "Non"],
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
        title="Modifier le livre"
        subtitle={active ? active.title : undefined}
        wide
      >
        {active && (
          <form
            action={async (fd) => {
              await updateBookAction(fd);
              close();
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <input type="hidden" name="id" value={active.id} />
            <div className="sm:col-span-2">
              <label className={labelClass}>Titre</label>
              <input
                name="title"
                defaultValue={active.title}
                className={`${fieldClass} mt-1.5`}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Auteur</label>
              <select
                name="author_id"
                defaultValue={active.author_id ?? ""}
                className={`${fieldClass} mt-1.5`}
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
                defaultValue={active.language ?? ""}
                className={`${fieldClass} mt-1.5`}
              />
            </div>
            <div>
              <label className={labelClass}>Pages</label>
              <input
                name="total_pages"
                type="number"
                min={1}
                defaultValue={active.total_pages}
                className={`${fieldClass} mt-1.5`}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>URL couverture</label>
              <input
                name="cover_url"
                defaultValue={active.cover_url ?? ""}
                className={`${fieldClass} mt-1.5`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>URL PDF</label>
              <input
                name="pdf_url"
                defaultValue={active.pdf_url ?? ""}
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
              <input type="checkbox" name="is_free" defaultChecked={active.is_free} />
              <span className="text-sm text-slate-200">Livre gratuit</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 sm:col-span-2">
              <input
                type="checkbox"
                name="is_featured"
                defaultChecked={Boolean(active.is_featured)}
              />
              <span className="text-sm text-slate-200">À la une</span>
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
