import React, { useState } from 'react';
import { IncomingCallData } from '../data/b2bData';

interface IncomingCallModalProps {
  isOpen: boolean;
  callData: IncomingCallData;
  onAcceptAndJoin: (callData: IncomingCallData) => void;
  onDecline: () => void;
  onPostpone15Min: (callData: IncomingCallData) => void;
  onOpenLegalNotice: (section: string) => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  isOpen,
  callData,
  onAcceptAndJoin,
  onDecline,
  onPostpone15Min,
  onOpenLegalNotice,
}) => {
  const [modalStatus, setModalStatus] = useState<'ringing' | 'connecting' | 'postponed'>('ringing');

  if (!isOpen) return null;

  const handleAccept = () => {
    setModalStatus('connecting');
    setTimeout(() => {
      setModalStatus('ringing');
      onAcceptAndJoin(callData);
    }, 850);
  };

  const handlePostpone = () => {
    setModalStatus('postponed');
  };

  const handleFinishPostpone = () => {
    setModalStatus('ringing');
    onPostpone15Min(callData);
  };

  const handleDismiss = () => {
    setModalStatus('ringing');
    onDecline();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/65 backdrop-blur-md transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incoming-call-heading"
    >
      {modalStatus === 'connecting' && (
        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-auto text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-full bg-secondary-container/50 flex items-center justify-center mb-4 text-secondary">
            <span className="material-symbols-outlined text-[30px] animate-spin">sync</span>
          </div>
          <h2 className="font-headline-sm text-on-surface mb-1">
            Estableciendo enlace seguro Jitsi Meet...
          </h2>
          <p className="font-body-sm text-on-surface-variant">
            Conectando audio y video HD con {callData.callerName} ({callData.roomNumber}).
          </p>
        </div>
      )}

      {modalStatus === 'postponed' && (
        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-auto text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center mb-4 text-primary">
            <span className="material-symbols-outlined text-[28px]">schedule_send</span>
          </div>
          <h2 className="font-headline-sm text-on-surface mb-1">Reunión Pospuesta</h2>
          <p className="font-body-sm text-on-surface-variant">
            Se ha enviado una notificación automática a {callData.callerName} para reconectar en 15 minutos y se agregó a tu Agenda B2B.
          </p>
          <button
            type="button"
            onClick={handleFinishPostpone}
            className="mt-5 px-6 py-2.5 bg-primary text-on-primary rounded-xl font-title-md hover:bg-primary-container transition-colors cursor-pointer"
          >
            Volver al Lobby
          </button>
        </div>
      )}

      {modalStatus === 'ringing' && (
        <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Ambient Top Subtle Aura Accent */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-secondary-container/40 rounded-full blur-3xl pointer-events-none" />

          {/* Top Utility / Dismiss Bar */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-6">
            <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-1.5 rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
              </span>
              <span className="material-symbols-outlined text-secondary text-[16px]">videocam</span>
              <span className="font-label-sm text-secondary font-bold uppercase tracking-wider">
                Videollamada B2B entrante
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-surface-container-high px-2.5 py-1 rounded-md text-on-surface-variant font-label-sm font-bold">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>{callData.roomNumber} · JITSI</span>
            </div>
          </div>

          {/* Main Caller Presentation */}
          <div className="relative z-10 px-6 pt-4 text-center flex flex-col items-center">
            {/* Avatar Ring with Pulsing Halo */}
            <div className="relative my-3">
              <div className="absolute -inset-3 rounded-full bg-secondary-container/60 animate-ping opacity-40" />
              <div className="absolute -inset-1.5 rounded-full bg-secondary/20" />
              <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-lg bg-surface-container-high p-1">
                <img
                  src={callData.avatarDesktopUrl}
                  alt={callData.callerName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = callData.avatarMobileUrl;
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-secondary text-on-secondary px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <span className="w-2 h-2 rounded-full bg-secondary-container animate-ping" />
                <span className="font-label-sm uppercase tracking-wider">En vivo</span>
              </div>
            </div>

            {/* Notification Headline */}
            <span className="font-label-md uppercase tracking-wider text-primary font-bold mb-1">
              Solicitud Directa en Tiempo Real
            </span>
            <h2
              id="incoming-call-heading"
              className="font-headline-md text-on-surface tracking-tight mb-1"
            >
              Alguien quiere conectar con vos
            </h2>

            {/* Executive Identification & Company */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap mb-1">
              <span className="font-title-md text-on-surface font-bold">
                {callData.callerName}
              </span>
              <span className="font-body-sm text-outline">•</span>
              <span className="font-body-md text-on-surface-variant font-medium">
                {callData.callerRole}
              </span>
            </div>

            {/* Location line */}
            <p className="font-body-sm text-outline flex items-center gap-1 justify-center mb-3">
              <span className="material-symbols-outlined text-[15px]">location_on</span>
              {callData.location}
            </p>

            {/* Match Chip Badge */}
            <div className="inline-flex items-center gap-1.5 bg-secondary-container/40 text-on-secondary-container px-4 py-1.5 rounded-full mb-4">
              <span className="material-symbols-outlined text-[18px] text-secondary material-fill">
                handshake
              </span>
              <span className="font-title-md font-bold text-secondary">
                Match de Negocio {callData.matchScore}%
              </span>
              <span className="font-body-sm opacity-80">(Alta sinergia)</span>
            </div>

            {/* Meeting Context Card (Oferta/Demanda Complement) */}
            <div className="w-full bg-surface-container-low rounded-xl p-4 text-left mb-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">
                    sync_alt
                  </span>
                  <span className="font-label-sm font-bold text-primary uppercase tracking-wider">
                    Interés de Sincronización
                  </span>
                </div>
                <span className="font-label-sm text-outline">{callData.quarterLabel}</span>
              </div>
              <p className="font-body-md text-on-surface leading-snug">
                “{callData.syncInterest}”
              </p>
              <div className="mt-2.5 pt-2 border-t border-surface-container-high flex flex-wrap gap-1.5">
                <span className="bg-secondary-container/50 text-secondary px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                  {callData.offerSummary}
                </span>
                <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                  {callData.demandSummary}
                </span>
              </div>
            </div>

            {/* Action Buttons: Mobile stacks Accept on top, Desktop 2-col */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={handleDismiss}
                className="order-2 sm:order-1 w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-error-container text-on-error-container hover:bg-error-container/80 active:scale-95 transition-all font-title-md font-bold px-4 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] material-fill">
                  call_end
                </span>
                <span>Rechazar</span>
              </button>

              <button
                type="button"
                onClick={handleAccept}
                className="order-1 sm:order-2 w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-secondary text-on-secondary hover:opacity-95 shadow-lg shadow-secondary/25 active:scale-95 transition-all font-title-md font-bold px-4 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] material-fill">
                  videocam
                </span>
                <span>Aceptar y unirse</span>
              </button>
            </div>

            {/* Option to Postpone */}
            <button
              type="button"
              onClick={handlePostpone}
              className="font-label-md text-outline hover:text-on-surface transition-colors py-1.5 flex items-center gap-1 mb-3 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>Posponer 15 min y enviar mensaje predeterminado</span>
            </button>
          </div>

          {/* Modal Footer Note with Red Lawyer Placeholder */}
          <div
            onClick={() =>
              onOpenLegalNotice('Cláusula de Confidencialidad y Cifrado en Videollamadas B2B')
            }
            className="bg-[#ffdad6]/70 border-t border-[#ba1a1a]/40 px-6 py-2.5 flex items-center justify-center gap-2 text-[#93000a] font-label-sm cursor-pointer hover:bg-[#ffdad6] transition-colors"
          >
            <span className="material-symbols-outlined text-[15px] text-[#ba1a1a]">
              gavel
            </span>
            <span>
              Canal Jitsi Meet Gratuito • [AVISO LEGAL DE GRABACIÓN/CONFIDENCIALIDAD EN BLANCO — PENDIENTE ABOGADOS]
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
