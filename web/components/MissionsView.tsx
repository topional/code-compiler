import { Award, CheckCircle2, Code2, Download, Lightbulb, Sparkles, Trophy } from 'lucide-react';

import { MISIONES_EDU, type MisionEdu } from '../data/misiones';

interface MissionsViewProps {
  completadas: string[];
  onIniciarMision: (mision: MisionEdu) => void;
}

export function MissionsView({ completadas, onIniciarMision }: MissionsViewProps) {
  const porcentaje = Math.round((completadas.length / MISIONES_EDU.length) * 100);

  const descargarDiploma = () => {
    const listaInsignias = MISIONES_EDU.filter((m) => completadas.includes(m.id))
      .map((m) => `• ${m.insignia} (${m.titulo})`)
      .join('\n');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
  <rect width="900" height="560" rx="28" fill="#FFF9F0"/>
  <rect x="24" y="24" width="852" height="512" rx="20" fill="#FFFFFF" stroke="#142038" stroke-width="5"/>
  <rect x="44" y="44" width="812" height="84" rx="14" fill="#FF6B2C"/>
  <text x="450" y="97" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="700" fill="#FFFFFF">CERTIFICADO CHISPA .EDU</text>
  <text x="450" y="185" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="700" fill="#142038">Progreso completado: ${completadas.length} de ${MISIONES_EDU.length} misiones (${porcentaje}%)</text>
  <text x="450" y="232" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#3F4F6B">De bloques tipo Scratch a programación textual en español</text>
  <rect x="90" y="268" width="720" height="190" rx="14" fill="#F6EFE4" stroke="#DFD3C0" stroke-width="2"/>
  <text x="120" y="308" font-family="monospace" font-size="17" font-weight="700" fill="#C9410A">Insignias desbloqueadas:</text>
  ${(listaInsignias || '• ¡Completa tu primera misión en Chispa .edu!')
    .split('\n')
    .slice(0, 6)
    .map(
      (line, idx) =>
        `<text x="120" y="${340 + idx * 24}" font-family="monospace" font-size="15" fill="#142038">${line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')}</text>`,
    )
    .join('')}
  <text x="450" y="505" text-anchor="middle" font-family="monospace" font-size="14" fill="#52617D">Generado localmente por Chispa .edu · Lenguaje Educativo</text>
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificado-chispa-edu.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="missions-heading">
      <div className="panel" style={{ padding: 22, marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          <div>
            <span className="section-tag">// ruta gradual estilo Hedy + Pilas Bloques</span>
            <h1 id="missions-heading" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
              Misiones interactivas de programación
            </h1>
            <p style={{ margin: '6px 0 0', color: 'var(--ink-secondary)' }}>
              Avanza nivel por nivel, pon a prueba tus programas y desbloquea todas las insignias.
            </p>
          </div>

          <button type="button" className="btn btn-primary" onClick={descargarDiploma}>
            <Download size={16} aria-hidden="true" />
            Descargar ficha de logros (SVG)
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuenow={porcentaje}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso total de misiones"
            >
              <div className="progress-fill" style={{ width: `${porcentaje}%` }} />
            </div>
          </div>
          <span className="pill">
            <Trophy size={14} aria-hidden="true" /> {completadas.length}/{MISIONES_EDU.length} ({porcentaje}%)
          </span>
        </div>
      </div>

      <div className="missions-grid">
        {MISIONES_EDU.map((mision) => {
          const hecha = completadas.includes(mision.id);
          return (
            <article key={mision.id} className={`panel mission-card ${hecha ? 'done' : ''}`}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <span className="pill">{mision.etiquetaNivel}</span>
                  {hecha ? (
                    <span className="status-pill ok">
                      <CheckCircle2 size={14} aria-hidden="true" /> Completada
                    </span>
                  ) : (
                    <span className="pill">
                      <Award size={13} aria-hidden="true" /> {mision.insignia}
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>{mision.titulo}</h2>
                <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>
                  {mision.historia}
                </p>
                <p
                  style={{
                    margin: '0 0 10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.86rem',
                  }}
                >
                  <strong>Objetivo:</strong> {mision.objetivo}
                </p>

                <details style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700, padding: '4px 0' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Lightbulb size={14} aria-hidden="true" /> Ver pista
                    </span>
                  </summary>
                  <p style={{ margin: '6px 0 0' }}>{mision.pista}</p>
                </details>
              </div>

              <button
                type="button"
                className={`btn ${hecha ? '' : 'btn-primary'}`}
                onClick={() => onIniciarMision(mision)}
              >
                {hecha ? <Sparkles size={16} aria-hidden="true" /> : <Code2 size={16} aria-hidden="true" />}
                {hecha ? 'Volver a practicar en el Estudio' : 'Abrir misión en el Estudio'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
