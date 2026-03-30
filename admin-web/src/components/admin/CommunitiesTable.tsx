"use client";

import { useState } from "react";
import type { AdminCommunity, AdminProfile } from "@/lib/supabase";
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
  communities: AdminCommunity[];
  users: AdminProfile[];
  updateCommunityAction: (formData: FormData) => Promise<void>;
  deleteCommunityAction: (formData: FormData) => Promise<void>;
};

function userLabel(users: AdminProfile[], id: string) {
  return users.find((u) => u.id === id)?.username ?? `${id.slice(0, 8)}…`;
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

export function CommunitiesTable({
  communities,
  users,
  updateCommunityAction,
  deleteCommunityAction,
}: Props) {
  const [mode, setMode] = useState<"view" | "edit" | null>(null);
  const [active, setActive] = useState<AdminCommunity | null>(null);

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
                <th className={thClass()}>Catégorie</th>
                <th className={thClass()}>Créateur</th>
                <th className={thClass()}>Visibilité</th>
                <th className={thClass()}>Mise à jour</th>
                <th className={`${thClass()} w-[1%] whitespace-nowrap text-right`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {communities.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className={`${tdClass()} py-12 text-center text-slate-500`}
                  >
                    Aucune communauté. Utilisez « Nouvelle communauté » pour en créer une.
                  </td>
                </tr>
              ) : (
                communities.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`${trRowClass(i)} transition-colors hover:bg-violet-500/[0.06]`}
                  >
                    <td className={`${tdClass()} font-mono text-xs text-slate-500`}>
                      {c.id}
                    </td>
                    <td className={`${tdClass()} max-w-[200px]`}>
                      <span className="block truncate font-medium text-white">{c.name}</span>
                    </td>
                    <td className={tdClass()}>{c.category || "—"}</td>
                    <td className={`${tdClass()} text-xs`}>{userLabel(users, c.creator_id)}</td>
                    <td className={tdClass()}>
                      {c.is_private ? (
                        <span className="rounded-md bg-slate-600/40 px-2 py-0.5 text-xs text-slate-200">
                          Privée
                        </span>
                      ) : (
                        <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-xs text-sky-200">
                          Publique
                        </span>
                      )}
                    </td>
                    <td className={`${tdClass()} whitespace-nowrap text-xs text-slate-500`}>
                      {shortDate(c.updated_at)}
                    </td>
                    <td className={`${tdClass()} text-right`}>
                      <div className="inline-flex justify-end gap-1">
                        <button
                          type="button"
                          className={tableIconVariants.view}
                          onClick={() => {
                            setActive(c);
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
                            setActive(c);
                            setMode("edit");
                          }}
                          aria-label="Modifier"
                          title="Modifier"
                        >
                          <IconPencil />
                        </button>
                        <form
                          action={deleteCommunityAction}
                          className="inline"
                          onSubmit={(e) => {
                            if (
                              !confirm(
                                `Supprimer « ${c.name} » ? Cette action est irréversible.`,
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={c.id} />
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
        subtitle={active ? `Communauté n°${active.id}` : undefined}
        wide
      >
        {active && (
          <dl className="grid gap-4 text-sm">
            {[
              ["Nom", active.name],
              ["Catégorie", active.category || "—"],
              ["Description", active.description || "—"],
              ["Créateur", userLabel(users, active.creator_id)],
              ["Couverture", active.cover_image_url || "—"],
              ["Visibilité", active.is_private ? "Privée" : "Publique"],
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
        title="Modifier la communauté"
        subtitle={active ? active.name : undefined}
        wide
      >
        {active && (
          <form
            action={async (fd) => {
              await updateCommunityAction(fd);
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
              <label className={labelClass}>Catégorie</label>
              <input
                name="category"
                defaultValue={active.category ?? ""}
                className={`${fieldClass} mt-1.5`}
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
              <span className="text-sm text-slate-200">Communauté privée</span>
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
