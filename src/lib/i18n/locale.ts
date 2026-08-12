import { cookies } from "next/headers";
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";

export const LOCALE_COOKIE = "agently_locale";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : "es";
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, dict: dictionaries[locale] };
}
