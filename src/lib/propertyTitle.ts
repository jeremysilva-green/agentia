import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";
// Titles this short are already tidy; skip the model call.
const SHORT_TITLE_CHARS = 24;

export function capitalizeFirst(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.charAt(0).toLocaleUpperCase("es") + trimmed.slice(1);
}

/**
 * Tidies a listing title when the agent saves it: shortens it by dropping what
 * the form already shows elsewhere (city, address, neighborhood, "en venta"),
 * and capitalizes it. "casa 3 dormitorios en barrio ciudad nueva de ciudad del
 * este" becomes "Casa de 3 Dormitorios". Never throws: any failure (no API key,
 * network, odd model output) keeps the agent's own title, just capitalized.
 */
export async function tidyPropertyTitle(
  title: string,
  context: { city?: string | null; address?: string | null; listingType?: string | null; propertyType?: string | null }
): Promise<string> {
  const fallback = capitalizeFirst(title);
  if (fallback.length <= SHORT_TITLE_CHARS) return fallback;

  try {
    const response = await new Anthropic().messages.create({
      model: MODEL,
      max_tokens: 60,
      system:
        "Acortás títulos de publicaciones inmobiliarias de Paraguay. Devolvé SOLO el título nuevo, sin comillas ni explicación. " +
        "Reglas: máximo 5 palabras; Title Case (cada palabra importante con mayúscula inicial, 'de'/'en'/'con' en minúscula); " +
        "mantené el tipo de propiedad y lo que la distingue (cantidad de dormitorios, piscina, superficie); " +
        "eliminá la ciudad, el barrio, la dirección y 'en venta'/'en alquiler', porque ya se muestran en otros campos de la publicación; " +
        "no inventes datos que no estén en el título; sin emojis ni signos de exclamación. " +
        "Ejemplo: 'casa 3 dormitorios en barrio ciudad nueva de ciudad del este' -> 'Casa de 3 Dormitorios'.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            titulo: title,
            ciudad: context.city ?? null,
            direccion: context.address ?? null,
            operacion: context.listingType ?? null,
            tipo: context.propertyType ?? null,
          }),
        },
      ],
    });
    const block = response.content.find((b) => b.type === "text");
    const shortened = block && block.type === "text" ? block.text.trim().replace(/^["'“”]+|["'“”]+$/g, "") : "";
    if (!shortened || shortened.length < 3 || shortened.length > title.trim().length + 10) return fallback;
    return capitalizeFirst(shortened);
  } catch (err) {
    console.error("[property-title] shortening failed, keeping the original", err);
    return fallback;
  }
}
