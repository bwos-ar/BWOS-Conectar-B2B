import React, { useState } from 'react';
import { ADMIN_EMAIL, SUMMIT_HERO_IMAGE } from '../data/b2bData';
import { InstitutionalFooter } from './InstitutionalFooter';
import { InlineLegalRedBanner } from './LegalRedNoticeModal';
import { MultiSectorSelector } from './MultiSectorSelector';
import { MvpDevelopmentBanner } from './MvpDevelopmentBanner';

export interface InvitationRequestData {
  fullName: string;
  companyName: string;
  email: string;
  corporateContact: string;
  role: string;
  sector: string;
  sectorsList?: string[];
  requestedAt: string;
  isAdmin: boolean;
}

interface InvitationGateViewProps {
  onGrantAccess: (requestData: InvitationRequestData) => void;
  onOpenLegalNotice: (section: string) => void;
  onResetDemo: () => void;
}

export const InvitationGateView: React.FC<InvitationGateViewProps> = ({
  onGrantAccess,
  onOpenLegalNotice,
  onResetDemo,
}) => {
  const [mode, setMode] = useState<'request' | 'authorized'>('request');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [corporateContact, setCorporateContact] = useState('');
  const [role, setRole] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([
    'SaaS & Tecnología',
  ]);
  const [authorizedEmail, setAuthorizedEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const isEnteredAdmin =
    email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    const combinedSectorLabel =
      selectedSectors.length > 0
        ? selectedSectors.join(' · ')
        : 'SaaS & Tecnología';

    // If administrator email is entered, grant immediate admin access
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      onGrantAccess({
        fullName: fullName.trim() || 'Administrador BWOS',
        companyName: companyName.trim() || 'Dirección General BWOS',
        email: cleanEmail,
        corporateContact: corporateContact.trim() || cleanEmail,
        role: role.trim() || 'Administrador General',
        sector: combinedSectorLabel,
        sectorsList: selectedSectors,
        requestedAt: new Date().toISOString(),
        isAdmin: true,
      });
      return;
    }

    if (!fullName.trim() || !companyName.trim() || !corporateContact.trim()) {
      setErrorMsg(
        'Por favor completa tu Nombre, Empresa, Correo Corporativo y WhatsApp para enviar tu solicitud de invitación.'
      );
      return;
    }

    if (selectedSectors.length === 0) {
      setErrorMsg(
        'Por favor selecciona al menos 1 sector industrial de interés (máximo 2).'
      );
      return;
    }

    // Save request in localStorage queue and show pending verification state (do NOT expose directory data)
    try {
      const existing = JSON.parse(
        localStorage.getItem('bwos_b2b_pending_invitations_v1') || '[]'
      );
      existing.push({
        fullName: fullName.trim(),
        companyName: companyName.trim(),
        email: cleanEmail,
        corporateContact: corporateContact.trim(),
        role: role.trim(),
        sector: combinedSectorLabel,
        sectorsList: selectedSectors,
        requestedAt: new Date().toISOString(),
      });
      localStorage.setItem(
        'bwos_b2b_pending_invitations_v1',
        JSON.stringify(existing)
      );
    } catch {
      // ignore storage errors
    }

    setRequestSubmitted(true);
  };

  const handleAuthorizedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanAuth = authorizedEmail.trim().toLowerCase();
    if (!cleanAuth) {
      setErrorMsg('Por favor ingresa tu correo autorizado de acceso.');
      return;
    }

    if (cleanAuth !== ADMIN_EMAIL.toLowerCase()) {
      setErrorMsg(
        'Este correo aún no cuenta con invitación activa o permisos de administrador. Por favor solicita tu invitación en la pestaña "Quiero ingresar, solicito invitación".'
      );
      return;
    }

    onGrantAccess({
      fullName: 'Administrador BWOS',
      companyName: 'Dirección General BWOS',
      email: cleanAuth,
      corporateContact: cleanAuth,
      role: 'Administrador General',
      sector: 'SaaS & Tecnología',
      sectorsList: ['SaaS & Tecnología'],
      requestedAt: new Date().toISOString(),
      isAdmin: true,
    });
  };

  return (
    <div className="min-h-screen w-full bg-surface text-on-surface font-body-md flex flex-col justify-between">
      {/* Top Persistent MVP Notice */}
      <MvpDevelopmentBanner
        isAdmin={false}
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
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
                    Completa tu solicitud de invitación en el formulario adjunto para revisión del comité de admisión B2B.
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
                <p className="font-label-md text-on-surface font-bold mt-1">
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
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-xl p-6 sm:p-8 flex flex-col gap-5">
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
                    setMode('authorized');
                    setErrorMsg(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-title-md text-[14px] transition-all cursor-pointer flex items-center gap-1.5 ${
                    mode === 'authorized'
                      ? 'bg-primary text-on-primary shadow-xs font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    admin_panel_settings
                  </span>
                  <span>Ingreso Autorizado</span>
                </button>
              </div>
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
                <div className="py-8 px-5 bg-surface-container-low/60 rounded-2xl border border-secondary/30 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[34px]">
                      mark_email_read
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 max-w-lg">
                    <span className="font-label-sm uppercase tracking-wider text-secondary font-extrabold">
                      Solicitud en Revisión por el Comité B2B
                    </span>
                    <h2 className="font-headline-md text-on-surface">
                      ¡Gracias por tu solicitud, {fullName}!
                    </h2>
                    <p className="font-body-md text-on-surface-variant mt-1">
                      Hemos registrado la solicitud de admisión para{' '}
                      <strong>{companyName}</strong> ({email}) en el/los
                      sector(es):{' '}
                      <strong>{selectedSectors.join(', ')}</strong>. Nuestro
                      equipo validará los antecedentes corporativos y enviará tu
                      habilitación de acceso al correo registrado.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRequestSubmitted(false);
                      setFullName('');
                      setCompanyName('');
                      setEmail('');
                      setCorporateContact('');
                      setRole('');
                    }}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md font-bold transition-colors cursor-pointer"
                  >
                    Enviar otra solicitud
                  </button>
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
                        placeholder="Nombre completo"
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
                        placeholder="Razón social de la empresa"
                        className="w-full px-3.5 py-3 rounded-xl bg-surface border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="inv-email"
                        className="font-label-md text-on-surface font-bold"
                      >
                        Correo Electrónico Corporativo{' '}
                        <span className="text-error">*</span>
                      </label>
                      <input
                        id="inv-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@empresa.com"
                        className="w-full px-3.5 py-3 rounded-xl bg-surface border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="inv-contact"
                        className="font-label-md text-on-surface font-bold"
                      >
                        WhatsApp Empresarial{' '}
                        <span className="text-error">*</span>
                      </label>
                      <input
                        id="inv-contact"
                        type="tel"
                        required
                        value={corporateContact}
                        onChange={(e) => setCorporateContact(e.target.value)}
                        placeholder="+56 9 / +52 55..."
                        className="w-full px-3.5 py-3 rounded-xl bg-surface border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
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
                      placeholder="Ej. CEO / Director de Compras"
                      className="w-full px-3.5 py-3 rounded-xl bg-surface border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Multi-Sector Selector (Up to 2 sectors + "Otro" with 20-char limit & comma support) */}
                  <MultiSectorSelector
                    selectedSectors={selectedSectors}
                    onChange={(sectors) => setSelectedSectors(sectors)}
                    label="Sector Industrial de Interés (Selecciona hasta 2)"
                  />

                  {isEnteredAdmin && (
                    <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary font-body-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">
                        verified
                      </span>
                      <span>
                        Cuenta de Administrador reconocida (
                        <strong>{ADMIN_EMAIL}</strong>). Al enviar ingresarás
                        directamente al panel completo.
                      </span>
                    </div>
                  )}

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
                onSubmit={handleAuthorizedLogin}
                className="flex flex-col gap-4 py-2"
                noValidate
              >
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="authorized-email-input"
                    className="font-label-md text-on-surface font-bold"
                  >
                    Correo Electrónico Autorizado / Administrador
                  </label>
                  <input
                    id="authorized-email-input"
                    type="email"
                    required
                    value={authorizedEmail}
                    onChange={(e) => setAuthorizedEmail(e.target.value)}
                    placeholder="Ingresa tu correo corporativo autorizado"
                    className="w-full px-4 py-3.5 rounded-xl bg-surface border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary"
                  />
                  <span className="font-body-sm text-on-surface-variant">
                    El acceso directo está reservado exclusivamente para cuentas con invitación aprobada o administración del sistema.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-md flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    login
                  </span>
                  <span>Validar Credencial e Ingresar</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Dark 4-Column Institutional Footer (Image 2) */}
      <InstitutionalFooter
        hasAccess={false}
        onOpenLegalNotice={onOpenLegalNotice}
        onProtectedLinkClick={() => {
          setErrorMsg(
            'El acceso al Directorio BW2, Conexiones, Agenda y Salas Virtuales requiere invitación aprobada. Solicita tu invitación en el formulario.'
          );
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
