import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { AddGroupDialog } from "@/components/admin/AddGroupDialog";
import { GroupsTable } from "@/components/admin/GroupsTable";
import {
  deleteRow,
  getBooks,
  getReadingGroups,
  getUsers,
  insertRow,
  updateRow,
} from "@/lib/supabase";

function textOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function numberOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? Number(text) : null;
}

export default async function GroupsPage() {
  const admin = await requireAdmin();
  const [groups, users, books] = await Promise.all([
    getReadingGroups(),
    getUsers(),
    getBooks(),
  ]);

  async function createGroupAction(formData: FormData) {
    "use server";

    await requireAdmin();

    await insertRow("reading_groups", {
      name: String(formData.get("name") ?? "").trim(),
      description: textOrNull(formData.get("description")),
      cover_image_url: textOrNull(formData.get("cover_image_url")),
      creator_id: String(formData.get("creator_id") ?? "").trim(),
      current_book_id: numberOrNull(formData.get("current_book_id")),
      is_private: formData.get("is_private") === "on",
    });

    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard");
  }

  async function updateGroupAction(formData: FormData) {
    "use server";

    await requireAdmin();

    await updateRow("reading_groups", Number(formData.get("id")), {
      name: String(formData.get("name") ?? "").trim(),
      description: textOrNull(formData.get("description")),
      cover_image_url: textOrNull(formData.get("cover_image_url")),
      creator_id: String(formData.get("creator_id") ?? "").trim(),
      current_book_id: numberOrNull(formData.get("current_book_id")),
      is_private: formData.get("is_private") === "on",
    });

    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard");
  }

  async function deleteGroupAction(formData: FormData) {
    "use server";

    await requireAdmin();
    await deleteRow("reading_groups", Number(formData.get("id")));
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-lg shadow-black/10">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Groupes de lecture
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Reading groups synchronisés avec le mobile : création guidée, pilotage dans le
          tableau.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Liste</h2>
            <p className="mt-1 text-sm text-slate-500">
              {groups.length} groupe{groups.length !== 1 ? "s" : ""}
            </p>
          </div>
          <AddGroupDialog
            users={users}
            books={books}
            defaultCreatorId={admin.id}
            createGroupAction={createGroupAction}
          />
        </div>
        <div className="mt-6">
          <GroupsTable
            groups={groups}
            users={users}
            books={books}
            updateGroupAction={updateGroupAction}
            deleteGroupAction={deleteGroupAction}
          />
        </div>
      </section>
    </div>
  );
}
