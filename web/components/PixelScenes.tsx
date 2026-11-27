import React from 'react';

/**
 * Ilustraciones 16-bit Pixel-Art en SVG (`shape-rendering="crispEdges"`)
 * Inspiradas en la atmósfera de aventura retro de Codédex, 100% vectoriales y sin recursos externos.
 */

export const PixelSparkCoin: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    aria-hidden="true"
    className="px-svg"
  >
    <rect x="4" y="1" width="8" height="14" fill="#d97706" />
    <rect x="2" y="3" width="12" height="10" fill="#d97706" />
    <rect x="1" y="5" width="14" height="6" fill="#d97706" />
    <rect x="4" y="2" width="8" height="12" fill="#facc15" />
    <rect x="2" y="4" width="12" height="8" fill="#facc15" />
    <rect x="4" y="3" width="3" height="2" fill="#fef08a" />
    <rect x="3" y="5" width="2" height="2" fill="#fef08a" />
    {/* Rayo Chispa central */}
    <rect x="8" y="4" width="2" height="2" fill="#78350f" />
    <rect x="6" y="6" width="4" height="2" fill="#78350f" />
    <rect x="8" y="8" width="2" height="2" fill="#78350f" />
    <rect x="6" y="10" width="2" height="2" fill="#78350f" />
  </svg>
);

export const PixelChispaCrt: React.FC<{ size?: number }> = ({ size = 96 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    shapeRendering="crispEdges"
    aria-hidden="true"
    className="px-svg lp-hero-mascot"
  >
    {/* Antena chispa */}
    <rect x="11" y="1" width="2" height="2" fill="#fde047" />
    <rect x="10" y="2" width="1" height="1" fill="#38bdf8" />
    <rect x="13" y="2" width="1" height="1" fill="#38bdf8" />
    <rect x="11" y="3" width="2" height="2" fill="#94a3b8" />
    {/* Carcasa CRT retro */}
    <rect x="3" y="5" width="18" height="13" fill="#1e293b" />
    <rect x="4" y="6" width="16" height="11" fill="#cbd5e1" />
    <rect x="4" y="6" width="16" height="2" fill="#f8fafc" />
    <rect x="4" y="15" width="16" height="2" fill="#94a3b8" />
    {/* Pantalla encendida */}
    <rect x="6" y="8" width="12" height="7" fill="#0f172a" />
    <rect x="7" y="9" width="10" height="5" fill="#111c36" />
    {/* Ojos felices pixelados y sonrisa :3 */}
    <rect x="8" y="10" width="2" height="2" fill="#38bdf8" />
    <rect x="14" y="10" width="2" height="2" fill="#38bdf8" />
    <rect x="8" y="10" width="1" height="1" fill="#e0f2fe" />
    <rect x="14" y="10" width="1" height="1" fill="#e0f2fe" />
    <rect x="10" y="12" width="1" height="1" fill="#facc15" />
    <rect x="11" y="13" width="2" height="1" fill="#facc15" />
    <rect x="13" y="12" width="1" height="1" fill="#facc15" />
    {/* Mejillas */}
    <rect x="7" y="12" width="1" height="1" fill="#f472b6" />
    <rect x="16" y="12" width="1" height="1" fill="#f472b6" />
    {/* LED de encendido */}
    <rect x="17" y="16" width="2" height="1" fill="#4ade80" />
    {/* Base CRT */}
    <rect x="8" y="18" width="8" height="2" fill="#64748b" />
    <rect x="6" y="20" width="12" height="2" fill="#475569" />
    <rect x="7" y="20" width="10" height="1" fill="#94a3b8" />
  </svg>
);

export const HeroPixelBackdrop: React.FC = () => (
  <svg
    viewBox="0 0 320 150"
    preserveAspectRatio="xMidYMax slice"
    shapeRendering="crispEdges"
    aria-hidden="true"
    className="lp-hero-scene-svg"
  >
    <defs>
      <linearGradient id="px-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#081024" />
        <stop offset="55%" stopColor="#122347" />
        <stop offset="100%" stopColor="#1c3560" />
      </linearGradient>
    </defs>

    {/* Cielo nocturno pixelado */}
    <rect x="0" y="0" width="320" height="150" fill="url(#px-sky)" />

    {/* Luna pixelada con halo */}
    <rect x="262" y="14" width="22" height="22" fill="#1e3a68" />
    <rect x="265" y="17" width="16" height="16" fill="#fef08a" />
    <rect x="267" y="15" width="12" height="20" fill="#fef08a" />
    <rect x="263" y="19" width="20" height="12" fill="#fef08a" />
    <rect x="273" y="19" width="4" height="4" fill="#fde047" />
    <rect x="269" y="25" width="3" height="3" fill="#fde047" />

    {/* Estrellas */}
    <g className="px-stars">
      <rect x="18" y="16" width="2" height="2" fill="#fef08a" />
      <rect x="48" y="26" width="2" height="2" fill="#bae6fd" />
      <rect x="76" y="12" width="2" height="2" fill="#ffffff" />
      <rect x="112" y="22" width="2" height="2" fill="#fde047" />
      <rect x="148" y="10" width="2" height="2" fill="#bae6fd" />
      <rect x="190" y="18" width="2" height="2" fill="#ffffff" />
      <rect x="226" y="12" width="2" height="2" fill="#fef08a" />
      <rect x="242" y="34" width="2" height="2" fill="#bae6fd" />
      <rect x="300" y="24" width="2" height="2" fill="#ffffff" />
      <rect x="34" y="44" width="2" height="2" fill="#93c5fd" />
      <rect x="292" y="46" width="2" height="2" fill="#fde047" />
      {/* Estrella cruz grande */}
      <rect x="64" y="34" width="2" height="6" fill="#fde047" />
      <rect x="62" y="36" width="6" height="2" fill="#fde047" />
      <rect x="214" y="28" width="2" height="6" fill="#38bdf8" />
      <rect x="212" y="30" width="6" height="2" fill="#38bdf8" />
    </g>

    {/* Nubes pixeladas */}
    <g fill="#234173" opacity="0.85">
      <rect x="16" y="54" width="34" height="6" />
      <rect x="22" y="50" width="20" height="4" />
      <rect x="246" y="56" width="44" height="6" />
      <rect x="256" y="52" width="24" height="4" />
    </g>

    {/* Montañas lejanas */}
    <polygon points="0,126 38,76 76,126" fill="#162b52" />
    <polygon points="48,126 98,64 148,126" fill="#1a3361" />
    <polygon points="168,126 226,68 282,126" fill="#162b52" />
    <polygon points="244,126 294,74 320,108 320,126" fill="#1b3666" />
    {/* Nieve pixel en cumbres */}
    <rect x="92" y="68" width="12" height="4" fill="#60a5fa" opacity="0.5" />
    <rect x="95" y="65" width="6" height="3" fill="#bae6fd" opacity="0.65" />
    <rect x="221" y="71" width="10" height="4" fill="#60a5fa" opacity="0.5" />

    {/* Isla flotante izquierda con torre de compilador */}
    <g>
      <rect x="12" y="102" width="40" height="6" fill="#22c55e" />
      <rect x="14" y="108" width="36" height="5" fill="#78350f" />
      <rect x="18" y="113" width="28" height="4" fill="#57260b" />
      {/* Torre pixel */}
      <rect x="22" y="84" width="16" height="18" fill="#334155" />
      <rect x="20" y="80" width="20" height="4" fill="#475569" />
      <rect x="22" y="78" width="4" height="2" fill="#64748b" />
      <rect x="28" y="78" width="4" height="2" fill="#64748b" />
      <rect x="34" y="78" width="4" height="2" fill="#64748b" />
      <rect x="28" y="88" width="4" height="5" fill="#facc15" />
      <rect x="26" y="96" width="8" height="6" fill="#1e293b" />
    </g>

    {/* Isla flotante derecha con pinos pixel */}
    <g>
      <rect x="264" y="104" width="44" height="6" fill="#22c55e" />
      <rect x="268" y="110" width="36" height="5" fill="#78350f" />
      <rect x="274" y="115" width="24" height="4" fill="#57260b" />
      {/* Pino 1 */}
      <rect x="278" y="98" width="4" height="6" fill="#78350f" />
      <rect x="272" y="92" width="16" height="6" fill="#15803d" />
      <rect x="274" y="86" width="12" height="6" fill="#16a34a" />
      <rect x="276" y="82" width="8" height="4" fill="#22c55e" />
      {/* Pino 2 */}
      <rect x="294" y="99" width="4" height="5" fill="#78350f" />
      <rect x="290" y="94" width="12" height="5" fill="#166534" />
      <rect x="292" y="89" width="8" height="5" fill="#16a34a" />
    </g>

    {/* Pradera pixelada inferior */}
    <rect x="0" y="124" width="320" height="8" fill="#16a34a" />
    <rect x="0" y="124" width="320" height="3" fill="#4ade80" />
    <rect x="0" y="132" width="320" height="18" fill="#14532d" />
    {/* Flores y ladrillos de tierra */}
    <rect x="28" y="122" width="3" height="3" fill="#facc15" />
    <rect x="58" y="122" width="3" height="3" fill="#f472b6" />
    <rect x="116" y="122" width="3" height="3" fill="#38bdf8" />
    <rect x="204" y="122" width="3" height="3" fill="#facc15" />
    <rect x="256" y="122" width="3" height="3" fill="#fb923c" />
    <rect x="292" y="122" width="3" height="3" fill="#c084fc" />
    {/* Pinos laterales en primer plano */}
    <rect x="8" y="114" width="4" height="10" fill="#78350f" />
    <rect x="2" y="106" width="16" height="8" fill="#15803d" />
    <rect x="4" y="100" width="12" height="6" fill="#22c55e" />
    <rect x="306" y="114" width="4" height="10" fill="#78350f" />
    <rect x="300" y="106" width="16" height="8" fill="#15803d" />
    <rect x="302" y="100" width="12" height="6" fill="#22c55e" />
  </svg>
);

export type EscenaTarjeta =
  | 'variables'
  | 'puente'
  | 'cohete'
  | 'dado'
  | 'fabrica'
  | 'detective'
  | 'juego'
  | 'calculadora'
  | 'recursion';

const PALETAS_TARJETA: Record<
  EscenaTarjeta,
  { cielo1: string; cielo2: string; suelo: string; acento: string; extra: string }
> = {
  variables: { cielo1: '#172554', cielo2: '#1e3a8a', suelo: '#15803d', acento: '#fb923c', extra: '#fde047' },
  puente: { cielo1: '#1e1b4b', cielo2: '#312e81', suelo: '#0f766e', acento: '#38bdf8', extra: '#facc15' },
  cohete: { cielo1: '#090d1f', cielo2: '#1e1b4b', suelo: '#334155', acento: '#f43f5e', extra: '#fde047' },
  dado: { cielo1: '#2e1065', cielo2: '#4c1d95', suelo: '#166534', acento: '#34d399', extra: '#facc15' },
  fabrica: { cielo1: '#3b0764', cielo2: '#701a75', suelo: '#334155', acento: '#f472b6', extra: '#38bdf8' },
  detective: { cielo1: '#450a0a', cielo2: '#7f1d1d', suelo: '#1f2937', acento: '#f87171', extra: '#fde047' },
  juego: { cielo1: '#064e3b', cielo2: '#065f46', suelo: '#14532d', acento: '#4ade80', extra: '#facc15' },
  calculadora: { cielo1: '#0c4a6e', cielo2: '#075985', suelo: '#1e293b', acento: '#38bdf8', extra: '#fde047' },
  recursion: { cielo1: '#1e1b4b', cielo2: '#3730a3', suelo: '#1e293b', acento: '#c084fc', extra: '#4ade80' },
};

export const QuestCardPixelBanner: React.FC<{ escena: EscenaTarjeta }> = ({ escena }) => {
  const p = PALETAS_TARJETA[escena];
  return (
    <svg
      viewBox="0 0 120 44"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="quest-banner-svg"
    >
      <rect x="0" y="0" width="120" height="44" fill={p.cielo1} />
      <rect x="0" y="18" width="120" height="16" fill={p.cielo2} />
      {/* Estrellas */}
      <rect x="10" y="6" width="2" height="2" fill="#ffffff" opacity="0.85" />
      <rect x="28" y="11" width="2" height="2" fill={p.extra} />
      <rect x="92" y="7" width="2" height="2" fill="#ffffff" opacity="0.8" />
      <rect x="106" y="14" width="2" height="2" fill={p.acento} />
      {/* Suelo */}
      <rect x="0" y="34" width="120" height="10" fill={p.suelo} />
      <rect x="0" y="34" width="120" height="2" fill={p.acento} opacity="0.65" />

      {/* Motivo central pixel-art según la misión */}
      {escena === 'variables' && (
        <g>
          <rect x="44" y="16" width="14" height="14" fill={p.acento} />
          <rect x="46" y="18" width="10" height="10" fill="#1e293b" />
          <rect x="48" y="21" width="6" height="4" fill={p.extra} />
          <rect x="64" y="16" width="14" height="14" fill="#38bdf8" />
          <rect x="66" y="18" width="10" height="10" fill="#1e293b" />
          <rect x="69" y="20" width="4" height="6" fill="#4ade80" />
        </g>
      )}
      {escena === 'puente' && (
        <g>
          <rect x="24" y="24" width="72" height="4" fill={p.acento} />
          <rect x="30" y="28" width="4" height="8" fill="#94a3b8" />
          <rect x="86" y="28" width="4" height="8" fill="#94a3b8" />
          <rect x="54" y="14" width="12" height="10" fill={p.extra} />
          <rect x="57" y="17" width="2" height="2" fill="#0f172a" />
          <rect x="61" y="17" width="2" height="2" fill="#0f172a" />
        </g>
      )}
      {escena === 'cohete' && (
        <g>
          <rect x="56" y="8" width="8" height="18" fill="#f8fafc" />
          <rect x="58" y="5" width="4" height="3" fill={p.acento} />
          <rect x="52" y="20" width="4" height="6" fill={p.acento} />
          <rect x="64" y="20" width="4" height="6" fill={p.acento} />
          <rect x="58" y="12" width="4" height="4" fill="#38bdf8" />
          <rect x="57" y="26" width="6" height="4" fill="#fb923c" />
          <rect x="58" y="30" width="4" height="4" fill={p.extra} />
        </g>
      )}
      {escena === 'dado' && (
        <g>
          <rect x="50" y="12" width="20" height="20" fill="#f8fafc" />
          <rect x="52" y="14" width="16" height="16" fill="#e2e8f0" />
          <rect x="54" y="16" width="3" height="3" fill="#0f172a" />
          <rect x="63" y="16" width="3" height="3" fill="#0f172a" />
          <rect x="58" y="20" width="4" height="4" fill={p.acento} />
          <rect x="54" y="25" width="3" height="3" fill="#0f172a" />
          <rect x="63" y="25" width="3" height="3" fill="#0f172a" />
        </g>
      )}
      {escena === 'fabrica' && (
        <g>
          <rect x="40" y="16" width="40" height="18" fill="#475569" />
          <rect x="44" y="10" width="8" height="6" fill="#94a3b8" />
          <rect x="50" y="20" width="8" height="8" fill={p.acento} />
          <rect x="64" y="20" width="8" height="8" fill={p.extra} />
          <rect x="58" y="23" width="6" height="2" fill="#f8fafc" />
        </g>
      )}
      {escena === 'detective' && (
        <g>
          <rect x="50" y="12" width="14" height="14" fill="#f8fafc" />
          <rect x="52" y="14" width="10" height="10" fill={p.cielo1} />
          <rect x="55" y="17" width="4" height="4" fill={p.acento} />
          <rect x="64" y="24" width="4" height="4" fill={p.extra} />
          <rect x="68" y="28" width="4" height="4" fill={p.extra} />
        </g>
      )}
      {escena === 'juego' && (
        <g>
          <rect x="40" y="15" width="40" height="16" fill="#1e293b" />
          <rect x="46" y="20" width="8" height="2" fill={p.acento} />
          <rect x="49" y="17" width="2" height="8" fill={p.acento} />
          <rect x="66" y="19" width="4" height="4" fill={p.extra} />
          <rect x="72" y="22" width="4" height="4" fill="#f472b6" />
        </g>
      )}
      {escena === 'calculadora' && (
        <g>
          <rect x="48" y="8" width="24" height="26" fill="#cbd5e1" />
          <rect x="51" y="11" width="18" height="6" fill="#0f172a" />
          <rect x="62" y="13" width="5" height="2" fill="#4ade80" />
          <rect x="51" y="20" width="4" height="4" fill={p.acento} />
          <rect x="58" y="20" width="4" height="4" fill={p.acento} />
          <rect x="65" y="20" width="4" height="4" fill={p.extra} />
          <rect x="51" y="26" width="4" height="4" fill="#64748b" />
          <rect x="58" y="26" width="4" height="4" fill="#64748b" />
          <rect x="65" y="26" width="4" height="4" fill="#fb923c" />
        </g>
      )}
      {escena === 'recursion' && (
        <g>
          <rect x="42" y="10" width="36" height="22" fill={p.acento} />
          <rect x="46" y="14" width="28" height="14" fill={p.cielo1} />
          <rect x="50" y="16" width="20" height="10" fill={p.extra} />
          <rect x="54" y="18" width="12" height="6" fill={p.cielo1} />
          <rect x="58" y="20" width="4" height="2" fill="#facc15" />
        </g>
      )}
    </svg>
  );
};
