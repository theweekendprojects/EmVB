/** Reject executable and protocol-relative URLs while preserving normal site-relative links. */
export function safeHref(value: unknown): string {
  const href = String(value ?? "").trim();
  if (!href) return "#";
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (
    href.startsWith("#") ||
    href.startsWith("?") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  )
    return href;
  try {
    const parsed = new URL(href);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? href : "#";
  } catch {
    return "#";
  }
}
