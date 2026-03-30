import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { AddBookDialog } from "@/components/admin/AddBookDialog";
import { BooksTable } from "@/components/admin/BooksTable";
import {
  deleteRow,
  getAuthors,
  getBooks,
  insertRow,
  updateRow,
} from "@/lib/supabase";

function toNullableString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function toNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? Number(text) : null;
}

export default async function BooksPage() {
  await requireAdmin();
  const [books, authors] = await Promise.all([getBooks(), getAuthors()]);

  async function createBookAction(formData: FormData) {
    "use server";

    await requireAdmin();

    await insertRow("books", {
      title: String(formData.get("title") ?? "").trim(),
      description: toNullableString(formData.get("description")),
      language: toNullableString(formData.get("language")) ?? "fr",
      total_pages: Number(formData.get("total_pages") ?? 0),
      author_id: toNumber(formData.get("author_id")),
      cover_url: toNullableString(formData.get("cover_url")),
      pdf_url: toNullableString(formData.get("pdf_url")),
      is_free: formData.get("is_free") === "on",
      is_featured: formData.get("is_featured") === "on",
    });

    revalidatePath("/dashboard/books");
    revalidatePath("/dashboard");
  }

  async function updateBookAction(formData: FormData) {
    "use server";

    await requireAdmin();

    const id = Number(formData.get("id"));

    await updateRow("books", id, {
      title: String(formData.get("title") ?? "").trim(),
      description: toNullableString(formData.get("description")),
      language: toNullableString(formData.get("language")),
      total_pages: Number(formData.get("total_pages") ?? 0),
      author_id: toNumber(formData.get("author_id")),
      cover_url: toNullableString(formData.get("cover_url")),
      pdf_url: toNullableString(formData.get("pdf_url")),
      is_free: formData.get("is_free") === "on",
      is_featured: formData.get("is_featured") === "on",
    });

    revalidatePath("/dashboard/books");
    revalidatePath("/dashboard");
  }

  async function deleteBookAction(formData: FormData) {
    "use server";

    await requireAdmin();
    await deleteRow("books", Number(formData.get("id")));
    revalidatePath("/dashboard/books");
    revalidatePath("/dashboard");
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 sm:space-y-8">
      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-lg shadow-black/10 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Livres
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Catalogue partagé avec l&apos;application mobile. Ajoutez un titre via le bouton
          ci-dessous, puis gérez chaque ligne depuis le tableau (aperçu, édition,
          suppression).
        </p>
      </section>

      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4 sm:p-6">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">Catalogue</h2>
            <p className="mt-1 text-sm text-slate-500">
              {books.length} livre{books.length !== 1 ? "s" : ""}
              <span className="hidden sm:inline"> · icônes dans le tableau</span>
            </p>
          </div>
          <div className="shrink-0 [&_button]:w-full sm:[&_button]:w-auto">
            <AddBookDialog authors={authors} createBookAction={createBookAction} />
          </div>
        </div>
        <div className="mt-4 min-w-0 sm:mt-6">
          <BooksTable
            books={books}
            authors={authors}
            updateBookAction={updateBookAction}
            deleteBookAction={deleteBookAction}
          />
        </div>
      </section>
    </div>
  );
}
