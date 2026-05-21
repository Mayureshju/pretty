import { revalidatePath } from "next/cache";

/** Invalidate homepage hero after banner CRUD. */
export function revalidateHomeBanner() {
  revalidatePath("/");
}
