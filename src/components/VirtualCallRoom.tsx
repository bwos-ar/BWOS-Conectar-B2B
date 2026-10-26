import React, { useEffect, useRef, useState } from 'react';
import { CompanyCard, UserProfile } from '../data/b2bData';
import { InlineLegalRedBanner } from './LegalRedNoticeModal';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

interface VirtualCallRoomProps {
  activeCompany: CompanyCard;
  allCompanies: CompanyCard[];
  userProfile: UserProfile | null;
  onSelectCompany: (company: CompanyCard) => void;
  onBackToLobby: () => void;
  onOpenLegalNotice: (section: string) => void;
}

export const VirtualCallRoom: React.FC<VirtualCallRoomProps> = ({
  activeCompany,
  allCompanies,
  userProfile,
  onSelectCompany,
  onBackToLobby,
  onOpenLegalNotice,
}) => {
  const jitsiContainerRef = useRef<HTMLDivElement | null>(null);
  const jitsiApiRef = useRef<any>(null);
  const [useDirectIframe, setUseDirectIframe] = useState(false);
  const [notes, setNotes] = useState<string>(() => {
    return (
      localStorage.getItem(`bwos_notes_${activeCompany.id}`) ||
      `Acuerdos preliminares con ${activeCompany.name}:\n• Revisión de catálogo y condiciones comerciales Q3.\n• Seguimiento técnico vía WhatsApp corporativo.`
    );
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savedNotice, setSavedNotice] = useState(false);

  const displayName = userProfile?.fullName
    ? `${userProfile.fullName} (${userProfile.companyName})`
    : 'Directivo Acreditado · BWOS B2B';

  const cleanRoomName = activeCompany.jitsiRoomName.replace(/[^a-zA-Z0-9_-]/g, '');
  const jitsiDirectUrl = `https://meet.jit.si/${cleanRoomName}#userInfo.displayName="${encodeURIComponent(
    displayName
  )}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

  // Sync notes when company changes
  useEffect(() => {
    const stored = localStorage.getItem(`bwos_notes_${activeCompany.id}`);
    setNotes(
      stored ||
        `Acuerdos preliminares con ${activeCompany.name}:\n• Revisión de oferta: ${activeCompany.offer.badge}\n• Requerimiento de demanda: ${activeCompany.demand.badge}`
    );
    setElapsedSeconds(0);
  }, [activeCompany]);

  // Call timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Jitsi Meet External API
  useEffect(() => {
    if (useDirectIframe || !jitsiContainerRef.current) return;

    let mounted = true;
    const initJitsi = () => {
      if (!mounted || !jitsiContainerRef.current) return;
      if (typeof window.JitsiMeetExternalAPI === 'function') {
        try {
          if (jitsiApiRef.current) {
            jitsiApiRef.current.dispose();
          }
          jitsiContainerRef.current.innerHTML = '';
          jitsiApiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
            roomName: cleanRoomName,
            parentNode: jitsiContainerRef.current,
            width: '100%',
            height: '100%',
            userInfo: {
              displayName,
            },
            configOverwrite: {
              prejoinPageEnabled: false,
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              disableDeepLinking: true,
            },
            interfaceConfigOverwrite: {
              SHOW_JITSI_WATERMARK: false,
              TOOLBAR_BUTTONS: [
                'microphone',
                'camera',
                'desktop',
                'chat',
                'raisehand',
                'tileview',
                'fullscreen',
                'hangup',
              ],
            },
          });
        } catch {
          setUseDirectIframe(true);
        }
      } else {
        setUseDirectIframe(true);
      }
    };

    const timer = setTimeout(initJitsi, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch {
          // ignore cleanup errors
        }
        jitsiApiRef.current = null;
      }
    };
  }, [cleanRoomName, displayName, useDirectIframe]);

  const handleSaveNotes = (val: string) => {
    setNotes(val);
    localStorage.setItem(`bwos_notes_${activeCompany.id}`, val);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const remSecs = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${remSecs}`;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-6">
      {/* Top Call Session Header */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-surface-container-high flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={onBackToLobby}
            className="w-11 h-11 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Volver al Lobby"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>

          <img
            src={activeCompany.logoUrl}
            alt={activeCompany.name}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-xl object-cover bg-surface-container shrink-0"
          />

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container font-label-sm uppercase flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                Sala Jitsi Meet Gratuita en Vivo
              </span>
              <span className="font-label-sm text-primary bg-primary-fixed px-2 py-0.5 rounded-md tabular-nums">
                ⏱ {formatDuration(elapsedSeconds)}
              </span>
            </div>
            <h1 className="font-headline-sm sm:font-headline-md text-on-surface truncate mt-0.5">
              Mesa 1-a-1: {activeCompany.name} ({activeCompany.representative.name})
            </h1>
          </div>
        </div>

        {/* Counterparty Switcher & External Jitsi Link */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl border border-surface-container-high max-w-full">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
              swap_horiz
            </span>
            <label htmlFor="room-switcher" className="font-label-sm text-outline shrink-0">
              Sala:
            </label>
            <select
              id="room-switcher"
              value={activeCompany.id}
              onChange={(e) => {
                const found = allCompanies.find((c) => c.id === e.target.value);
                if (found) onSelectCompany(found);
              }}
              className="bg-transparent font-label-md text-on-surface outline-none cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
            >
              {allCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.matchScore}% Match)
                </option>
              ))}
            </select>
          </div>

          <a
            href={`https://meet.jit.si/${cleanRoomName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            <span>Abrir Jitsi en pestaña completa</span>
          </a>

          <button
            type="button"
            onClick={onBackToLobby}
            className="h-10 px-4 rounded-xl bg-error text-on-error hover:opacity-90 font-label-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">call_end</span>
            <span>Finalizar reunión</span>
          </button>
        </div>
      </div>

      {/* Main Split: Jitsi Video Viewport + Commercial Synergy Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Jitsi Meet Free Video Conference Container */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="w-full h-[500px] sm:h-[600px] rounded-2xl overflow-hidden bg-[#131b2e] shadow-lg border border-surface-container-high relative flex flex-col">
            {useDirectIframe ? (
              <iframe
                src={jitsiDirectUrl}
                title={`Sala Jitsi Meet B2B - ${activeCompany.name}`}
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                className="w-full h-full border-0"
              />
            ) : (
              <div ref={jitsiContainerRef} className="w-full h-full" />
            )}
          </div>

          {/* Red Lawyer Notice for Call Recording & NDA */}
          <InlineLegalRedBanner
            compact
            title="Cláusula de Confidencialidad (NDA) y Términos de Videollamada B2B"
            onOpenModal={onOpenLegalNotice}
          />
        </div>

        {/* Right 4 Cols: Counterparty Offer/Demand & Collaborative Notes */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          {/* Executive Counterparty Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-label-sm uppercase tracking-wider text-primary font-bold">
                Ficha de Sinergia B2B
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-label-md font-bold">
                {activeCompany.matchScore}% Match
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low">
              <div className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0 overflow-hidden">
                {activeCompany.representative.avatarUrl ? (
                  <img
                    src={activeCompany.representative.avatarUrl}
                    alt={activeCompany.representative.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[20px]">
                    {activeCompany.representative.icon}
                  </span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-title-md text-on-surface truncate">
                  {activeCompany.representative.name}
                </span>
                <span className="font-body-sm text-on-surface-variant truncate">
                  {activeCompany.representative.role}
                </span>
                <span className="font-label-sm text-outline mt-0.5">
                  {activeCompany.countryFlag} {activeCompany.location}
                </span>
              </div>
            </div>

            {/* Ofrece Block */}
            <div className="rounded-xl p-3.5 bg-[#ECFDF5] flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-label-sm font-extrabold text-[#047857] uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#047857]" />
                  Ofrece Contraparte
                </span>
                <span className="font-label-sm text-[#047857]/80">
                  {activeCompany.offer.badge}
                </span>
              </div>
              <p className="font-body-sm text-[#064E3B] leading-snug">
                {activeCompany.offer.description}
              </p>
            </div>

            {/* Demanda Block */}
            <div className="rounded-xl p-3.5 bg-surface-container-low flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-label-sm font-extrabold text-primary uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Demanda / Requiere
                </span>
                <span className="font-label-sm text-on-surface-variant">
                  {activeCompany.demand.badge}
                </span>
              </div>
              <p className="font-body-sm text-on-surface leading-snug">
                {activeCompany.demand.description}
              </p>
            </div>

            {/* Direct WhatsApp Action */}
            <a
              href={`https://wa.me/${activeCompany.representative.whatsapp.replace(
                /[^0-9]/g,
                ''
              )}?text=${encodeURIComponent(
                `Hola ${activeCompany.representative.name}, estamos conectados en la Sala Virtual de BWOS Conectar B2B (${activeCompany.name}).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-xl bg-secondary hover:opacity-95 text-on-secondary font-title-md flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
              <span>Contactar por WhatsApp Directo</span>
            </a>
          </div>

          {/* Meeting Notes Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="meeting-notes"
                className="font-title-md text-on-surface flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-primary text-[20px]">
                  edit_note
                </span>
                Minuta de Rueda 1-a-1
              </label>
              {savedNotice && (
                <span className="font-label-sm text-secondary">✓ Guardado</span>
              )}
            </div>
            <textarea
              id="meeting-notes"
              rows={5}
              value={notes}
              onChange={(e) => handleSaveNotes(e.target.value)}
              placeholder="Anota compromisos, precios o acuerdos de confidencialidad de esta sesión..."
              className="w-full p-3 rounded-xl bg-surface border border-outline-variant font-body-sm text-on-surface focus:outline-none focus:border-primary resize-none"
            />
            <span className="font-label-sm text-outline">
              Las notas se guardan automáticamente en tu navegador para esta contraparte.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
};
