import React, { useState } from 'react';

export type FooterNavTarget =
  | 'bw2-directory'
  | 'connections'
  | 'agenda'
  | 'virtual-room';

interface InstitutionalFooterProps {
  hasAccess: boolean;
  onNavigate?: (view: FooterNavTarget) => void;
  onOpenLegalNotice: (sectionTitle: string) => void;
  onProtectedLinkClick?: () => void;
}

export const InstitutionalFooter: React.FC<InstitutionalFooterProps> = ({
  hasAccess,
  onNavigate,
  onOpenLegalNotice,
  onProtectedLinkClick,
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const handlePlatformClick = (target: FooterNavTarget) => {
    if (!hasAccess) {
      if (onProtectedLinkClick) {
        onProtectedLinkClick();
      } else {
        onOpenLegalNotice(
          'Acceso Restringido a Empresas Invitadas · Solicita tu Invitación para visualizar esta sección'
        );
      }
      return;
    }
    if (onNavigate) {
      onNavigate(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    setReportSent(true);
    setTimeout(() => {
      setReportSent(false);
      setReportText('');
      setIsReportModalOpen(false);
    }, 1800);
  };

  return (
    <>
      <footer className="w-full bg-[#161f30] text-[#cbd5e1] border-t border-slate-800 mt-auto select-none">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 pt-10 pb-8">
          {/* 4-Column Institutional Grid (Matches Image 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 pb-9 border-b border-slate-700/60">
            {/* Column 1 (4 cols): BW2 Brand & Non-recording disclaimer */}
            <div className="lg:col-span-4 flex flex-col gap-4 pr-0 lg:pr-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#93b4ff] text-[#0f172a] flex items-center justify-center font-headline-sm font-black tracking-tighter text-[13px] shrink-0">
                  BW2
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-white font-headline-sm font-extrabold tracking-tight text-[16px]">
                    BWOS
                  </span>
                  <span className="text-[#94a3b8] font-label-sm uppercase tracking-widest text-[10px] mt-0.5">
                    CONECTAR B2B
                  </span>
                </div>
              </div>

              <p className="text-[#cbd5e1] font-body-md text-[14px] leading-relaxed">
                Directorio y rondas de negocios B2B con videollamadas 1 a 1. Solo
                para empresas invitadas a la ronda.
              </p>

              <p className="text-[#94a3b8] font-body-sm text-[13px]">
                La plataforma no graba las reuniones.
              </p>
            </div>

            {/* Column 2 (2 cols): PLATAFORMA */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <h3 className="text-[#94a3b8] font-label-sm uppercase tracking-wider text-[11px] font-bold">
                PLATAFORMA
              </h3>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => handlePlatformClick('bw2-directory')}
                    className="text-white hover:text-[#93b4ff] font-title-md text-[14px] font-bold transition-colors cursor-pointer text-left"
                  >
                    Directorio BW2
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handlePlatformClick('connections')}
                    className="text-white hover:text-[#93b4ff] font-title-md text-[14px] font-bold transition-colors cursor-pointer text-left"
                  >
                    Mis conexiones
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handlePlatformClick('agenda')}
                    className="text-white hover:text-[#93b4ff] font-title-md text-[14px] font-bold transition-colors cursor-pointer text-left"
                  >
                    Agenda B2B
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handlePlatformClick('virtual-room')}
                    className="text-white hover:text-[#93b4ff] font-title-md text-[14px] font-bold transition-colors cursor-pointer text-left"
                  >
                    Sala virtual
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3 (3 cols): LEGAL */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              <h3 className="text-[#94a3b8] font-label-sm uppercase tracking-wider text-[11px] font-bold">
                LEGAL
              </h3>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenLegalNotice(
                        'Términos y Condiciones (Borrador Pendiente de Abogados)'
                      )
                    }
                    className="group text-left inline-flex flex-wrap items-baseline gap-1.5 cursor-pointer"
                  >
                    <span className="text-white group-hover:text-[#93b4ff] font-title-md text-[14px] font-bold transition-colors">
                      Términos y Condiciones
                    </span>
                    <span className="text-[#f87171] font-label-sm text-[11px] font-bold">
                      borrador
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenLegalNotice(
                        'Política de Privacidad y Datos Corporativos (Borrador Pendiente de Abogados)'
                      )
                    }
                    className="group text-left inline-flex flex-wrap items-baseline gap-1.5 cursor-pointer"
                  >
                    <span className="text-white group-hover:text-[#93b4ff] font-title-md text-[14px] font-bold transition-colors">
                      Política de Privacidad
                    </span>
                    <span className="text-[#f87171] font-label-sm text-[11px] font-bold">
                      borrador
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenLegalNotice(
                        'Reglas de Conducta Empresarial en Rondas B2B (Borrador Pendiente de Abogados)'
                      )
                    }
                    className="group text-left inline-flex flex-wrap items-baseline gap-1.5 cursor-pointer"
                  >
                    <span className="text-white group-hover:text-[#93b4ff] font-title-md text-[14px] font-bold transition-colors">
                      Reglas de conducta
                    </span>
                    <span className="text-[#f87171] font-label-sm text-[11px] font-bold">
                      borrador
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenLegalNotice(
                        'Uso de WhatsApp y Videollamadas 1 a 1 (Pendiente de Abogados)'
                      )
                    }
                    className="group text-left flex flex-col items-start cursor-pointer"
                  >
                    <span className="text-white group-hover:text-[#93b4ff] font-title-md text-[14px] font-bold transition-colors">
                      Uso de WhatsApp y videollamadas
                    </span>
                    <span className="text-[#f87171] font-label-sm text-[11px] font-bold mt-0.5">
                      pendiente
                    </span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4 (3 cols): CONTACTO Y SOPORTE */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              <h3 className="text-[#94a3b8] font-label-sm uppercase tracking-wider text-[11px] font-bold">
                CONTACTO Y SOPORTE
              </h3>
              <ul className="flex flex-col gap-2.5">
                <li className="text-[#cbd5e1] font-body-md text-[14px]">
                  Soporte técnico:{' '}
                  <button
                    type="button"
                    onClick={() =>
                      onOpenLegalNotice(
                        'Definición de Canal de Soporte Oficial y SLA (Pendiente)'
                      )
                    }
                    className="text-[#94a3b8] hover:text-white underline decoration-dotted cursor-pointer"
                  >
                    [correo pendiente]
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="text-white hover:text-[#93b4ff] font-title-md text-[14px] font-bold transition-colors cursor-pointer text-left"
                  >
                    Denunciar una conducta
                  </button>
                </li>
                <li className="text-[#cbd5e1] font-body-md text-[14px]">
                  Horario: lunes a viernes, 9 a 18 h
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright + Legal Entity Pending + Jitsi Prototype Info */}
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-[#94a3b8]">
            <div>
              <span>
                © 2026 BWOS Digital Partner · Razón social, CUIT y domicilio:{' '}
              </span>
              <button
                type="button"
                onClick={() =>
                  onOpenLegalNotice(
                    'Datos Societarios: Razón Social, CUIT y Domicilio Legal (Pendiente de Abogados)'
                  )
                }
                className="text-[#f87171] hover:underline font-semibold cursor-pointer"
              >
                [pendiente]
              </button>
            </div>

            <div className="text-[#94a3b8]">
              Video con Jitsi Meet · Prototipo v4.4 con datos de ejemplo
            </div>
          </div>
        </div>
      </footer>

      {/* Modal: Denunciar una conducta */}
      {isReportModalOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-surface-container-lowest text-on-surface rounded-2xl shadow-2xl border border-surface-container-high p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-[22px]">
                  report_problem
                </span>
                <h4 className="font-headline-sm text-on-surface">
                  Denunciar una conducta B2B
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            {reportSent ? (
              <div className="py-6 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[36px]">
                  check_circle
                </span>
                <p className="font-title-md text-on-surface">
                  Reporte registrado para el Comité de Ética y Moderación
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="flex flex-col gap-3">
                <p className="font-body-sm text-on-surface-variant">
                  Describe el incidente ocurrido durante una ronda o contacto B2B. El protocolo sancionatorio definitivo está marcado en rojo para revisión de abogados.
                </p>
                <textarea
                  rows={3}
                  required
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Indica la empresa, sala o motivo del reporte..."
                  className="w-full p-3 rounded-xl bg-surface border border-outline-variant font-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low font-label-md cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-error text-on-error font-label-md font-bold cursor-pointer"
                  >
                    Enviar Reporte
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
