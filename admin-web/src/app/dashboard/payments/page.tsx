import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function PaymentsPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Paiements & abonnements
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Zone reservee au billing futur (Stripe, App Store, Google Play, etc.).
            Aujourd&apos;hui le statut premium est pilote par{" "}
            <code className="text-violet-300">users.is_premium</code> dans
            l&apos;onglet Utilisateurs.
          </p>
        </div>
        <Link
          href="/dashboard/users"
          className="rounded-2xl bg-violet-500 px-4 py-2 text-sm font-medium text-white"
        >
          Gerer is_premium
        </Link>
      </div>

      <section className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6 text-sm text-amber-100">
        <p className="font-semibold text-amber-50">Prochaines etapes suggerees</p>
        <ul className="mt-3 list-inside list-disc space-y-2">
          <li>
            Table <code className="text-amber-200">subscriptions</code> ou
            integration Stripe (webhooks) pour mettre a jour{" "}
            <code className="text-amber-200">is_premium</code> automatiquement.
          </li>
          <li>
            Page de synthese MRR / abonnements actifs / annulations (lecture SQL
            ou API dediee).
          </li>
          <li>
            Journal des transactions et remboursements (admin read-only au debut).
          </li>
        </ul>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <h3 className="text-lg font-semibold text-white">Etat actuel</h3>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Aucun fournisseur de paiement n&apos;est encore branche sur ce panneau.
          Les administrateurs peuvent deja activer ou desactiver manuellement le
          flag premium par utilisateur depuis la section Utilisateurs du menu.
        </p>
      </section>
    </div>
  );
}
