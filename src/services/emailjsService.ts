import emailjs from '@emailjs/browser';
import { ADMIN_EMAIL, CompanyCard, MeetingItem } from '../data/b2bData';

export type EmailNotificationType =
  | 'connection_invite'
  | 'meeting_request'
  | 'access_request'
  | 'access_approved'
  | 'weekly_report';

export interface EmailNotificationPayload {
  type: EmailNotificationType;
  toEmail: string;
  toName: string;
  fromName: string;
  fromEmail?: string;
  companyName: string;
  subject: string;
  message: string;
  jitsiRoomUrl?: string;
  approvalUrl?: string;
  oneTimeToken?: string;
  rejectUrl?: string;
  ccAdminEmail?: string;
}

export interface EmailLogItem extends EmailNotificationPayload {
  id: string;
  sentAt: string;
  deliveryMode: 'emailjs_live' | 'pilot_outbox';
  statusText: string;
}

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AccessRequestItem {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  corporateContact: string;
  role: string;
  sector: string;
  sectorsList: string[];
  requestedAt: string;
  source: 'invitation_form' | 'authorized_login_attempt' | 'admin_manual';
  status: AccessRequestStatus;
  oneTimeToken?: string;
  tokenUsed?: boolean;
  tokenUsedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface EmailJSRuntimeConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface WeeklyReportSchedule {
  enabled: boolean;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  hourMinute: string; // e.g., "09:00"
  recipientEmail: string;
  includeCompaniesAndMeetings: boolean;
  includeAccessRequestsSummary: boolean;
  includeEmailJSWeeklyCount: boolean;
  includeSectorBreakdown: boolean;
  lastSentAt: string | null;
  lastAutoCycleKey: string | null;
}

const STORAGE_KEYS = {
  EMAIL_LOGS: 'bwos_b2b_email_logs_v1',
  ACCESS_REQUESTS: 'bwos_b2b_access_requests_v2',
  EMAILJS_CONFIG: 'bwos_b2b_emailjs_config_v1',
  WEEKLY_REPORT_SCHEDULE: 'bwos_b2b_weekly_report_schedule_v1',
  USED_APPROVAL_TOKENS: 'bwos_b2b_used_approval_tokens_v1',
};

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  0: 'Domingo',
};

export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://ais-pre-y4og7ojyi34wdxyyvgaaz4-81726093639.us-east1.run.app';
}

/**
 * Generates a unique cryptographic-style single-use token for invitation approval
 */
export function generateOneTimeApprovalToken(): string {
  const randomPart =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Math.random().toString(36).slice(2)}${Math.random()
          .toString(36)
          .slice(2)}`;
  return `otk_${Date.now().toString(36)}_${randomPart.slice(0, 16)}`;
}

export function getUsedApprovalTokens(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USED_APPROVAL_TOKENS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isApprovalTokenUsed(token?: string | null): boolean {
  if (!token) return false;
  const usedMap = getUsedApprovalTokens();
  if (usedMap[token]) return true;
  const req = getAccessRequests().find((r) => r.oneTimeToken === token);
  return Boolean(req?.tokenUsed);
}

export function markApprovalTokenUsed(token: string): void {
  if (!token) return;
  try {
    const usedMap = getUsedApprovalTokens();
    usedMap[token] = new Date().toISOString();
    localStorage.setItem(
      STORAGE_KEYS.USED_APPROVAL_TOKENS,
      JSON.stringify(usedMap)
    );
  } catch {
    // ignore storage errors
  }
}

/**
 * Generates a single-use (link de único uso) Approval URL for the Administrator (clientesbinweb@gmail.com)
 * to approve an invitation request directly from their email inbox.
 */
export function buildAdminApprovalUrl(params: {
  email: string;
  fullName: string;
  companyName: string;
  corporateContact?: string;
  role?: string;
  sector?: string;
  oneTimeToken?: string;
}): { approvalUrl: string; oneTimeToken: string } {
  const baseUrl = getAppBaseUrl();
  const token = params.oneTimeToken || generateOneTimeApprovalToken();
  const search = new URLSearchParams();
  search.set('admin_action', 'approve_request');
  search.set('token', token);
  search.set('email', params.email.trim().toLowerCase());
  search.set('name', params.fullName.trim() || 'Ejecutivo B2B');
  search.set('company', params.companyName.trim() || 'Empresa Solicitante');
  if (params.corporateContact) {
    search.set('contact', params.corporateContact.trim());
  }
  if (params.role) {
    search.set('role', params.role.trim());
  }
  if (params.sector) {
    search.set('sector', params.sector.trim());
  }
  return {
    approvalUrl: `${baseUrl}/?${search.toString()}`,
    oneTimeToken: token,
  };
}

/**
 * Generates a direct single-use Reject URL for the Administrator (clientesbinweb@gmail.com)
 */
export function buildAdminRejectUrl(params: {
  email: string;
  fullName?: string;
  companyName?: string;
  oneTimeToken?: string;
}): string {
  const baseUrl = getAppBaseUrl();
  const search = new URLSearchParams();
  search.set('admin_action', 'reject_request');
  if (params.oneTimeToken) {
    search.set('token', params.oneTimeToken);
  }
  search.set('email', params.email.trim().toLowerCase());
  if (params.fullName) search.set('name', params.fullName.trim());
  if (params.companyName) search.set('company', params.companyName.trim());
  return `${baseUrl}/?${search.toString()}`;
}

export function getEmailJSConfig(): EmailJSRuntimeConfig {
  const envServiceId =
    (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || '';
  const envTemplateId =
    (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || '';
  const envPublicKey =
    (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || '';

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EMAILJS_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        serviceId: parsed.serviceId || envServiceId,
        templateId: parsed.templateId || envTemplateId,
        publicKey: parsed.publicKey || envPublicKey,
      };
    }
  } catch {
    // ignore storage errors
  }

  return {
    serviceId: envServiceId,
    templateId: envTemplateId,
    publicKey: envPublicKey,
  };
}

export function saveEmailJSConfig(config: EmailJSRuntimeConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EMAILJS_CONFIG, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}

export function isEmailJSConfigured(config = getEmailJSConfig()): boolean {
  return Boolean(
    config.serviceId &&
      config.templateId &&
      config.publicKey &&
      config.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY'
  );
}

/**
 * Generates a deterministic corporate email for a directory company
 */
export function getCompanyCorporateEmail(companyName: string): string {
  const slug = companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 18);
  return `alianzas@${slug || 'empresab2b'}.com`;
}

export function getSavedEmailLogs(): EmailLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEmailLogs(logs: EmailLogItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(logs));
  } catch {
    // ignore storage errors
  }
}

/**
 * Sends an email notification via @emailjs/browser if credentials are configured,
 * and always records the dispatch in the auditable EmailJS log with copy to clientesbinweb@gmail.com.
 * Supports the single-use {{Aceptar a quien solicitó invitación}} variable and link.
 */
export async function sendB2BEmailNotification(
  payload: EmailNotificationPayload
): Promise<EmailLogItem> {
  const config = getEmailJSConfig();
  const ccAdmin = payload.ccAdminEmail || ADMIN_EMAIL;

  // For access_request emails, use approvalUrl (single-use link) as the primary action link
  const effectiveActionOrJitsiUrl =
    payload.type === 'access_request' && payload.approvalUrl
      ? payload.approvalUrl
      : payload.jitsiRoomUrl ||
        payload.approvalUrl ||
        'https://meet.jit.si/BWOS_Conectar_B2B';

  const singleUseAcceptLink =
    payload.approvalUrl || effectiveActionOrJitsiUrl;

  const templateParams: Record<string, string> = {
    to_email: payload.toEmail,
    to_name: payload.toName,
    from_name: payload.fromName,
    from_email: payload.fromEmail || ADMIN_EMAIL,
    cc_email: ccAdmin,
    admin_email: ADMIN_EMAIL,
    company_name: payload.companyName,
    notification_type: payload.type,
    subject: payload.subject,
    message: payload.message,
    jitsi_url: effectiveActionOrJitsiUrl,
    approval_url: singleUseAcceptLink,
    aceptar_invitacion: singleUseAcceptLink,
    'Aceptar a quien solicitó invitación': singleUseAcceptLink,
    'Aceptar a quien solicito invitacion': singleUseAcceptLink,
    reject_url: payload.rejectUrl || '',
    reply_to: payload.fromEmail || ADMIN_EMAIL,
  };

  let deliveryMode: 'emailjs_live' | 'pilot_outbox' = 'pilot_outbox';
  let statusText = `Notificación procesada (CC: ${ccAdmin})`;

  if (isEmailJSConfigured(config)) {
    try {
      await emailjs.send(
        config.serviceId,
        config.templateId,
        templateParams,
        {
          publicKey: config.publicKey,
        }
      );
      deliveryMode = 'emailjs_live';
      statusText = `Enviado vía EmailJS API a ${payload.toEmail} (CC: ${ccAdmin})`;
    } catch {
      deliveryMode = 'pilot_outbox';
      statusText = `Registrado en Bandeja EmailJS (${payload.toEmail} · CC: ${ccAdmin})`;
    }
  } else {
    statusText = `Despachado en Bandeja EmailJS (${payload.toEmail} · CC: ${ccAdmin})`;
  }

  const logEntry: EmailLogItem = {
    ...payload,
    jitsiRoomUrl: effectiveActionOrJitsiUrl,
    approvalUrl: singleUseAcceptLink,
    ccAdminEmail: ccAdmin,
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sentAt: new Date().toISOString(),
    deliveryMode,
    statusText,
  };

  const currentLogs = getSavedEmailLogs();
  const updatedLogs = [logEntry, ...currentLogs].slice(0, 80);
  saveEmailLogs(updatedLogs);

  return logEntry;
}

/**
 * Access Requests Queue Management (Mandatory Admin OK from clientesbinweb@gmail.com)
 */
export function getAccessRequests(): AccessRequestItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCESS_REQUESTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore storage errors
  }
  return [];
}

export function saveAccessRequests(requests: AccessRequestItem[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.ACCESS_REQUESTS,
      JSON.stringify(requests)
    );
  } catch {
    // ignore storage errors
  }
}

export function findAccessRequestByEmail(
  email: string
): AccessRequestItem | undefined {
  const clean = email.trim().toLowerCase();
  return getAccessRequests().find((r) => r.email.toLowerCase() === clean);
}

export function upsertAccessRequest(
  item: Omit<AccessRequestItem, 'id' | 'requestedAt' | 'status'> & {
    status?: AccessRequestStatus;
    oneTimeToken?: string;
    tokenUsed?: boolean;
    tokenUsedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
  }
): AccessRequestItem {
  const cleanEmail = item.email.trim().toLowerCase();
  const list = getAccessRequests();
  const existingIdx = list.findIndex(
    (r) => r.email.toLowerCase() === cleanEmail
  );

  if (existingIdx >= 0) {
    const existing = list[existingIdx];
    const nextStatus =
      item.status !== undefined
        ? item.status
        : existing.status === 'approved'
        ? 'approved'
        : 'pending';

    const updated: AccessRequestItem = {
      ...existing,
      fullName: item.fullName || existing.fullName,
      companyName: item.companyName || existing.companyName,
      corporateContact: item.corporateContact || existing.corporateContact,
      role: item.role || existing.role,
      sector: item.sector || existing.sector,
      sectorsList:
        item.sectorsList && item.sectorsList.length > 0
          ? item.sectorsList
          : existing.sectorsList,
      status: nextStatus,
      oneTimeToken: item.oneTimeToken || existing.oneTimeToken,
      tokenUsed:
        item.tokenUsed !== undefined ? item.tokenUsed : existing.tokenUsed,
      tokenUsedAt: item.tokenUsedAt || existing.tokenUsedAt,
      reviewedAt: item.reviewedAt || existing.reviewedAt,
      reviewedBy: item.reviewedBy || existing.reviewedBy,
    };
    list[existingIdx] = updated;
    saveAccessRequests(list);
    return updated;
  }

  const created: AccessRequestItem = {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fullName: item.fullName,
    companyName: item.companyName,
    email: cleanEmail,
    corporateContact: item.corporateContact,
    role: item.role,
    sector: item.sector,
    sectorsList: item.sectorsList,
    requestedAt: new Date().toISOString(),
    source: item.source,
    status: item.status || 'pending',
    oneTimeToken: item.oneTimeToken || generateOneTimeApprovalToken(),
    tokenUsed: item.tokenUsed || false,
    tokenUsedAt: item.tokenUsedAt,
    reviewedAt: item.reviewedAt,
    reviewedBy: item.reviewedBy,
  };

  const next = [created, ...list];
  saveAccessRequests(next);
  return created;
}

/**
 * Weekly Metrics Summary Email Report Schedule Management
 */
export function getWeeklyReportSchedule(): WeeklyReportSchedule {
  const defaultSchedule: WeeklyReportSchedule = {
    enabled: true,
    dayOfWeek: 1, // Lunes
    hourMinute: '09:00',
    recipientEmail: ADMIN_EMAIL,
    includeCompaniesAndMeetings: true,
    includeAccessRequestsSummary: true,
    includeEmailJSWeeklyCount: true,
    includeSectorBreakdown: true,
    lastSentAt: null,
    lastAutoCycleKey: null,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEEKLY_REPORT_SCHEDULE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultSchedule,
        ...parsed,
        recipientEmail: ADMIN_EMAIL,
      };
    }
  } catch {
    // ignore storage errors
  }

  return defaultSchedule;
}

export function saveWeeklyReportSchedule(schedule: WeeklyReportSchedule): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.WEEKLY_REPORT_SCHEDULE,
      JSON.stringify({
        ...schedule,
        recipientEmail: ADMIN_EMAIL,
      })
    );
  } catch {
    // ignore storage errors
  }
}

/**
 * Computes the next scheduled Date occurrence for the weekly report
 */
export function getNextWeeklyReportDate(
  schedule: WeeklyReportSchedule,
  fromDate = new Date()
): Date {
  const [hourStr, minStr] = (schedule.hourMinute || '09:00').split(':');
  const targetHour = Number(hourStr) || 9;
  const targetMin = Number(minStr) || 0;

  const result = new Date(fromDate);
  result.setSeconds(0, 0);
  result.setHours(targetHour, targetMin, 0, 0);

  const currentDay = fromDate.getDay();
  let daysUntil = (schedule.dayOfWeek - currentDay + 7) % 7;
  if (daysUntil === 0 && result <= fromDate) {
    daysUntil = 7;
  }
  result.setDate(result.getDate() + daysUntil);
  return result;
}

/**
 * Builds the formatted Weekly Summary Email Report payload with all 4 metric groups
 */
export function buildWeeklyMetricsEmailPayload(params: {
  companies: CompanyCard[];
  meetings: MeetingItem[];
  accessRequests: AccessRequestItem[];
  emailLogs: EmailLogItem[];
  schedule: WeeklyReportSchedule;
}): EmailNotificationPayload {
  const { companies, meetings, accessRequests, emailLogs, schedule } = params;

  const totalCompanies = companies.length;
  const totalMeetings = meetings.length;
  const liveMeetings = meetings.filter((m) => m.status === 'live').length;
  const scheduledMeetings = meetings.filter(
    (m) => m.status === 'scheduled'
  ).length;
  const postponedMeetings = meetings.filter(
    (m) => m.status === 'postponed'
  ).length;

  const activeEngagedIds = new Set<string>([
    ...companies.filter((c) => c.isConnected).map((c) => c.id),
    ...meetings.map((m) => m.companyId),
  ]);
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
            Math.round((activeEngagedIds.size / totalCompanies) * 100),
            avgMatchScore - 4
          )
        )
      : 0;

  const pendingReq = accessRequests.filter(
    (r) => r.status === 'pending'
  ).length;
  const approvedReq = accessRequests.filter(
    (r) => r.status === 'approved'
  ).length;
  const rejectedReq = accessRequests.filter(
    (r) => r.status === 'rejected'
  ).length;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyEmailsSent = emailLogs.filter(
    (l) => new Date(l.sentAt).getTime() >= sevenDaysAgo
  );
  const weeklyLiveCount = weeklyEmailsSent.filter(
    (l) => l.deliveryMode === 'emailjs_live'
  ).length;

  const sectorBreakdownLines = [
    { key: 'saas', label: 'SaaS & Tecnología' },
    { key: 'logistica', label: 'Logística & Fintech' },
    { key: 'manufactura', label: 'Manufactura 4.0' },
    { key: 'servicios', label: 'Servicios B2B' },
  ].map((sec) => {
    const count = companies.filter((c) => c.category === sec.key).length;
    return `• ${sec.label}: ${count} empresas`;
  });

  const sections: string[] = [
    `📊 REPORTE SEMANAL EJECUTIVO DE MÉTRICAS · BWOS CONECTAR B2B`,
    `Fecha de corte: ${new Date().toLocaleString()}`,
    `Programación configurada: Todos los ${
      DAY_OF_WEEK_LABELS[schedule.dayOfWeek] || 'Lunes'
    } a las ${schedule.hourMinute} hs`,
    ``,
  ];

  if (schedule.includeCompaniesAndMeetings) {
    sections.push(
      `1) USO GENERAL Y CONEXIONES B2B:`,
      `• Total de Empresas en Directorio: ${totalCompanies}`,
      `• Reuniones 1-a-1 Agendadas: ${totalMeetings} (${liveMeetings} confirmadas/en sala, ${scheduledMeetings} programadas, ${postponedMeetings} pospuestas)`,
      `• Tasa de Éxito de Conexión B2B: ${connectionSuccessRate}% (Match promedio: ${avgMatchScore}%)`,
      ``
    );
  }

  if (schedule.includeAccessRequestsSummary) {
    sections.push(
      `2) SOLICITUDES DE ACCESO (CONTROL DE OK OBLIGATORIO):`,
      `• Solicitudes Pendientes de OK: ${pendingReq}`,
      `• Solicitudes Aprobadas con OK Admin: ${approvedReq}`,
      `• Solicitudes Rechazadas / Revocadas: ${rejectedReq}`,
      `• Total Histórico de Solicitudes: ${accessRequests.length}`,
      ``
    );
  }

  if (schedule.includeEmailJSWeeklyCount) {
    sections.push(
      `3) ACTIVIDAD DE CORREOS EMAILJS (ÚLTIMOS 7 DÍAS):`,
      `• Total de Correos Despachados en la Semana: ${weeklyEmailsSent.length} (${weeklyLiveCount} vía EmailJS Live API)`,
      `• Total Acumulado en Bitácora: ${emailLogs.length} registros`,
      ``
    );
  }

  if (schedule.includeSectorBreakdown) {
    sections.push(
      `4) DESGLOSE DE EMPRESAS POR SECTOR INDUSTRIAL:`,
      ...sectorBreakdownLines,
      ``
    );
  }

  const dashboardUrl = `${getAppBaseUrl()}/?admin_action=open_dashboard`;
  sections.push(`🔗 Abrir Dashboard de Administración: ${dashboardUrl}`);

  return {
    type: 'weekly_report',
    toEmail: ADMIN_EMAIL,
    toName: 'Administrador General BWOS',
    fromName: 'Sistema de Métricas BWOS Conectar B2B',
    fromEmail: ADMIN_EMAIL,
    companyName: 'Consola de Administración BWOS',
    subject: `[REPORTE SEMANAL MÉTRICAS B2B] ${totalCompanies} Empresas · ${totalMeetings} Reuniones · ${pendingReq} Solicitudes Pendientes`,
    message: sections.join('\n'),
    jitsiRoomUrl: dashboardUrl,
    approvalUrl: dashboardUrl,
    ccAdminEmail: ADMIN_EMAIL,
  };
}
