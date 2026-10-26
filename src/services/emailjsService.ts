import emailjs from '@emailjs/browser';
import { ADMIN_EMAIL } from '../data/b2bData';

export type EmailNotificationType =
  | 'connection_invite'
  | 'meeting_request'
  | 'access_request'
  | 'access_approved';

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
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface EmailJSRuntimeConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

const STORAGE_KEYS = {
  EMAIL_LOGS: 'bwos_b2b_email_logs_v1',
  ACCESS_REQUESTS: 'bwos_b2b_access_requests_v2',
  EMAILJS_CONFIG: 'bwos_b2b_emailjs_config_v1',
};

export function getEmailJSConfig(): EmailJSRuntimeConfig {
  const envServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
  const envTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
  const envPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EMAILJS_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      const chosenServiceId =
        parsed.serviceId && parsed.serviceId !== 'service_bwos_b2b'
          ? parsed.serviceId
          : envServiceId || parsed.serviceId || '';
      const chosenTemplateId =
        parsed.templateId && parsed.templateId !== 'template_bwos_notificacion'
          ? parsed.templateId
          : envTemplateId || parsed.templateId || '';
      const chosenPublicKey =
        parsed.publicKey && parsed.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY'
          ? parsed.publicKey
          : envPublicKey || parsed.publicKey || '';

      return {
        serviceId: chosenServiceId,
        templateId: chosenTemplateId,
        publicKey: chosenPublicKey,
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
 */
export async function sendB2BEmailNotification(
  payload: EmailNotificationPayload
): Promise<EmailLogItem> {
  const config = getEmailJSConfig();
  const ccAdmin = payload.ccAdminEmail || ADMIN_EMAIL;

  const templateParams: Record<string, unknown> = {
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
    jitsi_url: payload.jitsiRoomUrl || 'https://meet.jit.si/BWOS_Conectar_B2B',
    reply_to: payload.fromEmail || ADMIN_EMAIL,

    // Aliases to support various EmailJS template parameter naming conventions
    email: payload.toEmail,
    name: payload.toName,
    user_email: payload.toEmail,
    user_name: payload.toName,
    recipient_email: payload.toEmail,
    recipient_name: payload.toName,
    sender_name: payload.fromName,
    sender_email: payload.fromEmail || ADMIN_EMAIL,
  };

  let deliveryMode: 'emailjs_live' | 'pilot_outbox' = 'pilot_outbox';
  let statusText = `Notificación procesada (CC: ${ccAdmin})`;

  if (isEmailJSConfigured(config)) {
    try {
      const response = await emailjs.send(
        config.serviceId,
        config.templateId,
        templateParams,
        {
          publicKey: config.publicKey,
        }
      );
      deliveryMode = 'emailjs_live';
      statusText = `Enviado en vivo vía EmailJS (${response.status} ${response.text}) a ${payload.toEmail} (CC: ${ccAdmin})`;
    } catch (err: any) {
      console.error('[EmailJS Send Error]', err);
      deliveryMode = 'pilot_outbox';
      const errMsg = err?.text || err?.message || 'Error desconocido EmailJS';
      statusText = `Error EmailJS API (${errMsg}) · Registrado en bandeja (${payload.toEmail} · CC: ${ccAdmin})`;
    }
  } else {
    statusText = `Despachado en Bandeja EmailJS (${payload.toEmail} · CC: ${ccAdmin})`;
  }

  const logEntry: EmailLogItem = {
    ...payload,
    ccAdminEmail: ccAdmin,
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sentAt: new Date().toISOString(),
    deliveryMode,
    statusText,
  };

  const currentLogs = getSavedEmailLogs();
  const updatedLogs = [logEntry, ...currentLogs].slice(0, 60);
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
  }
): AccessRequestItem {
  const cleanEmail = item.email.trim().toLowerCase();
  const list = getAccessRequests();
  const existingIdx = list.findIndex(
    (r) => r.email.toLowerCase() === cleanEmail
  );

  if (existingIdx >= 0) {
    const existing = list[existingIdx];
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
      // Preserve 'approved' status if already approved by Admin unless explicitly overridden
      status:
        item.status !== undefined
          ? item.status
          : existing.status === 'approved'
          ? 'approved'
          : 'pending',
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
  };

  const next = [created, ...list];
  saveAccessRequests(next);
  return created;
}
