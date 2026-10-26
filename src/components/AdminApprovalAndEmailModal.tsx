import React, { useState } from 'react';
import { ADMIN_EMAIL, CompanyCard } from '../data/b2bData';
import {
  AccessRequestItem,
  EmailJSRuntimeConfig,
  EmailLogItem,
  EmailNotificationPayload,
  EmailNotificationType,
  getCompanyCorporateEmail,
  getEmailJSConfig,
  isEmailJSConfigured,
  saveEmailJSConfig,
} from '../services/emailjsService';

interface AdminApprovalAndEmailModalProps {
  isOpen: boolean;
  initialTab?: 'approvals' | 'compose' | 'logs';
  isAdmin: boolean;
  userEmail: string;
  userName: string;
  userCompany: string;
  companies: CompanyCard[];
  accessRequests: AccessRequestItem[];
  emailLogs: EmailLogItem[];
  onClose: () => void;
  onApproveRequest: (request: AccessRequestItem) => void;
  onRejectRequest: (request: AccessRequestItem) => void;
  onManualAuthorizeEmail: (data: {
    email: string;
    fullName: string;
    companyName: string;
    role: string;
    sector: string;
  }) => void;
  onSendManualEmail: (payload: EmailNotificationPayload) => Promise<void>;
}

export const AdminApprovalAndEmailModal: React.FC<
  AdminApprovalAndEmailModalProps
> = ({
  isOpen,
  initialTab = 'compose',
  isAdmin,
  userEmail,
  userName,
  userCompany,
  companies,
  accessRequests,
  emailLogs,
  onClose,
  onApproveRequest,
  onRejectRequest,
  onManualAuthorizeEmail,
  onSendManualEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'compose' | 'logs'>(
    initialTab
  );

  // Simple Frontend EmailJS Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    companies[0]?.id || ''
  );
  const [notifType, setNotifType] =
    useState<EmailNotificationType>('connection_invite');
  const [toEmail, setToEmail] = useState<string>(
    companies[0]
      ? getCompanyCorporateEmail(companies[0].name)
      : ADMIN_EMAIL
  );
  const [toName, setToName] = useState<string>(
    companies[0]?.representative.name || 'Directivo B2B'
  );
  const [targetCompanyName, setTargetCompanyName] = useState<string>(
    companies[0]?.name || 'Empresa Contraparte'
  );
  const [subject, setSubject] = useState<string>(
    `[BWOS Conectar B2B] Nueva Invitación de Conexión de ${userCompany}`
  );
  const [message, setMessage] = useState<string>(
    `Hola, te escribimos desde ${userCompany} para coordinar una vinculación comercial y reunión 1-a-1 en el marco del Summit BWOS Conectar B2B.`
  );
  const [isSending, setIsSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<string | null>(null);

  // Admin Pre-Authorization Form State
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualRole, setManualRole] = useState('Directivo Autorizado');
  const [manualSector, setManualSector] = useState('SaaS & Tecnología');

  // Optional EmailJS Credentials Panel State (for Admin)
  const [emailConfig, setEmailConfig] = useState<EmailJSRuntimeConfig>(() =>
    getEmailJSConfig()
  );
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  if (!isOpen) return null;

  const pendingCount = accessRequests.filter(
    (r) => r.status === 'pending'
  ).length;

  const handleSelectCompanyPreset = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const found = companies.find((c) => c.id === companyId);
    if (!found) return;
    const corpEmail = getCompanyCorporateEmail(found.name);
    setToEmail(corpEmail);
    setToName(found.representative.name);
    setTargetCompanyName(found.name);

    if (notifType === 'connection_invite') {
      setSubject(
        `[BWOS Conectar B2B] Nueva Invitación de Conexión para ${found.name}`
      );
      setMessage(
        `Estimado/a ${found.representative.name} (${found.name}), revisamos su perfil en el Directorio BWOS Conectar B2B ("${found.demand.badge}") y deseamos establecer contacto directo desde ${userCompany}.`
      );
    } else {
      setSubject(
        `[BWOS Conectar B2B] Solicitud de Reunión 1-a-1 Jitsi con ${found.name}`
      );
      setMessage(
        `Estimado/a ${found.representative.name}, le invitamos a una videollamada privada 1-a-1 mediante Sala Jitsi Meet (https://meet.jit.si/${found.jitsiRoomName}) para evaluar sinergias entre ${userCompany} y ${found.name}.`
      );
    }
  };

  const handleSubmitEmailForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim() || !message.trim()) return;

    setIsSending(true);
    setSendFeedback(null);

    const selectedComp = companies.find((c) => c.id === selectedCompanyId);
    await onSendManualEmail({
      type: notifType,
      toEmail: toEmail.trim(),
      toName: toName.trim() || 'Directivo B2B',
      fromName: userName,
      fromEmail: userEmail,
      companyName: targetCompanyName.trim() || userCompany,
      subject: subject.trim(),
      message: message.trim(),
      jitsiRoomUrl: selectedComp
        ? `https://meet.jit.si/${selectedComp.jitsiRoomName}`
        : 'https://meet.jit.si/BWOS_Conectar_B2B',
      ccAdminEmail: ADMIN_EMAIL,
    });

    setIsSending(false);
    setSendFeedback(
      `Notificación enviada por EmailJS a ${toEmail.trim()} con copia al administrador (${ADMIN_EMAIL}).`
    );
  };

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailJSConfig(emailConfig);
    setConfigSavedNotice(true);
    setTimeout(() => setConfigSavedNotice(false), 2500);
  };

  const handleManualPreAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim() || !manualEmail.includes('@')) return;
    onManualAuthorizeEmail({
      email: manualEmail.trim().toLowerCase(),
      fullName: manualName.trim() || 'Ejecutivo Autorizado',
      companyName: manualCompany.trim() || 'Empresa Invitada B2B',
      role: manualRole.trim() || 'Directivo Comercial',
      sector: manualSector.trim() || 'SaaS & Tecnología',
    });
    setManualEmail('');
    setManualName('');
    setManualCompany('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-surface-container-high">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#161f30] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[22px]">
                forward_to_inbox
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-headline-sm text-white font-extrabold">
                  Centro de Notificaciones EmailJS & Control de Admisión B2B
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-label-sm text-[11px]">
                  {isEmailJSConfigured(emailConfig)
                    ? 'EmailJS API Conectado'
                    : 'Modo Piloto EmailJS Activo'}
                </span>
              </div>
              <p className="text-slate-300 font-body-sm text-[12px]">
                Envío directo desde el frontend para invitaciones de conexión,
                reuniones 1-a-1 y aprobación obligatoria del administrador (
                {ADMIN_EMAIL})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-surface-container-low border-b border-surface-container-high flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('compose')}
              className={`px-3.5 py-2 rounded-xl font-title-md text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'compose'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                send
              </span>
              <span>Formulario de Envío EmailJS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-2 rounded-xl font-title-md text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                mark_email_read
              </span>
              <span>Bandeja de Correos ({emailLogs.length})</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('approvals')}
                className={`px-3.5 py-2 rounded-xl font-title-md text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'approvals'
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  verified_user
                </span>
                <span>Aprobación de Ingresos (OK Admin)</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-label-sm font-extrabold tabular-nums">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowConfigPanel((prev) => !prev)}
              className="mb-2 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface font-label-sm flex items-center gap-1 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                settings
              </span>
              <span>Credenciales EmailJS</span>
            </button>
          )}
        </div>

        {/* Optional Admin EmailJS Credentials Bar */}
        {isAdmin && showConfigPanel && (
          <form
            onSubmit={handleSaveEmailConfig}
            className="px-6 py-3.5 bg-slate-900 text-slate-200 border-b border-slate-700 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-label-md text-amber-300 font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">
                  key
                </span>
                Configuración de Llaves EmailJS (Variables VITE_EMAILJS_* o
                ajuste en vivo)
              </span>
              {configSavedNotice && (
                <span className="text-emerald-400 font-label-sm font-bold">
                  ✓ Configuración guardada
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={emailConfig.serviceId}
                onChange={(e) =>
                  setEmailConfig({ ...emailConfig, serviceId: e.target.value })
                }
                placeholder="Service ID (ej. service_xxx)"
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-body-sm"
              />
              <input
                type="text"
                value={emailConfig.templateId}
                onChange={(e) =>
                  setEmailConfig({
                    ...emailConfig,
                    templateId: e.target.value,
                  })
                }
                placeholder="Template ID (ej. template_xxx)"
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-body-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={emailConfig.publicKey}
                  onChange={(e) =>
                    setEmailConfig({
                      ...emailConfig,
                      publicKey: e.target.value,
                    })
                  }
                  placeholder="Public Key EmailJS"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-body-sm"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-primary text-white font-label-md font-bold cursor-pointer shrink-0"
                >
                  Guardar
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {activeTab === 'compose' && (
            <form
              onSubmit={handleSubmitEmailForm}
              className="flex flex-col gap-4"
            >
              <div className="p-3.5 rounded-xl bg-primary-fixed/40 border border-primary/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                  mail
                </span>
                <div className="text-on-surface font-body-sm">
                  <strong>Formulario Simple de Notificación EmailJS:</strong>{' '}
                  Envía avisos por correo electrónico cuando un usuario recibe
                  una invitación de conexión B2B o una solicitud de reunión
                  1-a-1, con copia automática al administrador (
                  <strong>{ADMIN_EMAIL}</strong>).
                </div>
              </div>

              {sendFeedback && (
                <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#047857]/30 text-[#047857] font-body-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">
                    check_circle
                  </span>
                  <span>{sendFeedback}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-label-md text-on-surface font-bold block mb-1">
                    Tipo de Notificación por Email
                  </label>
                  <select
                    value={notifType}
                    onChange={(e) => {
                      const nextType = e.target.value as EmailNotificationType;
                      setNotifType(nextType);
                      const comp = companies.find(
                        (c) => c.id === selectedCompanyId
                      );
                      if (comp) {
                        if (nextType === 'connection_invite') {
                          setSubject(
                            `[BWOS Conectar B2B] Nueva Invitación de Conexión para ${comp.name}`
                          );
                        } else if (nextType === 'meeting_request') {
                          setSubject(
                            `[BWOS Conectar B2B] Solicitud de Reunión 1-a-1 Jitsi con ${comp.name}`
                          );
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant font-body-md outline-none focus:border-primary"
                  >
                    <option value="connection_invite">
                      🤝 Nueva Invitación de Conexión B2B
                    </option>
                    <option value="meeting_request">
                      📹 Solicitud de Reunión 1-a-1 (Sala Jitsi)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-label-md text-on-surface font-bold block mb-1">
                    Seleccionar Empresa del Directorio
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleSelectCompanyPreset(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant font-body-md outline-none focus:border-primary"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.representative.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-label-md text-on-surface font-bold block mb-1">
                    Correo Destinatario *
                  </label>
                  <input
                    type="email"
                    required
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant font-body-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-label-md text-on-surface font-bold block mb-1">
                    Ejecutivo Destino
                  </label>
                  <input
                    type="text"
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant font-body-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-label-md text-on-surface font-bold block mb-1">
                    Copia Obligatoria Admin (CC)
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={ADMIN_EMAIL}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/60 font-body-sm text-on-surface-variant"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-md text-on-surface font-bold block mb-1">
                  Asunto del Correo *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant font-body-md outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-label-md text-on-surface font-bold block mb-1">
                  Mensaje / Propuesta de Reunión *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-surface border border-outline-variant font-body-md outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low font-title-md text-[14px] cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-md text-[14px] shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    forward_to_inbox
                  </span>
                  <span>
                    {isSending
                      ? 'Enviando vía EmailJS...'
                      : 'Enviar Notificación por EmailJS'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'logs' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-title-md text-on-surface font-bold">
                  Historial de Notificaciones Disparadas por EmailJS
                </h4>
                <span className="font-label-sm text-on-surface-variant tabular-nums">
                  Total enviados: {emailLogs.length}
                </span>
              </div>

              {emailLogs.length === 0 ? (
                <div className="py-12 px-4 rounded-xl bg-surface-container-low border border-surface-container-high text-center flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[32px]">
                    unsubscribe
                  </span>
                  <p className="font-title-md text-on-surface">
                    Aún no se han disparado notificaciones por correo
                  </p>
                  <p className="font-body-sm text-on-surface-variant max-w-md">
                    Cada vez que envíes una invitación de conexión B2B, agendes
                    una reunión 1-a-1 o se gestione una solicitud de ingreso, el
                    registro aparecerá aquí.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {emailLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl bg-surface border border-surface-container-high flex flex-col gap-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-primary-fixed text-primary font-label-sm font-bold">
                            {log.type === 'connection_invite'
                              ? 'Invitación de Conexión'
                              : log.type === 'meeting_request'
                              ? 'Solicitud Reunión 1-a-1'
                              : log.type === 'access_request'
                              ? 'Solicitud de Ingreso'
                              : 'OK de Ingreso (Admin)'}
                          </span>
                          <span className="font-title-md text-on-surface font-bold text-[14px]">
                            {log.subject}
                          </span>
                        </div>
                        <span className="font-label-sm text-on-surface-variant tabular-nums">
                          {new Date(log.sentAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-on-surface-variant">
                        <span>
                          <strong>Para:</strong> {log.toName} ({log.toEmail})
                        </span>
                        <span>
                          <strong>CC Admin:</strong>{' '}
                          {log.ccAdminEmail || ADMIN_EMAIL}
                        </span>
                        <span className="text-secondary font-bold">
                          ✓ {log.statusText}
                        </span>
                      </div>

                      <p className="font-body-sm text-on-surface bg-surface-container-low p-2.5 rounded-lg mt-1">
                        {log.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'approvals' && isAdmin && (
            <div className="flex flex-col gap-5">
              {/* Explanation Banner */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-700 text-[22px] mt-0.5">
                  gpp_maybe
                </span>
                <div className="flex flex-col gap-1">
                  <span className="font-title-md font-bold text-[14px]">
                    Control de Admisión Obligatorio ({ADMIN_EMAIL})
                  </span>
                  <p className="font-body-sm text-amber-900">
                    Ningún usuario puede ingresar a la plataforma (ni por
                    formulario de invitación ni por Ingreso Autorizado) sin
                    recibir tu <strong>"OK / Aprobar Ingreso"</strong> aquí. Al
                    aprobar un correo, se envía un aviso por EmailJS y ese
                    ejecutivo queda habilitado para entrar en la pestaña{' '}
                    <em>Ingreso Autorizado</em>.
                  </p>
                </div>
              </div>

              {/* Quick Pre-Authorize Email Form */}
              <form
                onSubmit={handleManualPreAuth}
                className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-3"
              >
                <span className="font-label-md text-on-surface font-bold">
                  Dar "OK" Directo / Pre-Autorizar un Correo Corporativo
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="correo@empresa.com *"
                    className="px-3 py-2 rounded-lg bg-white border border-outline-variant font-body-sm"
                  />
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Nombre del Ejecutivo"
                    className="px-3 py-2 rounded-lg bg-white border border-outline-variant font-body-sm"
                  />
                  <input
                    type="text"
                    value={manualCompany}
                    onChange={(e) => setManualCompany(e.target.value)}
                    placeholder="Empresa / Razón Social"
                    className="px-3 py-2 rounded-lg bg-white border border-outline-variant font-body-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#047857] hover:bg-[#065f46] text-white font-label-md font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      check_circle
                    </span>
                    <span>Dar OK y Notificar</span>
                  </button>
                </div>
              </form>

              {/* Queue List */}
              <div className="flex flex-col gap-2.5">
                <h4 className="font-title-md text-on-surface font-bold">
                  Solicitudes de Ingreso e Invitación ({accessRequests.length})
                </h4>

                {accessRequests.length === 0 ? (
                  <div className="py-10 px-4 rounded-xl bg-surface border border-surface-container-high text-center text-on-surface-variant font-body-sm">
                    No hay solicitudes de acceso registradas en este momento.
                  </div>
                ) : (
                  accessRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-surface border border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-title-md text-on-surface font-bold">
                            {req.fullName}
                          </span>
                          <span className="text-on-surface-variant font-body-sm">
                            · {req.companyName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-label-sm font-bold ${
                              req.status === 'approved'
                                ? 'bg-[#ECFDF5] text-[#047857]'
                                : req.status === 'rejected'
                                ? 'bg-error-container text-on-error-container'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status === 'approved'
                              ? '✓ OK APROBADO POR ADMIN'
                              : req.status === 'rejected'
                              ? 'RECHAZADO'
                              : '⏳ PENDIENTE DE OK ADMIN'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-on-surface-variant">
                          <span>
                            <strong>Correo:</strong> {req.email}
                          </span>
                          <span>
                            <strong>WhatsApp:</strong> {req.corporateContact}
                          </span>
                          <span>
                            <strong>Sector(es):</strong> {req.sector}
                          </span>
                          <span>
                            <strong>Origen:</strong>{' '}
                            {req.source === 'authorized_login_attempt'
                              ? 'Intento Ingreso Autorizado'
                              : req.source === 'admin_manual'
                              ? 'Pre-autorizado Admin'
                              : 'Formulario de Invitación'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {req.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => onApproveRequest(req)}
                            className="px-3.5 py-2 rounded-xl bg-[#047857] hover:bg-[#065f46] text-white font-label-md font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              done_all
                            </span>
                            <span>Dar OK / Aprobar Ingreso</span>
                          </button>
                        )}
                        {req.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => onRejectRequest(req)}
                            className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-on-surface-variant font-label-md cursor-pointer"
                          >
                            {req.status === 'approved'
                              ? 'Revocar OK'
                              : 'Rechazar'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
