/**
 * Emblema original de Chispa: corchetes de código `< >` abrazando una chispa de 4 puntas.
 * Se adapta automáticamente a los 10 temas visuales.
 */
export function ChispaBrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="14"
        fill="var(--bg-editor)"
        stroke="var(--accent)"
        strokeWidth="3.5"
      />
      <path
        d="M21 22L12 32L21 42"
        stroke="var(--ink-primary)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M43 22L52 32L43 42"
        stroke="var(--ink-primary)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 16L35.6 28.4L46 32L35.6 35.6L32 48L28.4 35.6L18 32L28.4 28.4Z"
        fill="var(--accent)"
      />
    </svg>
  );
}

/**
 * Logotipo SVG y mascota adaptativa de Chispa .edu · Code Compiler.
 * Usa variables CSS (--logo-*) para adaptarse a los 10 temas visuales.
 */

interface ChispaLogoProps {
  compact?: boolean;
}

export function ChispaLogo({ compact = false }: ChispaLogoProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <rect
          x="4"
          y="6"
          width="56"
          height="52"
          rx="16"
          fill="var(--logo-frame)"
          stroke="var(--border-strong)"
          strokeWidth="3"
        />
        <path
          d="M17 20C17 17.8 18.8 16 21 16H27L30.5 20H43C45.2 20 47 21.8 47 24V42C47 44.2 45.2 46 43 46H21C18.8 46 17 44.2 17 42V20Z"
          fill="var(--logo-body)"
          stroke="var(--border-strong)"
          strokeWidth="2.5"
        />
        <path
          d="M35.5 22L25.5 34.5H32.5L30.5 44L40.5 31.5H33.5L35.5 22Z"
          fill="var(--logo-spark)"
        />
      </svg>

      {!compact && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.22rem',
                color: 'var(--logo-ink)',
                letterSpacing: '-0.02em',
              }}
            >
              Chispa
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '0.72rem',
                padding: '2px 7px',
                borderRadius: '7px',
                background: 'var(--logo-badge-bg)',
                color: 'var(--logo-badge-ink)',
                border: '1.5px solid var(--border-strong)',
              }}
            >
              .edu
            </span>
          </span>
          <span
            className="mono"
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--ink-muted)',
              letterSpacing: '0.03em',
              marginTop: 2,
            }}
          >
            CODE COMPILER
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
