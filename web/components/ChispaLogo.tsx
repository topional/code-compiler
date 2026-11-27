/**
 * Emblema SVG oficial de Chispa: corchetes biselados `< >` abrazando una chispa de 4 puntas.
 * Sin marco exterior; cada uno de los 10 temas define su propia pareja cromática
 * mediante `--logo-spark` (corchete izquierdo + chispa) y `--logo-wing` (corchete derecho).
 */
export function ChispaBrandMark({ size = 40 }: { size?: number }) {
  const height = Math.round(size * (96 / 112));
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 112 96"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Corchete izquierdo `<` biselado (color 3 del tema) */}
      <polygon
        points="42,6 4,40 4,56 42,90 42,72 19,48 42,24"
        fill="var(--logo-wing, var(--accent))"
      />
      {/* Chispa central de 4 puntas estilizada (color 4 del tema) */}
      <path
        d="M56 10 Q60 43 82 48 Q60 53 56 86 Q52 53 30 48 Q52 43 56 10 Z"
        fill="var(--logo-spark, var(--info))"
      />
      {/* Corchete derecho `>` biselado (color 3 del tema) */}
      <polygon
        points="70,6 108,40 108,56 70,90 70,72 93,48 70,24"
        fill="var(--logo-wing, var(--accent))"
      />
    </svg>
  );
}

/**
 * Logotipo SVG y mascota adaptativa de Chispa · Code Compiler.
 * Usa variables CSS (--logo-*) para adaptarse a los 10 temas visuales.
 */

interface ChispaLogoProps {
  compact?: boolean;
}

export function ChispaLogo({ compact = false }: ChispaLogoProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <ChispaBrandMark size={compact ? 32 : 40} />

      {!compact && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span
            style={{
              fontFamily: 'var(--font-pixel)',
              fontWeight: 700,
              fontSize: '1.22rem',
              color: 'var(--logo-ink)',
              letterSpacing: '0.01em',
            }}
          >
            Chispa
          </span>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.68rem',
              fontWeight: 600,
              color: 'var(--ink-muted)',
              letterSpacing: '0.03em',
            }}
          >
            Code Compiler
          </span>
        </span>
      )}
    </span>
  );
}

export function ChispaMascota({
  estado = 'feliz',
  size = 44,
}: {
  estado?: 'feliz' | 'pensando' | 'celebrando' | 'alerta';
  size?: number;
}) {
  const boca =
    estado === 'celebrando'
      ? 'M23 36 Q32 45 41 36'
      : estado === 'alerta'
        ? 'M25 40 Q32 35 39 40'
        : estado === 'pensando'
          ? 'M27 38 H37'
          : 'M24 36 Q32 42 40 36';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect
        x="6"
        y="12"
        width="52"
        height="44"
        rx="16"
        fill="var(--logo-frame)"
        stroke="var(--border-strong)"
        strokeWidth="3"
      />
      <path
        d="M32 12V5M26 7L29 10M38 7L35 10"
        stroke="var(--logo-ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="14"
        y="20"
        width="36"
        height="28"
        rx="10"
        fill="var(--logo-body)"
        stroke="var(--border-strong)"
        strokeWidth="2.2"
      />
      <circle cx="25" cy="30" r="3" fill="var(--logo-ink)" />
      <circle cx="39" cy="30" r="3" fill="var(--logo-ink)" />
      <path
        d={boca}
        stroke="var(--logo-ink)"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
