"use client";

import { useState } from "react";
import type { AdminProfile } from "@/lib/supabase";
import {
  AdminModal,
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
import { IconEye, IconPencil } from "./icons";

type Props = {
  users: AdminProfile[];
  updateUserAction: (formData: FormData) => Promise<void>;
};

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

export function UsersTable({ users, updateUserAction }: Props) {
  const [mode, setMode] = useState<"view" | "edit" | null>(null);
  const [active, setActive] = useState<AdminProfile | null>(null);

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
                <th className={thClass()}>Pseudo</th>
                <th className={thClass()}>Email</th>
                <th className={thClass()}>Admin</th>
                <th className={thClass()}>Premium</th>
                <th className={thClass()}>Onboarding</th>
                <th className={thClass()}>Dernière connexion</th>
                <th className={`${thClass()} w-[1%] whitespace-nowrap text-right`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className={`${tdClass()} py-12 text-center text-slate-500`}
                  >
                    Aucun utilisateur.
                  </td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <tr
                    key={user.id}
                    className={`${trRowClass(i)} transition-colors hover:bg-violet-500/[0.06]`}
                  >
                    <td className={`${tdClass()} font-medium text-white`}>
                      {user.username}
                    </td>
                    <td className={`${tdClass()} max-w-[200px] truncate text-sm`}>
                      {user.email}
                    </td>
                    <td className={tdClass()}>
                      {user.is_admin ? (
                        <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200">
                          Oui
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className={tdClass()}>
                      {user.is_premium ? (
                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-200">
                          Oui
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className={tdClass()}>
                      {user.has_completed_onboarding ? (
                        <span className="text-slate-300">Oui</span>
                      ) : (
                        <span className="text-slate-500">Non</span>
                      )}
                    </td>
                    <td className={`${tdClass()} whitespace-nowrap text-xs text-slate-500`}>
                      {user.last_login ? shortDate(user.last_login) : "—"}
                    </td>
                    <td className={`${tdClass()} text-right`}>
                      <div className="inline-flex justify-end gap-1">
                        <button
                          type="button"
                          className={tableIconVariants.view}
                          onClick={() => {
                            setActive(user);
                            setMode("view");
                          }}
                          aria-label="Voir le profil"
                          title="Voir le profil"
                        >
                          <IconEye />
                        </button>
                        <button
                          type="button"
                          className={tableIconVariants.edit}
                          onClick={() => {
                            setActive(user);
                            setMode("edit");
                          }}
                          aria-label="Modifier les droits"
                          title="Modifier les droits"
                        >
                          <IconPencil />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        La suppression d’un compte se fait depuis Supabase Auth pour rester aligné avec
        l’authentification.
      </p>

      <AdminModal
        open={mode === "view" && active != null}
        onClose={close}
        title={active ? active.username : ""}
        subtitle={active ? active.email : undefined}
        wide
      >
        {active && (
          <dl className="grid gap-4 text-sm">
            {[
              ["ID", active.id],
              ["Email", active.email],
              ["Pseudo", active.username],
              ["Admin", active.is_admin ? "Oui" : "Non"],
              ["Premium", active.is_premium ? "Oui" : "Non"],
              ["Onboarding", active.has_completed_onboarding ? "Oui" : "Non"],
              ["Créé le", shortDate(active.created_at)],
              ["Dernière connexion", active.last_login ? shortDate(active.last_login) : "—"],
              ["Points Koach", String(active.koach_points ?? "—")],
              ["Streak", String(active.reading_streak ?? "—")],
              ["Avatar", active.avatar_url || "—"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="grid gap-1 border-b border-slate-800/80 pb-3 last:border-0 sm:grid-cols-[minmax(0,160px)_1fr]"
              >
                <dt className="text-slate-500">{k}</dt>
                <dd className="break-all text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </AdminModal>

      <AdminModal
        open={mode === "edit" && active != null}
        onClose={close}
        title="Droits utilisateur"
        subtitle={active ? `${active.username} · ${active.email}` : undefined}
      >
        {active && (
          <form
            action={async (fd) => {
              await updateUserAction(fd);
              close();
            }}
            className="grid gap-4"
          >
            <input type="hidden" name="id" value={active.id} />
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/40 px-4 py-3">
              <input type="checkbox" name="is_admin" defaultChecked={active.is_admin} />
              <span className="text-sm text-slate-200">Accès administrateur</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/40 px-4 py-3">
              <input type="checkbox" name="is_premium" defaultChecked={active.is_premium} />
              <span className="text-sm text-slate-200">Compte premium</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/40 px-4 py-3">
              <input
                type="checkbox"
                name="has_completed_onboarding"
                defaultChecked={active.has_completed_onboarding}
              />
              <span className="text-sm text-slate-200">Onboarding complété</span>
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
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
