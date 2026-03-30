import Link from "next/link";
import {
  aggregateSessionsByUser,
  loadAnalyticsPayload,
  loginActivityByDay,
  plansWithProgress,
} from "@/lib/admin-stats";
import { getBooks, getUsers } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export default async function AnalyticsPage() {
  await requireAdmin();
  const [users, books, analytics] = await Promise.all([
    getUsers(),
    getBooks(),
    loadAnalyticsPayload(),
  ]);

  const bookPages = new Map(books.map((b) => [b.id, b.total_pages]));
  const bookTitle = new Map(books.map((b) => [b.id, b.title]));
  const usersById = new Map(users.map((u) => [u.id, u]));

  const loginBuckets = loginActivityByDay(users, 21);
  const planProgress = plansWithProgress(
    analytics.plans,
    bookPages,
    usersById,
  );
  const sessionLeaders = aggregateSessionsByUser(analytics.sessions, 25);

  const challengeById = new Map(
    analytics.challenges.map((c) => [c.id, c]),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Statistiques approfondies
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Progression des utilisateurs, sessions, plans de lecture et
            participation aux defis. Les donnees sont lues en direct depuis
            Supabase.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-slate-200"
        >
          Retour vue globale
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <h3 className="text-lg font-semibold text-white">
            Connexions (last_login par jour)
          </h3>
          <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto text-sm">
            {loginBuckets.length === 0 ? (
              <li className="text-slate-500">Aucune donnee.</li>
            ) : (
              loginBuckets.map((row) => (
                <li
                  key={row.date}
                  className="flex justify-between rounded-xl bg-white/5 px-3 py-2"
                >
                  <span>{row.date}</span>
                  <span className="text-violet-300">{row.count}</span>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <h3 className="text-lg font-semibold text-white">
            Top lecteurs (pages / Koach)
          </h3>
          <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto text-sm">
            {sessionLeaders.map((row) => {
              const name = usersById.get(row.userId)?.username ?? row.userId;
              return (
                <li
                  key={row.userId}
                  className="rounded-xl bg-white/5 px-3 py-2"
                >
                  <div className="font-medium text-white">{name}</div>
                  <div className="text-slate-400">
                    {row.pages} pages · {row.koach} pts Koach · {row.sessions}{" "}
                    seances · dernier {row.lastAt.slice(0, 10)}
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <h3 className="text-lg font-semibold text-white">
          Plans de lecture — progression detaillee
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="pb-2 pr-3">Utilisateur</th>
                <th className="pb-2 pr-3">Livre</th>
                <th className="pb-2 pr-3">Pages</th>
                <th className="pb-2 pr-3">Objectif / jour</th>
                <th className="pb-2 pr-3">%</th>
                <th className="pb-2 pr-3">Derniere lecture</th>
                <th className="pb-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {planProgress.slice(0, 40).map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="py-2 pr-3 text-slate-200">{p.username}</td>
                  <td className="py-2 pr-3 text-slate-400">
                    {bookTitle.get(p.book_id) ?? `#${p.book_id}`}
                  </td>
                  <td className="py-2 pr-3">
                    {p.current_page} / {p.bookTotalPages || "?"}
                  </td>
                  <td className="py-2 pr-3 text-slate-400">{p.daily_goal}</td>
                  <td className="py-2 pr-3 text-violet-300">{p.progressPercent}%</td>
                  <td className="py-2 pr-3 text-slate-500">
                    {p.last_read_date
                      ? String(p.last_read_date).slice(0, 16)
                      : "—"}
                  </td>
                  <td className="py-2 text-slate-400">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <h3 className="text-lg font-semibold text-white">Defis</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-slate-400">Defis en base</h4>
            <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm">
              {analytics.challenges.map((c) => (
                <li key={c.id} className="rounded-xl bg-white/5 px-3 py-2">
                  <span className="text-white">{c.title}</span>
                  <span className="ml-2 text-slate-500">
                    {c.target_type} {c.target_value} · {c.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-400">
              Participants recents
            </h4>
            <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm">
              {analytics.participants.map((p) => {
                const ch = challengeById.get(p.challenge_id);
                const uname =
                  usersById.get(p.user_id)?.username ?? p.user_id.slice(0, 8);
                return (
                  <li key={p.id} className="rounded-xl bg-white/5 px-3 py-2">
                    <div className="text-white">{uname}</div>
                    <div className="text-slate-400">
                      {ch?.title ?? `Defi #${p.challenge_id}`} · progression{" "}
                      {p.current_progress} · {p.status}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <h3 className="text-lg font-semibold text-white">
          Sessions de lecture (extrait)
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="pb-2 pr-3">Date</th>
                <th className="pb-2 pr-3">Utilisateur</th>
                <th className="pb-2 pr-3">Livre</th>
                <th className="pb-2 pr-3">Pages</th>
                <th className="pb-2">Koach</th>
              </tr>
            </thead>
            <tbody>
              {analytics.sessions.slice(0, 30).map((s) => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="py-2 pr-3 text-slate-500">
                    {s.session_date.slice(0, 16)}
                  </td>
                  <td className="py-2 pr-3 text-slate-200">
                    {usersById.get(s.user_id)?.username ?? s.user_id.slice(0, 8)}
                  </td>
                  <td className="py-2 pr-3 text-slate-400">
                    {bookTitle.get(s.book_id) ?? `#${s.book_id}`}
                  </td>
                  <td className="py-2 pr-3">{s.pages_read}</td>
                  <td className="py-2">{s.koach_earned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
