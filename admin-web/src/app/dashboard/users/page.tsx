import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { UsersTable } from "@/components/admin/UsersTable";
import { getUsers, updateRow } from "@/lib/supabase";

export default async function UsersPage() {
  await requireAdmin();
  const users = await getUsers();

  async function updateUserAction(formData: FormData) {
    "use server";

    await requireAdmin();

    const id = String(formData.get("id") ?? "");

    await updateRow("users", id, {
      is_admin: formData.get("is_admin") === "on",
      is_premium: formData.get("is_premium") === "on",
      has_completed_onboarding: formData.get("has_completed_onboarding") === "on",
    });

    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-lg shadow-black/10">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Utilisateurs
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Profils issus de <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">public.users</code>
          . Ouvrez une ligne pour consulter le détail ou ajuster admin, premium et
          onboarding.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Annuaire</h2>
        <p className="mt-1 text-sm text-slate-500">
          {users.length} compte{users.length !== 1 ? "s" : ""}
        </p>
        <div className="mt-6">
          <UsersTable users={users} updateUserAction={updateUserAction} />
        </div>
      </section>
    </div>
  );
}
