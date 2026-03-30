import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { destroyAdminSession, requireAdmin } from "@/lib/auth";

const navigationItems = [
  { href: "/dashboard", label: "Vue globale" },
  { href: "/dashboard/analytics", label: "Statistiques" },
  { href: "/dashboard/payments", label: "Paiements" },
  { href: "/dashboard/books", label: "Livres" },
  { href: "/dashboard/users", label: "Utilisateurs" },
  { href: "/dashboard/communities", label: "Communautes" },
  { href: "/dashboard/groups", label: "Groupes" },
];

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireAdmin();

  async function logoutAction() {
    "use server";

    await destroyAdminSession();
    revalidatePath("/dashboard", "layout");
    redirect("/login?error=Session+admin+fermee");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-slate-900/80 p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-violet-300">
              Admin
            </p>
            <h1 className="mt-3 text-2xl font-semibold">Koach Reader</h1>
            <p className="mt-2 text-sm text-slate-300">
              {admin.username} · {admin.email}
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-violet-400/30 hover:bg-violet-500/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <form action={logoutAction} className="mt-8">
            <button
              type="submit"
              className="w-full rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
            >
              Se deconnecter
            </button>
          </form>
        </aside>

        <main className="min-w-0 max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
