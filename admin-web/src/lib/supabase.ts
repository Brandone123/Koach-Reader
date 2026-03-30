const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface AdminProfile {
  id: string;
  email: string;
  username: string;
  is_admin: boolean;
  is_premium: boolean;
  has_completed_onboarding: boolean;
  created_at: string;
  avatar_url?: string | null;
  koach_points?: number;
  reading_streak?: number;
  last_login?: string | null;
}

export interface AdminBook {
  id: number;
  title: string;
  description: string | null;
  language: string | null;
  total_pages: number;
  author_id: number | null;
  cover_url: string | null;
  pdf_url: string | null;
  is_free: boolean;
  is_featured: boolean | null;
  updated_at: string;
}

export interface AdminAuthor {
  id: number;
  name: string;
}

export interface AdminCommunity {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  cover_image_url: string | null;
  is_private: boolean | null;
  creator_id: string;
  updated_at: string;
}

export interface AdminReadingGroup {
  id: number;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  is_private: boolean | null;
  creator_id: string;
  current_book_id: number | null;
  updated_at: string;
}

interface SupabaseAuthSession {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email?: string;
  };
}

function requireEnv(name: string, value?: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

/** PostgREST / drivers peuvent renvoyer des booleens atypiques */
export function asBool(v: unknown): boolean {
  if (v === true || v === "true" || v === "t" || v === 1 || v === "1") {
    return true;
  }
  return false;
}

function normalizeProfileRow(row: Record<string, unknown> | null): AdminProfile | null {
  if (!row || typeof row.id !== "string") return null;
  return {
    id: row.id,
    email: String(row.email ?? ""),
    username: String(row.username ?? ""),
    is_admin: asBool(row.is_admin),
    is_premium: asBool(row.is_premium),
    has_completed_onboarding: asBool(row.has_completed_onboarding),
    created_at: String(row.created_at ?? ""),
    avatar_url: (row.avatar_url as string | null) ?? null,
    koach_points: typeof row.koach_points === "number" ? row.koach_points : undefined,
    reading_streak: typeof row.reading_streak === "number" ? row.reading_streak : undefined,
    last_login: row.last_login != null ? String(row.last_login) : null,
  };
}

function createHeaders(options?: {
  accessToken?: string;
  serviceRole?: boolean;
  prefer?: string;
}) {
  const headers = new Headers();
  const apiKey = options?.serviceRole
    ? requireEnv("SUPABASE_SERVICE_ROLE_KEY", supabaseServiceRoleKey)
    : requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey);

  headers.set("apikey", apiKey);
  headers.set(
    "Authorization",
    `Bearer ${options?.accessToken ?? apiKey}`,
  );

  if (options?.prefer) {
    headers.set("Prefer", options.prefer);
  }

  return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    let msg = text || `Supabase request failed with ${response.status}`;
    try {
      const j = JSON.parse(text) as {
        message?: string;
        hint?: string;
        details?: string;
        error?: string;
      };
      const composed = [j.message || j.error, j.details, j.hint]
        .filter(Boolean)
        .join(" — ");
      if (composed) msg = composed;
    } catch {
      /* garder le corps brut */
    }
    throw new Error(msg);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function parseAuthErrorBody(text: string): string {
  try {
    const j = JSON.parse(text) as {
      error_description?: string;
      msg?: string;
      message?: string;
      error?: string;
    };
    return (
      j.error_description ||
      j.msg ||
      j.message ||
      j.error ||
      text ||
      "Erreur d'authentification"
    );
  } catch {
    return text || "Erreur d'authentification";
  }
}

async function restRequest<T>(
  path: string,
  method: HttpMethod,
  options?: {
    body?: unknown;
    accessToken?: string;
    serviceRole?: boolean;
    prefer?: string;
  },
): Promise<T> {
  const url = `${requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl)}/rest/v1/${path}`;
  const headers = createHeaders(options);

  if (options?.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  return parseResponse<T>(response);
}

export function assertAdminServerEnv(): void {
  requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey);
  requireEnv("SUPABASE_SERVICE_ROLE_KEY", supabaseServiceRoleKey);
}

export async function signInWithPassword(email: string, password: string) {
  const anon = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey);
  const base = requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);

  const response = await fetch(
    `${base}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    },
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(parseAuthErrorBody(text));
  }

  return JSON.parse(text) as SupabaseAuthSession;
}

export async function getAuthUser(accessToken: string) {
  const anon = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey);
  const base = requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);

  const response = await fetch(`${base}/auth/v1/user`, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(parseAuthErrorBody(text));
  }

  return JSON.parse(text) as { id: string; email?: string };
}

const USER_SELECT =
  "id,email,username,is_admin,is_premium,has_completed_onboarding,created_at,avatar_url,koach_points,reading_streak,last_login";

export async function getProfileById(userId: string) {
  const data = await restRequest<Record<string, unknown>[]>(
    `users?select=${USER_SELECT}&id=eq.${encodeURIComponent(userId)}`,
    "GET",
    { serviceRole: true },
  );

  return normalizeProfileRow(data[0] ?? null);
}

export async function getProfileByEmail(email: string) {
  const raw = email.trim();
  const lower = raw.toLowerCase();
  for (const candidate of [lower, raw]) {
    if (!candidate) continue;
    const data = await restRequest<Record<string, unknown>[]>(
      `users?select=${USER_SELECT}&email=eq.${encodeURIComponent(candidate)}`,
      "GET",
      { serviceRole: true },
    );
    const row = normalizeProfileRow(data[0] ?? null);
    if (row) return row;
  }
  return null;
}

/**
 * Apres login Auth: charge le profil public.users par id, puis par email si besoin
 * (desynchronisation id rare mais possible).
 */
export async function resolveAdminProfileAfterAuth(
  authUserId: string,
  authEmail?: string | null,
): Promise<AdminProfile | null> {
  assertAdminServerEnv();

  let profile = await getProfileById(authUserId);
  if (!profile && authEmail) {
    profile = await getProfileByEmail(authEmail);
  }
  return profile;
}

export async function getBooks() {
  return restRequest<AdminBook[]>(
    "books?select=id,title,description,language,total_pages,author_id,cover_url,pdf_url,is_free,is_featured,updated_at&order=updated_at.desc",
    "GET",
    { serviceRole: true },
  );
}

export async function getAuthors() {
  return restRequest<AdminAuthor[]>(
    "authors?select=id,name&order=name.asc",
    "GET",
    { serviceRole: true },
  );
}

export async function getUsers() {
  const rows = await restRequest<Record<string, unknown>[]>(
    `users?select=${USER_SELECT}&order=created_at.desc`,
    "GET",
    { serviceRole: true },
  );

  return rows
    .map((r) => normalizeProfileRow(r))
    .filter((p): p is AdminProfile => p != null);
}

export async function getCommunities() {
  return restRequest<AdminCommunity[]>(
    "communities?select=id,name,description,category,cover_image_url,is_private,creator_id,updated_at&order=updated_at.desc",
    "GET",
    { serviceRole: true },
  );
}

export async function getReadingGroups() {
  return restRequest<AdminReadingGroup[]>(
    "reading_groups?select=id,name,description,cover_image_url,is_private,creator_id,current_book_id,updated_at&order=updated_at.desc",
    "GET",
    { serviceRole: true },
  );
}

export async function insertRow<T>(table: string, payload: Record<string, unknown>) {
  return restRequest<T[]>(
    `${table}`,
    "POST",
    {
      serviceRole: true,
      body: payload,
      prefer: "return=representation",
    },
  );
}

export async function updateRow<T>(
  table: string,
  id: string | number,
  payload: Record<string, unknown>,
) {
  return restRequest<T[]>(
    `${table}?id=eq.${encodeURIComponent(String(id))}`,
    "PATCH",
    {
      serviceRole: true,
      body: payload,
      prefer: "return=representation",
    },
  );
}

export async function deleteRow(table: string, id: string | number) {
  return restRequest<void>(
    `${table}?id=eq.${encodeURIComponent(String(id))}`,
    "DELETE",
    {
      serviceRole: true,
      prefer: "return=minimal",
    },
  );
}

/** Comptage exact PostgREST (Prefer: count=exact) */
/** GET REST admin (service role), chemin complet apres /rest/v1/ */
export async function adminRestGet<T>(pathAndQuery: string): Promise<T> {
  assertAdminServerEnv();
  return restRequest<T>(pathAndQuery, "GET", { serviceRole: true });
}

export async function getTableCount(
  table: string,
  extraFilter = "",
): Promise<number> {
  assertAdminServerEnv();
  const base = requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  const path = `${table}?select=id${extraFilter ? `&${extraFilter}` : ""}`;
  const url = `${base}/rest/v1/${path}`;
  const headers = createHeaders({ serviceRole: true });
  headers.set("Prefer", "count=exact");
  headers.set("Range", "0-0");

  const response = await fetch(url, { headers, cache: "no-store" });
  if (!response.ok) {
    const t = await response.text();
    throw new Error(t || `count failed ${response.status}`);
  }
  const cr = response.headers.get("content-range");
  if (!cr) return 0;
  const total = cr.split("/")[1];
  if (!total || total === "*") return 0;
  return parseInt(total, 10) || 0;
}
