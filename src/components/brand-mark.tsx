import { quoteProColors } from "@/lib/design-tokens";

interface BrandMarkProps {
  size?: number;
  color?: string;
  title?: string;
}

/**
 * The QuotePro brand mark — two square brackets framing a centered dot.
 * Mirrors `provider_mobile/lib/src/branding/quotepro_logo_mark.dart` so the
 * mobile app and the client-web stay visually aligned.
 */
export function BrandMark({
  size = 20,
  color = quoteProColors.primary,
  title,
}: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <path d="M4 4 H14 V8 H8 V24 H14 V28 H4 Z" fill={color} />
      <path d="M28 4 H18 V8 H24 V24 H18 V28 H28 Z" fill={color} />
      <rect x="14" y="14" width="4" height="4" fill={color} />
    </svg>
  );
}
