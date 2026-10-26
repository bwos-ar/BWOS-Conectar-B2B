import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ADMIN_EMAIL, CompanyCard, MeetingItem } from '../data/b2bData';
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
import { B2B_SECTOR_OPTIONS } from './MultiSectorSelector';

interface AdminDashboardViewProps {
  isAdmin: boolean;
  companies: CompanyCard[];
  meetings: MeetingItem[];
  accessRequests: AccessRequestItem[];
  emailLogs: EmailLogItem[];
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
  onTriggerIncomingCall: () => void;
  onOpenPublishModal: () => void;
  onResetDemoData: () => void;
  onNavigateToLobby: () => void;
}

const SECTOR_CHART_COLORS = [
  '#004ac6',
  '#047857',
  '#2563eb',
  '#0d9488',
  '#4f46e5',
  '#d97706',
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  isAdmin,
  companies,
  meetings,
  accessRequests,
  emailLogs,
  onApproveRequest,
  onRejectRequest,
  onDeleteRequest,
  onManualAuthorizeEmail,
  onSendManualEmail,
  onClearEmailLogs,
  onTriggerIncomingCall,
  onOpenPublishModal,
  onResetDemoData,
  onNavigateToLobby,
}) => {
  // Active section filter inside the consolidated dashboard
  const [activeSection, setActiveSection] = useState<
    'all' | 'requests' | 'emailjs' | 'metrics'
  >('all');

  // Access Requests Filter & Search
  const [reqStatusFilter, setReqStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('all');
  const [reqSearch, setReqSearch] = useState('');

  // Quick Pre-Authorize ("Dar OK Directo") Form State
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualRole, setManualRole] = useState('Directivo Autorizado');
  const [manualSector, setManualSector] = useState(
    B2B_SECTOR_OPTIONS[0]?.label || 'SaaS & Tecnología'
  );

  // EmailJS Credentials Configuration State
  const [emailConfig, setEmailConfig] = useState<EmailJSRuntimeConfig>(() =>
    getEmailJSConfig()
  );
  const [configSaved, setConfigSaved] = useState(false);

  // Simple EmailJS Dispatch Form State
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

  // Email Logs Filter
  const [emailTypeFilter, setEmailTypeFilter] = useState<
    'all' | EmailNotificationType
  >('all');

  // Security guard: Only clientesbinweb@gmail.com can access this view
  if (!isAdmin) {
    return (
      <section className="w-full max-w-[960px] mx-auto px-4 py-16">
        <div className="bg-surface-container-lowest rounded-2xl border border-error/40 p-8 text-center flex flex-col items-center gap-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-error-container text-error flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">
              gpp_bad
            </span>
          </div>
          <h2 className="font-headline-md text-on-surface font-extrabold">
            Acceso Exclusivo para el Administrador ({ADMIN_EMAIL})
          </h2>
          <p className="font-body-md text-on-surface-variant max-w-md">
            Esta consola consolida la aprobación obligatoria de ingresos,
            métricas ejecutivas y auditoría de EmailJS únicamente para la cuenta
            administradora.
          </p>
          <button
            type="button"
            onClick={onNavigateToLobby}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-title-md cursor-pointer"
          >
            Volver al Lobby Virtual
          </button>
        </div>
      </section>
    );
  }

  // Computed Metrics for Access & Revenue/Pipeline
  const stats = useMemo(() => {
    const pending = accessRequests.filter((r) => r.status === 'pending').length;
    const approved = accessRequests.filter(
      (r) => r.status === 'approved'
    ).length;
    const rejected = accessRequests.filter(
      (r) => r.status === 'rejected'
    ).length;
    const totalReq = accessRequests.length;
    const approvalRate =
      totalReq > 0 ? Math.round((approved / totalReq) * 100) : 100;

    const activeConnections = companies.filter((c) => c.isConnected).length;
    // Estimated B2B accreditation & round pipeline value (USD)
    const accreditedRevenueUsd = (companies.length + approved) * 450;
    const pipelineDealsUsd = (activeConnections + meetings.length) * 18500;

    const byForm = accessRequests.filter(
      (r) => r.source === 'invitation_form'
    ).length;
    const byAuthAttempt = accessRequests.filter(
      (r) => r.source === 'authorized_login_attempt'
    ).length;
    const byAdminManual = accessRequests.filter(
      (r) => r.source === 'admin_manual'
    ).length;

    return {
      pending,
      approved,
      rejected,
      totalReq,
      approvalRate,
      activeConnections,
      accreditedRevenueUsd,
      pipelineDealsUsd,
      byForm,
      byAuthAttempt,
      byAdminManual,
    };
  }, [accessRequests, companies, meetings.length]);

  // Chart 1: Ingresos de Solicitudes, OKs Aprobados y Envíos EmailJS por Jornada
  const intakeTrendData = useMemo(() => {
    return [
      {
        etapa: 'Día 1 Summit',
        solicitudes: 6,
        aprobadosOk: 5,
        correosEmailJS: 11,
        ingresosUsd: 2250,
      },
      {
        etapa: 'Día 2 Summit',
        solicitudes: 9,
        aprobadosOk: 8,
        correosEmailJS: 18,
        ingresosUsd: 3600,
      },
      {
        etapa: 'Día 3 Summit',
        solicitudes: 14,
        aprobadosOk: 12,
        correosEmailJS: 27,
        ingresosUsd: 5400,
      },
      {
        etapa: 'Hoy (En Vivo)',
        solicitudes: Math.max(4, stats.totalReq + 4),
        aprobadosOk: Math.max(3, stats.approved + 3),
        correosEmailJS: Math.max(6, emailLogs.length + 6),
        ingresosUsd: stats.accreditedRevenueUsd,
      },
    ];
  }, [
    stats.totalReq,
    stats.approved,
    stats.accreditedRevenueUsd,
    emailLogs.length,
  ]);

  // Chart 2: Distribución de Ingresos y Empresas por Sector
  const sectorDistributionData = useMemo(() => {
    const counts = {
      'SaaS & Tech': companies.filter((c) => c.category === 'saas').length,
      'Logística & Fintech': companies.filter((c) => c.category === 'logistica')
        .length,
      'Manufactura 4.0': companies.filter((c) => c.category === 'manufactura')
        .length,
      'Servicios B2B': companies.filter((c) => c.category === 'servicios')
        .length,
    };

    accessRequests.forEach((req) => {
      const s = req.sector.toLowerCase();
      if (s.includes('saas') || s.includes('tecnolog')) {
        counts['SaaS & Tech'] += 1;
      } else if (
        s.includes('logística') ||
        s.includes('fintech') ||
        s.includes('comercio')
      ) {
        counts['Logística & Fintech'] += 1;
      } else if (
        s.includes('manufactura') ||
        s.includes('agro') ||
        s.includes('construcc')
      ) {
        counts['Manufactura 4.0'] += 1;
      } else {
        counts['Servicios B2B'] += 1;
      }
    });

    return Object.entries(counts).map(([sector, total]) => ({
      sector,
      total,
    }));
  }, [companies, accessRequests]);

  // Filtered Access Requests
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

  // Filtered EmailJS Logs
  const filteredEmailLogs = useMemo(() => {
    if (emailTypeFilter === 'all') return emailLogs;
    return emailLogs.filter((l) => l.type === emailTypeFilter);
  }, [emailLogs, emailTypeFilter]);

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
  };

  const emailConfigured = isEmailJSConfigured(emailConfig);

  return (
    <section
      aria-label="Dashboard de Administración General"
      className="w-full px-4 md:px-8 py-6"
    >
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        {/* Top Command Header */}
        <div className="bg-[#161f30] text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-300 font-label-sm uppercase font-bold tracking-wider">
                Consola Central de Administración
              </span>
              <span className="text-slate-400 font-label-sm">•</span>
              <span className="text-emerald-400 font-label-sm font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">
                  verified_user
                </span>
                Sesión Maestra: {ADMIN_EMAIL}
              </span>
            </div>
            <h1 className="font-headline-lg text-white tracking-tight">
              Dashboard de Administración · Control de Ingresos & EmailJS
            </h1>
            <p className="text-slate-300 font-body-md max-w-3xl">
              Centro unificado para otorgar el <strong>"OK" obligatorio</strong>{' '}
              a solicitudes de invitación e ingreso autorizado, monitorear
              métricas de ingresos/admisión y gestionar los envíos de correo por{' '}
              <strong>EmailJS</strong>.
            </p>
          </div>

          {/* Quick Admin Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onTriggerIncomingCall}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-label-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-400">
                ring_volume
              </span>
              <span>Simular Llamada 1-a-1</span>
            </button>

            <button
              type="button"
              onClick={onOpenPublishModal}
              className="px-3.5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white font-label-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                post_add
              </span>
              <span>Publicar Ficha B2B</span>
            </button>

            <button
              type="button"
              onClick={onResetDemoData}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-400/30 font-label-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                restart_alt
              </span>
              <span>Reiniciar Datos Demo</span>
            </button>
          </div>
        </div>

        {/* Section Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSection('all')}
              className={`px-4 py-2 rounded-lg font-title-md text-[13px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'all'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                space_dashboard
              </span>
              <span>Vista Consolidada (Todo)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('requests')}
              className={`px-4 py-2 rounded-lg font-title-md text-[13px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'requests'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                how_to_reg
              </span>
              <span>Gestión de Solicitudes & OK ({stats.totalReq})</span>
              {stats.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[11px] tabular-nums">
                  {stats.pending} pend.
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('emailjs')}
              className={`px-4 py-2 rounded-lg font-title-md text-[13px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'emailjs'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                forward_to_inbox
              </span>
              <span>Centro EmailJS & Historial ({emailLogs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('metrics')}
              className={`px-4 py-2 rounded-lg font-title-md text-[13px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'metrics'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                monitoring
              </span>
              <span>Métricas de Ingresos & Admisión</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onNavigateToLobby}
            className="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-md flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">
              storefront
            </span>
            <span>Ir al Lobby Virtual</span>
          </button>
        </div>

        {/* 1. KPI CARDS: MÉTRICAS DE INGRESOS, APROBACIONES OK Y EMAILJS */}
        {(activeSection === 'all' || activeSection === 'metrics') && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {/* KPI 1: Solicitudes Pendientes de OK */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-xs flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm uppercase text-on-surface-variant font-bold">
                    Pendientes de OK Admin
                  </span>
                  <span className="material-symbols-outlined text-amber-600 text-[22px]">
                    pending_actions
                  </span>
                </div>
                <div className="text-[30px] font-extrabold text-on-surface leading-none tabular-nums">
                  {stats.pending}
                </div>
                <div className="font-body-sm text-on-surface-variant text-[12px]">
                  Solicitudes retenidas esperando tu OK
                </div>
              </div>

              {/* KPI 2: Ingresos Aprobados con OK */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-xs flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm uppercase text-on-surface-variant font-bold">
                    Ingresos Aprobados (OK)
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[22px]">
                    verified
                  </span>
                </div>
                <div className="text-[30px] font-extrabold text-secondary leading-none tabular-nums">
                  {stats.approved}
                </div>
                <div className="font-body-sm text-on-surface-variant text-[12px]">
                  Tasa de aprobación: {stats.approvalRate}% ·{' '}
                  {stats.byAuthAttempt} vía Ingreso Autorizado
                </div>
              </div>

              {/* KPI 3: Ingresos por Acreditación Summit */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-xs flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm uppercase text-on-surface-variant font-bold">
                    Ingresos Acreditación B2B
                  </span>
                  <span className="material-symbols-outlined text-primary text-[22px]">
                    payments
                  </span>
                </div>
                <div className="text-[28px] font-extrabold text-on-surface leading-none tabular-nums">
                  USD ${stats.accreditedRevenueUsd.toLocaleString('en-US')}
                </div>
                <div className="font-body-sm text-on-surface-variant text-[12px]">
                  {companies.length} empresas en catálogo + {stats.approved}{' '}
                  nuevas
                </div>
              </div>

              {/* KPI 4: Volumen Pipeline Rondas 1-a-1 */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-xs flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm uppercase text-on-surface-variant font-bold">
                    Pipeline Rondas 1-a-1
                  </span>
                  <span className="material-symbols-outlined text-tertiary text-[22px]">
                    handshake
                  </span>
                </div>
                <div className="text-[28px] font-extrabold text-on-surface leading-none tabular-nums">
                  USD ${stats.pipelineDealsUsd.toLocaleString('en-US')}
                </div>
                <div className="font-body-sm text-on-surface-variant text-[12px]">
                  {stats.activeConnections} conexiones B2B · {meetings.length}{' '}
                  salas Jitsi
                </div>
              </div>

              {/* KPI 5: Correos Enviados por EmailJS */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-xs flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm uppercase text-on-surface-variant font-bold">
                    Notificaciones EmailJS
                  </span>
                  <span className="material-symbols-outlined text-primary text-[22px]">
                    mark_email_read
                  </span>
                </div>
                <div className="text-[30px] font-extrabold text-primary leading-none tabular-nums">
                  {emailLogs.length}
                </div>
                <div className="font-body-sm text-on-surface-variant text-[12px]">
                  {emailConfigured
                    ? 'EmailJS API en Producción'
                    : 'Bandeja Piloto Activa'}
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Chart: Evolución de Ingresos de Solicitudes, OKs y EmailJS */}
              <div className="lg:col-span-7 bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-title-md text-on-surface font-bold">
                      Curva de Ingresos de Usuarios, Aprobaciones "OK" y Tráfico
                      EmailJS
                    </h3>
                    <p className="font-body-sm text-on-surface-variant text-[12px]">
                      Seguimiento diario de solicitudes recibidas frente a
                      cuentas habilitadas por {ADMIN_EMAIL}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] font-label-sm">
                    <span className="text-primary font-bold">
                      ● Solicitudes
                    </span>
                    <span className="text-secondary font-bold">
                      ● OK Aprobados
                    </span>
                    <span className="text-amber-600 font-bold">
                      ● Correos EmailJS
                    </span>
                  </div>
                </div>

                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={intakeTrendData}
                      margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="gradSolicitudes"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#004ac6"
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="95%"
                            stopColor="#004ac6"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="gradOk"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#047857"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#047857"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="etapa"
                        tick={{ fontSize: 12, fill: '#475569' }}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="correosEmailJS"
                        name="Correos EmailJS"
                        stroke="#d97706"
                        strokeWidth={2}
                        fillOpacity={0}
                      />
                      <Area
                        type="monotone"
                        dataKey="solicitudes"
                        name="Solicitudes de Ingreso"
                        stroke="#004ac6"
                        strokeWidth={2.5}
                        fill="url(#gradSolicitudes)"
                      />
                      <Area
                        type="monotone"
                        dataKey="aprobadosOk"
                        name="Aprobados con OK Admin"
                        stroke="#047857"
                        strokeWidth={2.5}
                        fill="url(#gradOk)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Chart: Distribución por Sector & Origen de Ingreso */}
              <div className="lg:col-span-5 bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-xs flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-title-md text-on-surface font-bold">
                    Ingresos y Solicitudes por Sector Industrial
                  </h3>
                  <p className="font-body-sm text-on-surface-variant text-[12px]">
                    Participación acumulada de empresas en directorio + cola de
                    admisión
                  </p>
                </div>

                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sectorDistributionData}
                      layout="vertical"
                      margin={{ top: 0, right: 18, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#475569' }}
                      />
                      <YAxis
                        dataKey="sector"
                        type="category"
                        width={125}
                        tick={{
                          fontSize: 11,
                          fill: '#1e293b',
                          fontWeight: 600,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        dataKey="total"
                        name="Empresas / Solicitudes"
                        radius={[0, 6, 6, 0]}
                      >
                        {sectorDistributionData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={
                              SECTOR_CHART_COLORS[
                                idx % SECTOR_CHART_COLORS.length
                              ]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Breakdown by Entry Channel */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-container-high text-center">
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <div className="font-headline-sm text-primary font-extrabold tabular-nums">
                      {stats.byForm}
                    </div>
                    <div className="font-label-sm text-on-surface-variant text-[11px]">
                      Por Formulario
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <div className="font-headline-sm text-amber-700 font-extrabold tabular-nums">
                      {stats.byAuthAttempt}
                    </div>
                    <div className="font-label-sm text-on-surface-variant text-[11px]">
                      Ingreso Autorizado
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <div className="font-headline-sm text-secondary font-extrabold tabular-nums">
                      {stats.byAdminManual}
                    </div>
                    <div className="font-label-sm text-on-surface-variant text-[11px]">
                      OK Directo Admin
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. GESTIÓN CENTRALIZADA DE SOLICITUDES DE INGRESO ("OK" OBLIGATORIO ADMIN) */}
        {(activeSection === 'all' || activeSection === 'requests') && (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-xs p-6 flex flex-col gap-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-container-high pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">
                    how_to_reg
                  </span>
                  <h2 className="font-headline-sm text-on-surface font-extrabold">
                    Control de Admisión y "OK" Obligatorio del Administrador
                  </h2>
                </div>
                <p className="font-body-sm text-on-surface-variant mt-0.5">
                  Ningún usuario puede ingresar (ni por formulario ni por
                  Ingreso Autorizado) sin tu aprobación explícita aquí. Al dar
                  "OK", se notifica automáticamente por EmailJS.
                </p>
              </div>

              {/* Filter Tabs for Requests */}
              <div className="flex flex-wrap items-center gap-1.5 bg-surface-container-low p-1 rounded-xl">
                {(
                  [
                    { id: 'all', label: `Todas (${stats.totalReq})` },
                    { id: 'pending', label: `Pendientes (${stats.pending})` },
                    { id: 'approved', label: `Con OK (${stats.approved})` },
                    { id: 'rejected', label: `Rechazadas (${stats.rejected})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setReqStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-label-md transition-colors cursor-pointer ${
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

            {/* Form to Pre-Authorize / Grant Immediate OK to an Email */}
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
                <span className="font-label-sm text-on-surface-variant text-[11px]">
                  Habilita el acceso en "Ingreso Autorizado" y envía aviso por
                  EmailJS
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
                  placeholder="Nombre y Apellido"
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
                  className="px-4 py-2 rounded-lg bg-[#047857] hover:bg-[#065f46] text-white font-label-md font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                  <span>Dar OK y Notificar</span>
                </button>
              </div>
            </form>

            {/* Search bar for requests */}
            <div className="relative">
              <span className="material-symbols-outlined text-outline absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={reqSearch}
                onChange={(e) => setReqSearch(e.target.value)}
                placeholder="Buscar solicitud por correo electrónico, nombre del ejecutivo, empresa o sector..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-outline-variant font-body-sm outline-none focus:border-primary"
              />
            </div>

            {/* Requests Table / Cards */}
            {filteredRequests.length === 0 ? (
              <div className="py-10 px-4 rounded-xl bg-surface-container-low/50 border border-surface-container-high text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[30px]">
                  inbox
                </span>
                <p className="font-title-md text-on-surface">
                  No hay solicitudes que coincidan con el filtro seleccionado
                </p>
                <p className="font-body-sm text-on-surface-variant max-w-md">
                  Cuando un visitante envíe el formulario "Quiero ingresar,
                  solicito invitación" o intente validar su correo en "Ingreso
                  Autorizado", aparecerá aquí para que le des el OK.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl bg-surface border border-surface-container-high flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-title-md text-on-surface font-extrabold">
                          {req.fullName}
                        </span>
                        <span className="text-on-surface-variant font-body-sm">
                          · {req.companyName}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-label-sm font-bold ${
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
                            ? 'RECHAZADO / SIN ACCESO'
                            : '⏳ PENDIENTE DE OK OBLIGATORIO'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-on-surface-variant">
                        <span>
                          <strong>Correo:</strong> {req.email}
                        </span>
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
                          <strong>Vía:</strong>{' '}
                          {req.source === 'authorized_login_attempt'
                            ? 'Ingreso Autorizado'
                            : req.source === 'admin_manual'
                            ? 'Pre-autorización Admin'
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
                      {req.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => onApproveRequest(req)}
                          className="px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065f46] text-white font-label-md font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
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
                          className="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-on-surface-variant font-label-md cursor-pointer"
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. CENTRO CONSOLIDADO DE EMAILJS: CONFIGURACIÓN, ENVÍO SIMPLE E HISTORIAL */}
        {(activeSection === 'all' || activeSection === 'emailjs') && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left Column (5 cols): Configuración VITE_EMAILJS + Formulario de Envío Simple */}
            <div className="xl:col-span-5 flex flex-col gap-6">
              {/* Credentials Card */}
              <form
                onSubmit={handleSaveEmailJSConfig}
                className="bg-[#161f30] text-white rounded-2xl p-5 border border-slate-800 flex flex-col gap-3.5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-[20px]">
                      key
                    </span>
                    <h3 className="font-title-md text-white font-bold">
                      Credenciales EmailJS (VITE_EMAILJS_*)
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-label-sm text-[11px] font-bold ${
                      emailConfigured
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    }`}
                  >
                    {emailConfigured ? 'Conectado' : 'Modo Piloto Local'}
                  </span>
                </div>

                <p className="text-slate-300 font-body-sm text-[12px]">
                  Extrae estos 3 valores desde tu panel de{' '}
                  <strong>dashboard.emailjs.com</strong> (Email Services, Email
                  Templates y Account &rarr; Public Key) o defínelos en Netlify.
                </p>

                <div className="flex flex-col gap-2.5">
                  <div>
                    <label className="text-[11px] font-label-sm text-slate-300 block mb-1">
                      VITE_EMAILJS_SERVICE_ID (Service ID)
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
                      placeholder="Ej. service_xxx"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-white font-body-sm outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-label-sm text-slate-300 block mb-1">
                      VITE_EMAILJS_TEMPLATE_ID (Template ID)
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
                      placeholder="Ej. template_xxx"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-white font-body-sm outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-label-sm text-slate-300 block mb-1">
                      VITE_EMAILJS_PUBLIC_KEY (Public Key)
                    </label>
                    <input
                      type="text"
                      value={emailConfig.publicKey}
                      onChange={(e) =>
                        setEmailConfig({
                          ...emailConfig,
                          publicKey: e.target.value,
                        })
                      }
                      placeholder="Ej. u7XyZ_91AbCdEfGhI"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-white font-body-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {configSaved ? (
                    <span className="text-emerald-400 font-label-sm font-bold">
                      ✓ Llaves guardadas en el navegador
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">
                      Variables: {'{{to_email}}'}, {'{{cc_email}}'},{' '}
                      {'{{subject}}'}, {'{{message}}'}
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white font-label-md font-bold cursor-pointer"
                  >
                    Guardar Llaves
                  </button>
                </div>
              </form>

              {/* Simple Frontend EmailJS Send Form */}
              <form
                onSubmit={handleSendDirectEmail}
                className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high shadow-xs flex flex-col gap-3.5"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    send
                  </span>
                  <h3 className="font-title-md text-on-surface font-bold">
                    Envío Directo de Notificación EmailJS
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-label-sm text-on-surface font-bold block mb-1">
                      Tipo de Aviso
                    </label>
                    <select
                      value={notifType}
                      onChange={(e) =>
                        setNotifType(e.target.value as EmailNotificationType)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant font-body-sm outline-none"
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
                    </select>
                  </div>

                  <div>
                    <label className="font-label-sm text-on-surface font-bold block mb-1">
                      Empresa Destino
                    </label>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) =>
                        handleSelectCompanyPreset(e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant font-body-sm outline-none"
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-label-sm text-on-surface font-bold block mb-1">
                      Para (Email Corporativo) *
                    </label>
                    <input
                      type="email"
                      required
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant font-body-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-on-surface font-bold block mb-1">
                      Nombre Destinatario
                    </label>
                    <input
                      type="text"
                      value={toName}
                      onChange={(e) => setToName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant font-body-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-label-sm text-on-surface font-bold block mb-1">
                    Asunto *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant font-body-sm outline-none"
                  />
                </div>

                <div>
                  <label className="font-label-sm text-on-surface font-bold block mb-1">
                    Mensaje *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-surface border border-outline-variant font-body-sm outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-md text-[14px] flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    forward_to_inbox
                  </span>
                  <span>
                    {isSendingEmail
                      ? 'Despachando vía EmailJS...'
                      : 'Disparar Correo por EmailJS'}
                  </span>
                </button>
              </form>
            </div>

            {/* Right Column (7 cols): Historial Auditable de Correos Enviados por EmailJS */}
            <div className="xl:col-span-7 bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high shadow-xs flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container-high pb-3">
                <div>
                  <h3 className="font-headline-sm text-on-surface font-extrabold">
                    Historial de Correos Enviados por EmailJS (
                    {filteredEmailLogs.length})
                  </h3>
                  <p className="font-body-sm text-on-surface-variant">
                    Registro en tiempo real de invitaciones de conexión,
                    solicitudes de reunión 1-a-1 y aprobaciones de ingreso
                  </p>
                </div>

                {emailLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearEmailLogs}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-error-container text-on-surface-variant hover:text-error font-label-sm cursor-pointer"
                  >
                    Limpiar historial
                  </button>
                )}
              </div>

              {/* Filter pills by email notification type */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: 'Todos' },
                    { id: 'connection_invite', label: 'Conexiones B2B' },
                    { id: 'meeting_request', label: 'Reuniones 1-a-1' },
                    { id: 'access_request', label: 'Solicitudes Ingreso' },
                    { id: 'access_approved', label: 'OK Admin Otorgados' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setEmailTypeFilter(t.id)}
                    className={`px-3 py-1 rounded-lg font-label-sm transition-colors cursor-pointer ${
                      emailTypeFilter === t.id
                        ? 'bg-primary text-on-primary font-bold'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {filteredEmailLogs.length === 0 ? (
                <div className="py-12 px-4 rounded-xl bg-surface-container-low/50 border border-surface-container-high text-center flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[32px]">
                    mark_email_unread
                  </span>
                  <p className="font-title-md text-on-surface">
                    Sin correos registrados en esta categoría
                  </p>
                  <p className="font-body-sm text-on-surface-variant max-w-md">
                    Los envíos realizados desde el formulario lateral, desde las
                    tarjetas de conexión o al dar "OK" a una solicitud se
                    listarán automáticamente aquí.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[540px] overflow-y-auto pr-1">
                  {filteredEmailLogs.map((log) => (
                    <article
                      key={log.id}
                      className="p-4 rounded-xl bg-surface border border-surface-container-high flex flex-col gap-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded font-label-sm font-bold text-[11px] ${
                              log.type === 'access_approved'
                                ? 'bg-[#ECFDF5] text-[#047857]'
                                : log.type === 'access_request'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-primary-fixed text-primary'
                            }`}
                          >
                            {log.type === 'connection_invite'
                              ? 'Conexión B2B'
                              : log.type === 'meeting_request'
                              ? 'Reunión 1-a-1'
                              : log.type === 'access_request'
                              ? 'Solicitud Ingreso'
                              : 'OK Admin'}
                          </span>
                          <h4 className="font-title-md text-on-surface font-bold text-[14px]">
                            {log.subject}
                          </h4>
                        </div>
                        <span className="font-label-sm text-on-surface-variant tabular-nums">
                          {new Date(log.sentAt).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-on-surface-variant">
                        <span>
                          <strong>Para:</strong> {log.toName} ({log.toEmail})
                        </span>
                        <span>
                          <strong>CC:</strong> {log.ccAdminEmail || ADMIN_EMAIL}
                        </span>
                        <span className="text-secondary font-bold">
                          ✓ {log.statusText}
                        </span>
                      </div>

                      <p className="font-body-sm text-on-surface bg-surface-container-low p-2.5 rounded-lg mt-1">
                        {log.message}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
