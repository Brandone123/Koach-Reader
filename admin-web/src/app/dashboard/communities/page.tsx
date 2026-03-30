import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { AddCommunityDialog } from "@/components/admin/AddCommunityDialog";
import { CommunitiesTable } from "@/components/admin/CommunitiesTable";
import {
  deleteRow,
  getCommunities,
  getUsers,
  insertRow,
  updateRow,
} from "@/lib/supabase";

function textOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

export default async function CommunitiesPage() {
  const admin = await requireAdmin();
  const [communities, users] = await Promise.all([getCommunities(), getUsers()]);

  async function createCommunityAction(formData: FormData) {
    "use server";

    await requireAdmin();

    await insertRow("communities", {
      name: String(formData.get("name") ?? "").trim(),
      description: textOrNull(formData.get("description")),
      category: textOrNull(formData.get("category")),
      cover_image_url: textOrNull(formData.get("cover_image_url")),
      creator_id: String(formData.get("creator_id") ?? "").trim(),
      is_private: formData.get("is_private") === "on",
    });

    revalidatePath("/dashboard/communities");
    revalidatePath("/dashboard");
  }

  async function updateCommunityAction(formData: FormData) {
    "use server";

    await requireAdmin();

    await updateRow("communities", Number(formData.get("id")), {
      name: String(formData.get("name") ?? "").trim(),
      description: textOrNull(formData.get("description")),
      category: textOrNull(formData.get("category")),
      cover_image_url: textOrNull(formData.get("cover_image_url")),
      creator_id: String(formData.get("creator_id") ?? "").trim(),
      is_private: formData.get("is_private") === "on",
    });

    revalidatePath("/dashboard/communities");
    revalidatePath("/dashboard");
  }

  async function deleteCommunityAction(formData: FormData) {
    "use server";

    await requireAdmin();
    await deleteRow("communities", Number(formData.get("id")));
    revalidatePath("/dashboard/communities");
    revalidatePath("/dashboard");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-lg shadow-black/10">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Communautés
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Espaces visibles dans l&apos;app. Création par dialogue, suivi et édition dans
          le tableau.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Liste</h2>
            <p className="mt-1 text-sm text-slate-500">
              {communities.length} communauté{communities.length !== 1 ? "s" : ""}
            </p>
          </div>
          <AddCommunityDialog
            users={users}
            defaultCreatorId={admin.id}
            createCommunityAction={createCommunityAction}
          />
        </div>
        <div className="mt-6">
          <CommunitiesTable
            communities={communities}
            users={users}
            updateCommunityAction={updateCommunityAction}
            deleteCommunityAction={deleteCommunityAction}
          />
        </div>
      </section>
    </div>
  );
}
