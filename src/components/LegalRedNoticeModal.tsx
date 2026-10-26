import React from 'react';

interface LegalRedNoticeModalProps {
  isOpen: boolean;
  sectionTitle: string;
  onClose: () => void;
}

export const InlineLegalRedBanner: React.FC<{
  title?: string;
  onOpenModal?: (section: string) => void;
  compact?: boolean;
}> = ({
  title = 'Consulta con Abogados / Cláusulas Legales y Tratamiento de Datos B2B',
  onOpenModal,
  compact = false,
}) => {
  return (
    <div
      role="alert"
      onClick={() => onOpenModal && onOpenModal(title)}
      className={`w-full rounded-xl border-2 border-dashed border-[#ba1a1a] bg-[#ffdad6]/50 text-[#93000a] transition-all ${
        onOpenModal ? 'cursor-pointer hover:bg-[#ffdad6]/80' : ''
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[#ba1a1a] text-[22px] shrink-0 mt-0.5">
            gavel
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-[#ba1a1a] text-white font-label-sm uppercase tracking-wider">
                AVISO EN ROJO · PENDIENTE ABOGADOS
              </span>
              <span className="font-title-md text-[#93000a] text-[14px]">
                {title}
              </span>
            </div>
            <p className="font-body-sm text-[#93000a]/90">
              [ESPACIO DEJADO EN BLANCO INTENCIONALMENTE PARA REVISIÓN FINAL CON ABOGADOS — TÉRMINOS, PRIVACIDAD B2B, NDA Y VALIDACIÓN NOTARIAL]
            </p>
          </div>
        </div>
        {onOpenModal && (
          <span className="px-2.5 py-1 rounded-lg bg-[#ba1a1a]/10 text-[#ba1a1a] font-label-sm shrink-0 hover:bg-[#ba1a1a] hover:text-white transition-colors">
            Ver espacio legal
          </span>
        )}
      </div>
    </div>
  );
};

export const LegalRedNoticeModal: React.FC<LegalRedNoticeModalProps> = ({
  isOpen,
  sectionTitle,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border-2 border-[#ba1a1a] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Red Warning Header */}
        <div className="bg-[#ba1a1a] text-white px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px]">warning</span>
            <div className="flex flex-col">
              <span className="font-label-sm uppercase tracking-widest text-[#ffdad6]">
                PENDIENTE DE REVISIÓN JURÍDICA
              </span>
              <h3 className="font-headline-sm text-white">
                Espacio Reservado para Consulta con Abogados
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar aviso legal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Blank Body with Red Frame */}
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-[#ffdad6]/50 px-4 py-2.5 rounded-lg border border-[#ba1a1a]/40">
            <span className="font-label-md text-[#93000a] uppercase">
              Sección Solicitada:
            </span>
            <span className="font-title-md text-[#ba1a1a]">{sectionTitle}</span>
          </div>

          {/* Intentional Blank Box in Red */}
          <div className="min-h-[200px] w-full rounded-xl border-2 border-dashed border-[#ba1a1a] bg-[#fff8f7] p-6 flex flex-col items-center justify-center text-center gap-2">
            <span className="material-symbols-outlined text-[#ba1a1a] text-[36px]">
              balance
            </span>
            <p className="font-headline-sm text-[#ba1a1a]">
              [ SECCIÓN EN BLANCO — PENDIENTE DE ABOGADOS ]
            </p>
            <p className="font-body-md text-[#93000a] max-w-md">
              Este bloque (Términos del Encuentro, Tratamiento de Datos B2B, Confidencialidad en Rondas 1-a-1, Validación Notarial / BASC y Avisos de Privacidad) se ha dejado en blanco tal como se solicitó para completarlo al final tras la consulta con el equipo legal.
            </p>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white font-title-md transition-colors cursor-pointer"
            >
              Entendido, continuar con el MVP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
