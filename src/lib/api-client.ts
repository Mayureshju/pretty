function flattenFieldErrors(
  fieldErrors: Record<string, string[] | undefined>
): string | undefined {
  for (const messages of Object.values(fieldErrors)) {
    if (messages?.[0]) return messages[0];
  }
  return undefined;
}

export async function parseApiError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    const fieldError = data.details?.fieldErrors
      ? flattenFieldErrors(data.details.fieldErrors)
      : undefined;
    return fieldError || data.error || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export function isValidHttpUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

interface BlogFormPayload {
  title: string;
  /**
   * Canonical rich text from the editor. The server derives the stored HTML
   * from these, so the legacy `content`/`excerpt` strings are only sent for
   * records still holding un-migrated HTML.
   */
  contentJson?: unknown[];
  excerptJson?: unknown[];
  content: string;
  excerpt: string;
  image: string;
  author: string;
  category: string;
  tags: string;
  isPublished: boolean;
  seo: {
    metaTitle: string;
    metaDescription: string;
  };
}

export function buildBlogPayload(
  form: BlogFormPayload,
  mode: "create" | "update"
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    isPublished: form.isPublished,
  };

  // Prefer the editor's JSON; the server regenerates the HTML from it. Fall
  // back to the raw HTML only when the editor never produced JSON.
  if (form.contentJson) {
    payload.contentJson = form.contentJson;
  } else if (mode === "update") {
    payload.content = form.content;
  } else if (form.content) {
    payload.content = form.content;
  }

  if (form.excerptJson) {
    payload.excerptJson = form.excerptJson;
  } else if (mode === "update") {
    payload.excerpt = form.excerpt;
  } else if (form.excerpt) {
    payload.excerpt = form.excerpt;
  }

  const image = form.image.trim();
  if (image && isValidHttpUrl(image)) {
    payload.image = image;
  }

  if (form.author.trim()) payload.author = form.author.trim();
  if (form.category.trim()) payload.category = form.category.trim();

  const tags = form.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (tags.length > 0 || mode === "update") {
    payload.tags = tags;
  }

  const seo: Record<string, string> = {};
  if (form.seo.metaTitle.trim()) seo.metaTitle = form.seo.metaTitle.trim();
  if (form.seo.metaDescription.trim()) {
    seo.metaDescription = form.seo.metaDescription.trim();
  }
  if (Object.keys(seo).length > 0 || mode === "update") {
    payload.seo = seo;
  }

  return payload;
}

export function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 11000
  );
}

export function getBlogSaveErrorMessage(
  err: unknown,
  fallback: string
): string {
  if (isDuplicateKeyError(err)) {
    return "A blog with this title already exists";
  }
  return err instanceof Error ? err.message : fallback;
}
