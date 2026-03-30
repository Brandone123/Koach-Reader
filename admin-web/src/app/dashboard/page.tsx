import Link from "next/link";
import { loadDashboardBundle } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth";

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const {
    counts,
    users,
    books,
    loginBuckets,
    planProgress,
    sessionLeaders,
    analytics,
  } = await loadDashboardBundle();

  const nUsers = counts.users ?? users.length;
  const nBooks = counts.books ?? books.length;
  const nSessions = counts.readingSessions ?? analytics.sessions.length;
  const nPlans = counts.readingPlans ?? analytics.plans.length;
  const nChallenges = counts.challenges ?? analytics.challenges.length;
  const premiumUsers = users.filter((u) => u.is_premium).length;
  const adminUsers = users.filter((u) => u.is_admin).length;
  const freeBooks = books.filter((b) => b.is_free).length;
  const featuredBooks = books.filter((b) => b.is_featured).length;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300">
          Vue globale
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          Bonjour {admin.username}, tableau de bord et statistiques applicatives.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          Les chiffres viennent de Supabase (comptages et dernieres activites). Pour
          des analyses plus fines (progression, defis, frequence de connexion), ouvre
          la page{" "}
          <Link href="/dashboard/analytics" className="text-violet-300 underline">
            Statistiques approfondies
          </Link>
          .
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/analytics"
            className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white"
          >
            Statistiques approfondies
          </Link>
          <Link
            href="/dashboard/payments"
            className="rounded-2xl border border-white/20 px-5 py-3 text-sm text-slate-200"
          >
            Paiements & abonnements
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Utilisateurs",
            value: nUsers,
            hint: `${premiumUsers} premium · ${adminUsers} admin`,
          },
          {
            label: "Livres",
            value: nBooks,
            hint: `${freeBooks} gratuits · ${featuredBooks} mis en avant`,
          },
          {
            label: "Sessions de lecture",
            value: nSessions,
            hint: "Dernieres lignes dans reading_sessions",
          },
          {
            label: "Plans & defis",
            value: nPlans,
            hint: `${nChallenges} defis actifs en base`,
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-3xl border border-white/10 bg-slate-900/70 p-6"
          >
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-3 text-4xl font-semibold text-white">{item.value}</p>
            <p className="mt-2 text-sm text-violet-200">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <h3 className="text-lg font-semibold text-white">
            Frequence de connexion (proxy)
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Repartition des utilisateurs par jour selon{" "}
            <code className="text-violet-300">last_login</code> dans{" "}
            <code className="text-violet-300">public.users</code>. Pour du suivi
            precis, branchez plus tard des evenements analytics ou{" "}
            <code className="text-violet-300">auth.audit_log_entries</code>.
          </p>
          <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto text-sm">
            {loginBuckets.length === 0 ? (
              <li className="text-slate-500">Pas encore de donnees last_login.</li>
            ) : (
              loginBuckets.map((row) => (
                <li
                  key={row.date}
                  className="flex justify-between rounded-xl bg-white/5 px-3 py-2"
                >
                  <span className="text-slate-300">{row.date}</span>
                  <span className="font-medium text-white">{row.count}</span>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <h3 className="text-lg font-semibold text-white">
            Top lecteurs (pages lues, echantillon recent)
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {sessionLeaders.length === 0 ? (
              <li className="text-slate-500">Aucune session recente.</li>
            ) : (
              sessionLeaders.map((row) => (
                <li
                  key={row.userId}
                  className="flex flex-wrap justify-between gap-2 rounded-xl bg-white/5 px-3 py-2"
                >
                  <span className="text-slate-200">{row.userId.slice(0, 8)}…</span>
                  <span className="text-slate-400">
                    {row.pages} p. · {row.koach} pts · {row.sessions} seances
                  </span>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <h3 className="text-lg font-semibold text-white">
          Progression des plans de lecture (echantillon)
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="pb-2 pr-4">Utilisateur</th>
                <th className="pb-2 pr-4">Livre</th>
                <th className="pb-2 pr-4">Page</th>
                <th className="pb-2 pr-4">Progression</th>
                <th className="pb-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {planProgress.slice(0, 12).map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="py-2 pr-4 text-slate-200">{p.username}</td>
                  <td className="py-2 pr-4 text-slate-400">#{p.book_id}</td>
                  <td className="py-2 pr-4 text-slate-300">
                    {p.current_page}/{p.bookTotalPages || "?"}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="h-2 w-full max-w-[120px] rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-violet-500"
                        style={{ width: `${p.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{p.progressPercent}%</span>
                  </td>
                  <td className="py-2 text-slate-400">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
