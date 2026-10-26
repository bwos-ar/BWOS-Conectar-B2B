import React, { useState } from 'react';
import {
  ADMIN_EMAIL,
  ADMIN_USERS,
  SECONDARY_ADMIN_EMAIL,
  SUMMIT_HERO_IMAGE,
  isAdminEmail,
} from '../data/b2bData';
import {
  AccessRequestItem,
  buildAdminApprovalUrl,
  buildAdminRejectUrl,
  findAccessRequestByEmail,
  generateOneTimeApprovalToken,
  sendB2BEmailNotification,
  upsertAccessRequest,
} from '../services/emailjsService';
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
  accessRequests: AccessRequestItem[];
  onRefreshRequests: () => void;
  onGrantAccess: (requestData: InvitationRequestData) => void;
  onOpenLegalNotice: (section: string) => void;
  onResetDemo: () => void;
}

export const InvitationGateView: React.FC<InvitationGateViewProps> = ({
  accessRequests,
  onRefreshRequests,
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
  const [authorizedFullName, setAuthorizedFullName] = useState('');
  const [authorizedEmail, setAuthorizedEmail] = useState('');
  const [authorizedCompany, setAuthorizedCompany] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingStatusNotice, setPendingStatusNotice] = useState<{
    email: string;
    companyName: string;
    message: string;
  } | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const isEnteredAdmin = isAdminEmail(email);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPendingStatusNotice(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Por favor ingresa un correo electrónico corporativo válido.');
      return;
    }

    const combinedSectorLabel =
      selectedSectors.length > 0
        ? selectedSectors.join(' · ')
        : 'SaaS & Tecnología';

    // Administrator accounts (clientesbinweb@gmail.com and somosbwos@gmail.com) enter directly to Dashboard Admin
    if (isAdminEmail(cleanEmail)) {
      const adminPreset = ADMIN_USERS[cleanEmail];
      const finalAdminName =
        fullName.trim() || adminPreset?.fullName || 'Administrador BWOS';
      const finalAdminCompany =
        companyName.trim() ||
        adminPreset?.companyName ||
        'BWOS | Sitios Web & Merch';

      if (!finalAdminName || !finalAdminCompany) {
        setErrorMsg(
          'Por favor indica Nombre y Apellido, Empresa y Correo Electrónico para ingresar al Dashboard Administrador.'
        );
        return;
      }

      onGrantAccess({
        fullName: finalAdminName,
        companyName: finalAdminCompany,
        email: cleanEmail,
        corporateContact: corporateContact.trim() || cleanEmail,
        role:
          role.trim() ||
          adminPreset?.role ||
          'Administrador de Admisiones B2B',
        sector: combinedSectorLabel,
        sectorsList: selectedSectors,
        requestedAt: new Date().toISOString(),
        isAdmin: true,
      });
      return;
    }

    if (!fullName.trim() || !companyName.trim() || !corporateContact.trim()) {
      setErrorMsg(
        'Por favor completa tu Nombre y Apellido, Empresa, Correo Corporativo y WhatsApp para solicitar la aprobación del administrador.'
      );
      return;
    }

    if (selectedSectors.length === 0) {
      setErrorMsg(
        'Por favor selecciona al menos 1 sector industrial de interés (máximo 2).'
      );
      return;
    }

    setIsSendingEmail(true);

    // Generate single-use approval token & link ({{Aceptar a quien solicitó invitación}})
    const freshToken = generateOneTimeApprovalToken();
    const { approvalUrl } = buildAdminApprovalUrl({
      email: cleanEmail,
      fullName: fullName.trim(),
      companyName: companyName.trim(),
      corporateContact: corporateContact.trim(),
      role: role.trim() || 'Directivo B2B',
      sector: combinedSectorLabel,
      oneTimeToken: freshToken,
    });
    const rejectUrl = buildAdminRejectUrl({
      email: cleanEmail,
      fullName: fullName.trim(),
      companyName: companyName.trim(),
      oneTimeToken: freshToken,
    });

    // 1. Register in Mandatory Admin Approval Queue with single-use token
    const savedReq = upsertAccessRequest({
      fullName: fullName.trim(),
      companyName: companyName.trim(),
      email: cleanEmail,
      corporateContact: corporateContact.trim(),
      role: role.trim() || 'Directivo B2B',
      sector: combinedSectorLabel,
      sectorsList: selectedSectors,
      source: 'invitation_form',
      oneTimeToken: freshToken,
      tokenUsed: false,
    });

    // 2. Dispatch EmailJS notification to Administrator (clientesbinweb@gmail.com) with single-use approval link
    await sendB2BEmailNotification({
      type: 'access_request',
      toEmail: ADMIN_EMAIL,
      toName: 'Administrador General BWOS',
      fromName: fullName.trim(),
      fromEmail: cleanEmail,
      companyName: companyName.trim(),
      subject: `[SOLICITUD DE INGRESO B2B - REQUIERE OK ADMIN] ${companyName.trim()} (${cleanEmail})`,
      message: `El ejecutivo ${fullName.trim()} (${
        role.trim() || 'Directivo'
      }) de la empresa "${companyName.trim()}" ha solicitado invitación en los sectores [${combinedSectorLabel}]. WhatsApp: ${corporateContact.trim()}. Correo: ${cleanEmail}.\n\n✅ Aceptar a quien solicitó invitación (Link de único uso):\n${approvalUrl}\n\n❌ Rechazar solicitud:\n${rejectUrl}`,
      jitsiRoomUrl: approvalUrl,
      approvalUrl,
      oneTimeToken: freshToken,
      rejectUrl,
      ccAdminEmail: ADMIN_EMAIL,
    });

    onRefreshRequests();
    setIsSendingEmail(false);

    // If Admin had ALREADY approved this email earlier, grant access
    if (savedReq.status === 'approved') {
      onGrantAccess({
        fullName: savedReq.fullName,
        companyName: savedReq.companyName,
        email: savedReq.email,
        corporateContact: savedReq.corporateContact,
        role: savedReq.role,
        sector: savedReq.sector,
        sectorsList: savedReq.sectorsList,
        requestedAt: savedReq.requestedAt,
        isAdmin: false,
      });
      return;
    }

    setRequestSubmitted(true);
  };

  const handleAuthorizedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPendingStatusNotice(null);

    const cleanAuth = authorizedEmail.trim().toLowerCase();
    if (!cleanAuth || !cleanAuth.includes('@')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    // 1. Administrator Accounts (clientesbinweb@gmail.com or somosbwos@gmail.com)
    if (isAdminEmail(cleanAuth)) {
      const adminPreset = ADMIN_USERS[cleanAuth];
      const resolvedName =
        authorizedFullName.trim() || adminPreset?.fullName || '';
      const resolvedCompany =
        authorizedCompany.trim() || adminPreset?.companyName || '';

      if (!resolvedName || !resolvedCompany) {
        setErrorMsg(
          'Por favor indica tu Nombre y Apellido, Empresa y Correo Electrónico para ingresar al Dashboard Administrador.'
        );
        return;
      }

      onGrantAccess({
        fullName: resolvedName,
        companyName: resolvedCompany,
        email: cleanAuth,
        corporateContact: cleanAuth,
        role: adminPreset?.role || 'Administrador de Admisiones B2B',
        sector: 'SaaS & Tecnología',
        sectorsList: ['SaaS & Tecnología'],
        requestedAt: new Date().toISOString(),
        isAdmin: true,
      });
      return;
    }

    // 2. Check if the user has received the mandatory "OK" ('approved') from an administrator
    const existingReq =
      accessRequests.find((r) => r.email.toLowerCase() === cleanAuth) ||
      findAccessRequestByEmail(cleanAuth);

    if (existingReq && existingReq.status === 'approved') {
      // Admin has granted OK! Allow entry and update Name/Company if provided
      onGrantAccess({
        fullName: authorizedFullName.trim() || existingReq.fullName,
        companyName: authorizedCompany.trim() || existingReq.companyName,
        email: existingReq.email,
        corporateContact: existingReq.corporateContact,
        role: existingReq.role,
        sector: existingReq.sector,
        sectorsList: existingReq.sectorsList,
        requestedAt: existingReq.requestedAt,
        isAdmin: false,
      });
      return;
    }

    if (existingReq && existingReq.status === 'rejected') {
      setErrorMsg(
        `El acceso para ${cleanAuth} fue denegado o revocado por el administrador (${ADMIN_EMAIL} / ${SECONDARY_ADMIN_EMAIL}). Sin el OK del administrador no es posible ingresar.`
      );
      return;
    }

    if (!authorizedFullName.trim() || !authorizedCompany.trim()) {
      setErrorMsg(
        'Por favor indica tu Nombre y Apellido, Empresa y Correo Electrónico para enviar o validar tu pedido de invitación en el Dashboard Admin.'
      );
      return;
    }

    // 3. If not approved yet (either pending or new authorized login attempt):
    // Register/update the request in pending state with a fresh single-use token and notify admins via EmailJS + Admin Dashboard
    setIsSendingEmail(true);

    const companyLabel =
      authorizedCompany.trim() ||
      existingReq?.companyName ||
      'Empresa Solicitante (Ingreso Autorizado)';
    const applicantName =
      authorizedFullName.trim() ||
      existingReq?.fullName ||
      cleanAuth.split('@')[0];
    const applicantRole = existingReq?.role || 'Ejecutivo B2B';
    const applicantSector = existingReq?.sector || 'SaaS & Tecnología';
    const applicantContact =
      existingReq?.corporateContact || 'Pendiente validar';

    const freshToken = generateOneTimeApprovalToken();
    const { approvalUrl } = buildAdminApprovalUrl({
      email: cleanAuth,
      fullName: applicantName,
      companyName: companyLabel,
      corporateContact: applicantContact,
      role: applicantRole,
      sector: applicantSector,
      oneTimeToken: freshToken,
    });
    const rejectUrl = buildAdminRejectUrl({
      email: cleanAuth,
      fullName: applicantName,
      companyName: companyLabel,
      oneTimeToken: freshToken,
    });

    upsertAccessRequest({
      fullName: applicantName,
      companyName: companyLabel,
      email: cleanAuth,
      corporateContact: applicantContact,
      role: applicantRole,
      sector: applicantSector,
      sectorsList: existingReq?.sectorsList || ['SaaS & Tecnología'],
      source: existingReq?.source || 'authorized_login_attempt',
      status: 'pending',
      oneTimeToken: freshToken,
      tokenUsed: false,
    });

    await sendB2BEmailNotification({
      type: 'access_request',
      toEmail: ADMIN_EMAIL,
      toName: 'Administrador General BWOS',
      fromName: applicantName,
      fromEmail: cleanAuth,
      companyName: companyLabel,
      subject: `[INGRESO AUTORIZADO RETENIDO - REQUIERE OK ADMIN] ${cleanAuth}`,
      message: `El correo ${cleanAuth} (${companyLabel}) intentó ingresar por "Ingreso Autorizado". El acceso permanece bloqueado hasta que otorgues tu "OK / Aprobar Ingreso" obligatorio desde la cuenta administradora (${ADMIN_EMAIL}).\n\n✅ Aceptar a quien solicitó invitación (Link de único uso):\n${approvalUrl}\n\n❌ Rechazar solicitud:\n${rejectUrl}`,
      jitsiRoomUrl: approvalUrl,
      approvalUrl,
      oneTimeToken: freshToken,
      rejectUrl,
      ccAdminEmail: ADMIN_EMAIL,
    });

    onRefreshRequests();
    setIsSendingEmail(false);

    setPendingStatusNotice({
      email: cleanAuth,
      companyName: companyLabel,
      message: `Sin el "OK" obligatorio del administrador (${ADMIN_EMAIL}) no puedes ingresar. Hemos enviado una notificación por EmailJS al administrador con un enlace de único uso para aceptar tu invitación (${cleanAuth}). Una vez que el administrador dé el OK, podrás ingresar aquí.`,
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
                Acceso por Aceptación Obligatoria del Administrador (
                {ADMIN_EMAIL})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-surface-container-high font-label-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">
                verified_user
              </span>
              <span>Requiere OK del Administrador para ingresar</span>
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
          {/* Left Column: Institutional Value & Mandatory Admin Approval Notice */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-fixed text-primary font-label-md font-bold self-start">
              <span className="material-symbols-outlined text-[18px]">
                admin_panel_settings
              </span>
              <span>Admisión Controlada por Administrador</span>
            </div>

            <h1 className="text-[28px] sm:text-[36px] font-extrabold text-on-surface leading-[1.15] tracking-tight">
              Quiero ingresar, solicito invitación
            </h1>

            <p className="font-body-lg text-on-surface-variant leading-relaxed">
              En fase de producción piloto, el ingreso a la plataforma —tanto
              por <strong>formulario de invitación</strong> como por{' '}
              <strong>Ingreso Autorizado</strong>— requiere la{' '}
              <strong>
                respuesta y aprobación obligatoria ("OK") del administrador (
                {ADMIN_EMAIL})
              </strong>
              . Sin ese OK, ningún dato del directorio es visible.
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
                    Bloqueado hasta OK del Administrador
                  </span>
                  <span className="material-symbols-outlined text-white/80 text-[22px]">
                    lock_person
                  </span>
                </div>
                <div>
                  <p className="font-title-md text-white font-bold">
                    0 datos visibles sin aceptación de {ADMIN_EMAIL}
                  </p>
                  <p className="font-body-sm text-slate-300 mt-0.5">
                    Toda solicitud envía un aviso automático por EmailJS al
                    administrador y aguarda su confirmación para habilitar el
                    ingreso.
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
                  OK Obligatorio
                </p>
                <p className="font-body-sm text-on-surface-variant text-[11px]">
                  Validación previa por {ADMIN_EMAIL}.
                </p>
              </div>
              <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container-high">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  forward_to_inbox
                </span>
                <p className="font-label-md text-on-surface font-bold mt-1">
                  Aviso EmailJS
                </p>
                <p className="font-body-sm text-on-surface-variant text-[11px]">
                  Notificación en vivo de solicitudes y reuniones.
                </p>
              </div>
              <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container-high">
                <span className="material-symbols-outlined text-tertiary text-[20px]">
                  videocam
                </span>
                <p className="font-label-md text-on-surface font-bold mt-1">
                  Salas 1-a-1
                </p>
                <p className="font-body-sm text-on-surface-variant text-[11px]">
                  Videollamadas Jitsi tras aprobar tu ingreso.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Form Card */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-xl p-6 sm:p-8 flex flex-col gap-5">
            {/* Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container pb-4">
              <div className="flex flex-wrap items-center gap-2 bg-surface-container-low p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMode('request');
                    setErrorMsg(null);
                    setPendingStatusNotice(null);
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
                    setPendingStatusNotice(null);
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
                  <span>Ingreso Autorizado (Con OK Admin)</span>
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

            {pendingStatusNotice && (
              <div
                role="status"
                className="p-4 rounded-xl bg-amber-50 border border-amber-400 text-amber-950 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 font-title-md font-bold text-amber-900">
                  <span className="material-symbols-outlined text-amber-700 text-[22px]">
                    hourglass_top
                  </span>
                  <span>
                    Ingreso Retenido · Requiere "OK" Obligatorio del
                    Administrador
                  </span>
                </div>
                <p className="font-body-sm text-amber-900 leading-relaxed">
                  {pendingStatusNotice.message}
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2 text-[12px] text-amber-800 font-bold">
                  <span>• Cuenta evaluada: {pendingStatusNotice.email}</span>
                  <span>• Estado actual: PENDIENTE DE OK ({ADMIN_EMAIL})</span>
                </div>
              </div>
            )}

            {mode === 'request' ? (
              requestSubmitted ? (
                <div className="py-8 px-5 bg-surface-container-low/60 rounded-2xl border border-secondary/30 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[34px]">
                      forward_to_inbox
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 max-w-lg">
                    <span className="font-label-sm uppercase tracking-wider text-amber-700 font-extrabold">
                      Notificación EmailJS Enviada · Esperando OK Obligatorio
                      del Administrador
                    </span>
                    <h2 className="font-headline-md text-on-surface">
                      Solicitud registrada para {companyName}
                    </h2>
                    <p className="font-body-md text-on-surface-variant mt-1">
                      Hemos enviado tu solicitud por <strong>EmailJS</strong> al
                      administrador (<strong>{ADMIN_EMAIL}</strong>) para el
                      correo <strong>{email}</strong> en el/los sector(es):{' '}
                      <strong>{selectedSectors.join(', ')}</strong>.
                    </p>
                    <p className="font-body-sm text-on-surface bg-amber-50 border border-amber-300 rounded-xl p-3 mt-2">
                      <strong>Importante:</strong> Sin la respuesta y aceptación
                      ("OK") del administrador <strong>{ADMIN_EMAIL}</strong>,
                      no es posible ingresar. Una vez que el administrador dé el
                      OK a tu cuenta, podrás entrar desde la pestaña{' '}
                      <strong>"Ingreso Autorizado"</strong>.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthorizedEmail(email.trim());
                        setMode('authorized');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-bold transition-colors cursor-pointer"
                    >
                      Ir a Verificar en Ingreso Autorizado
                    </button>
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
                      className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md font-bold transition-colors cursor-pointer"
                    >
                      Enviar otra solicitud
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
                        <strong>{email.trim().toLowerCase()}</strong>). Al
                        enviar ingresarás directamente al{' '}
                        <strong>Dashboard de Administración</strong> para
                        recibir y aprobar los pedidos de invitación.
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
                    disabled={isSendingEmail}
                    className="mt-1 w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-primary-container hover:opacity-95 text-on-primary font-title-md text-[16px] shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      how_to_reg
                    </span>
                    <span>
                      {isSendingEmail
                        ? 'Enviando solicitud al Dashboard Admin y EmailJS...'
                        : isEnteredAdmin
                        ? 'Ingresar al Dashboard Administrador'
                        : 'Quiero ingresar, solicito invitación'}
                    </span>
                  </button>
                </form>
              )
            ) : (
              <form
                onSubmit={handleAuthorizedLogin}
                className="flex flex-col gap-4 py-2"
                noValidate
              >
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                      verified_user
                    </span>
                    <div className="font-body-sm text-on-surface-variant">
                      <strong>
                        Ingreso Autorizado y Acceso al Dashboard Admin:
                      </strong>{' '}
                      Indica tu <strong>Nombre y Apellido</strong>,{' '}
                      <strong>Empresa</strong> y{' '}
                      <strong>Correo Electrónico</strong>. Las cuentas
                      administradoras (<strong>{SECONDARY_ADMIN_EMAIL}</strong>{' '}
                      y <strong>{ADMIN_EMAIL}</strong>) ingresan directamente al{' '}
                      <strong>Dashboard de Administración</strong> para recibir
                      y aprobar allí mismo los pedidos de invitación.
                    </div>
                  </div>

                  {/* Quick-Fill Buttons for Admin Accounts */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-surface-container-high">
                    <span className="font-label-sm text-on-surface-variant font-bold">
                      Acceso Rápido Admin:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const preset = ADMIN_USERS[SECONDARY_ADMIN_EMAIL];
                        setAuthorizedFullName(preset.fullName);
                        setAuthorizedCompany(preset.companyName);
                        setAuthorizedEmail(preset.email);
                        setErrorMsg(null);
                      }}
                      className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-on-primary font-label-sm font-bold transition-colors cursor-pointer"
                    >
                      Cargar {SECONDARY_ADMIN_EMAIL}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const preset = ADMIN_USERS[ADMIN_EMAIL];
                        setAuthorizedFullName(preset.fullName);
                        setAuthorizedCompany(preset.companyName);
                        setAuthorizedEmail(preset.email);
                        setErrorMsg(null);
                      }}
                      className="px-3 py-1 rounded-lg bg-surface-container-high hover:bg-primary text-on-surface hover:text-on-primary font-label-sm font-bold transition-colors cursor-pointer"
                    >
                      Cargar {ADMIN_EMAIL}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="authorized-name-input"
                      className="font-label-md text-on-surface font-bold"
                    >
                      Nombre y Apellido <span className="text-error">*</span>
                    </label>
                    <input
                      id="authorized-name-input"
                      type="text"
                      required
                      value={authorizedFullName}
                      onChange={(e) => setAuthorizedFullName(e.target.value)}
                      placeholder="Nombre y apellido completo"
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="authorized-company-input"
                      className="font-label-md text-on-surface font-bold"
                    >
                      Empresa / Razón Social{' '}
                      <span className="text-error">*</span>
                    </label>
                    <input
                      id="authorized-company-input"
                      type="text"
                      required
                      value={authorizedCompany}
                      onChange={(e) => setAuthorizedCompany(e.target.value)}
                      placeholder="Nombre de tu empresa"
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="authorized-email-input"
                    className="font-label-md text-on-surface font-bold"
                  >
                    Correo Electrónico <span className="text-error">*</span>
                  </label>
                  <input
                    id="authorized-email-input"
                    type="email"
                    required
                    value={authorizedEmail}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAuthorizedEmail(val);
                      const cleanVal = val.trim().toLowerCase();
                      if (ADMIN_USERS[cleanVal]) {
                        if (!authorizedFullName.trim()) {
                          setAuthorizedFullName(ADMIN_USERS[cleanVal].fullName);
                        }
                        if (!authorizedCompany.trim()) {
                          setAuthorizedCompany(
                            ADMIN_USERS[cleanVal].companyName
                          );
                        }
                      }
                    }}
                    placeholder="Ej. somosbwos@gmail.com o tu correo corporativo"
                    className="w-full px-4 py-3.5 rounded-xl bg-surface border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                {isAdminEmail(authorizedEmail) && (
                  <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary font-body-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">
                      admin_panel_settings
                    </span>
                    <span>
                      Acceso de Administrador detectado para{' '}
                      <strong>{authorizedEmail.trim().toLowerCase()}</strong> (
                      {authorizedFullName || 'Asesor Digital BWOS'} ·{' '}
                      {authorizedCompany || 'BWOS | Sitios Web & Merch'}).
                      Ingresarás directo al{' '}
                      <strong>Dashboard de Administración</strong>.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-md flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    login
                  </span>
                  <span>
                    {isSendingEmail
                      ? 'Verificando autorización con Administrador...'
                      : isAdminEmail(authorizedEmail)
                      ? 'Ingresar al Dashboard Administrador'
                      : 'Validar OK del Administrador e Ingresar'}
                  </span>
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
            `El acceso al Directorio BW2, Conexiones, Agenda y Salas Virtuales requiere invitación con el OK obligatorio del administrador (${ADMIN_EMAIL}).`
          );
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
