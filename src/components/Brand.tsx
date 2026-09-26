import { logoFor } from "../lib/logos";
import { monogram, sourceColor } from "../lib/brand";

/**
 * Rounded tile showing a brand's logo (Apple, Netflix, Gojek…), or a colored monogram
 * for names we have no logo for (banks, local merchants).
 */
export function BrandBadge({ name, alt, size = 44, fallback }: { name: string; alt?: string; size?: number; fallback?: React.ReactNode }) {
  const logo = logoFor(name, alt);
  const style = { width: size, height: size, "--c": logo?.bg ?? sourceColor(name) } as React.CSSProperties;
  if (logo) {
    return (
      <span className="brand-badge" style={style} aria-hidden="true">
        <svg viewBox="0 0 24 24" width={size * 0.52} height={size * 0.52}><path d={logo.path} fill="#fff" /></svg>
      </span>
    );
  }
  // A component fallback (e.g. a category tile) replaces the badge entirely.
  if (fallback && typeof fallback !== "string") return <>{fallback}</>;
  return (
    <span className={`brand-badge ${fallback ? "soft" : ""}`} style={style} aria-hidden="true">
      {fallback ?? monogram(name)}
    </span>
  );
}
