import React, { useState } from 'react';
import { SUMMIT_HERO_IMAGE } from '../data/b2bData';
import { InlineLegalRedBanner } from './LegalRedNoticeModal';
import { MvpDevelopmentBanner } from './MvpDevelopmentBanner';

export interface InvitationRequestData {
  fullName: string;
  companyName: string;
  corporateContact: string;
  role: string;
  sector: string;
  requestedAt: string;
}

interface InvitationGateViewProps {
  onGrantAccess: (requestData?: InvitationRequestData) => void;
  onOpenLegalNotice: (section: string) => void;
  onResetDemo: () => void;
}

export const InvitationGateView: React.FC<InvitationGateViewProps> = ({
  onGrantAccess,
  onOpenLegalNotice,
  onResetDemo,
}) => {
  const [mode, setMode] = useState<'request' | 'code'>('request');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [corporateContact, setCorporateContact] = useState('');
  const [role, setRole] = useState('');
  const [sector, setSector] = useState('SaaS & Tecnología');
  const [inviteCode, setInviteCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const handleQuickFill = () => {
    setFullName('Ing. Alberto Ruiz');
    setCompanyName('Suministros Globales S.A.');
    setCorporateContact('aruiz@suministrosglobales.com · +52 55 4123 8900');
    setRole('Director de Compras & Alianzas');
    setSector('Logística & Fintech');
    setErrorMsg(null);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (
      !fullName.trim() ||
      !companyName.trim() ||
      !corporateContact.trim()
    ) {
      setErrorMsg(
        'Por favor completa tu Nombre, Empresa y Correo o WhatsApp corporativo para solicitar tu invitación.'
      );
      return;
    }

    setRequestSubmitted(true);
  };

  const handleConfirmAndEnter = () => {
    onGrantAccess({
      fullName: fullName.trim() || 'Directivo Invitado',
      companyName: companyName.trim() || 'Empresa Acreditada',
      corporateContact: corporateContact.trim(),
      role: role.trim() || 'Directivo B2B',
      sector,
      requestedAt: new Date().toISOString(),
    });
  };

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleaned = inviteCode.trim().toUpperCase();
    if (!cleaned) {
      setErrorMsg('Ingresa tu código de invitación corporativa.');
      return;
    }
    onGrantAccess();
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-surface text-on-surface font-body-md flex flex-col justify-between">
      {/* Top Persistent MVP Notice */}
      <MvpDevelopmentBanner
        onOpenLegalNotice={onOpenLegalNotice}
        onResetDemo={onResetDemo}
      />

      {/* Minimal Institutional Gate Header (Zero Private Data Exposed) */}
      <header className="w-full bg-surface-container-lowest border-b border-surface-container-high">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-on-primary text-[22px]">
                lock
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-headline-sm text-on-surface tracking-tight">
                  BWOS Conectar B2B
                </span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-label-sm uppercase">
                  Summit 2025
                </span>
              </div>
              <span className="font-label-sm text-on-surface-variant block">
                Acceso Restringido · Directorio Protegido bajo Invitación
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-surface-container-high font-label-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">
                visibility_off
              </span>
              <span>Datos del directorio ocultos sin invitación</span>
            </span>

            <button
              type="button"
              onClick={() =>
                onOpenLegalNotice(
                  'Política de Admisión, Confidencialidad y Reserva de Datos B2B (Pendiente Abogados)'
                )
              }
              className="px-3 py-1.5 rounded-lg bg-[#ffdad6] hover:bg-[#ba1a1a] text-[#93000a] hover:text-white border border-[#ba1a1a]/40 font-label-sm flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                gavel
              </span>
              <span>Abogados (Pendiente)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Centered Gate Content */}
      <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-8 py-8 md:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Institutional Value & Confidentiality Notice */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-fixed text-primary font-label-md font-bold self-start">
              <span className="material-symbols-outlined text-[18px]">
                verified_user
              </span>
              <span>Ecosistema Privado de Negocios B2B</span>
            </div>

            <h1 className="text-[28px] sm:text-[36px] font-extrabold text-on-surface leading-[1.15] tracking-tight">
              Quiero ingresar, solicito invitación
            </h1>

            <p className="font-body-lg text-on-surface-variant leading-relaxed">
              Por seguridad y confidencialidad societaria, las fichas de empresas, ofertas, demandas y salas de videollamada 1-a-1 <strong>permanecen completamente ocultas</strong> hasta contar con una invitación autorizada.
            </p>

            {/* Visual Locked Card Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-surface-container-high shadow-sm bg-inverse-surface">
              <img
                src={SUMMIT_HERO_IMAGE}
                alt="BWOS Summit Privado"
                referrerPolicy="no-referrer"
                className="w-full h-44 object-cover opacity-35 blur-[2px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/75 to-transparent p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-300 font-label-sm uppercase">
                    Contenido Bloqueado
                  </span>
                  <span className="material-symbols-outlined text-white/80 text-[22px]">
                    lock_person
                  </span>
                </div>
                <div>
                  <p className="font-title-md text-white font-bold">
                    0 datos visibles para visitantes no acreditados
                  </p>
                  <p className="font-body-sm text-slate-300 mt-0.5">
                    Solicita tu invitación en el formulario adjunto para desbloquear el Lobby Virtual B2B y las salas Jitsi Meet.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Security Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container-high">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  shield_lock
                </span>
                <p className="font-label-md text-on-surface font-bold mt-1">
                  Reserva Total
                </p>
                <p className="font-body-sm text-on-surface-variant text-[11px]">
                  Sin exposición pública de contactos ni licitaciones.
                </p>
              </div>
              <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container-high">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  handshake
                </span>
                <p className="font-label-sm text-on-surface font-bold mt-1">
                  Filtro Ejecutivo
                </p>
                <p className="font-body-sm text-on-surface-variant text-[11px]">
                  Acceso exclusivo para tomadores de decisión.
                </p>
              </div>
              <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container-high">
                <span className="material-symbols-outlined text-tertiary text-[20px]">
                  videocam
                </span>
                <p className="font-label-sm text-on-surface font-bold mt-1">
                  Salas 1-a-1
                </p>
                <p className="font-body-sm text-on-surface-variant text-[11px]">
                  Videollamadas privadas tras habilitar tu ingreso.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: "Quiero ingresar, solicito invitación" Form Card */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-xl p-6 sm:p-8 flex flex-col gap-6">
            {/* Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container pb-4">
              <div className="flex flex-wrap items-center gap-2 bg-surface-container-low p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMode('request');
                    setErrorMsg(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-title-md text-[14px] transition-all cursor-pointer flex items-center gap-1.5 ${
                    mode === 'request'
                      ? 'bg-primary text-on-primary shadow-xs font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    mail
                  </span>
                  <span>Quiero ingresar, solicito invitación</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('code');
                    setErrorMsg(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-title-md text-[14px] transition-all cursor-pointer flex items-center gap-1.5 ${
                    mode === 'code'
                      ? 'bg-primary text-on-primary shadow-xs font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    key
                  </span>
                  <span>Ya tengo código de invitación</span>
                </button>
              </div>

              {mode === 'request' && !requestSubmitted && (
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="px-3 py-1.5 rounded-lg bg-primary-fixed hover:bg-primary-fixed-dim text-primary font-label-sm font-bold transition-colors cursor-pointer"
                >
                  Autocompletar Demo
                </button>
              )}
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-error-container text-on-error-container border border-error/30 flex items-center gap-2.5 font-body-sm"
              >
                <span className="material-symbols-outlined text-error text-[20px] shrink-0">
                  error
                </span>
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'request' ? (
              requestSubmitted ? (
                <div className="py-6 px-4 bg-surface-container-low/60 rounded-2xl border border-secondary/30 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[34px]">
                      mark_email_read
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 max-w-lg">
                    <span className="font-label-sm uppercase tracking-wider text-secondary font-extrabold">
                      Solicitud de Invitación Registrada
                    </span>
                    <h2 className="font-headline-md text-on-surface">
                      ¡Gracias, {fullName}!
                    </h2>
                    <p className="font-body-md text-on-surface-variant mt-1">
                      Hemos registrado la solicitud de invitación para{' '}
                      <strong>{companyName}</strong> ({corporateContact}).
                    </p>
                  </div>

                  <div className="w-full max-w-md bg-amber-50 border border-amber-300 rounded-xl p-4 text-left flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-amber-900 font-label-md font-bold">
                      <span className="material-symbols-outlined text-[18px]">
                        science
                      </span>
                      <span>Modo Piloto MVP Activo</span>
                    </div>
                    <p className="font-body-sm text-amber-900">
                      Al estar en fase de pruebas MVP, puedes aprobar tu propia invitación inmediatamente para ingresar y visualizar las pantallas del evento:
                    </p>
                    <button
                      type="button"
                      onClick={handleConfirmAndEnter}
                      className="mt-1 w-full py-3 px-5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-md flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        lock_open
                      </span>
                      <span>Activar Invitación Ahora e Ingresar al MVP</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmitRequest}
                  className="flex flex-col gap-4"
                  noValidate
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="inv-name"
                        className="font-label-md text-on-surface font-bold"
                      >
                        Nombre y Apellido Ejecutivo{' '}
                        <span className="text-error">*</span>
                      </label>
                      <input
                        id="inv-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ej. Ing. Alberto Ruiz"
                        className="w-full px-3.5 py-3 rounded-xl bg-surface border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="inv-company"
                        className="font-label-md text-on-surface font-bold"
                      >
                        Empresa / Razón Social{' '}
                        <span className="text-error">*</span>
                      </label>
                      <input
                        id="inv-company"
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ej. Suministros Globales S.A."
                        className="w-full px-3.5 py-3 rounded-xl bg-surface border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="inv-contact"
                        className="font-label-md text-on-surface font-bold"
                      >
                        Correo Corporativo o WhatsApp{' '}
                        <span className="text-error">*</span>
                      </label>
                      <input
                        id="inv-contact"
                        type="text"
                        required
                        value={corporateContact}
                        onChange={(e) => setCorporateContact(e.target.value)}
                        placeholder="director@empresa.com / +56 9..."
                        className="w-full px-3.5 py-3 rounded-xl bg-surface border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="inv-role"
                        className="font-label-md text-on-surface font-bold"
                      >
                        Cargo Directivo
                      </label>
                      <input
                        id="inv-role"
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Ej. CEO / Gerente de Compras"
                        className="w-full px-3.5 py-3 rounded-xl bg-surface border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="inv-sector"
                      className="font-label-md text-on-surface font-bold"
                    >
                      Sector Industrial de Interés
                    </label>
                    <select
                      id="inv-sector"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-surface border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="SaaS & Tecnología">
                        SaaS & Tecnología
                      </option>
                      <option value="Logística & Fintech">
                        Logística & Fintech
                      </option>
                      <option value="Manufactura & Industria 4.0">
                        Manufactura & Industria 4.0
                      </option>
                      <option value="Servicios Corporativos">
                        Servicios Corporativos
                      </option>
                    </select>
                  </div>

                  {/* Red Legal Notice Placeholder for Lawyers */}
                  <InlineLegalRedBanner
                    compact
                    title="Cláusula de Solicitud de Admisión, Confidencialidad y NDA Preliminar (En Blanco para Abogados)"
                    onOpenModal={onOpenLegalNotice}
                  />

                  <button
                    type="submit"
                    className="mt-1 w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-primary-container hover:opacity-95 text-on-primary font-title-md text-[16px] shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      how_to_reg
                    </span>
                    <span>Quiero ingresar, solicito invitación</span>
                  </button>
                </form>
              )
            ) : (
              <form
                onSubmit={handleSubmitCode}
                className="flex flex-col gap-4 py-2"
                noValidate
              >
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="invite-code-input"
                    className="font-label-md text-on-surface font-bold"
                  >
                    Código de Invitación Corporativa
                  </label>
                  <input
                    id="invite-code-input"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Ej. BWOS-2025"
                    className="w-full px-4 py-3.5 rounded-xl bg-surface border border-outline-variant font-headline-sm text-on-surface tracking-widest uppercase focus:outline-none focus:border-primary"
                  />
                  <span className="font-body-sm text-on-surface-variant">
                    Para pruebas del MVP puedes usar el código{' '}
                    <button
                      type="button"
                      onClick={() => setInviteCode('BWOS-2025')}
                      className="text-primary font-bold underline cursor-pointer"
                    >
                      BWOS-2025
                    </button>
                    .
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-md flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    login
                  </span>
                  <span>Validar Invitación e Ingresar</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full bg-surface-container-low border-t border-surface-container-high py-4 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span className="font-body-sm text-on-surface-variant">
            © 2025 BWOS Conectar B2B · Acceso exclusivo bajo invitación verificada.
          </span>
          <button
            type="button"
            onClick={() =>
              onOpenLegalNotice(
                'Términos de Admisión y Confidencialidad de Directorio B2B'
              )
            }
            className="font-label-sm text-[#ba1a1a] hover:underline font-bold cursor-pointer"
          >
            Aviso Legal en Rojo [PENDIENTE DE CONSULTA CON ABOGADOS]
          </button>
        </div>
      </footer>
    </div>
  );
};
