import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ADMIN_EMAIL,
  CompanyCard,
  MeetingItem,
  SECONDARY_ADMIN_EMAIL,
} from '../data/b2bData';
import {
  AccessRequestItem,
  DAY_OF_WEEK_LABELS,
  EmailJSRuntimeConfig,
  EmailLogItem,
  EmailNotificationPayload,
  EmailNotificationType,
  WeeklyReportSchedule,
  buildAdminApprovalUrl,
  buildAdminRejectUrl,
  buildWeeklyMetricsEmailPayload,
  generateOneTimeApprovalToken,
  getCompanyCorporateEmail,
  getCurrentSessionInstanceId,
  getEmailJSConfig,
  getIssuedMagicLoginTokens,
  getNextWeeklyReportDate,
  getUsedMagicLoginTokens,
  isApprovalTokenUsed,
  isEmailJSConfigured,
  isMagicLoginTokenUsed,
  recordMagicTokenReuseAttempt,
  saveEmailJSConfig,
  subscribeAdminTokenSecurityEvents,
  upsertAccessRequest,
  validateActiveAdminSessionTokenState,
  validateAndConsumeAdminMagicToken,
  verifyAdminDashboardSessionToken,
} from '../services/emailjsService';
import { B2B_SECTOR_OPTIONS } from './MultiSectorSelector';

interface AdminDashboardViewProps {
  isAdmin: boolean;
  verifiedSessionToken?: string | null;
  consumedMagicToken?: string | null;
  onInvalidSessionDetected?: (reason: string) => void;
  adminUser?: {
    fullName: string;
    companyName: string;
    email: string;
  };
  companies: CompanyCard[];
  meetings: MeetingItem[];
  accessRequests: AccessRequestItem[];
  emailLogs: EmailLogItem[];
  weeklySchedule: WeeklyReportSchedule;
  onUpdateWeeklySchedule: (schedule: WeeklyReportSchedule) => void;
  onSendWeeklyReportNow: () => Promise<void>;
  onApproveRequest: (req: AccessRequestItem) => void;
  onRejectRequest: (req: AccessRequestItem) => void;
  onDeleteRequest: (reqId: string) => void;
  onManualAuthorizeEmail: (data: {
    email: string;
    fullName: string;
    companyName: string;
    role: string;
    sector: string;
  }) => void;
  onSendManualEmail: (payload: EmailNotificationPayload) => Promise<void>;
  onClearEmailLogs: () => void;
  onRefreshRequests?: () => void;
  onTriggerIncomingCall: () => void;
  onOpenPublishModal: () => void;
  onResetDemoData: () => void;
  onNavigateToLobby: () => void;
}

type DashboardTab = 'requests' | 'email-logs' | 'system-metrics';

const BAR_COLORS = ['#004ac6', '#047857', '#2563eb', '#0d9488'];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  isAdmin,
  verifiedSessionToken,
  consumedMagicToken,
  onInvalidSessionDetected,
  adminUser,
  companies,
  meetings,
  accessRequests,
  emailLogs,
  weeklySchedule,
  onUpdateWeeklySchedule,
  onSendWeeklyReportNow,
  onApproveRequest,
  onRejectRequest,
  onDeleteRequest,
  onManualAuthorizeEmail,
  onSendManualEmail,
  onClearEmailLogs,
  onRefreshRequests,
  onTriggerIncomingCall,
  onOpenPublishModal,
  onResetDemoData,
  onNavigateToLobby,
}) => {
  // 3-Tab View State (Default: Tab 1 'requests' as confirmed by user)
  const [activeTab, setActiveTab] = useState<DashboardTab>('requests');

  // Tab 1: Access Requests Filter & Search
  const [reqStatusFilter, setReqStatusFilter] = useState<
    'pending' | 'all' | 'approved' | 'rejected'
  >('pending');
  const [reqSearch, setReqSearch] = useState('');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Tab 1: Manual Pre-Authorization Form State
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualRole] = useState('Directivo Autorizado');
  const [manualSector, setManualSector] = useState(
    B2B_SECTOR_OPTIONS[0]?.label || 'SaaS & Tecnología'
  );

  // Tab 2: EmailJS Logs Filter & Compose/Config Toggles
  const [emailTypeFilter, setEmailTypeFilter] = useState<
    'all' | EmailNotificationType
  >('all');
  const [showComposeDrawer, setShowComposeDrawer] = useState(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [emailConfig, setEmailConfig] = useState<EmailJSRuntimeConfig>(() =>
    getEmailJSConfig()
  );
  const [configSaved, setConfigSaved] = useState(false);

  // Tab 2: Quick Send EmailJS Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    companies[0]?.id || ''
  );
  const [notifType, setNotifType] =
    useState<EmailNotificationType>('connection_invite');
  const [toEmail, setToEmail] = useState<string>(
    companies[0] ? getCompanyCorporateEmail(companies[0].name) : ADMIN_EMAIL
  );
  const [toName, setToName] = useState<string>(
    companies[0]?.representative.name || 'Directivo B2B'
  );
  const [targetCompanyName, setTargetCompanyName] = useState<string>(
    companies[0]?.name || 'Empresa Contraparte'
  );
  const [subject, setSubject] = useState<string>(
    `[BWOS Conectar B2B] Invitación Oficial de Conexión B2B`
  );
  const [message, setMessage] = useState<string>(
    `Estimado/a ejecutivo/a, le contactamos desde la Administración General de BWOS Conectar B2B para coordinar su participación en nuestra rueda de negocios 1-a-1.`
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Tab 3: Weekly Report Scheduler UI State
  const [isSendingWeeklyNow, setIsSendingWeeklyNow] = useState(false);
  const [showWeeklyPreview, setShowWeeklyPreview] = useState(false);
  const [scheduleSavedBanner, setScheduleSavedBanner] = useState(false);

  // Test Approval Simulation State ('Probar Aprobación')
  const [isTestingApproval, setIsTestingApproval] = useState(false);
  const [testApprovalResult, setTestApprovalResult] = useState<{
    testEmail: string;
    testCompany: string;
    oneTimeToken: string;
    approvalUrl: string;
    rejectUrl: string;
    sentAt: string;
  } | null>(null);

  // Strict Magic Token Retry Verification State
  const [retryCheckFeedback, setRetryCheckFeedback] = useState<{
    token: string;
    blocked: boolean;
    message: string;
    checkedAt: string;
  } | null>(null);

  // Strict Session Token Validation from App.tsx verified state (never validated by email alone)
  const activeSessionToken = verifiedSessionToken ?? consumedMagicToken ?? null;
  const currentSessionInstanceId = getCurrentSessionInstanceId();
  const tokenValidationState = validateActiveAdminSessionTokenState(
    adminUser?.email,
    activeSessionToken
  );
  const isStrictTokenVerified = Boolean(
    isAdmin &&
      activeSessionToken &&
      tokenValidationState.valid &&
      verifyAdminDashboardSessionToken(adminUser?.email, activeSessionToken)
  );

  // System Usage & Access Request Metrics derived from App.tsx state
  const systemMetrics = useMemo(() => {
    const totalCompanies = companies.length;
    const totalMeetings = meetings.length;
    const liveMeetings = meetings.filter((m) => m.status === 'live').length;
    const scheduledMeetings = meetings.filter(
      (m) => m.status === 'scheduled'
    ).length;
    const postponedMeetings = meetings.filter(
      (m) => m.status === 'postponed'
    ).length;

    const connectedCompaniesCount = companies.filter(
      (c) => c.isConnected
    ).length;
    const bookmarkedCompaniesCount = companies.filter(
      (c) => c.isBookmarked
    ).length;
    const immediateCallReadyCount = companies.filter(
      (c) => c.immediateCallAvailable
    ).length;

    const activeEngagedIds = new Set<string>([
      ...companies.filter((c) => c.isConnected).map((c) => c.id),
      ...meetings.map((m) => m.companyId),
    ]);
    const engagedCount = activeEngagedIds.size;
    const avgMatchScore =
      totalCompanies > 0
        ? Math.round(
            companies.reduce((acc, c) => acc + c.matchScore, 0) / totalCompanies
          )
        : 95;

    const connectionSuccessRate =
      totalCompanies > 0
        ? Math.min(
            100,
            Math.max(
              Math.round((engagedCount / totalCompanies) * 100),
              avgMatchScore - 4
            )
          )
        : 0;

    const pendingRequests = accessRequests.filter(
      (r) => r.status === 'pending'
    ).length;
    const approvedRequests = accessRequests.filter(
      (r) => r.status === 'approved'
    ).length;
    const rejectedRequests = accessRequests.filter(
      (r) => r.status === 'rejected'
    ).length;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyEmailsCount = emailLogs.filter(
      (l) => new Date(l.sentAt).getTime() >= sevenDaysAgo
    ).length;

    return {
      totalCompanies,
      totalMeetings,
      liveMeetings,
      scheduledMeetings,
      postponedMeetings,
      connectedCompaniesCount,
      bookmarkedCompaniesCount,
      immediateCallReadyCount,
      engagedCount,
      avgMatchScore,
      connectionSuccessRate,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalRequests: accessRequests.length,
      weeklyEmailsCount,
    };
  }, [companies, meetings, accessRequests, emailLogs]);

  // Sector usage breakdown for Tab 3 chart
  const sectorMetricsData = useMemo(() => {
    const categories: Array<{
      key: 'saas' | 'logistica' | 'manufactura' | 'servicios';
      label: string;
    }> = [
      { key: 'saas', label: 'SaaS & Tecnología' },
      { key: 'logistica', label: 'Logística & Fintech' },
      { key: 'manufactura', label: 'Manufactura 4.0' },
      { key: 'servicios', label: 'Servicios B2B' },
    ];

    return categories.map((cat) => {
      const inSector = companies.filter((c) => c.category === cat.key);
      const connectedInSector = inSector.filter((c) => c.isConnected).length;
      const meetingsInSector = meetings.filter((m) =>
        inSector.some((c) => c.id === m.companyId)
      ).length;
      return {
        sector: cat.label,
        empresas: inSector.length,
        interacciones: connectedInSector + meetingsInSector,
      };
    });
  }, [companies, meetings]);

  // Next scheduled weekly report date
  const nextScheduledReportDate = useMemo(
    () => getNextWeeklyReportDate(weeklySchedule),
    [weeklySchedule]
  );

  // Weekly report live preview payload
  const weeklyReportPreviewPayload = useMemo(
    () =>
      buildWeeklyMetricsEmailPayload({
        companies,
        meetings,
        accessRequests,
        emailLogs,
        schedule: weeklySchedule,
      }),
    [companies, meetings, accessRequests, emailLogs, weeklySchedule]
  );

  // Filtered Access Requests for Tab 1
  const filteredRequests = useMemo(() => {
    const q = reqSearch.trim().toLowerCase();
    return accessRequests.filter((r) => {
      if (reqStatusFilter !== 'all' && r.status !== reqStatusFilter) {
        return false;
      }
      if (q.length > 0) {
        const hay =
          `${r.fullName} ${r.companyName} ${r.email} ${r.sector} ${r.role}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [accessRequests, reqStatusFilter, reqSearch]);

  // Filtered EmailJS Logs for Tab 2
  const filteredEmailLogs = useMemo(() => {
    if (emailTypeFilter === 'all') return emailLogs;
    return emailLogs.filter((l) => l.type === emailTypeFilter);
  }, [emailLogs, emailTypeFilter]);

  const handleManualPreAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim() || !manualEmail.includes('@')) return;
    onManualAuthorizeEmail({
      email: manualEmail.trim().toLowerCase(),
      fullName: manualName.trim() || 'Ejecutivo Autorizado',
      companyName: manualCompany.trim() || 'Empresa Invitada B2B',
      role: manualRole.trim() || 'Directivo Comercial',
      sector: manualSector,
    });
    setManualEmail('');
    setManualName('');
    setManualCompany('');
  };

  const handleCopySingleUseLink = async (req: AccessRequestItem) => {
    const { approvalUrl } = buildAdminApprovalUrl({
      email: req.email,
      fullName: req.fullName,
      companyName: req.companyName,
      corporateContact: req.corporateContact,
      role: req.role,
      sector: req.sector,
      oneTimeToken: req.oneTimeToken,
    });
    try {
      await navigator.clipboard.writeText(approvalUrl);
      setCopiedTokenId(req.id);
      setTimeout(() => setCopiedTokenId(null), 2400);
    } catch {
      // ignore clipboard restrictions
    }
  };

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
        `Estimado/a ${found.representative.name} (${found.name}), revisamos su perfil en el Directorio BWOS Conectar B2B ("${found.demand.badge}") y deseamos establecer contacto directo.`
      );
    } else if (notifType === 'meeting_request') {
      setSubject(
        `[BWOS Conectar B2B] Solicitud de Reunión 1-a-1 Jitsi con ${found.name}`
      );
      setMessage(
        `Estimado/a ${found.representative.name}, le invitamos a una videollamada privada 1-a-1 mediante Sala Jitsi Meet (https://meet.jit.si/${found.jitsiRoomName}).`
      );
    }
  };

  const handleSaveEmailJSConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailJSConfig(emailConfig);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  const handleSendDirectEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim() || !message.trim()) return;
    setIsSendingEmail(true);
    const selectedComp = companies.find((c) => c.id === selectedCompanyId);
    await onSendManualEmail({
      type: notifType,
      toEmail: toEmail.trim(),
      toName: toName.trim() || 'Directivo B2B',
      fromName: 'Administrador General BWOS',
      fromEmail: ADMIN_EMAIL,
      companyName: targetCompanyName.trim() || 'Dirección General BWOS',
      subject: subject.trim(),
      message: message.trim(),
      jitsiRoomUrl: selectedComp
        ? `https://meet.jit.si/${selectedComp.jitsiRoomName}`
        : 'https://meet.jit.si/BWOS_Conectar_B2B',
      ccAdminEmail: ADMIN_EMAIL,
    });
    setIsSendingEmail(false);
    setShowComposeDrawer(false);
  };

  const handleSaveScheduleChanges = (
    partial: Partial<WeeklyReportSchedule>
  ) => {
    const updated: WeeklyReportSchedule = {
      ...weeklySchedule,
      ...partial,
      recipientEmail: ADMIN_EMAIL,
    };
    onUpdateWeeklySchedule(updated);
    setScheduleSavedBanner(true);
    setTimeout(() => setScheduleSavedBanner(false), 2200);
  };

  const handleTriggerWeeklyNow = async () => {
    setIsSendingWeeklyNow(true);
    await onSendWeeklyReportNow();
    setIsSendingWeeklyNow(false);
  };

  const handleTestApprovalFlow = async () => {
    setIsTestingApproval(true);
    const shortId = Math.random().toString(36).slice(2, 6);
    const testEmail = `prueba.invitacion.${shortId}@binweb.solutions`;
    const testName = `Ejecutivo Prueba (${shortId.toUpperCase()})`;
    const testCompany = `Empresa Demo Validación Link (${shortId.toUpperCase()})`;
    const testRole = 'Director de Alianzas B2B';
    const testSector = 'SaaS & Tecnología';
    const testContact = '+54 9 11 5555-0199';

    const freshToken = generateOneTimeApprovalToken();
    const { approvalUrl } = buildAdminApprovalUrl({
      email: testEmail,
      fullName: testName,
      companyName: testCompany,
      corporateContact: testContact,
      role: testRole,
      sector: testSector,
      oneTimeToken: freshToken,
    });
    const rejectUrl = buildAdminRejectUrl({
      email: testEmail,
      fullName: testName,
      companyName: testCompany,
      oneTimeToken: freshToken,
    });

    // 1. Register test pending request in queue
    upsertAccessRequest({
      email: testEmail,
      fullName: testName,
      companyName: testCompany,
      corporateContact: testContact,
      role: testRole,
      sector: testSector,
      sectorsList: [testSector],
      source: 'invitation_form',
      status: 'pending',
      oneTimeToken: freshToken,
      tokenUsed: false,
    });

    // 2. Dispatch real/simulated EmailJS invitation request to ADMIN_EMAIL
    await onSendManualEmail({
      type: 'access_request',
      toEmail: ADMIN_EMAIL,
      toName: 'Administrador General BWOS',
      fromName: testName,
      fromEmail: testEmail,
      companyName: testCompany,
      subject: `[PRUEBA DE APROBACIÓN EMAILJS - LINK ÚNICO USO] ${testCompany} (${testEmail})`,
      message: `Simulación de prueba de invitación enviada desde el Dashboard de Administración para verificar los enlaces en la plantilla de EmailJS.\n\nSolicitante: ${testName} (${testRole})\nEmpresa: ${testCompany}\nCorreo: ${testEmail}\nSector: ${testSector}\n\n✅ Aceptar a quien solicitó invitación (Link de único uso):\n${approvalUrl}\n\n❌ Rechazar solicitud:\n${rejectUrl}`,
      jitsiRoomUrl: approvalUrl,
      approvalUrl,
      oneTimeToken: freshToken,
      rejectUrl,
      ccAdminEmail: ADMIN_EMAIL,
    });

    if (onRefreshRequests) {
      onRefreshRequests();
    }

    setTestApprovalResult({
      testEmail,
      testCompany,
      oneTimeToken: freshToken,
      approvalUrl,
      rejectUrl,
      sentAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    });
    setIsTestingApproval(false);
  };

  const emailConfigured = isEmailJSConfigured(emailConfig);

  // Persistent Magic Link token audit from localStorage
  const magicTokensAudit = useMemo(() => {
    const issuedMap = getIssuedMagicLoginTokens();
    const usedMap = getUsedMagicLoginTokens();
    const records = Object.values(issuedMap).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const usedCount = Object.keys(usedMap).length;
    return {
      records,
      usedCount,
      totalIssued: records.length,
    };
  }, [emailLogs, activeSessionToken, retryCheckFeedback]);

  const handleSimulateUsedTokenRetry = (tokenToTest?: string | null) => {
    const targetToken = tokenToTest || activeSessionToken || '';
    const attempt = validateAndConsumeAdminMagicToken(
      targetToken,
      adminUser?.email,
      { dryRunAuditOnly: true }
    );
    setRetryCheckFeedback({
      token: targetToken || 'sin-token',
      blocked: !attempt.valid,
      message: !attempt.valid
        ? `Auditoría OK: el token ${targetToken} figura como 'usado' en localStorage (sesión ${currentSessionInstanceId.slice(0, 14)}) y rechaza cualquier segundo uso (${attempt.reason}).`
        : 'Token validado por primera vez y marcado como usado.',
      checkedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    });
  };

  const handleSimulateCrossSessionReuseClosure = () => {
    if (!activeSessionToken) {
      onInvalidSessionDetected?.(
        'No existe un token de sesión verificado en el estado de App.tsx.'
      );
      return;
    }
    recordMagicTokenReuseAttempt(activeSessionToken, adminUser?.email);
    onInvalidSessionDetected?.(
      `Se detectó un reintento de uso del token ${activeSessionToken.slice(0, 14)}... en otra sesión. Vista cerrada inmediatamente.`
    );
  };

  // Continuous enforcement layer inside AdminDashboardView:
  // Immediately triggers session closure if isAdmin is false, verifiedSessionToken is missing/invalid,
  // or a token reuse attempt is detected in localStorage / BroadcastChannel.
  useEffect(() => {
    if (!isAdmin || !isStrictTokenVerified) {
      onInvalidSessionDetected?.(
        !isAdmin
          ? 'Intento de acceso a AdminDashboardView con isAdmin=false.'
          : `Token de sesión no válido (${tokenValidationState.reason || 'unverified'}).`
      );
      return;
    }

    const unsubscribe = subscribeAdminTokenSecurityEvents((secEvent) => {
      if (
        secEvent.type === 'TOKEN_REUSE_DETECTED' &&
        (!activeSessionToken || secEvent.token === activeSessionToken)
      ) {
        onInvalidSessionDetected?.(
          `Reintento detectado para el token ${secEvent.token.slice(0, 14)}... Vista cerrada inmediatamente.`
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [
    isAdmin,
    isStrictTokenVerified,
    activeSessionToken,
    tokenValidationState.reason,
    onInvalidSessionDetected,
  ]);

  // Additional protection layer: never render AdminDashboardView if isAdmin is false or session token is not strictly verified
  if (!isAdmin || !isStrictTokenVerified) {
    return null;
  }

  return (
    <section
      aria-label="Dashboard de Administración en 3 Pestañas"
      className="w-full px-4 md:px-8 py-6"
    >
      <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
        {/* Top Executive Header */}
        <div className="bg-[#161f30] text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-label-sm uppercase tracking-wider text-amber-300 font-bold">
                Consola Exclusiva de Administración
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-400 font-label-sm font-bold">
                {adminUser?.fullName || 'Asesor Digital BWOS'} (
                {adminUser?.companyName || 'BWOS | Sitios Web & Merch'}) ·{' '}
                {adminUser?.email || SECONDARY_ADMIN_EMAIL}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300 font-label-sm">
                Admins Habilitados: {SECONDARY_ADMIN_EMAIL} / {ADMIN_EMAIL}
              </span>
            </div>
            <h1 className="font-headline-lg text-white tracking-tight">
              Dashboard de Administración B2B
            </h1>
            <p className="text-slate-300 font-body-md max-w-2xl">
              Recepción y aprobación directa en el Dashboard (y vía EmailJS con
              link de único uso) de los pedidos de invitación indicando{' '}
              <strong>Nombre y Apellido, Empresa y Correo Electrónico</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={isTestingApproval}
              onClick={handleTestApprovalFlow}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-label-md font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              title="Simular envío de invitación al correo del admin y verificar enlaces approve/reject en EmailJS"
            >
              <span className="material-symbols-outlined text-[18px]">
                mark_email_read
              </span>
              <span>
                {isTestingApproval
                  ? 'Enviando Prueba...'
                  : 'Probar Aprobación'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateUsedTokenRetry(activeSessionToken)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 font-label-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title="Auditar que el Link Mágico actual está marcado como 'usado' en localStorage"
            >
              <span className="material-symbols-outlined text-[18px]">
                lock_person
              </span>
              <span>Verificar Bloqueo Token Usado</span>
            </button>

            <button
              type="button"
              onClick={handleSimulateCrossSessionReuseClosure}
              className="px-3.5 py-2 rounded-xl bg-rose-500/25 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-400/40 font-label-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title="Simular un reintento de uso del mismo token por otra sesión para verificar el cierre inmediato de la vista"
            >
              <span className="material-symbols-outlined text-[18px]">
                gpp_bad
              </span>
              <span>Simular Reintento Otra Sesión</span>
            </button>

            <button
              type="button"
              onClick={onTriggerIncomingCall}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-label-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-400">
                ring_volume
              </span>
              <span>Simular Llamada</span>
            </button>

            <button
              type="button"
              onClick={onOpenPublishModal}
              className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-container text-white font-label-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">
                post_add
              </span>
              <span>Publicar Oferta</span>
            </button>

            <button
              type="button"
              onClick={onResetDemoData}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-400/30 font-label-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">
                restart_alt
              </span>
              <span>Reiniciar Demo</span>
            </button>
          </div>
        </div>

        {/* STRICT MAGIC LINK SINGLE-USE VERIFICATION BAR (localStorage) */}
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5 flex-wrap">
              <span className="material-symbols-outlined text-[#047857] text-[20px]">
                encrypted
              </span>
              <span className="font-label-md text-on-surface font-bold">
                Verificación Estricta de Link Mágico (localStorage):
              </span>
              <span className="font-mono text-[12px] text-primary bg-surface-container-low px-2.5 py-0.5 rounded border border-outline-variant/40">
                {activeSessionToken || 'mlk_verified'}
              </span>
              <span className="font-label-sm text-[#047857] font-bold">
                · Estado en localStorage: &apos;usado&apos; (Reintentos
                bloqueados)
              </span>
              <span className="font-body-sm text-on-surface-variant">
                · Sesión vinculada:{' '}
                <code>{currentSessionInstanceId.slice(0, 14)}</code>
              </span>
              <span className="font-body-sm text-on-surface-variant tabular-nums">
                · Total tokens consumidos: {magicTokensAudit.usedCount}
              </span>
            </div>

            {retryCheckFeedback && (
              <div className="flex items-center gap-2 text-[12px] bg-[#ECFDF5] text-[#064E3B] px-3 py-1.5 rounded-lg border border-[#047857]/30">
                <span className="material-symbols-outlined text-[16px] text-[#047857]">
                  gpp_good
                </span>
                <span>
                  <strong>[{retryCheckFeedback.checkedAt}]</strong>{' '}
                  {retryCheckFeedback.message}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* VERIFICATION PANEL WHEN 'PROBAR APROBACIÓN' IS TRIGGERED */}
        {testApprovalResult && (
          <div
            role="status"
            className="bg-surface-container-lowest rounded-2xl border border-[#047857]/40 p-5 shadow-xs flex flex-col gap-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-high pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="material-symbols-outlined text-[#047857] text-[22px]">
                  verified
                </span>
                <h2 className="font-title-md text-on-surface font-extrabold">
                  Verificación de Prueba de Aprobación EmailJS (
                  {testApprovalResult.sentAt})
                </h2>
                <span className="text-on-surface-variant font-body-sm">
                  · Enviado a {ADMIN_EMAIL}
                </span>
                <span className="text-on-surface-variant font-body-sm">
                  · Token único: <code>{testApprovalResult.oneTimeToken}</code>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setTestApprovalResult(null)}
                className="px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-label-sm font-bold cursor-pointer"
              >
                Cerrar verificación
              </button>
            </div>

            <p className="font-body-sm text-on-surface-variant">
              Se creó la solicitud de prueba para{' '}
              <strong>{testApprovalResult.testCompany}</strong> (
              <code>{testApprovalResult.testEmail}</code>) y se despachó el
              correo por EmailJS con los siguientes enlaces generados en las
              variables de la plantilla:
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Approve Link Verification Box */}
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-sm text-[#047857] font-bold">
                    1. Variable {'{{Aceptar a quien solicitó invitación}}'} /{' '}
                    {'{{approval_url}}'}
                  </span>
                  <a
                    href={testApprovalResult.approvalUrl}
                    className="px-3 py-1 rounded-lg bg-[#047857] hover:bg-[#065f46] text-white font-label-sm font-bold whitespace-nowrap"
                  >
                    Probar Link Aprobar (1 Clic)
                  </a>
                </div>
                <code className="text-[11px] font-mono text-on-surface break-all bg-surface p-2 rounded-lg border border-outline-variant/40">
                  {testApprovalResult.approvalUrl}
                </code>
              </div>

              {/* Reject Link Verification Box */}
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-sm text-error font-bold">
                    2. Variable {'{{reject_url}}'} (Enlace de Rechazo)
                  </span>
                  <a
                    href={testApprovalResult.rejectUrl}
                    className="px-3 py-1 rounded-lg bg-error hover:opacity-90 text-on-error font-label-sm font-bold whitespace-nowrap"
                  >
                    Probar Link Rechazar (1 Clic)
                  </a>
                </div>
                <code className="text-[11px] font-mono text-on-surface break-all bg-surface p-2 rounded-lg border border-outline-variant/40">
                  {testApprovalResult.rejectUrl}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* 3-TAB NAVIGATION BAR */}
        <div
          role="tablist"
          aria-label="Secciones del Dashboard de Administración"
          className="bg-surface-container-lowest p-2 rounded-2xl border border-surface-container-high shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
            {/* TAB 1: Solicitudes de Acceso Pendientes */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'requests'}
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-3 rounded-xl font-title-md text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                how_to_reg
              </span>
              <span>1. Solicitudes de Acceso</span>
              <span
                className={`px-2 py-0.5 rounded-md font-label-sm font-extrabold tabular-nums ${
                  activeTab === 'requests'
                    ? 'bg-white text-primary'
                    : systemMetrics.pendingRequests > 0
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {systemMetrics.pendingRequests} pend.
              </span>
            </button>

            {/* TAB 2: Historial de Registros de EmailJS */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'email-logs'}
              onClick={() => setActiveTab('email-logs')}
              className={`px-4 py-3 rounded-xl font-title-md text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'email-logs'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                forward_to_inbox
              </span>
              <span>2. Historial de EmailJS</span>
              <span
                className={`px-2 py-0.5 rounded-md font-label-sm font-extrabold tabular-nums ${
                  activeTab === 'email-logs'
                    ? 'bg-white text-primary'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {emailLogs.length}
              </span>
            </button>

            {/* TAB 3: Métricas Básicas y Reporte Semanal */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'system-metrics'}
              onClick={() => setActiveTab('system-metrics')}
              className={`px-4 py-3 rounded-xl font-title-md text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'system-metrics'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                monitoring
              </span>
              <span>3. Métricas & Reporte Semanal</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onNavigateToLobby}
            className="px-4 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-md font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">
              storefront
            </span>
            <span>Volver al Lobby</span>
          </button>
        </div>

        {/* =====================================================================
            PESTAÑA 1: SOLICITUDES DE ACCESO PENDIENTES (APROBAR / RECHAZAR)
           ===================================================================== */}
        {activeTab === 'requests' && (
          <div
            role="tabpanel"
            className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-xs p-6 flex flex-col gap-6"
          >
            {/* Header & Status Filter Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-container-high pb-4">
              <div>
                <h2 className="font-headline-sm text-on-surface font-extrabold">
                  Gestión de Solicitudes de Acceso (Aprobar / Rechazar)
                </h2>
                <p className="font-body-sm text-on-surface-variant mt-0.5">
                  Cada correo enviado desde la primera pantalla a{' '}
                  <strong>{ADMIN_EMAIL}</strong> incluye un{' '}
                  <strong>
                    link de único uso (
                    <code>{'{{Aceptar a quien solicitó invitación}}'}</code>)
                  </strong>
                  . También puedes aprobar o rechazar aquí directamente.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-surface-container-low p-1 rounded-xl">
                {(
                  [
                    {
                      id: 'pending',
                      label: `Pendientes (${systemMetrics.pendingRequests})`,
                    },
                    {
                      id: 'approved',
                      label: `Aprobadas (${systemMetrics.approvedRequests})`,
                    },
                    {
                      id: 'rejected',
                      label: `Rechazadas (${systemMetrics.rejectedRequests})`,
                    },
                    {
                      id: 'all',
                      label: `Todas (${systemMetrics.totalRequests})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setReqStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-label-md transition-colors cursor-pointer whitespace-nowrap ${
                      reqStatusFilter === tab.id
                        ? 'bg-primary text-on-primary font-bold shadow-2xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Pre-Authorization Form */}
            <form
              onSubmit={handleManualPreAuthSubmit}
              className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-label-md text-on-surface font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">
                    person_add
                  </span>
                  Pre-Autorizar / Dar "OK" Directo a un Correo Corporativo
                </span>
                <span className="font-label-sm text-on-surface-variant text-[12px]">
                  Autoriza inmediatamente el correo para "Ingreso Autorizado" y
                  dispara notificación EmailJS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="correo@empresa.com *"
                  className="px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-sm outline-none focus:border-primary"
                />
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Nombre del Ejecutivo"
                  className="px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-sm outline-none focus:border-primary"
                />
                <input
                  type="text"
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                  placeholder="Empresa / Razón Social"
                  className="px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-sm outline-none focus:border-primary"
                />
                <select
                  value={manualSector}
                  onChange={(e) => setManualSector(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-sm outline-none focus:border-primary"
                >
                  {B2B_SECTOR_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#047857] hover:bg-[#065f46] text-white font-label-md font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                  <span>Aprobar y Notificar</span>
                </button>
              </div>
            </form>

            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined text-outline absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={reqSearch}
                onChange={(e) => setReqSearch(e.target.value)}
                placeholder="Buscar solicitud por correo electrónico, nombre, empresa o sector..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-outline-variant font-body-sm outline-none focus:border-primary"
              />
            </div>

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
              <div className="py-12 px-4 rounded-xl bg-surface-container-low/50 border border-surface-container-high text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-outline text-[34px]">
                  verified_user
                </span>
                <div className="flex flex-col gap-1 max-w-md">
                  <p className="font-title-md text-on-surface font-bold">
                    {reqStatusFilter === 'pending'
                      ? 'No hay solicitudes de acceso pendientes por aprobar'
                      : 'Sin solicitudes en este filtro'}
                  </p>
                  <p className="font-body-sm text-on-surface-variant">
                    Cuando un usuario complete el formulario de invitación o
                    solicite Ingreso Autorizado, recibirás un correo con el link
                    de único uso{' '}
                    <code>{'{{Aceptar a quien solicitó invitación}}'}</code> y
                    aparecerá aquí.
                  </p>
                </div>
                {reqStatusFilter === 'pending' &&
                  systemMetrics.totalRequests > 0 && (
                    <button
                      type="button"
                      onClick={() => setReqStatusFilter('all')}
                      className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md font-bold cursor-pointer"
                    >
                      Ver todas las solicitudes ({systemMetrics.totalRequests})
                    </button>
                  )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredRequests.map((req) => {
                  const tokenConsumed =
                    Boolean(req.tokenUsed) ||
                    isApprovalTokenUsed(req.oneTimeToken);

                  return (
                    <article
                      key={req.id}
                      className="p-4 rounded-xl bg-surface border border-surface-container-high flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex flex-col gap-2.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`font-label-sm font-bold ${
                              req.status === 'approved'
                                ? 'text-[#047857]'
                                : req.status === 'rejected'
                                ? 'text-error'
                                : 'text-amber-700'
                            }`}
                          >
                            {req.status === 'approved'
                              ? '✓ APROBADO CON OK ADMIN'
                              : req.status === 'rejected'
                              ? '✕ RECHAZADO'
                              : '⏳ PENDIENTE DE APROBACIÓN EN DASHBOARD'}
                          </span>
                          <span className="text-on-surface-variant font-body-sm">
                            ·
                          </span>
                          <span className="font-label-sm text-on-surface-variant">
                            {tokenConsumed
                              ? 'Link único uso: Ya consumido'
                              : 'Link único uso: Activo (1 clic)'}
                          </span>
                        </div>

                        {/* Highlighted 3 Mandatory Fields: Nombre y Apellido, Empresa, Correo Electrónico */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                          <div className="flex flex-col">
                            <span className="text-[11px] text-on-surface-variant font-bold">
                              Nombre y Apellido
                            </span>
                            <span className="font-title-md text-on-surface font-extrabold">
                              {req.fullName}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] text-on-surface-variant font-bold">
                              Empresa / Razón Social
                            </span>
                            <span className="font-title-md text-on-surface font-bold">
                              {req.companyName}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] text-on-surface-variant font-bold">
                              Correo Electrónico
                            </span>
                            <span className="font-body-sm text-primary font-bold break-all">
                              {req.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-on-surface-variant">
                          <span>
                            <strong>WhatsApp:</strong> {req.corporateContact}
                          </span>
                          <span>
                            <strong>Cargo:</strong> {req.role || 'Directivo'}
                          </span>
                          <span>
                            <strong>Sector(es):</strong> {req.sector}
                          </span>
                          <span>
                            <strong>Origen:</strong>{' '}
                            {req.source === 'authorized_login_attempt'
                              ? 'Ingreso Autorizado'
                              : req.source === 'admin_manual'
                              ? 'Pre-autorización Manual'
                              : 'Formulario de Invitación'}
                          </span>
                          <span className="tabular-nums">
                            <strong>Fecha:</strong>{' '}
                            {new Date(req.requestedAt).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {req.status === 'pending' && !tokenConsumed && (
                          <button
                            type="button"
                            onClick={() => handleCopySingleUseLink(req)}
                            className="px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-primary font-label-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                            title="Copiar link de único uso {{Aceptar a quien solicitó invitación}}"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              link
                            </span>
                            <span>
                              {copiedTokenId === req.id
                                ? '¡Link Único Copiado!'
                                : 'Copiar Link Único Uso'}
                            </span>
                          </button>
                        )}

                        {req.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => onApproveRequest(req)}
                            className="px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065f46] text-white font-label-md font-bold flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              done_all
                            </span>
                            <span>Aprobar (Dar OK)</span>
                          </button>
                        )}

                        {req.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => onRejectRequest(req)}
                            className="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-on-surface-variant font-label-md font-bold cursor-pointer whitespace-nowrap"
                          >
                            {req.status === 'approved'
                              ? 'Revocar OK'
                              : 'Rechazar'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onDeleteRequest(req.id)}
                          title="Eliminar solicitud"
                          className="w-9 h-9 rounded-xl bg-surface-container-low hover:bg-error-container text-on-surface-variant hover:text-error flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            PESTAÑA 2: HISTORIAL DE REGISTROS DE EMAILJS (CON LIMPIAR LOG)
           ===================================================================== */}
        {activeTab === 'email-logs' && (
          <div
            role="tabpanel"
            className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-xs p-6 flex flex-col gap-5"
          >
            {/* Header & Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-container-high pb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-headline-sm text-on-surface font-extrabold">
                    Historial de Registros de EmailJS ({emailLogs.length})
                  </h2>
                  <span className="font-label-sm text-on-surface-variant">
                    ·{' '}
                    {emailConfigured
                      ? 'Conectado a EmailJS API'
                      : 'Modo Bandeja Piloto'}
                  </span>
                </div>
                <p className="font-body-sm text-on-surface-variant mt-0.5">
                  Auditoría de correos de invitación con link de único uso (
                  <code>{'{{Aceptar a quien solicitó invitación}}'}</code>),
                  reuniones 1-a-1 y reportes semanales de métricas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowComposeDrawer((prev) => !prev);
                    setShowConfigDrawer(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-on-primary font-label-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    send
                  </span>
                  <span>
                    {showComposeDrawer
                      ? 'Ocultar Envío Manual'
                      : 'Enviar Correo Manual'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowConfigDrawer((prev) => !prev);
                    setShowComposeDrawer(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    key
                  </span>
                  <span>Credenciales VITE_EMAILJS</span>
                </button>

                <button
                  type="button"
                  disabled={emailLogs.length === 0}
                  onClick={onClearEmailLogs}
                  className="px-4 py-2 rounded-xl bg-[#ffdad6] hover:bg-[#ba1a1a] text-[#93000a] hover:text-white font-label-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    delete_sweep
                  </span>
                  <span>Limpiar Log de EmailJS</span>
                </button>
              </div>
            </div>

            {/* Optional Drawer: Credenciales VITE_EMAILJS_* */}
            {showConfigDrawer && (
              <form
                onSubmit={handleSaveEmailJSConfig}
                className="p-5 rounded-xl bg-[#161f30] text-white border border-slate-800 flex flex-col gap-3.5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-title-md text-amber-300 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">
                      settings
                    </span>
                    Configuración de Credenciales EmailJS (VITE_EMAILJS_*)
                  </span>
                  {configSaved && (
                    <span className="text-emerald-400 font-label-sm font-bold">
                      ✓ Credenciales actualizadas
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-slate-300">
                  Variables soportadas en tu plantilla de EmailJS:{' '}
                  <code className="text-amber-300">
                    {'{{Aceptar a quien solicitó invitación}}'}
                  </code>
                  , <code className="text-amber-300">{'{{approval_url}}'}</code>
                  , <code className="text-amber-300">{'{{message}}'}</code>,{' '}
                  <code className="text-amber-300">{'{{jitsi_url}}'}</code>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      VITE_EMAILJS_SERVICE_ID
                    </label>
                    <input
                      type="text"
                      value={emailConfig.serviceId}
                      onChange={(e) =>
                        setEmailConfig({
                          ...emailConfig,
                          serviceId: e.target.value,
                        })
                      }
                      placeholder="service_xxx"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-body-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      VITE_EMAILJS_TEMPLATE_ID
                    </label>
                    <input
                      type="text"
                      value={emailConfig.templateId}
                      onChange={(e) =>
                        setEmailConfig({
                          ...emailConfig,
                          templateId: e.target.value,
                        })
                      }
                      placeholder="template_xxx"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-body-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      VITE_EMAILJS_PUBLIC_KEY
                    </label>
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
                        placeholder="Public Key"
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-body-sm"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-primary text-white font-label-md font-bold cursor-pointer shrink-0"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Optional Drawer: Enviar Correo Manual EmailJS */}
            {showComposeDrawer && (
              <form
                onSubmit={handleSendDirectEmail}
                className="p-5 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-3.5"
              >
                <h3 className="font-title-md text-on-surface font-bold">
                  Disparar Notificación Manual por EmailJS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={notifType}
                    onChange={(e) =>
                      setNotifType(e.target.value as EmailNotificationType)
                    }
                    className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant font-body-sm"
                  >
                    <option value="connection_invite">
                      Invitación de Conexión B2B
                    </option>
                    <option value="meeting_request">
                      Solicitud Reunión 1-a-1 Jitsi
                    </option>
                    <option value="access_approved">
                      Confirmación OK de Ingreso
                    </option>
                    <option value="weekly_report">
                      Reporte Semanal de Métricas
                    </option>
                  </select>

                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleSelectCompanyPreset(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant font-body-sm"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.representative.name})
                      </option>
                    ))}
                  </select>

                  <input
                    type="email"
                    required
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="Correo destinatario *"
                    className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant font-body-sm"
                  />
                </div>

                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto del correo *"
                  className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant font-body-sm"
                />

                <textarea
                  rows={2}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mensaje *"
                  className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant font-body-sm resize-none"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowComposeDrawer(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface font-label-md font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary font-label-md font-bold cursor-pointer disabled:opacity-50"
                  >
                    {isSendingEmail
                      ? 'Enviando...'
                      : 'Enviar Ahora por EmailJS'}
                  </button>
                </div>
              </form>
            )}

            {/* Filter by Notification Type */}
            <div className="flex flex-wrap items-center gap-1.5 bg-surface-container-low p-1 rounded-xl self-start">
              {(
                [
                  { id: 'all', label: `Todos (${emailLogs.length})` },
                  { id: 'admin_magic_link', label: 'Links Mágicos Admin' },
                  { id: 'access_request', label: 'Solicitudes al Admin' },
                  { id: 'access_approved', label: 'OK de Ingreso' },
                  { id: 'connection_invite', label: 'Invitaciones Conexión' },
                  { id: 'meeting_request', label: 'Solicitudes Reunión' },
                  { id: 'weekly_report', label: 'Reportes Semanales' },
                ] as const
              ).map((filterItem) => (
                <button
                  key={filterItem.id}
                  type="button"
                  onClick={() => setEmailTypeFilter(filterItem.id)}
                  className={`px-3 py-1.5 rounded-lg font-label-sm transition-colors cursor-pointer whitespace-nowrap ${
                    emailTypeFilter === filterItem.id
                      ? 'bg-primary text-on-primary font-bold shadow-2xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {filterItem.label}
                </button>
              ))}
            </div>

            {/* Email Logs List */}
            {filteredEmailLogs.length === 0 ? (
              <div className="py-12 px-4 rounded-xl bg-surface-container-low/50 border border-surface-container-high text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-outline text-[34px]">
                  inbox
                </span>
                <div className="flex flex-col gap-1 max-w-md">
                  <p className="font-title-md text-on-surface font-bold">
                    El historial de registros de EmailJS está vacío
                  </p>
                  <p className="font-body-sm text-on-surface-variant">
                    Cada invitación de conexión, solicitud de reunión, solicitud
                    de ingreso o reporte semanal enviado por EmailJS quedará
                    registrado aquí.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredEmailLogs.map((log) => {
                  const isMagicLogUsed =
                    log.type === 'admin_magic_link' &&
                    (log.tokenStatus === 'usado' ||
                      isMagicLoginTokenUsed(log.oneTimeToken));

                  return (
                    <article
                      key={log.id}
                      className="p-4 rounded-xl bg-surface border border-surface-container-high flex flex-col gap-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-label-sm font-bold text-primary">
                            {log.type === 'connection_invite'
                              ? 'Invitación de Conexión'
                              : log.type === 'meeting_request'
                              ? 'Solicitud de Reunión'
                              : log.type === 'access_approved'
                              ? 'OK de Ingreso Otorgado'
                              : log.type === 'weekly_report'
                              ? 'Reporte Semanal de Métricas'
                              : log.type === 'admin_magic_link'
                              ? 'Link Mágico de Acceso Admin'
                              : 'Solicitud de Acceso al Admin'}
                          </span>
                          <span className="text-on-surface-variant font-body-sm">
                            ·
                          </span>
                          <span
                            className={`font-label-sm font-bold ${
                              log.deliveryMode === 'emailjs_live'
                                ? 'text-[#047857]'
                                : 'text-amber-700'
                            }`}
                          >
                            {log.deliveryMode === 'emailjs_live'
                              ? 'Enviado EmailJS API'
                              : 'Simulado / Bandeja Piloto'}
                          </span>
                          {log.type === 'admin_magic_link' && (
                            <>
                              <span className="text-on-surface-variant font-body-sm">
                                ·
                              </span>
                              <span
                                className={`font-label-sm font-bold ${
                                  isMagicLogUsed
                                    ? 'text-error'
                                    : 'text-[#047857]'
                                }`}
                              >
                                {isMagicLogUsed
                                  ? "Estado Token en localStorage: 'usado' (Reintento Bloqueado)"
                                  : "Estado Token en localStorage: 'pendiente'"}
                              </span>
                            </>
                          )}
                        </div>

                        <span className="font-label-sm text-on-surface-variant tabular-nums">
                          {new Date(log.sentAt).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      <p className="font-title-md text-on-surface font-bold">
                        {log.subject}
                      </p>
                      <p className="font-body-sm text-on-surface-variant whitespace-pre-line">
                        {log.message}
                      </p>

                      {log.type === 'admin_magic_link' && log.approvalUrl && (
                        <div className="mt-1 p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high flex flex-wrap items-center justify-between gap-2 text-[12px]">
                          <span className="font-label-sm text-on-surface font-bold">
                            Token Único ({log.oneTimeToken || 'mlk'}):
                          </span>
                          {isMagicLogUsed ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-on-surface-variant line-through truncate max-w-md">
                                {log.approvalUrl}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleSimulateUsedTokenRetry(log.oneTimeToken)
                                }
                                className="px-2.5 py-1 rounded bg-error/10 text-error font-label-sm font-bold cursor-pointer"
                              >
                                Token &apos;usado&apos; · Probar Reintento
                                (Bloqueado)
                              </button>
                            </div>
                          ) : (
                            <a
                              href={log.approvalUrl}
                              className="text-primary hover:underline font-mono truncate max-w-xl"
                            >
                              {log.approvalUrl}
                            </a>
                          )}
                        </div>
                      )}

                      {log.type === 'access_request' && log.approvalUrl && (
                        <div className="mt-1 p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high flex flex-wrap items-center justify-between gap-2 text-[12px]">
                          <span className="font-label-sm text-on-surface font-bold">
                            {'{{Aceptar a quien solicitó invitación}}'} (Link de
                            único uso):
                          </span>
                          <a
                            href={log.approvalUrl}
                            className="text-primary hover:underline font-mono truncate max-w-xl"
                          >
                            {log.approvalUrl}
                          </a>
                        </div>
                      )}

                      <div className="pt-2 border-t border-surface-container flex flex-wrap items-center justify-between gap-2 text-[11px] text-on-surface-variant">
                        <span>
                          <strong>Para:</strong> {log.toName} ({log.toEmail}) ·{' '}
                          <strong>CC Admin:</strong>{' '}
                          {log.ccAdminEmail || ADMIN_EMAIL}
                        </span>
                        <span className="font-bold text-primary">
                          {log.statusText}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            PESTAÑA 3: MÉTRICAS BÁSICAS DE USO Y REPORTE SEMANAL EMAILJS
           ===================================================================== */}
        {activeTab === 'system-metrics' && (
          <div role="tabpanel" className="flex flex-col gap-6">
            {/* Core 3 KPI Cards requested: Total de empresas, Reuniones agendadas, Tasa de éxito de conexión */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* KPI 1: Total de Empresas */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-on-surface-variant font-bold">
                    1. Total de Empresas
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">
                      domain
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[36px] font-extrabold text-on-surface leading-none tabular-nums">
                    {systemMetrics.totalCompanies}
                  </span>
                  <p className="font-body-sm text-on-surface-variant mt-1.5">
                    {systemMetrics.immediateCallReadyCount} con sala Jitsi
                    inmediata · {systemMetrics.bookmarkedCompaniesCount} en
                    favoritos
                  </p>
                </div>
              </div>

              {/* KPI 2: Reuniones Agendadas */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-on-surface-variant font-bold">
                    2. Reuniones Agendadas
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">
                      video_call
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[36px] font-extrabold text-on-surface leading-none tabular-nums">
                    {systemMetrics.totalMeetings}
                  </span>
                  <p className="font-body-sm text-on-surface-variant mt-1.5">
                    {systemMetrics.liveMeetings} confirmadas en sala ·{' '}
                    {systemMetrics.scheduledMeetings} pendientes ·{' '}
                    {systemMetrics.postponedMeetings} pospuestas
                  </p>
                </div>
              </div>

              {/* KPI 3: Tasa de Éxito de Conexión */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-on-surface-variant font-bold">
                    3. Tasa de Éxito de Conexión
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#047857] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">
                      insights
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[36px] font-extrabold text-[#047857] leading-none tabular-nums">
                    {systemMetrics.connectionSuccessRate}%
                  </span>
                  <p className="font-body-sm text-on-surface-variant mt-1.5">
                    {systemMetrics.connectedCompaniesCount} conexiones directas
                    · Afinidad B2B media: {systemMetrics.avgMatchScore}%
                  </p>
                </div>
              </div>
            </div>

            {/* WEEKLY METRICS EMAIL REPORT SCHEDULER PANEL */}
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-xs p-6 flex flex-col gap-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-container-high pb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      schedule_send
                    </span>
                    <h2 className="font-headline-sm text-on-surface font-extrabold">
                      Programación de Reporte Semanal de Métricas por EmailJS
                    </h2>
                    <span className="text-on-surface-variant font-body-sm">
                      ·
                    </span>
                    <span
                      className={`font-label-sm font-bold ${
                        weeklySchedule.enabled
                          ? 'text-[#047857]'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {weeklySchedule.enabled
                        ? 'Programación Automática Activa'
                        : 'Programación en Pausa'}
                    </span>
                    {scheduleSavedBanner && (
                      <span className="font-label-sm text-primary font-bold">
                        · ✓ Programación guardada
                      </span>
                    )}
                  </div>
                  <p className="font-body-sm text-on-surface-variant">
                    Envía automáticamente a <strong>{ADMIN_EMAIL}</strong> el
                    resumen consolidado de métricas del sistema mediante el
                    servicio EmailJS en el día y hora seleccionados, o dispáralo
                    manualmente cuando lo requieras.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowWeeklyPreview((prev) => !prev)}
                    className="px-3.5 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      visibility
                    </span>
                    <span>
                      {showWeeklyPreview
                        ? 'Ocultar Previsualización'
                        : 'Previsualizar Reporte'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isSendingWeeklyNow}
                    onClick={handleTriggerWeeklyNow}
                    className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      forward_to_inbox
                    </span>
                    <span>
                      {isSendingWeeklyNow
                        ? 'Enviando Resumen Semanal...'
                        : 'Enviar Resumen Ahora'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Schedule Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Enable / Disable Auto Dispatch */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-on-surface-variant font-bold">
                    Estado del Envío Automático
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveScheduleChanges({
                        enabled: !weeklySchedule.enabled,
                      })
                    }
                    className={`w-full px-4 py-2.5 rounded-xl border font-label-md font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      weeklySchedule.enabled
                        ? 'bg-[#047857]/10 border-[#047857]/40 text-[#047857]'
                        : 'bg-surface-container-low border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    <span>
                      {weeklySchedule.enabled
                        ? 'Activado (Cada 7 días)'
                        : 'Desactivado'}
                    </span>
                    <span className="material-symbols-outlined text-[20px]">
                      {weeklySchedule.enabled ? 'toggle_on' : 'toggle_off'}
                    </span>
                  </button>
                </div>

                {/* Day of Week Selector */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="weekly-day-select"
                    className="font-label-sm text-on-surface-variant font-bold"
                  >
                    Día de Envío Semanal
                  </label>
                  <select
                    id="weekly-day-select"
                    value={weeklySchedule.dayOfWeek}
                    onChange={(e) =>
                      handleSaveScheduleChanges({
                        dayOfWeek: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant font-body-sm text-on-surface outline-none focus:border-primary"
                  >
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                      <option key={d} value={d}>
                        Todos los {DAY_OF_WEEK_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time of Day Selector */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="weekly-time-input"
                    className="font-label-sm text-on-surface-variant font-bold"
                  >
                    Hora Programada (24h)
                  </label>
                  <input
                    id="weekly-time-input"
                    type="time"
                    value={weeklySchedule.hourMinute}
                    onChange={(e) =>
                      handleSaveScheduleChanges({
                        hourMinute: e.target.value || '09:00',
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant font-body-sm text-on-surface tabular-nums outline-none focus:border-primary"
                  />
                </div>

                {/* Next & Last Dispatch Summary */}
                <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-1 text-[12px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-on-surface-variant">
                      Próximo envío:
                    </span>
                    <span className="font-bold text-on-surface tabular-nums">
                      {weeklySchedule.enabled
                        ? nextScheduledReportDate.toLocaleString([], {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Pausado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-on-surface-variant">
                      Último enviado:
                    </span>
                    <span className="font-bold text-primary tabular-nums">
                      {weeklySchedule.lastSentAt
                        ? new Date(weeklySchedule.lastSentAt).toLocaleString(
                            [],
                            {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            }
                          )
                        : 'Aún no enviado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Metric Blocks Checkboxes (All 4 enabled by default per user confirmation) */}
              <div className="pt-2 border-t border-surface-container flex flex-col gap-2.5">
                <span className="font-label-sm text-on-surface-variant font-bold">
                  Secciones de métricas incluidas en el correo semanal a{' '}
                  {ADMIN_EMAIL}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <label className="p-3 rounded-xl bg-surface border border-surface-container-high flex items-center gap-2.5 cursor-pointer font-body-sm text-on-surface">
                    <input
                      type="checkbox"
                      checked={weeklySchedule.includeCompaniesAndMeetings}
                      onChange={(e) =>
                        handleSaveScheduleChanges({
                          includeCompaniesAndMeetings: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    <span>Empresas, reuniones y tasa B2B</span>
                  </label>

                  <label className="p-3 rounded-xl bg-surface border border-surface-container-high flex items-center gap-2.5 cursor-pointer font-body-sm text-on-surface">
                    <input
                      type="checkbox"
                      checked={weeklySchedule.includeAccessRequestsSummary}
                      onChange={(e) =>
                        handleSaveScheduleChanges({
                          includeAccessRequestsSummary: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    <span>Solicitudes pendientes y aprobadas</span>
                  </label>

                  <label className="p-3 rounded-xl bg-surface border border-surface-container-high flex items-center gap-2.5 cursor-pointer font-body-sm text-on-surface">
                    <input
                      type="checkbox"
                      checked={weeklySchedule.includeEmailJSWeeklyCount}
                      onChange={(e) =>
                        handleSaveScheduleChanges({
                          includeEmailJSWeeklyCount: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    <span>
                      Total correos EmailJS ({systemMetrics.weeklyEmailsCount}{' '}
                      sem.)
                    </span>
                  </label>

                  <label className="p-3 rounded-xl bg-surface border border-surface-container-high flex items-center gap-2.5 cursor-pointer font-body-sm text-on-surface">
                    <input
                      type="checkbox"
                      checked={weeklySchedule.includeSectorBreakdown}
                      onChange={(e) =>
                        handleSaveScheduleChanges({
                          includeSectorBreakdown: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    <span>Desglose por sector industrial</span>
                  </label>
                </div>
              </div>

              {/* Optional Live Preview of the Weekly Report Email */}
              {showWeeklyPreview && (
                <div className="p-4 rounded-xl bg-[#161f30] text-slate-100 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
                    <span className="font-label-sm text-amber-300 font-bold">
                      Vista Previa del Correo Semanal EmailJS · Destinatario:{' '}
                      {ADMIN_EMAIL}
                    </span>
                    <span className="font-label-sm text-slate-400">
                      Asunto: {weeklyReportPreviewPayload.subject}
                    </span>
                  </div>
                  <pre className="font-mono text-[12px] text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {weeklyReportPreviewPayload.message}
                  </pre>
                </div>
              )}
            </div>

            {/* Charts & Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* BarChart: Empresas e Interacciones por Sector Industrial */}
              <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs flex flex-col gap-4">
                <div>
                  <h3 className="font-title-lg text-on-surface font-bold">
                    Distribución de Empresas y Conexiones por Sector
                  </h3>
                  <p className="font-body-sm text-on-surface-variant">
                    Actividad acumulada en el directorio B2B según vertical
                    industrial
                  </p>
                </div>

                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sectorMetricsData}
                      margin={{ top: 8, right: 16, left: -12, bottom: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="sector"
                        tick={{ fontSize: 11, fill: '#475569' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#475569' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        dataKey="empresas"
                        name="Empresas Registradas"
                        radius={[8, 8, 0, 0]}
                      >
                        {sectorMetricsData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={BAR_COLORS[index % BAR_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Operational Summary Table */}
              <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-title-lg text-on-surface font-bold">
                    Resumen Operativo del Sistema
                  </h3>
                  <p className="font-body-sm text-on-surface-variant">
                    Indicadores consolidados de admisión, correo y networking
                  </p>
                </div>

                <div className="flex flex-col divide-y divide-surface-container-high">
                  <div className="py-3 flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">
                      Solicitudes de acceso pendientes de OK
                    </span>
                    <span className="font-bold text-amber-700 tabular-nums">
                      {systemMetrics.pendingRequests}
                    </span>
                  </div>
                  <div className="py-3 flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">
                      Cuentas aprobadas con OK del Admin
                    </span>
                    <span className="font-bold text-[#047857] tabular-nums">
                      {systemMetrics.approvedRequests}
                    </span>
                  </div>
                  <div className="py-3 flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">
                      Solicitudes rechazadas / revocadas
                    </span>
                    <span className="font-bold text-error tabular-nums">
                      {systemMetrics.rejectedRequests}
                    </span>
                  </div>
                  <div className="py-3 flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">
                      Notificaciones EmailJS en los últimos 7 días
                    </span>
                    <span className="font-bold text-primary tabular-nums">
                      {systemMetrics.weeklyEmailsCount}
                    </span>
                  </div>
                  <div className="py-3 flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">
                      Salas 1-a-1 Jitsi habilitadas
                    </span>
                    <span className="font-bold text-on-surface tabular-nums">
                      {systemMetrics.immediateCallReadyCount}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('requests')}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-sm font-bold cursor-pointer text-center"
                  >
                    Ir a Solicitudes ({systemMetrics.pendingRequests})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('email-logs')}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-sm font-bold cursor-pointer text-center"
                  >
                    Ir a Historial EmailJS ({emailLogs.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
