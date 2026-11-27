import { DotOrbit, MeshGradient, NeuroNoise } from '@paper-design/shaders-react';
import React, { Component, useEffect, useRef, useState } from 'react';

import type { TemaId } from '../data/temas';

export type ModoShader = 'neuro' | 'mesh' | 'orbit';

interface PaletaShader {
  back: string;
  mid: string;
  front: string;
  mesh: string[];
  particle: string;
  line: string;
}

const PALETAS_SHADER: Record<TemaId, PaletaShader> = {
  'gojs-dark': {
    back: '#070a12',
    mid: '#1b3a70',
    front: '#facc15',
    mesh: ['#080c18', '#172d59', '#38bdf8', '#facc15'],
    particle: 'rgba(250, 204, 21, 0.72)',
    line: 'rgba(56, 189, 248, 0.3)',
  },
  dracula: {
    back: '#181924',
    mid: '#5b3c96',
    front: '#ff79c6',
    mesh: ['#181924', '#4a2e7a', '#bd93f9', '#ff79c6'],
    particle: 'rgba(255, 121, 198, 0.72)',
    line: 'rgba(139, 233, 253, 0.3)',
  },
  'tokyo-night': {
    back: '#10121d',
    mid: '#294885',
    front: '#7dcfff',
    mesh: ['#10121d', '#243563', '#7aa2f7', '#bb9af7'],
    particle: 'rgba(125, 207, 255, 0.75)',
    line: 'rgba(187, 154, 247, 0.28)',
  },
  'catppuccin-mocha': {
    back: '#141422',
    mid: '#52408a',
    front: '#f5c2e7',
    mesh: ['#141422', '#38305a', '#cba6f7', '#89dceb'],
    particle: 'rgba(203, 166, 247, 0.75)',
    line: 'rgba(137, 220, 235, 0.28)',
  },
  nord: {
    back: '#1f242e',
    mid: '#3b5875',
    front: '#88c0d0',
    mesh: ['#1f242e', '#2e3a4e', '#5e81ac', '#88c0d0'],
    particle: 'rgba(136, 192, 208, 0.75)',
    line: 'rgba(129, 161, 193, 0.3)',
  },
  'arcade-pixel': {
    back: '#0b0618',
    mid: '#6b1882',
    front: '#00f5d4',
    mesh: ['#0b0618', '#4b1166', '#ff2a85', '#00f5d4'],
    particle: 'rgba(0, 245, 212, 0.8)',
    line: 'rgba(255, 42, 133, 0.35)',
  },
  cuaderno: {
    back: '#0f172a',
    mid: '#7c2d12',
    front: '#fb923c',
    mesh: ['#0f172a', '#431407', '#ea580c', '#facc15'],
    particle: 'rgba(251, 146, 60, 0.75)',
    line: 'rgba(250, 204, 21, 0.28)',
  },
  'catppuccin-latte': {
    back: '#13162b',
    mid: '#4c2f8f',
    front: '#a78bfa',
    mesh: ['#13162b', '#3b2475', '#8839ef', '#209fb5'],
    particle: 'rgba(167, 139, 250, 0.75)',
    line: 'rgba(32, 159, 181, 0.3)',
  },
  'bosque-menta': {
    back: '#061a14',
    mid: '#0f5c43',
    front: '#34d399',
    mesh: ['#061a14', '#0b4432', '#10b981', '#5eead4'],
    particle: 'rgba(52, 211, 153, 0.75)',
    line: 'rgba(94, 234, 212, 0.3)',
  },
  'high-contrast': {
    back: '#000000',
    mid: '#111111',
    front: '#ffff00',
    mesh: ['#000000', '#000000', '#222222', '#ffff00'],
    particle: 'rgba(255, 255, 0, 0.5)',
    line: 'rgba(255, 255, 255, 0.25)',
  },
};

function soportaWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class ShaderBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface InteractiveShaderBgProps {
  tema: TemaId;
  modo: ModoShader;
  desactivarAnimacion: boolean;
}

interface NodoParticula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  glifo?: string;
}

const GLIFOS_CODIGO = ['si', 'fin', 'IR', '=>', '42', '{}', '()'];

export const InteractiveShaderBg: React.FC<InteractiveShaderBgProps> = ({
  tema,
  modo,
  desactivarAnimacion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglOk, setWebglOk] = useState(false);

  const paleta = PALETAS_SHADER[tema] ?? PALETAS_SHADER['gojs-dark'];
  const esAltoContraste = tema === 'high-contrast';

  useEffect(() => {
    setWebglOk(soportaWebGL());
  }, []);

  // Red interactiva de partículas y glifos .edu que reacciona al cursor
  useEffect(() => {
    if (desactivarAnimacion || esAltoContraste) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let ancho = 0;
    let alto = 0;
    let rafId = 0;
    const mouse = { x: -9999, y: -9999, activo: false };
    const chispas: { x: number; y: number; vx: number; vy: number; vida: number }[] = [];

    const nodos: NodoParticula[] = Array.from({ length: 28 }, (_, i) => ({
      x: Math.random() * 1200,
      y: Math.random() * 680,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      r: i % 5 === 0 ? 2.6 : 1.7,
      glifo: i % 4 === 0 ? GLIFOS_CODIGO[i % GLIFOS_CODIGO.length] : undefined,
    }));

    const redimensionar = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = parent.clientWidth;
      alto = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(ancho * dpr));
      canvas.height = Math.max(1, Math.floor(alto * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    redimensionar();
    window.addEventListener('resize', redimensionar);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.activo = mouse.y >= 0 && mouse.y <= rect.height;
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      if (cy < 0 || cy > rect.height) return;
      for (let i = 0; i < 10; i += 1) {
        const ang = (Math.PI * 2 * i) / 10 + Math.random() * 0.3;
        const vel = 1.4 + Math.random() * 2.2;
        chispas.push({ x: cx, y: cy, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel, vida: 1 });
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('click', onClick, { passive: true });

    const dibujar = () => {
      ctx.clearRect(0, 0, ancho, alto);

      for (let i = 0; i < nodos.length; i += 1) {
        const n = nodos[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > ancho) n.vx *= -1;
        if (n.y < 0 || n.y > alto) n.vy *= -1;
        n.x = Math.max(0, Math.min(ancho, n.x));
        n.y = Math.max(0, Math.min(alto, n.y));

        if (mouse.activo) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 145 && dist > 1) {
            n.x += (dx / dist) * 0.7;
            n.y += (dy / dist) * 0.7;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = paleta.line;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Conexiones entre nodos cercanos
        for (let j = i + 1; j < nodos.length; j += 1) {
          const m = nodos[j];
          const d = Math.hypot(n.x - m.x, n.y - m.y);
          if (d < 125) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = paleta.line;
            ctx.globalAlpha = (1 - d / 125) * 0.5;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

        ctx.fillStyle = paleta.particle;
        if (n.glifo) {
          ctx.font = '700 10px "JetBrains Mono", monospace';
          ctx.globalAlpha = 0.48;
          ctx.fillText(n.glifo, n.x + 5, n.y + 3);
          ctx.globalAlpha = 1;
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Chispas de clic
      for (let i = chispas.length - 1; i >= 0; i -= 1) {
        const s = chispas[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vida -= 0.032;
        if (s.vida <= 0) {
          chispas.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = s.vida;
        ctx.fillStyle = paleta.particle;
        ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
        ctx.globalAlpha = 1;
      }

      rafId = window.requestAnimationFrame(dibujar);
    };

    rafId = window.requestAnimationFrame(dibujar);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', redimensionar);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('click', onClick);
    };
  }, [desactivarAnimacion, esAltoContraste, paleta.line, paleta.particle]);

  const fallback = <div className="shader-fallback" aria-hidden="true" />;
  const velocidad = desactivarAnimacion ? 0 : 0.45;

  return (
    <div className="shader-bg-layer" aria-hidden="true">
      {!esAltoContraste && webglOk ? (
        <ShaderBoundary fallback={fallback}>
          {modo === 'neuro' && (
            <NeuroNoise
              colorBack={paleta.back}
              colorMid={paleta.mid}
              colorFront={paleta.front}
              brightness={0.28}
              contrast={0.42}
              speed={velocidad}
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
            />
          )}
          {modo === 'mesh' && (
            <MeshGradient
              colors={paleta.mesh}
              distortion={0.75}
              swirl={0.6}
              speed={velocidad}
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
            />
          )}
          {modo === 'orbit' && (
            <DotOrbit
              colorBack={paleta.back}
              colors={paleta.mesh.slice(1)}
              size={0.28}
              spreading={0.8}
              speed={velocidad}
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
            />
          )}
        </ShaderBoundary>
      ) : (
        fallback
      )}

      {!esAltoContraste && !desactivarAnimacion && (
        <canvas ref={canvasRef} className="shader-particle-canvas" />
      )}
    </div>
  );
};
