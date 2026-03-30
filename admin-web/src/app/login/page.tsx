import { redirect } from "next/navigation";
import { createAdminSession, getAdminSession } from "@/lib/auth";
import {
  assertAdminServerEnv,
  resolveAdminProfileAfterAuth,
  signInWithPassword,
} from "@/lib/supabase";

function redirectLoginError(message: string) {
  redirect(`/login?error=${encodeURIComponent(message.slice(0, 450))}`);
}

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAdminSession();

  if (session?.is_admin) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const error =
    typeof params.error === "string"
      ? params.error
      : "Accede uniquement avec un compte administrateur.";

  async function loginAction(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    if (!email || !password) {
      redirect("/login?error=Email+et+mot+de+passe+requis");
    }

    try {
      assertAdminServerEnv();
      const sessionData = await signInWithPassword(email, password);
      const profile = await resolveAdminProfileAfterAuth(
        sessionData.user.id,
        sessionData.user.email,
      );

      if (!profile) {
        redirectLoginError(
          "Profil introuvable dans la table public.users pour ce compte Auth. Verifiez que la ligne users existe (meme id que auth.users) ou que l'email correspond.",
        );
      }

      if (!profile?.is_admin) {
        redirectLoginError(
          "Ce compte n'a pas is_admin = true dans public.users. Mettez is_admin a true pour cet utilisateur.",
        );
      }

      await createAdminSession(sessionData.access_token);
      redirect("/dashboard");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Connexion admin impossible";
      if (msg.includes("Missing environment variable")) {
        redirectLoginError(
          `${msg}. Ajoutez SUPABASE_SERVICE_ROLE_KEY (et les cles anon/url) dans admin-web/.env.local — sans la service role, le profil admin ne peut pas etre lu.`,
        );
      }
      redirectLoginError(msg);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#4c1d95,transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-6 py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur xl:p-12">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">
            Koach Reader
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold text-white xl:text-5xl">
            Espace administrateur web pour piloter toute l&apos;application.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">
            Ce back-office est pense pour gerer les livres, les contenus gratuits,
            les communautes, les groupes, les comptes utilisateurs et l&apos;evolution
            future des abonnements premium, le tout sur la meme base que l&apos;app
            mobile.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              "Gestion des livres et des auteurs",
              "Moderation des communautes et groupes",
              "Pilotage des comptes admin et premium",
              "Base unique partagee avec l'app mobile",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white">Connexion admin</h2>
            <p className="mt-2 text-sm text-slate-400">
              Utilise un compte ayant `is_admin = true` dans la table `users`.
            </p>
          </div>

          <form action={loginAction} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Email</span>
              <input
                type="email"
                name="email"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-violet-400"
                placeholder="admin@koachreader.app"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Mot de passe</span>
              <input
                type="password"
                name="password"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-violet-400"
                placeholder="Votre mot de passe"
                required
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-2xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400"
            >
              Ouvrir le back-office
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        </section>
      </div>
    </main>
  );
}
