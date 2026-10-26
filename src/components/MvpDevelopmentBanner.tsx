import React, { useState } from 'react';

interface MvpDevelopmentBannerProps {
  onOpenLegalNotice: (sectionName: string) => void;
  onResetDemo: () => void;
}

export const MvpDevelopmentBanner: React.FC<MvpDevelopmentBannerProps> = ({
  onOpenLegalNotice,
  onResetDemo,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-y4og7ojyi34wdxyyvgaaz4-81726093639.us-east1.run.app';

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  return (
    <>
      {/* Persistent Top MVP In-Development Notice Bar */}
      <div className="w-full bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white border-b border-amber-400/30 z-50">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-label-sm font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              MVP en Desarrollo · Piloto Activo
            </span>
            <p className="font-body-sm text-slate-200 text-[12px] sm:text-[13px]">
              <strong>Aviso:</strong> Esta plataforma se encuentra en fase de{' '}
              <span className="text-amber-300 font-semibold">
                Producto Mínimo Viable (MVP) en desarrollo
              </span>
              . Las funciones de videollamada Jitsi 1-a-1 y catálogo están operativas para pruebas piloto.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-label-sm font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">
                rocket_launch
              </span>
              <span>Estado MVP & Producción</span>
            </button>

            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-label-sm flex items-center gap-1 transition-colors cursor-pointer"
              title="Copiar enlace público para compartir el MVP"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedUrl ? 'check' : 'share'}
              </span>
              <span className="hidden md:inline">
                {copiedUrl ? '¡Enlace copiado!' : 'Compartir MVP'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Detalles del MVP en Desarrollo y Guía de Producción */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-on-surface/65 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mvp-status-modal-title"
        >
          <div className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <span className="material-symbols-outlined text-[22px]">
                    construction
                  </span>
                </div>
                <div>
                  <span className="font-label-sm uppercase tracking-widest text-amber-300 font-bold block">
                    Versión Preliminar de Validación (v0.9 MVP)
                  </span>
                  <h3
                    id="mvp-status-modal-title"
                    className="font-title-lg text-white font-bold"
                  >
                    Plataforma en Desarrollo · Guía de Producción MVP
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              {/* Banner Warning Inside Modal */}
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-700 text-[22px] shrink-0 mt-0.5">
                  info
                </span>
                <div className="flex flex-col gap-1">
                  <span className="font-title-sm text-amber-950 font-bold">
                    Aviso Oficial para Usuarios y Contrapartes Invitadas
                  </span>
                  <p className="font-body-sm text-amber-900">
                    Estás utilizando la versión <strong>MVP Piloto</strong> de{' '}
                    <strong>BWOS Conectar B2B (Summit 2025)</strong>. Todas las
                    funciones interactivas están habilitadas para pruebas de
                    usabilidad, ruedas de negocio y videollamadas gratuitas con
                    Jitsi Meet.
                  </p>
                </div>
              </div>

              {/* Two Columns: Operational vs In Development */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-secondary font-title-sm font-bold">
                    <span className="material-symbols-outlined text-[20px]">
                      check_circle
                    </span>
                    <span>Operativo en este MVP</span>
                  </div>
                  <ul className="font-body-sm text-on-surface-variant space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-secondary font-bold">•</span>
                      <span>
                        <strong>Videollamadas 1-a-1 Gratuitas:</strong> Salas en
                        vivo integradas con <code>meet.jit.si</code>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary font-bold">•</span>
                      <span>
                        <strong>Acreditación y Matriz B2B:</strong> Registro de
                        oferta/demanda con publicación inmediata en el Lobby.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary font-bold">•</span>
                      <span>
                        <strong>Insights con Recharts:</strong> Gráficos
                        interactivos de conexiones por sector industrial.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary font-bold">•</span>
                      <span>
                        <strong>Agenda, Speed-Pitch y WhatsApp:</strong> Flujo
                        completo de contacto ejecutivo.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-primary font-title-sm font-bold">
                    <span className="material-symbols-outlined text-[20px]">
                      pending_actions
                    </span>
                    <span>Próxima Fase (En Desarrollo)</span>
                  </div>
                  <ul className="font-body-sm text-on-surface-variant space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>
                        <strong>Revisión Legal con Abogados:</strong> Textos de
                        privacidad, NDA y validación BASC (marcados en rojo).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>
                        <strong>Base de Datos en la Nube:</strong> Sincronización
                        multiusuario en tiempo real entre distintos dispositivos.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>
                        <strong>Autenticación Corporativa:</strong> Inicio de
                        sesión verificado por correo empresarial.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Production Deployment Instructions */}
              <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/60 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      public
                    </span>
                    <span className="font-title-sm text-on-surface font-bold">
                      Cómo abrir el MVP al público SIN pedir Login de Google
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary font-label-sm font-bold">
                    Acceso Abierto
                  </span>
                </div>

                <div className="bg-surface-container-low rounded-lg p-3 border border-surface-container-high font-body-sm text-on-surface-variant space-y-2">
                  <p>
                    <strong>¿Por qué el enlace <code>ais-pre-...</code> pide cuenta de Google?</strong>{' '}
                    Por seguridad de Google AI Studio, los enlaces de previsualización (<code>ais-pre</code>) están protegidos por un proxy que exige iniciar sesión con Google y que hayas habilitado el uso compartido en el botón <strong>Share</strong>.
                  </p>
                  <p className="font-semibold text-on-surface">
                    Para que cualquier persona entre directo SIN iniciar sesión en Google, usa cualquiera de estas 2 vías:
                  </p>
                  <ol className="space-y-1.5 list-decimal list-inside">
                    <li>
                      <strong>Opción A · Deploy a Cloud Run (Desde AI Studio):</strong>{' '}
                      Haz clic en el icono <strong>Deploy to Cloud Run</strong> arriba a la derecha en AI Studio. Una vez desplegado en tu Google Cloud Console, entra al servicio en Cloud Run &rarr; pestaña <strong>Security</strong> y marca <strong>“Allow unauthenticated invocations”</strong> (Permitir invocaciones sin autenticar). Te dará una URL 100% libre de login.
                    </li>
                    <li>
                      <strong>Opción B · Descargar / GitHub a Vercel o Netlify (Gratis y sin tarjeta):</strong>{' '}
                      Usa el botón de <strong>Exportar a GitHub / Descargar ZIP</strong> en la barra superior de AI Studio y súbelo a <strong>Vercel</strong> o <strong>Netlify</strong>. Como esta app es un SPA con Jitsi público, quedará en línea en 1 minuto con acceso libre para todo el mundo.
                    </li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 h-10 px-3 rounded-lg bg-surface-container text-on-surface font-mono text-[12px] border border-outline-variant/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copiedUrl ? 'check' : 'content_copy'}
                    </span>
                    <span>
                      {copiedUrl ? '¡URL Copiada!' : 'Copiar URL Actual'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-surface-container-low border-t border-surface-container-high flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    onOpenLegalNotice(
                      'Revisión General de Cláusulas Legales para Lanzamiento a Producción'
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#ffdad6] text-[#93000a] font-label-sm font-bold flex items-center gap-1 hover:bg-[#ba1a1a] hover:text-white transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    gavel
                  </span>
                  <span>Ver Pendientes de Abogados</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onResetDemo();
                    setIsModalOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-sm font-semibold transition-colors cursor-pointer"
                >
                  Reiniciar Datos Demo
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary font-title-sm font-bold cursor-pointer"
              >
                Continuar en el MVP
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
