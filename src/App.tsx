import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccreditationView } from './components/AccreditationView';
import { AdminApprovalAndEmailModal } from './components/AdminApprovalAndEmailModal';
import { AdminDashboardView } from './components/AdminDashboardView';
import { IncomingCallModal } from './components/IncomingCallModal';
import { InstitutionalFooter } from './components/InstitutionalFooter';
import {
  InvitationGateView,
  InvitationRequestData,
} from './components/InvitationGateView';
import {
  InlineLegalRedBanner,
  LegalRedNoticeModal,
} from './components/LegalRedNoticeModal';
import {
  B2B_SECTOR_OPTIONS,
  MultiSectorSelector,
} from './components/MultiSectorSelector';
import { MvpDevelopmentBanner } from './components/MvpDevelopmentBanner';
import { NetworkingInsights } from './components/NetworkingInsights';
import { VirtualCallRoom } from './components/VirtualCallRoom';
import {
  ADMIN_EMAIL,
  ADMIN_USERS,
  CompanyCard,
  DEFAULT_INCOMING_CALL,
  EXECUTIVE_AVATARS,
  INITIAL_COMPANIES,
  INITIAL_MEETINGS,
  IncomingCallData,
  MeetingItem,
  SECONDARY_ADMIN_EMAIL,
  UserProfile,
  isAdminEmail,
} from './data/b2bData';
import {
  AccessRequestItem,
  EmailLogItem,
  EmailNotificationPayload,
  WeeklyReportSchedule,
  buildWeeklyMetricsEmailPayload,
  findAccessRequestByEmail,
  getAccessRequests,
  getCompanyCorporateEmail,
  getSavedEmailLogs,
  getWeeklyReportSchedule,
  isApprovalTokenUsed,
  markApprovalTokenUsed,
  saveAccessRequests,
  saveEmailLogs,
  saveWeeklyReportSchedule,
  sendB2BEmailNotification,
  upsertAccessRequest,
} from './services/emailjsService';

type MainView =
  | 'lobby'
  | 'bw2-directory'
  | 'accreditation'
  | 'connections'
  | 'agenda'
  | 'virtual-room'
  | 'admin-dashboard';

const STORAGE_KEYS = {
  INVITATION_GRANTED: 'bwos_b2b_invitation_granted_v2',
  ADMIN_EMAIL: 'bwos_b2b_admin_email_v2',
  PROFILE: 'bwos_b2b_user_profile_v1',
  COMPANIES: 'bwos_b2b_companies_v2',
  MEETINGS: 'bwos_b2b_meetings_v1',
};

const ITEMS_PER_PAGE = 8;

export default function App() {
  // Access Requests Queue (Mandatory Admin OK from clientesbinweb@gmail.com)
  const [accessRequests, setAccessRequests] = useState<AccessRequestItem[]>(
    () => getAccessRequests()
  );

  // EmailJS Dispatched Logs State
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>(() =>
    getSavedEmailLogs()
  );

  // Weekly Summary Metrics Email Report Schedule State
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyReportSchedule>(
    () => getWeeklyReportSchedule()
  );

  // Mandatory Invitation Gate State (Default false: requires Admin OK or Admin email)
  const [hasInvitationAccess, setHasInvitationAccess] = useState<boolean>(
    () => {
      try {
        const granted =
          localStorage.getItem(STORAGE_KEYS.INVITATION_GRANTED) === 'true';
        const storedEmail = (
          localStorage.getItem(STORAGE_KEYS.ADMIN_EMAIL) || ''
        )
          .trim()
          .toLowerCase();
        if (!granted || !storedEmail) return false;
        if (isAdminEmail(storedEmail)) return true;
        const req = findAccessRequestByEmail(storedEmail);
        return Boolean(req && req.status === 'approved');
      } catch {
        return false;
      }
    }
  );

  // Active Session Email State
  const [sessionEmail, setSessionEmail] = useState<string>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEYS.ADMIN_EMAIL) || '')
        .trim()
        .toLowerCase();
    } catch {
      return '';
    }
  });

  // Admin Session State (True for clientesbinweb@gmail.com and somosbwos@gmail.com)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return isAdminEmail(localStorage.getItem(STORAGE_KEYS.ADMIN_EMAIL));
    } catch {
      return false;
    }
  });

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Companies Catalog State
  const [companies, setCompanies] = useState<CompanyCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
    } catch {
      return INITIAL_COMPANIES;
    }
  });

  // Meetings / Agenda State
  const [meetings, setMeetings] = useState<MeetingItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEETINGS);
      return saved ? JSON.parse(saved) : INITIAL_MEETINGS;
    } catch {
      return INITIAL_MEETINGS;
    }
  });

  // Navigation & Active View State
  const [activeView, setActiveView] = useState<MainView>('lobby');
  const [activeCallCompany, setActiveCallCompany] = useState<CompanyCard>(
    () => INITIAL_COMPANIES[4] || INITIAL_COMPANIES[0]
  );

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<
    'all' | 'saas' | 'logistica' | 'manufactura' | 'servicios'
  >('all');
  const [selectedSubSector, setSelectedSubSector] = useState<string>('ALL');
  const [onlyImmediateMatch, setOnlyImmediateMatch] = useState(false);
  const [minMatchFilter, setMinMatchFilter] = useState<number>(0);
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'match' | 'response'>('match');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const directoryGridRef = useRef<HTMLElement | null>(null);

  // Live Active Executives Counter (subtle heartbeat)
  const [activeExecsCount, setActiveExecsCount] = useState<number>(142);

  // Modals State
  const [speedPitchTarget, setSpeedPitchTarget] = useState<CompanyCard | null>(
    null
  );
  const [pitchMessage, setPitchMessage] = useState<string>('');
  const [pitchRecipientEmail, setPitchRecipientEmail] = useState<string>('');
  const [sendPitchEmailToggle, setSendPitchEmailToggle] =
    useState<boolean>(true);
  const [emailModalState, setEmailModalState] = useState<{
    isOpen: boolean;
    tab: 'approvals' | 'compose' | 'logs';
  }>({ isOpen: false, tab: 'compose' });
  const [isIncomingCallOpen, setIsIncomingCallOpen] = useState<boolean>(false);
  const [incomingCallData, setIncomingCallData] = useState<IncomingCallData>(
    DEFAULT_INCOMING_CALL
  );
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] =
    useState<boolean>(false);
  const [legalModalSection, setLegalModalSection] = useState<string | null>(
    null
  );

  // New Offer/Demand Form State
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newRepName, setNewRepName] = useState('');
  const [newRepRole, setNewRepRole] = useState('');
  const [newLocation, setNewLocation] = useState('Bogotá, Colombia');
  const [newCategory, setNewCategory] = useState<
    'saas' | 'logistica' | 'manufactura' | 'servicios'
  >('saas');
  const [newSectorsList, setNewSectorsList] = useState<string[]>([
    'SaaS & Tecnología',
  ]);
  const [newOfferText, setNewOfferText] = useState('');
  const [newOfferTags, setNewOfferTags] = useState('');
  const [newDemandText, setNewDemandText] = useState('');
  const [newDemandTags, setNewDemandTags] = useState('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    subtitle?: string;
  } | null>(null);

  const showToast = (title: string, subtitle?: string) => {
    setToastMessage({ title, subtitle });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Persist to localStorage
  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
      } else {
        localStorage.removeItem(STORAGE_KEYS.PROFILE);
      }
    } catch {
      // ignore storage errors
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    } catch {
      // ignore storage errors
    }
  }, [companies]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
    } catch {
      // ignore storage errors
    }
  }, [meetings]);

  // Subtle live counter heartbeat
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveExecsCount((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        const next = prev + delta;
        if (next < 138) return 140;
        if (next > 149) return 146;
        return next;
      });
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  // Filtered & Sorted Companies
  const filteredCompanies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return companies
      .filter((c) => {
        if (selectedSector !== 'all' && c.category !== selectedSector) {
          return false;
        }
        if (selectedSubSector !== 'ALL') {
          const subOption = B2B_SECTOR_OPTIONS.find(
            (opt) => opt.id === selectedSubSector
          );
          if (subOption) {
            const matchesCategory = c.category === subOption.categoryKey;
            const matchesText =
              c.sectorLabel
                .toLowerCase()
                .includes(subOption.label.split(' ')[0].toLowerCase()) ||
              matchesCategory;
            if (!matchesText) return false;
          }
        }
        if (onlyImmediateMatch && !c.immediateCallAvailable) {
          return false;
        }
        if (minMatchFilter > 0 && c.matchScore < minMatchFilter) {
          return false;
        }
        if (countryFilter !== 'ALL' && c.countryCode !== countryFilter) {
          return false;
        }
        if (q.length > 0) {
          const haystack = [
            c.name,
            c.location,
            c.sectorLabel,
            c.summaryDescription,
            c.representative.name,
            c.representative.role,
            c.offer.badge,
            c.offer.description,
            ...c.offer.tags,
            c.demand.badge,
            c.demand.description,
            ...c.demand.tags,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') {
          return b.matchScore - a.matchScore;
        }
        return a.name.localeCompare(b.name);
      });
  }, [
    companies,
    searchQuery,
    selectedSector,
    selectedSubSector,
    onlyImmediateMatch,
    minMatchFilter,
    countryFilter,
    sortBy,
  ]);

  // Reset page to 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedSector,
    selectedSubSector,
    onlyImmediateMatch,
    minMatchFilter,
    countryFilter,
    sortBy,
  ]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE)),
    [filteredCompanies.length]
  );

  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  // Keep currentPage state synchronized if totalPages shrinks
  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  const paginatedCompanies = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredCompanies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCompanies, safeCurrentPage]);

  const handlePageChange = (targetPage: number) => {
    const clampedPage = Math.max(1, Math.min(targetPage, totalPages));
    setCurrentPage(clampedPage);
    requestAnimationFrame(() => {
      if (directoryGridRef.current) {
        directoryGridRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  };

  const sectorCounts = useMemo(() => {
    return {
      all: companies.length,
      saas: companies.filter((c) => c.category === 'saas').length,
      logistica: companies.filter((c) => c.category === 'logistica').length,
      manufactura: companies.filter((c) => c.category === 'manufactura').length,
      servicios: companies.filter((c) => c.category === 'servicios').length,
    };
  }, [companies]);

  const connectedCompanies = useMemo(
    () => companies.filter((c) => c.isConnected || c.isBookmarked),
    [companies]
  );

  // Handlers
  const handleCompleteAccreditation = (profile: UserProfile) => {
    setUserProfile(profile);

    // Also add or update the user's company card in the live directory
    const userCardId = 'user-accredited-company';
    const flagMap: Record<string, { flag: string; code: string; city: string }> =
      {
        '+52': { flag: '🇲🇽', code: 'MX', city: 'Ciudad de México, MX' },
        '+54': { flag: '🇦🇷', code: 'AR', city: 'Buenos Aires, AR' },
        '+56': { flag: '🇨🇱', code: 'CL', city: 'Santiago, CL' },
        '+57': { flag: '🇨🇴', code: 'CO', city: 'Bogotá, CO' },
        '+51': { flag: '🇵🇪', code: 'PE', city: 'Lima, PE' },
        '+34': { flag: '🇪🇸', code: 'ES', city: 'Madrid, ES' },
        '+1': { flag: '🇺🇸', code: 'US', city: 'Miami, US' },
      };
    const locInfo = flagMap[profile.countryCode] || flagMap['+52'];

    const userCard: CompanyCard = {
      id: userCardId,
      name: profile.companyName,
      shortCode: profile.companyName.slice(0, 2).toUpperCase(),
      iconName: 'domain_verification',
      verified: true,
      location: locInfo.city,
      countryFlag: locInfo.flag,
      countryCode: locInfo.code,
      category: 'servicios',
      sectorLabel: 'Empresa Acreditada en Vivo',
      matchScore: 99,
      responseTime: 'Resp. Inmediata',
      tierBadge: 'Tu Ficha B2B',
      summaryDescription: profile.offering,
      representative: {
        name: profile.fullName,
        role: 'Directivo Acreditado · Summit 2025',
        icon: 'person',
        avatarUrl: EXECUTIVE_AVATARS[0],
        whatsapp: `${profile.countryCode}${profile.phone}`,
      },
      offer: {
        badge: 'Oferta Acreditada',
        description: profile.offering,
        tags: [
          profile.offering.slice(0, 32) + '...',
          'Disponibilidad Inmediata',
        ],
      },
      demand: {
        badge: 'Demanda Acreditada',
        description: profile.demand,
        tags: [profile.demand.slice(0, 32) + '...', 'Ronda 1-a-1 Activa'],
      },
      footerNote: 'Tu Credencial B2B Activa',
      footerIcon: 'verified',
      mutualConnections: 8,
      logoUrl: EXECUTIVE_AVATARS[0],
      immediateCallAvailable: true,
      jitsiRoomName: `BWOS_Conectar_B2B_${profile.companyName.replace(
        /[^a-zA-Z0-9]/g,
        '_'
      )}`,
    };

    setCompanies((prev) => {
      const filtered = prev.filter((c) => c.id !== userCardId);
      return [userCard, ...filtered];
    });

    setActiveView('lobby');
    showToast(
      `¡Bienvenido/a ${profile.fullName}!`,
      `Tu ficha de ${profile.companyName} ya está sincronizada en el Lobby Virtual.`
    );
  };

  const handleOpenSpeedPitch = (company: CompanyCard) => {
    setSpeedPitchTarget(company);
    setPitchRecipientEmail(getCompanyCorporateEmail(company.name));
    setSendPitchEmailToggle(true);
    setPitchMessage(
      `Hola ${company.representative.name}, revisé su requerimiento de "${company.demand.badge}" en BWOS Conectar B2B y contamos con disponibilidad inmediata para homologar.`
    );
  };

  const handleToggleQuickConnect = (company: CompanyCard) => {
    if (company.isConnected) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, isConnected: false } : c))
      );
      showToast(
        `Vínculo actualizado`,
        `Se restableció el estado de conexión con ${company.name}.`
      );
    } else {
      handleOpenSpeedPitch(company);
    }
  };

  const handleToggleBookmark = (companyId: string) => {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id === companyId) {
          const next = !c.isBookmarked;
          showToast(
            next ? 'Empresa guardada en Favoritos' : 'Removida de Favoritos',
            c.name
          );
          return { ...c, isBookmarked: next };
        }
        return c;
      })
    );
  };

  const handleSendConnectionAndJoinRoom = async (
    joinVideoImmediately: boolean
  ) => {
    if (!speedPitchTarget) return;
    const target = speedPitchTarget;
    const recipientEmail =
      pitchRecipientEmail.trim() || getCompanyCorporateEmail(target.name);
    const senderName =
      userProfile?.fullName ||
      (isAdmin ? 'Administrador BWOS' : 'Ejecutivo Acreditado B2B');
    const senderCompany =
      userProfile?.companyName ||
      (isAdmin ? 'Dirección General BWOS' : 'Empresa Invitada B2B');

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === target.id
          ? {
              ...c,
              isConnected: true,
              pitchMessageSent: pitchMessage.trim(),
            }
          : c
      )
    );

    // Ensure meeting is in Agenda B2B
    setMeetings((prev) => {
      const exists = prev.some((m) => m.companyId === target.id);
      if (exists) return prev;
      const newMeet: MeetingItem = {
        id: `meet-${Date.now()}`,
        companyId: target.id,
        companyName: target.name,
        repName: target.representative.name,
        repRole: target.representative.role,
        repAvatar: target.representative.avatarUrl || target.logoUrl,
        matchScore: target.matchScore,
        topic:
          pitchMessage.trim() ||
          `Ronda de vinculación comercial: ${target.offer.badge}`,
        offerTag: target.offer.tags[0] || target.offer.badge,
        demandTag: target.demand.tags[0] || target.demand.badge,
        status: joinVideoImmediately ? 'live' : 'scheduled',
        timeSlot: joinVideoImmediately
          ? 'En vivo ahora · Sala Jitsi'
          : 'Hoy · Próximo turno 1-a-1',
        roomNumber: `SALA #${Math.floor(10 + Math.random() * 40)}`,
        jitsiRoomName: target.jitsiRoomName,
      };
      return [newMeet, ...prev];
    });

    setSpeedPitchTarget(null);

    if (sendPitchEmailToggle) {
      await sendB2BEmailNotification({
        type: joinVideoImmediately ? 'meeting_request' : 'connection_invite',
        toEmail: recipientEmail,
        toName: target.representative.name,
        fromName: senderName,
        fromEmail: isAdmin ? ADMIN_EMAIL : undefined,
        companyName: target.name,
        subject: joinVideoImmediately
          ? `[BWOS Conectar B2B] Solicitud de Reunión 1-a-1 Jitsi de ${senderCompany}`
          : `[BWOS Conectar B2B] Nueva Invitación de Conexión de ${senderCompany}`,
        message:
          pitchMessage.trim() ||
          `Hola ${target.representative.name}, te invitamos a conectar y coordinar una ronda 1-a-1 en BWOS Conectar B2B.`,
        jitsiRoomUrl: `https://meet.jit.si/${target.jitsiRoomName}`,
        ccAdminEmail: ADMIN_EMAIL,
      });
      setEmailLogs(getSavedEmailLogs());
    }

    if (joinVideoImmediately) {
      setActiveCallCompany(target);
      setActiveView('virtual-room');
      showToast(
        `Sala 1-a-1 abierta + EmailJS enviado`,
        `Notificación enviada a ${recipientEmail} (CC: ${ADMIN_EMAIL}).`
      );
    } else {
      showToast(
        `¡Invitación y EmailJS enviados a ${target.name}!`,
        `Correo despachado a ${recipientEmail} (CC: ${ADMIN_EMAIL}).`
      );
    }
  };

  const handleTriggerIncomingCall = (customCompany?: CompanyCard) => {
    if (customCompany) {
      setIncomingCallData({
        callerName: customCompany.representative.name,
        callerRole: `${customCompany.representative.role} · ${customCompany.name}`,
        companyId: customCompany.id,
        companyName: customCompany.name,
        location: customCompany.location,
        matchScore: customCompany.matchScore,
        roomNumber: 'SALA #14',
        quarterLabel: 'Q3 2025',
        syncInterest: customCompany.demand.description,
        offerSummary: `Ofrece: ${customCompany.offer.badge}`,
        demandSummary: `Busca: ${customCompany.demand.badge}`,
        avatarDesktopUrl:
          customCompany.representative.avatarUrl || customCompany.logoUrl,
        avatarMobileUrl:
          customCompany.representative.avatarUrl || customCompany.logoUrl,
        jitsiRoomName: customCompany.jitsiRoomName,
      });
    } else {
      setIncomingCallData(DEFAULT_INCOMING_CALL);
    }
    setIsIncomingCallOpen(true);
  };

  const handleAcceptIncomingCall = async (call: IncomingCallData) => {
    setIsIncomingCallOpen(false);
    const foundCompany =
      companies.find((c) => c.id === call.companyId) || companies[4] || companies[0];
    setActiveCallCompany(foundCompany);
    setActiveView('virtual-room');

    await sendB2BEmailNotification({
      type: 'meeting_request',
      toEmail: getCompanyCorporateEmail(call.companyName),
      toName: call.callerName,
      fromName: userProfile?.fullName || 'Ejecutivo B2B',
      companyName: call.companyName,
      subject: `[BWOS Conectar B2B] Reunión 1-a-1 Aceptada en ${call.roomNumber}`,
      message: `Confirmación de ingreso en vivo a la Sala Jitsi (${call.roomNumber}) con ${call.callerName} (${call.companyName}).`,
      jitsiRoomUrl: `https://meet.jit.si/${call.jitsiRoomName}`,
      ccAdminEmail: ADMIN_EMAIL,
    });
    setEmailLogs(getSavedEmailLogs());

    showToast(
      `Enlace establecido con ${call.callerName}`,
      `Conectado en ${call.roomNumber} · Confirmación enviada vía EmailJS.`
    );
  };

  const handlePostponeIncomingCall = async (call: IncomingCallData) => {
    setIsIncomingCallOpen(false);
    const newMeet: MeetingItem = {
      id: `meet-postponed-${Date.now()}`,
      companyId: call.companyId,
      companyName: call.companyName,
      repName: call.callerName,
      repRole: call.callerRole,
      repAvatar: call.avatarDesktopUrl,
      matchScore: call.matchScore,
      topic: call.syncInterest,
      offerTag: call.offerSummary.replace('Ofrece: ', ''),
      demandTag: call.demandSummary.replace('Busca: ', ''),
      status: 'postponed',
      timeSlot: 'Pospuesta (+15 min) · Confirmada',
      roomNumber: call.roomNumber,
      jitsiRoomName: call.jitsiRoomName,
    };
    setMeetings((prev) => [newMeet, ...prev]);

    await sendB2BEmailNotification({
      type: 'meeting_request',
      toEmail: getCompanyCorporateEmail(call.companyName),
      toName: call.callerName,
      fromName: userProfile?.fullName || 'Ejecutivo B2B',
      companyName: call.companyName,
      subject: `[BWOS Conectar B2B] Solicitud de Reunión Reprogramada (+15 min) con ${call.companyName}`,
      message: `La reunión 1-a-1 con ${call.callerName} (${call.companyName}) fue reprogramada +15 minutos en ${call.roomNumber}.`,
      jitsiRoomUrl: `https://meet.jit.si/${call.jitsiRoomName}`,
      ccAdminEmail: ADMIN_EMAIL,
    });
    setEmailLogs(getSavedEmailLogs());

    showToast(
      'Reunión pospuesta 15 minutos + EmailJS enviado',
      `Se notificó por correo a ${call.callerName} y se agendó en tu Agenda B2B.`
    );
  };

  const handlePublishNewOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newOfferText.trim() || !newDemandText.trim()) {
      return;
    }

    const formattedSectorLabel =
      newSectorsList.length > 0
        ? newSectorsList.slice(0, 2).join(' • ')
        : newCategory === 'saas'
        ? 'SaaS & Tecnología'
        : newCategory === 'logistica'
        ? 'Logística & Fintech'
        : newCategory === 'manufactura'
        ? 'Manufactura & Industria 4.0'
        : 'Servicios Corporativos';

    const newCard: CompanyCard = {
      id: `comp-${Date.now()}`,
      name: newCompanyName.trim(),
      shortCode: newCompanyName.trim().slice(0, 2).toUpperCase(),
      iconName: 'rocket_launch',
      verified: true,
      location: newLocation.trim() || 'Latinoamérica Hub',
      countryFlag: '🌎',
      countryCode: 'CO',
      category: newCategory,
      sectorLabel: formattedSectorLabel,
      matchScore: Math.floor(92 + Math.random() * 7),
      responseTime: 'Resp. < 15min',
      summaryDescription: newOfferText.trim(),
      representative: {
        name:
          newRepName.trim() ||
          userProfile?.fullName ||
          'Directivo Comercial B2B',
        role: newRepRole.trim() || 'Director de Alianzas B2B',
        icon: 'badge',
        avatarUrl: EXECUTIVE_AVATARS[0],
        whatsapp: userProfile
          ? `${userProfile.countryCode}${userProfile.phone}`
          : '+573001234567',
      },
      offer: {
        badge: 'Capacidad Inmediata',
        description: newOfferText.trim(),
        tags: newOfferTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 3),
      },
      demand: {
        badge: 'Licitación Abierta',
        description: newDemandText.trim(),
        tags: newDemandTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 3),
      },
      footerNote: 'Publicada en vivo',
      footerIcon: 'verified_user',
      mutualConnections: 3,
      logoUrl: EXECUTIVE_AVATARS[2],
      immediateCallAvailable: true,
      jitsiRoomName: `BWOS_Conectar_B2B_${newCompanyName
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '_')}`,
    };

    if (newCard.offer.tags.length === 0) {
      newCard.offer.tags = ['Oferta Verificada B2B', 'Disponibilidad Inmediata'];
    }
    if (newCard.demand.tags.length === 0) {
      newCard.demand.tags = ['Alianza Comercial', 'Proveedores Regionales'];
    }

    setCompanies((prev) => [newCard, ...prev]);
    setIsPublishModalOpen(false);
    setNewCompanyName('');
    setNewRepName('');
    setNewRepRole('');
    setNewOfferText('');
    setNewOfferTags('');
    setNewDemandText('');
    setNewDemandTags('');
    showToast(
      '¡Oferta / Demanda Publicada!',
      `${newCard.name} ya está visible en el directorio en tiempo real.`
    );
  };

  const handleGrantInvitationAccess = (reqData: InvitationRequestData) => {
    const cleanReqEmail = reqData.email.trim().toLowerCase();
    const adminGranted = isAdminEmail(cleanReqEmail);
    try {
      localStorage.setItem(STORAGE_KEYS.INVITATION_GRANTED, 'true');
      localStorage.setItem(STORAGE_KEYS.ADMIN_EMAIL, cleanReqEmail);
    } catch {
      // ignore storage errors
    }
    setSessionEmail(cleanReqEmail);
    setIsAdmin(adminGranted);
    setUserProfile({
      fullName: reqData.fullName,
      companyName: reqData.companyName,
      countryCode: '+52',
      phone: reqData.corporateContact,
      offering:
        'Soluciones e infraestructura corporativa validada para rueda de negocios B2B.',
      demand:
        'Alianzas comerciales y proveedores homologados en Latinoamérica.',
      accreditedAt: reqData.requestedAt,
      role: reqData.role,
    });
    setHasInvitationAccess(true);
    if (adminGranted) {
      setActiveView('admin-dashboard');
    }
    showToast(
      adminGranted
        ? '¡Dashboard de Administración Activado!'
        : '¡Invitación Validada!',
      `Bienvenido ${reqData.fullName} · ${reqData.companyName} (${cleanReqEmail}).`
    );
  };

  const handleLockToInvitationGate = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.INVITATION_GRANTED);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_EMAIL);
    } catch {
      // ignore storage errors
    }
    setIsAdmin(false);
    setHasInvitationAccess(false);
  };

  const handleResetDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.INVITATION_GRANTED);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.COMPANIES);
    localStorage.removeItem(STORAGE_KEYS.MEETINGS);
    setIsAdmin(false);
    setHasInvitationAccess(false);
    setUserProfile(null);
    setCompanies(INITIAL_COMPANIES);
    setMeetings(INITIAL_MEETINGS);
    setSearchQuery('');
    setSelectedSector('all');
    setOnlyImmediateMatch(false);
    setMinMatchFilter(0);
    setCountryFilter('ALL');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSector('all');
    setSelectedSubSector('ALL');
    setOnlyImmediateMatch(false);
    setMinMatchFilter(0);
    setCountryFilter('ALL');
    setCurrentPage(1);
  };

  const handleRefreshAccessRequests = () => {
    setAccessRequests(getAccessRequests());
    setEmailLogs(getSavedEmailLogs());
  };

  const handleApproveAccessRequest = async (req: AccessRequestItem) => {
    const nowIso = new Date().toISOString();
    if (req.oneTimeToken) {
      markApprovalTokenUsed(req.oneTimeToken);
    }
    const updatedList = accessRequests.map((item) =>
      item.id === req.id
        ? {
            ...item,
            status: 'approved' as const,
            tokenUsed: true,
            tokenUsedAt: nowIso,
            reviewedAt: nowIso,
            reviewedBy: ADMIN_EMAIL,
          }
        : item
    );
    saveAccessRequests(updatedList);
    setAccessRequests(updatedList);

    await sendB2BEmailNotification({
      type: 'access_approved',
      toEmail: req.email,
      toName: req.fullName,
      fromName: 'Administrador General BWOS',
      fromEmail: ADMIN_EMAIL,
      companyName: req.companyName,
      subject: `[OK DEL ADMINISTRADOR OTORGADO] Acceso Habilitado a BWOS Conectar B2B`,
      message: `Hola ${req.fullName} (${req.companyName}), el administrador (${ADMIN_EMAIL}) ha dado el "OK" obligatorio a tu solicitud de ingreso. Ya puedes entrar a la plataforma utilizando tu correo ${req.email} en la pestaña "Ingreso Autorizado".`,
      ccAdminEmail: ADMIN_EMAIL,
    });
    setEmailLogs(getSavedEmailLogs());

    showToast(
      `¡OK de Ingreso Otorgado a ${req.companyName}!`,
      `Notificación EmailJS enviada a ${req.email}.`
    );
  };

  const handleRejectAccessRequest = (req: AccessRequestItem) => {
    const nowIso = new Date().toISOString();
    if (req.oneTimeToken) {
      markApprovalTokenUsed(req.oneTimeToken);
    }
    const updatedList = accessRequests.map((item) =>
      item.id === req.id
        ? {
            ...item,
            status: 'rejected' as const,
            tokenUsed: true,
            tokenUsedAt: nowIso,
            reviewedAt: nowIso,
            reviewedBy: ADMIN_EMAIL,
          }
        : item
    );
    saveAccessRequests(updatedList);
    setAccessRequests(updatedList);
    showToast(
      `Solicitud rechazada / revocada`,
      `El correo ${req.email} no tiene autorización para ingresar.`
    );
  };

  const handleManualAuthorizeEmail = async (data: {
    email: string;
    fullName: string;
    companyName: string;
    role: string;
    sector: string;
  }) => {
    const created = upsertAccessRequest({
      email: data.email,
      fullName: data.fullName,
      companyName: data.companyName,
      corporateContact: data.email,
      role: data.role,
      sector: data.sector,
      sectorsList: [data.sector],
      source: 'admin_manual',
      status: 'approved',
      tokenUsed: true,
      tokenUsedAt: new Date().toISOString(),
    });
    setAccessRequests(getAccessRequests());

    await sendB2BEmailNotification({
      type: 'access_approved',
      toEmail: created.email,
      toName: created.fullName,
      fromName: 'Administrador General BWOS',
      fromEmail: ADMIN_EMAIL,
      companyName: created.companyName,
      subject: `[OK DEL ADMINISTRADOR OTORGADO] Credencial Autorizada BWOS Conectar B2B`,
      message: `Hola ${created.fullName} (${created.companyName}), el administrador (${ADMIN_EMAIL}) ha habilitado directamente tu ingreso con "OK" aprobado. Ingresa con ${created.email} en "Ingreso Autorizado".`,
      ccAdminEmail: ADMIN_EMAIL,
    });
    setEmailLogs(getSavedEmailLogs());

    showToast(
      `Correo ${created.email} aprobado con OK`,
      'Se notificó vía EmailJS al ejecutivo autorizado.'
    );
  };

  const handleSendManualEmail = async (payload: EmailNotificationPayload) => {
    await sendB2BEmailNotification(payload);
    setEmailLogs(getSavedEmailLogs());
    showToast(
      `Notificación EmailJS Enviada`,
      `Destinatario: ${payload.toEmail} (CC: ${ADMIN_EMAIL})`
    );
  };

  const handleDeleteAccessRequest = (reqId: string) => {
    const updatedList = accessRequests.filter((item) => item.id !== reqId);
    saveAccessRequests(updatedList);
    setAccessRequests(updatedList);
    showToast('Solicitud eliminada', 'El registro fue removido de la cola.');
  };

  const handleClearEmailLogs = () => {
    saveEmailLogs([]);
    setEmailLogs([]);
    showToast(
      'Historial EmailJS limpiado',
      'Se vació la bandeja de registros de correo.'
    );
  };

  const handleUpdateWeeklySchedule = (nextSchedule: WeeklyReportSchedule) => {
    saveWeeklyReportSchedule(nextSchedule);
    setWeeklySchedule(nextSchedule);
  };

  const handleSendWeeklyReportNow = async () => {
    const payload = buildWeeklyMetricsEmailPayload({
      companies,
      meetings,
      accessRequests,
      emailLogs,
      schedule: weeklySchedule,
    });
    await sendB2BEmailNotification(payload);
    const updatedSchedule: WeeklyReportSchedule = {
      ...weeklySchedule,
      lastSentAt: new Date().toISOString(),
    };
    saveWeeklyReportSchedule(updatedSchedule);
    setWeeklySchedule(updatedSchedule);
    setEmailLogs(getSavedEmailLogs());
    showToast(
      '¡Reporte Semanal de Métricas Enviado!',
      `Resumen despachado vía EmailJS a ${ADMIN_EMAIL}.`
    );
  };

  // Automatic Weekly Report Dispatcher (checks when scheduled day/hour arrives for current week)
  useEffect(() => {
    if (!isAdmin || !weeklySchedule.enabled) return;

    const now = new Date();
    const currentDay = now.getDay();
    if (currentDay !== weeklySchedule.dayOfWeek) return;

    const [schedH, schedM] = (weeklySchedule.hourMinute || '09:00')
      .split(':')
      .map((n) => Number(n) || 0);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = schedH * 60 + schedM;

    if (currentMinutes < targetMinutes) return;

    // Weekly cycle key (YYYY-MM-DD of the scheduled day) to prevent duplicate sends in the same week
    const cycleKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (weeklySchedule.lastAutoCycleKey === cycleKey) return;

    const payload = buildWeeklyMetricsEmailPayload({
      companies,
      meetings,
      accessRequests,
      emailLogs,
      schedule: weeklySchedule,
    });

    sendB2BEmailNotification(payload).then(() => {
      const updatedSchedule: WeeklyReportSchedule = {
        ...weeklySchedule,
        lastSentAt: new Date().toISOString(),
        lastAutoCycleKey: cycleKey,
      };
      saveWeeklyReportSchedule(updatedSchedule);
      setWeeklySchedule(updatedSchedule);
      setEmailLogs(getSavedEmailLogs());
      showToast(
        'Reporte Semanal Automático Enviado',
        `Resumen programado enviado por EmailJS a ${ADMIN_EMAIL}.`
      );
    });
  }, [
    isAdmin,
    weeklySchedule,
    companies,
    meetings,
    accessRequests,
    emailLogs,
  ]);

  // Process Single-Use Admin Approval Link ({{Aceptar a quien solicitó invitación}}) from Email URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const adminAction = params.get('admin_action');
    if (!adminAction) return;

    const targetEmail = (params.get('email') || '').trim().toLowerCase();
    const token = params.get('token') || '';
    const applicantName = params.get('name') || 'Ejecutivo B2B';
    const applicantCompany = params.get('company') || 'Empresa Invitada B2B';
    const applicantContact = params.get('contact') || targetEmail;
    const applicantRole = params.get('role') || 'Directivo B2B';
    const applicantSector = params.get('sector') || 'SaaS & Tecnología';

    // Clean URL immediately so refreshing doesn't re-trigger
    window.history.replaceState({}, document.title, window.location.pathname);

    // Activate Administrator Session (clientesbinweb@gmail.com)
    try {
      localStorage.setItem(STORAGE_KEYS.INVITATION_GRANTED, 'true');
      localStorage.setItem(STORAGE_KEYS.ADMIN_EMAIL, ADMIN_EMAIL.toLowerCase());
    } catch {
      // ignore storage errors
    }
    setIsAdmin(true);
    setHasInvitationAccess(true);
    setActiveView('admin-dashboard');

    if (adminAction === 'open_dashboard') {
      showToast(
        'Dashboard de Administración Abierto',
        `Sesión activa como ${ADMIN_EMAIL}.`
      );
      return;
    }

    if (!targetEmail || !targetEmail.includes('@')) return;

    // Enforce Single-Use Token Rule (Link de Único Uso)
    if (token && isApprovalTokenUsed(token)) {
      showToast(
        'Enlace de único uso ya utilizado',
        `El link de aprobación para ${targetEmail} ya fue consumido anteriormente.`
      );
      return;
    }

    const nowIso = new Date().toISOString();
    if (token) {
      markApprovalTokenUsed(token);
    }

    if (adminAction === 'approve_request') {
      const approvedItem = upsertAccessRequest({
        email: targetEmail,
        fullName: applicantName,
        companyName: applicantCompany,
        corporateContact: applicantContact,
        role: applicantRole,
        sector: applicantSector,
        sectorsList: applicantSector.split(' · ').filter(Boolean),
        source: 'invitation_form',
        status: 'approved',
        oneTimeToken: token || undefined,
        tokenUsed: true,
        tokenUsedAt: nowIso,
        reviewedAt: nowIso,
        reviewedBy: ADMIN_EMAIL,
      });

      setAccessRequests(getAccessRequests());

      sendB2BEmailNotification({
        type: 'access_approved',
        toEmail: approvedItem.email,
        toName: approvedItem.fullName,
        fromName: 'Administrador General BWOS',
        fromEmail: ADMIN_EMAIL,
        companyName: approvedItem.companyName,
        subject: `[OK DEL ADMINISTRADOR OTORGADO] Acceso Habilitado a BWOS Conectar B2B`,
        message: `Hola ${approvedItem.fullName} (${approvedItem.companyName}), el administrador (${ADMIN_EMAIL}) ha aceptado tu solicitud de invitación. Ya puedes ingresar a BWOS Conectar B2B utilizando tu correo ${approvedItem.email} en la pestaña "Ingreso Autorizado".`,
        ccAdminEmail: ADMIN_EMAIL,
      }).then(() => {
        setEmailLogs(getSavedEmailLogs());
      });

      showToast(
        `¡Invitación Aceptada con Link de Único Uso!`,
        `Se otorgó el OK a ${approvedItem.fullName} (${approvedItem.email}) y se notificó por EmailJS.`
      );
    } else if (adminAction === 'reject_request') {
      upsertAccessRequest({
        email: targetEmail,
        fullName: applicantName,
        companyName: applicantCompany,
        corporateContact: applicantContact,
        role: applicantRole,
        sector: applicantSector,
        sectorsList: [applicantSector],
        source: 'invitation_form',
        status: 'rejected',
        oneTimeToken: token || undefined,
        tokenUsed: true,
        tokenUsedAt: nowIso,
        reviewedAt: nowIso,
        reviewedBy: ADMIN_EMAIL,
      });
      setAccessRequests(getAccessRequests());
      showToast(
        `Solicitud Rechazada por Enlace de Único Uso`,
        `El acceso para ${targetEmail} fue denegado.`
      );
    }
  }, []);

  const pendingAccessCount = useMemo(
    () => accessRequests.filter((r) => r.status === 'pending').length,
    [accessRequests]
  );

  // MANDATORY FIRST SCREEN: If user has not received the mandatory OK from the administrator (or is not the admin), render ONLY the Invitation Gate (zero platform data exposed)
  if (!hasInvitationAccess) {
    return (
      <>
        <InvitationGateView
          accessRequests={accessRequests}
          onRefreshRequests={handleRefreshAccessRequests}
          onGrantAccess={handleGrantInvitationAccess}
          onOpenLegalNotice={(sec) => setLegalModalSection(sec)}
          onResetDemo={handleResetDemoData}
        />
        <LegalRedNoticeModal
          isOpen={Boolean(legalModalSection)}
          sectionTitle={legalModalSection || ''}
          onClose={() => setLegalModalSection(null)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full bg-surface text-on-surface font-body-md flex flex-col justify-between pb-20 lg:pb-0">
      {/* Persistent Top Notice: Plataforma en Desarrollo (MVP Piloto) */}
      <MvpDevelopmentBanner
        isAdmin={isAdmin}
        onOpenLegalNotice={(sec) => setLegalModalSection(sec)}
        onResetDemo={handleResetDemoData}
      />

      {/* Top Institutional Navigation Header (Responsive Flex-Wrap without Horizontal Scroll) */}
      <header className="sticky top-0 left-0 right-0 z-40 w-full bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high">
        <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          {/* Left Brand & Live Counter */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('lobby')}
              className="flex items-center gap-2 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
                {activeView === 'bw2-directory' ||
                activeView === 'accreditation' ? (
                  <span className="text-on-primary font-headline-sm font-black tracking-tighter text-[13px]">
                    BW2
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-on-primary text-[19px]">
                    hub
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-title-md text-on-surface leading-tight tracking-tight font-extrabold">
                    BWOS
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary font-label-sm uppercase text-[10px]">
                    Summit 2025
                  </span>
                </div>
                <span className="font-label-sm text-primary uppercase tracking-wider font-bold text-[10px]">
                  Conectar B2B
                </span>
              </div>
            </button>

            <div className="hidden 2xl:flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-full border border-surface-container-high">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span className="font-label-sm text-secondary font-bold tabular-nums text-[11px]">
                {activeExecsCount} activos
              </span>
            </div>
          </div>

          {/* Center Desktop Navigation Tabs (Wraps cleanly without horizontal scroll) */}
          <nav
            aria-label="Navegación Principal B2B"
            className="hidden lg:flex flex-wrap items-center justify-center gap-1"
          >
            <button
              type="button"
              onClick={() => setActiveView('accreditation')}
              className={`px-2.5 py-1.5 rounded-lg font-title-md text-[13px] transition-colors flex items-center gap-1 cursor-pointer ${
                activeView === 'accreditation'
                  ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                badge
              </span>
              <span>Acreditación</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('lobby')}
              className={`px-2.5 py-1.5 rounded-lg font-title-md text-[13px] transition-colors flex items-center gap-1 cursor-pointer ${
                activeView === 'lobby'
                  ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                storefront
              </span>
              <span>Lobby Virtual</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('bw2-directory')}
              className={`px-2.5 py-1.5 rounded-lg font-title-md text-[13px] transition-colors flex items-center gap-1 cursor-pointer ${
                activeView === 'bw2-directory'
                  ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                grid_view
              </span>
              <span>Directorio BW2</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('connections')}
              className={`px-2.5 py-1.5 rounded-lg font-title-md text-[13px] transition-colors flex items-center gap-1 cursor-pointer ${
                activeView === 'connections'
                  ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                handshake
              </span>
              <span>Conexiones</span>
              {connectedCompanies.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-extrabold tabular-nums">
                  {connectedCompanies.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveView('agenda')}
              className={`px-2.5 py-1.5 rounded-lg font-title-md text-[13px] transition-colors flex items-center gap-1 cursor-pointer ${
                activeView === 'agenda'
                  ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                calendar_month
              </span>
              <span>Agenda</span>
              <span className="px-1.5 py-0.2 rounded-full bg-primary-fixed text-primary text-[10px] font-extrabold tabular-nums">
                {meetings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('virtual-room')}
              className={`px-2.5 py-1.5 rounded-lg font-title-md text-[13px] transition-colors flex items-center gap-1 cursor-pointer ${
                activeView === 'virtual-room'
                  ? 'bg-secondary text-on-secondary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                videocam
              </span>
              <span>Sala Jitsi</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveView('admin-dashboard')}
                className={`px-2.5 py-1.5 rounded-lg font-title-md text-[13px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'admin-dashboard'
                    ? 'bg-[#161f30] text-white font-bold shadow-xs'
                    : 'bg-amber-500/15 text-amber-900 hover:bg-amber-500/25 font-bold'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">
                  admin_panel_settings
                </span>
                <span>Dashboard Admin</span>
                {pendingAccessCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold tabular-nums">
                    {pendingAccessCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Right Quick Actions: Consolidated Admin Dashboard / EmailJS, Legal Red Notice, Lock Gate & Profile */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setActiveView('admin-dashboard')}
                className={`lg:hidden h-8 px-2.5 rounded-lg font-label-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === 'admin-dashboard'
                    ? 'bg-[#161f30] text-white'
                    : 'bg-amber-500/20 text-amber-900 border border-amber-500/40'
                }`}
                title="Abrir Dashboard de Administración Consolidado"
              >
                <span className="material-symbols-outlined text-[16px]">
                  admin_panel_settings
                </span>
                <span>Admin</span>
                {pendingAccessCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] tabular-nums">
                    {pendingAccessCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setEmailModalState({ isOpen: true, tab: 'compose' })
                }
                className="h-8 px-2.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-on-primary font-label-sm font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Abrir Formulario de Envío y Bandeja de Notificaciones EmailJS"
              >
                <span className="material-symbols-outlined text-[16px]">
                  forward_to_inbox
                </span>
                <span className="hidden md:inline">EmailJS</span>
                {emailLogs.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-primary text-on-primary text-[10px] font-extrabold tabular-nums">
                    {emailLogs.length}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setLegalModalSection(
                  'Consulta General con Abogados · Marco Legal y Privacidad B2B'
                )
              }
              className="h-8 px-2.5 rounded-lg bg-[#ffdad6] hover:bg-[#ba1a1a] text-[#93000a] hover:text-white border border-[#ba1a1a]/40 font-label-sm flex items-center gap-1 transition-colors cursor-pointer"
              title="Ver aviso en rojo pendiente de abogados"
            >
              <span className="material-symbols-outlined text-[15px]">
                gavel
              </span>
              <span className="hidden xl:inline">Abogados</span>
            </button>

            <button
              type="button"
              onClick={handleLockToInvitationGate}
              className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-inverse-surface text-on-surface hover:text-white font-label-sm flex items-center gap-1 transition-colors cursor-pointer"
              title="Cerrar sesión y volver a la pantalla 'Quiero ingresar, solicito invitación'"
            >
              <span className="material-symbols-outlined text-[15px]">
                logout
              </span>
              <span className="hidden md:inline">Salir</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('accreditation')}
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer"
              title="Ver o editar Ficha de Acreditación"
            >
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
                <span className="material-symbols-outlined text-[16px]">
                  person
                </span>
              </div>
              <div className="hidden 2xl:flex flex-col text-left">
                <span className="font-label-sm text-on-surface leading-tight font-bold truncate max-w-[110px]">
                  {userProfile?.fullName || 'Administrador BWOS'}
                </span>
                <span className="font-label-sm text-on-surface-variant text-[10px] truncate max-w-[110px]">
                  {isAdmin ? ADMIN_EMAIL : userProfile?.companyName || ''}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* VIEW 0: DASHBOARD DE ADMINISTRACIÓN EXCLUSIVO (clientesbinweb@gmail.com / somosbwos@gmail.com) */}
        {activeView === 'admin-dashboard' && (
          <AdminDashboardView
            isAdmin={isAdmin}
            adminUser={{
              fullName:
                userProfile?.fullName ||
                ADMIN_USERS[sessionEmail]?.fullName ||
                'Asesor Digital BWOS',
              companyName:
                userProfile?.companyName ||
                ADMIN_USERS[sessionEmail]?.companyName ||
                'BWOS | Sitios Web & Merch',
              email: sessionEmail || SECONDARY_ADMIN_EMAIL,
            }}
            companies={companies}
            meetings={meetings}
            accessRequests={accessRequests}
            emailLogs={emailLogs}
            weeklySchedule={weeklySchedule}
            onUpdateWeeklySchedule={handleUpdateWeeklySchedule}
            onSendWeeklyReportNow={handleSendWeeklyReportNow}
            onApproveRequest={handleApproveAccessRequest}
            onRejectRequest={handleRejectAccessRequest}
            onDeleteRequest={handleDeleteAccessRequest}
            onManualAuthorizeEmail={handleManualAuthorizeEmail}
            onSendManualEmail={handleSendManualEmail}
            onClearEmailLogs={handleClearEmailLogs}
            onRefreshRequests={handleRefreshAccessRequests}
            onTriggerIncomingCall={() => handleTriggerIncomingCall()}
            onOpenPublishModal={() => setIsPublishModalOpen(true)}
            onResetDemoData={handleResetDemoData}
            onNavigateToLobby={() => setActiveView('lobby')}
          />
        )}

        {/* VIEW 1: ACREDITACIÓN EMPRESARIAL */}
        {activeView === 'accreditation' && (
          <AccreditationView
            userProfile={userProfile}
            isAdmin={isAdmin}
            onCompleteAccreditation={handleCompleteAccreditation}
            onOpenLegalNotice={(sec) => setLegalModalSection(sec)}
          />
        )}

        {/* VIEW 2: SALA VIRTUAL 1-A-1 (JITSI MEET GRATUITO) */}
        {activeView === 'virtual-room' && (
          <VirtualCallRoom
            activeCompany={activeCallCompany}
            allCompanies={companies}
            userProfile={userProfile}
            onSelectCompany={(comp) => setActiveCallCompany(comp)}
            onBackToLobby={() => setActiveView('lobby')}
            onOpenLegalNotice={(sec) => setLegalModalSection(sec)}
          />
        )}

        {/* VIEW 3: MIS CONEXIONES & GUARDADOS */}
        {activeView === 'connections' && (
          <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container-high">
              <div>
                <span className="font-label-sm uppercase tracking-wider text-primary font-bold">
                  Red de Contrapartes B2B
                </span>
                <h1 className="font-headline-lg text-on-surface mt-0.5">
                  Mis Conexiones y Empresas Guardadas
                </h1>
                <p className="font-body-md text-on-surface-variant mt-1">
                  Inicia una sala de videollamada gratuita en Jitsi Meet o contacta directamente por WhatsApp Empresarial.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('lobby')}
                className="h-11 px-5 rounded-xl bg-primary-container text-on-primary font-title-md flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  storefront
                </span>
                <span>Explorar más empresas</span>
              </button>
            </div>

            {connectedCompanies.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-surface-container-high flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline">
                  <span className="material-symbols-outlined text-[32px]">
                    handshake
                  </span>
                </div>
                <h3 className="font-headline-sm text-on-surface">
                  Aún no tienes conexiones activas ni empresas guardadas
                </h3>
                <p className="font-body-md text-on-surface-variant max-w-md">
                  Pulsa el botón “Conectar” o el ícono de marcador en cualquier tarjeta del Lobby Virtual para agregar contrapartes a tu lista.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('lobby')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-title-md cursor-pointer"
                >
                  Ir al Lobby Virtual
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {connectedCompanies.map((company) => (
                  <article
                    key={company.id}
                    className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col justify-between gap-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover bg-surface-container"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <h3 className="font-title-md text-on-surface">
                                {company.name}
                              </h3>
                              <span className="material-symbols-outlined text-primary text-[16px] material-fill">
                                verified
                              </span>
                            </div>
                            <span className="font-body-sm text-on-surface-variant">
                              {company.representative.name} ·{' '}
                              {company.representative.role}
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container font-label-sm font-bold">
                          {company.matchScore}% Match
                        </span>
                      </div>

                      {company.pitchMessageSent && (
                        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container text-body-sm text-on-surface-variant">
                          <strong className="text-on-surface block mb-0.5">
                            Mensaje Speed-Pitch enviado:
                          </strong>
                          “{company.pitchMessageSent}”
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-[#ECFDF5] text-[#064E3B] font-body-sm">
                        <strong className="text-[#047857] uppercase font-label-sm block">
                          Ofrece: {company.offer.badge}
                        </strong>
                        {company.offer.description}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-surface-container">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCallCompany(company);
                          setActiveView('virtual-room');
                        }}
                        className="flex-1 h-10 px-3 rounded-xl bg-secondary text-on-secondary font-label-md font-bold flex items-center justify-center gap-1.5 shadow-xs hover:opacity-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          videocam
                        </span>
                        <span>Sala Jitsi 1-a-1</span>
                      </button>

                      <a
                        href={`https://wa.me/${company.representative.whatsapp.replace(
                          /[^0-9]/g,
                          ''
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-3 rounded-xl bg-surface-container-high text-on-surface font-label-md font-bold flex items-center justify-center gap-1 hover:bg-surface-container-highest"
                      >
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          chat
                        </span>
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: AGENDA B2B (MESAS 1-A-1 Y LLAMADAS POSPUESTAS) */}
        {activeView === 'agenda' && (
          <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container-high">
              <div>
                <span className="font-label-sm uppercase tracking-wider text-primary font-bold">
                  Rondas de Negocios 2025
                </span>
                <h1 className="font-headline-lg text-on-surface mt-0.5">
                  Agenda B2B y Mesas Virtuales 1-a-1
                </h1>
                <p className="font-body-md text-on-surface-variant mt-1">
                  Administra tus sesiones confirmadas, llamadas pospuestas y salas privadas en Jitsi Meet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTriggerIncomingCall()}
                className="h-11 px-4 rounded-xl bg-secondary text-on-secondary font-title-md flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  ring_volume
                </span>
                <span>Simular Videollamada Entrante</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.map((meet) => (
                <article
                  key={meet.id}
                  className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full font-label-sm uppercase font-bold flex items-center gap-1.5 ${
                          meet.status === 'live'
                            ? 'bg-secondary-container/70 text-on-secondary-container'
                            : meet.status === 'postponed'
                            ? 'bg-primary-fixed text-primary'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            meet.status === 'live'
                              ? 'bg-secondary animate-ping'
                              : 'bg-primary'
                          }`}
                        />
                        {meet.timeSlot}
                      </span>
                      <span className="font-label-sm font-bold bg-surface-container px-2.5 py-1 rounded-md text-on-surface">
                        {meet.roomNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={meet.repAvatar}
                        alt={meet.repName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover bg-surface-container"
                      />
                      <div className="min-w-0">
                        <h3 className="font-title-md text-on-surface truncate">
                          {meet.companyName}
                        </h3>
                        <p className="font-body-sm text-on-surface-variant truncate">
                          {meet.repName} · {meet.repRole}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-container-low text-body-sm text-on-surface">
                      <span className="font-label-sm text-primary uppercase block mb-1">
                        Tema de Sincronización ({meet.matchScore}% Match)
                      </span>
                      “{meet.topic}”
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-secondary-container/40 text-secondary px-2 py-0.5 rounded text-[11px] font-bold uppercase">
                        Ofrece: {meet.offerTag}
                      </span>
                      <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[11px] font-bold uppercase">
                        Busca: {meet.demandTag}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const comp =
                        companies.find((c) => c.id === meet.companyId) ||
                        companies[0];
                      setActiveCallCompany(comp);
                      setActiveView('virtual-room');
                    }}
                    className="w-full h-11 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-title-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      videocam
                    </span>
                    <span>Entrar a {meet.roomNumber} (Jitsi Meet)</span>
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5 & 6: LOBBY VIRTUAL B2B (Image_8/Image_10/Image_2) & DIRECTORIO BW2 (Image_16) */}
        {(activeView === 'lobby' || activeView === 'bw2-directory') && (
          <div className="flex flex-col w-full">
            {/* Networking Insights Section (Recharts) above the Lobby Header */}
            <NetworkingInsights
              companies={companies}
              meetings={meetings}
              activeExecsCount={activeExecsCount}
              selectedSector={selectedSector}
              onSelectSector={(sector) => setSelectedSector(sector)}
            />

            {/* Top Header Section: Adapts between Lobby Virtual B2B (Image_8) and BW2 Conectar B2B (Image_16) */}
            {activeView === 'bw2-directory' ? (
              <section
                aria-label="Cabecera del Directorio B2B"
                className="w-full max-w-[1600px] mx-auto px-4 md:px-8 pt-6 pb-2"
              >
                <div className="w-full bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-sm border border-surface-container-high flex flex-col gap-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md shrink-0">
                        <span className="font-headline-sm text-on-primary font-black tracking-tighter">
                          BW2
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h1 className="font-headline-md text-on-surface tracking-tight">
                            BW2 Conectar B2B
                          </h1>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-label-sm font-bold">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                            </span>
                            Red validada: 340+ Contrapartes Activas
                          </span>
                        </div>
                        <p className="font-body-md text-on-surface-variant truncate">
                          Directorio de interoperabilidad y ruedas de negocio en tiempo real
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          setLegalModalSection(
                            'Validación Notarial & Certificación BASC (Pendiente Abogados)'
                          )
                        }
                        className="bg-[#ffdad6]/70 border border-[#ba1a1a]/50 px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-[#93000a] hover:bg-[#ffdad6] transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">
                          gavel
                        </span>
                        <span className="font-label-md font-bold">
                          Validación Notarial & BASC [AVISO ROJO ABOGADOS]
                        </span>
                      </button>
                      <div className="bg-surface-container-low px-3.5 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-[18px]">
                          bolt
                        </span>
                        <span className="font-label-md text-on-surface">
                          Match IA LatAm 2026
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="w-full px-4 md:px-8 pt-6 pb-4">
                <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-label-sm uppercase tracking-widest text-primary font-extrabold bg-primary-fixed px-2.5 py-0.5 rounded-full">
                        Edición Regional LatAm 2025
                      </span>
                      <span className="text-outline-variant font-label-sm">
                        •
                      </span>
                      <span className="font-label-sm text-tertiary">
                        Mesa de Rueda Activa
                      </span>
                    </div>
                    <h1 className="font-headline-lg text-on-surface tracking-tight">
                      Lobby Virtual B2B
                    </h1>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl">
                      Directorio dinámico de empresas oferentes y demandantes validadas. Conéctese al instante con decisores de compras y tecnología en salas privadas 1-a-1 con Jitsi Meet.
                    </p>
                  </div>

                  {/* Live Attendance Pill / Decision-Makers Counter */}
                  <div className="bg-surface-container-lowest shadow-sm border border-surface-container-high rounded-xl p-4 flex items-center gap-5 self-start lg:self-auto">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-80" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
                        </span>
                        <span className="font-headline-sm text-on-surface font-extrabold tracking-tight tabular-nums">
                          {activeExecsCount} En Línea
                        </span>
                      </div>
                      <span className="font-body-sm text-on-surface-variant">
                        Tomadores de decisión activos
                      </span>
                    </div>

                    <div className="flex items-center pl-4 border-l border-surface-container-high">
                      <div className="flex -space-x-2 overflow-hidden items-center">
                        {['🇨🇱', '🇲🇽', '🇨🇴', '🇵🇪', '🇧🇷'].map((flag, i) => (
                          <div
                            key={i}
                            className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-label-sm font-bold text-on-surface ring-2 ring-surface-container-lowest"
                          >
                            {flag}
                          </div>
                        ))}
                        <span className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center font-label-sm font-bold text-on-primary-fixed ring-2 ring-surface-container-lowest">
                          +7
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Sticky Search, Mode Switcher & Filter Pills Bar */}
            <section className="w-full px-4 md:px-8 py-3 sticky top-16 z-30 bg-surface/95 backdrop-blur-md">
              <div className="max-w-[1600px] mx-auto flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                  <div className="relative flex-1 w-full">
                    <span className="material-symbols-outlined text-outline absolute left-4 top-1/2 -translate-y-1/2 text-[22px] pointer-events-none">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar empresas, representantes, insumos, certificaciones ISO/BASC, ofertas o demandas..."
                      className="w-full h-12 bg-surface-container-lowest rounded-xl pl-12 pr-24 text-on-surface font-body-md shadow-sm ring-1 ring-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline"
                    />
                    {searchQuery.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant font-label-sm hover:bg-surface-container-high transition-colors cursor-pointer"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsAdvancedFilterOpen(true)}
                      className="flex-1 sm:flex-none h-12 px-4 bg-surface-container-lowest rounded-xl text-on-surface font-title-md text-[14px] shadow-sm ring-1 ring-outline-variant/60 hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px] text-primary">
                        tune
                      </span>
                      <span>Filtros Avanzados</span>
                      {(minMatchFilter > 0 || countryFilter !== 'ALL') && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSortBy((prev) =>
                          prev === 'match' ? 'response' : 'match'
                        )
                      }
                      title="Alternar orden por Match Score o Alfabético"
                      className="h-12 px-3.5 bg-surface-container-lowest rounded-xl text-on-surface-variant font-label-md shadow-sm ring-1 ring-outline-variant/60 hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        sort
                      </span>
                      <span className="hidden xl:inline">
                        {sortBy === 'match' ? 'Mayor Match %' : 'A-Z'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPublishModalOpen(true)}
                      className="h-12 px-4 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-title-md text-[14px] shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        post_add
                      </span>
                      <span className="hidden md:inline">
                        Publicar Oferta / Demanda
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sector Pills + Card Layout Toggle (Flex-Wrap without Horizontal Scroll) */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 py-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSector('all')}
                      className={`px-3.5 py-1.5 rounded-full font-label-md font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedSector === 'all'
                          ? 'bg-primary-container text-on-primary shadow-xs'
                          : 'bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/60 hover:bg-surface-container-low'
                      }`}
                    >
                      Todos ({sectorCounts.all})
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSector('saas')}
                      className={`px-3.5 py-1.5 rounded-full font-label-md whitespace-nowrap transition-all cursor-pointer ${
                        selectedSector === 'saas'
                          ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                          : 'bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/60 hover:bg-surface-container-low'
                      }`}
                    >
                      SaaS & Tech ({sectorCounts.saas})
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSector('logistica')}
                      className={`px-3.5 py-1.5 rounded-full font-label-md whitespace-nowrap transition-all cursor-pointer ${
                        selectedSector === 'logistica'
                          ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                          : 'bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/60 hover:bg-surface-container-low'
                      }`}
                    >
                      Logística & Fintech ({sectorCounts.logistica})
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSector('manufactura')}
                      className={`px-3.5 py-1.5 rounded-full font-label-md whitespace-nowrap transition-all cursor-pointer ${
                        selectedSector === 'manufactura'
                          ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                          : 'bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/60 hover:bg-surface-container-low'
                      }`}
                    >
                      Manufactura & Industria 4.0 ({sectorCounts.manufactura})
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSector('servicios')}
                      className={`px-3.5 py-1.5 rounded-full font-label-md whitespace-nowrap transition-all cursor-pointer ${
                        selectedSector === 'servicios'
                          ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                          : 'bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/60 hover:bg-surface-container-low'
                      }`}
                    >
                      Servicios ({sectorCounts.servicios})
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnlyImmediateMatch((prev) => !prev)}
                      className={`px-3.5 py-1.5 rounded-full font-label-md font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                        onlyImmediateMatch
                          ? 'bg-secondary text-on-secondary shadow-xs'
                          : 'bg-surface-container-lowest text-secondary ring-1 ring-secondary/40 hover:bg-secondary-container/20'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          onlyImmediateMatch ? 'bg-white' : 'bg-secondary'
                        }`}
                      />
                      Solo Match Inmediato
                    </button>

                    {/* Expanded Sub-Sector Selector in Filter Bar */}
                    <div className="relative flex items-center">
                      <select
                        aria-label="Filtrar por subsector industrial ampliado"
                        value={selectedSubSector}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedSubSector(val);
                          if (val !== 'ALL') {
                            const found = B2B_SECTOR_OPTIONS.find(
                              (o) => o.id === val
                            );
                            if (found) {
                              setSelectedSector(found.categoryKey);
                            }
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-full font-label-md transition-all cursor-pointer outline-none ${
                          selectedSubSector !== 'ALL'
                            ? 'bg-primary text-on-primary font-bold shadow-xs'
                            : 'bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/60 hover:bg-surface-container-low'
                        }`}
                      >
                        <option value="ALL">
                          + Más Sectores ({B2B_SECTOR_OPTIONS.length})
                        </option>
                        {B2B_SECTOR_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* View Mode Switcher between Lobby Cards (Image_8) and BW2 Tag Cards (Image_16) */}
                  <div className="hidden md:flex items-center gap-1 bg-surface-container-high p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveView('lobby')}
                      className={`px-3 py-1 rounded-lg font-label-sm transition-colors cursor-pointer ${
                        activeView === 'lobby'
                          ? 'bg-surface-container-lowest text-primary shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Tarjetas Detalladas
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('bw2-directory')}
                      className={`px-3 py-1 rounded-lg font-label-sm transition-colors cursor-pointer ${
                        activeView === 'bw2-directory'
                          ? 'bg-surface-container-lowest text-primary shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Tarjetas Tags BW2
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Cards Grid Section */}
            <section
              ref={directoryGridRef}
              id="directory-grid-anchor"
              className="w-full px-4 md:px-8 py-5 scroll-mt-32"
            >
              <div className="max-w-[1600px] mx-auto">
                {filteredCompanies.length === 0 ? (
                  <div className="py-14 px-4 bg-surface-container-lowest rounded-2xl border border-surface-container-high flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline mb-3">
                      <span className="material-symbols-outlined text-[32px]">
                        manage_search
                      </span>
                    </div>
                    <h4 className="font-headline-sm text-on-surface mb-1">
                      Sin coincidencias en este momento
                    </h4>
                    <p className="font-body-md text-on-surface-variant max-w-xs mb-4">
                      Prueba con otros términos como 'SaaS', 'Packaging', 'Logística' o restablece los filtros activos.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="px-5 py-2.5 rounded-xl bg-surface-container-highest text-primary font-title-md active:scale-95 transition-all cursor-pointer"
                    >
                      Restablecer búsqueda
                    </button>
                  </div>
                ) : activeView === 'bw2-directory' ? (
                  /* BW2 INTEROPERABILITY TAG CARDS GRID (Matches Image_16) */
                  <div
                    key={`grid-bw2-page-${safeCurrentPage}`}
                    className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6"
                  >
                    {paginatedCompanies.map((company) => (
                      <article
                        key={company.id}
                        className="bg-surface-container-lowest rounded-xl p-5 shadow-sm ring-1 ring-outline-variant/40 flex flex-col justify-between hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col gap-4">
                          {/* Header Card Info */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center font-headline-sm text-primary font-black relative overflow-hidden shrink-0">
                                {company.shortCode === 'IT%' ||
                                company.shortCode === 'KX' ? (
                                  <span>{company.shortCode}</span>
                                ) : (
                                  <span className="material-symbols-outlined text-primary text-[28px]">
                                    {company.iconName}
                                  </span>
                                )}
                                <span
                                  className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-secondary ring-2 ring-surface-container-lowest"
                                  title="En Vivo Activo"
                                />
                              </div>

                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1">
                                  <h3 className="font-headline-sm text-on-surface truncate">
                                    {company.name}
                                  </h3>
                                  <span
                                    className="material-symbols-outlined text-primary text-[18px] material-fill shrink-0"
                                    title="Contraparte Verificada"
                                  >
                                    verified
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-on-surface-variant font-label-md">
                                  <span className="material-symbols-outlined text-[14px]">
                                    location_on
                                  </span>
                                  <span className="truncate">
                                    {company.location}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end shrink-0">
                              <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-label-md font-bold tabular-nums">
                                {company.tierBadge ||
                                  `${company.matchScore}% Match`}
                              </span>
                              <span className="font-label-sm text-on-surface-variant flex items-center gap-1 mt-1">
                                <span className="material-symbols-outlined text-[12px]">
                                  schedule
                                </span>
                                {company.responseTime}
                              </span>
                            </div>
                          </div>

                          {company.extraBadges && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {company.extraBadges.map((b, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm font-semibold flex items-center gap-1"
                                >
                                  {idx === 0 && (
                                    <span className="material-symbols-outlined text-[14px] text-secondary">
                                      electric_bolt
                                    </span>
                                  )}
                                  {b}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="font-body-md text-on-surface-variant line-clamp-2">
                            {company.summaryDescription}
                          </p>

                          {/* Structured Payload: OFRECE (Tags) */}
                          <div className="rounded-lg bg-secondary/5 p-3.5 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-secondary font-label-sm tracking-wider uppercase font-extrabold">
                              <span className="w-2 h-2 rounded-full bg-secondary" />
                              OFRECE (Capacidad Inmediata)
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                              {company.offer.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="bg-surface-container-lowest text-secondary font-body-sm px-2.5 py-1 rounded-md shadow-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Structured Payload: DEMANDA (Tags) */}
                          <div className="rounded-lg bg-surface-container-low p-3.5 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-tertiary font-label-sm tracking-wider uppercase font-extrabold">
                              <span className="w-2 h-2 rounded-full bg-primary" />
                              DEMANDA (Licitación Abierta)
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                              {company.demand.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="bg-surface-container-lowest text-tertiary font-body-sm px-2.5 py-1 rounded-md shadow-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Footer / Call to Action */}
                        <div className="pt-4 mt-4 flex items-center justify-between gap-2 border-t border-surface-container">
                          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm">
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              {company.footerIcon}
                            </span>
                            <span>{company.footerNote}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTriggerIncomingCall(company)}
                              title="Simular videollamada entrante de esta empresa"
                              className="h-10 w-10 rounded-lg bg-surface-container-low hover:bg-secondary/15 text-secondary flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                videocam
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleQuickConnect(company)}
                              className={`px-5 h-10 rounded-lg font-title-md text-[14px] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                company.isConnected
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : 'bg-primary-container hover:bg-primary text-on-primary'
                              }`}
                            >
                              <span>
                                {company.isConnected ? 'Conectado' : 'Conecta'}
                              </span>
                              <span className="material-symbols-outlined text-[18px]">
                                {company.isConnected ? 'check' : 'send'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  /* STANDARD LOBBY VIRTUAL B2B CARDS GRID (Matches Image_8 & Image_10 & Image_2) */
                  <div
                    key={`grid-lobby-page-${safeCurrentPage}`}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {paginatedCompanies.map((company) => (
                      <article
                        key={company.id}
                        className="bg-surface-container-lowest rounded-2xl shadow-sm ring-1 ring-outline-variant/50 hover:shadow-md hover:ring-primary/40 transition-all flex flex-col justify-between overflow-hidden group"
                      >
                        <div className="p-5 flex flex-col gap-4">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner">
                                <img
                                  src={company.logoUrl}
                                  alt={company.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    if (company.buildingImgUrl) {
                                      (e.currentTarget as HTMLImageElement).src =
                                        company.buildingImgUrl;
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-headline-sm text-on-surface font-extrabold truncate">
                                    {company.name}
                                  </h3>
                                  <span
                                    className="material-symbols-outlined text-primary text-[18px] shrink-0 material-fill"
                                    title="Empresa Verificada BWOS"
                                  >
                                    verified
                                  </span>
                                </div>
                                <span className="font-body-sm text-on-surface-variant flex items-center gap-1 truncate">
                                  <span>
                                    {company.countryFlag} {company.location}
                                  </span>
                                  <span>•</span>
                                  <span>{company.sectorLabel}</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <div
                                className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-full"
                                title="Usuario activo en el portal"
                              >
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                                </span>
                                <span className="font-label-sm text-secondary font-bold">
                                  Activo
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleBookmark(company.id)}
                                aria-label="Guardar empresa"
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                                  company.isBookmarked
                                    ? 'text-primary bg-primary-fixed/60'
                                    : 'text-on-surface-variant hover:bg-surface-container-low'
                                }`}
                              >
                                <span
                                  className={`material-symbols-outlined text-[20px] ${
                                    company.isBookmarked ? 'material-fill' : ''
                                  }`}
                                >
                                  bookmark
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* Representative Persona Box */}
                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-low/70">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-[16px]">
                                  {company.representative.icon}
                                </span>
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-title-md text-on-surface text-[13px] leading-tight font-bold truncate">
                                  {company.representative.name}
                                </span>
                                <span className="font-body-sm text-on-surface-variant text-[11px] leading-tight truncate">
                                  {company.representative.role}
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-on-surface-variant font-label-sm shrink-0">
                              {company.responseTime}
                            </span>
                          </div>

                          {/* Bloque OFRECE (Soft Green Accent) */}
                          <div className="rounded-xl p-3 bg-[#ECFDF5] flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="font-label-sm font-extrabold text-[#047857] flex items-center gap-1.5 uppercase tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" />
                                Ofrece
                              </span>
                              <span className="font-label-sm text-[#047857]/80">
                                {company.offer.badge}
                              </span>
                            </div>
                            <p className="font-body-md text-[#064E3B] text-[13px] leading-snug">
                              {company.offer.description}
                            </p>
                          </div>

                          {/* Bloque DEMANDA / REQUIERE */}
                          <div className="rounded-xl p-3 bg-surface-container-low flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="font-label-sm font-extrabold text-primary flex items-center gap-1.5 uppercase tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Demanda / Requiere
                              </span>
                              <span className="font-label-sm text-on-surface-variant">
                                {company.demand.badge}
                              </span>
                            </div>
                            <p className="font-body-md text-on-surface text-[13px] leading-snug">
                              {company.demand.description}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="px-5 py-3.5 bg-surface-container-low/40 flex items-center justify-between gap-3 border-t border-surface-container-high/60">
                          <div className="flex items-center gap-1.5 text-secondary font-label-md font-bold">
                            <span className="material-symbols-outlined text-[18px]">
                              {company.footerIcon}
                            </span>
                            <span>{company.footerNote}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCallCompany(company);
                                setActiveView('virtual-room');
                              }}
                              title="Iniciar Sala 1-a-1 en Jitsi Meet"
                              className="h-10 w-10 rounded-xl bg-secondary/15 hover:bg-secondary text-secondary hover:text-on-secondary flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[19px]">
                                videocam
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleQuickConnect(company)}
                              className={`h-10 px-4 font-title-md text-[14px] rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                                company.isConnected
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : 'bg-primary-container hover:bg-primary text-on-primary'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {company.isConnected ? 'done' : 'handshake'}
                              </span>
                              <span>
                                {company.isConnected ? 'Conectado' : 'Conectar'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* Bottom Metric Bento Bar & Pagination (from Image_8 & Image_16) */}
                <div className="mt-8 flex flex-col gap-6">
                  <section
                    aria-label="Métricas del Directorio"
                    className="w-full bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col md:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[24px]">
                          speed
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-title-md text-on-surface">
                          Índice de Respuesta Mediana: 38 minutos
                        </span>
                        <span className="font-body-sm text-on-surface-variant">
                          Conexiones directas por canal corporativo y salas 1-a-1 con Jitsi Meet gratuito
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={handleResetDemoData}
                          className="px-3.5 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[17px]">
                            restart_alt
                          </span>
                          <span>Reiniciar Datos (Admin)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsAdvancedFilterOpen(true)}
                        className="px-4 py-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-title-md text-[14px] flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          tune
                        </span>
                        <span>Filtros Avanzados B2B</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPublishModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-primary-container text-on-primary hover:bg-primary transition-colors font-title-md text-[14px] flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          post_add
                        </span>
                        <span>Publicar Oferta / Demanda</span>
                      </button>
                    </div>
                  </section>

                  {/* Red Legal Notice Banner before Footer */}
                  <InlineLegalRedBanner
                    title="Marco Jurídico B2B, Privacidad de Datos y Términos de Rondas de Negocio (En Blanco para Abogados)"
                    onOpenModal={(sec) => setLegalModalSection(sec)}
                  />

                  {/* Pagination Summary Bar */}
                  <div className="pt-2 border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="font-body-sm text-on-surface-variant">
                      Mostrando{' '}
                      <span className="font-bold text-on-surface tabular-nums">
                        {filteredCompanies.length === 0
                          ? 0
                          : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}
                        –
                        {Math.min(
                          safeCurrentPage * ITEMS_PER_PAGE,
                          filteredCompanies.length
                        )}
                      </span>{' '}
                      de{' '}
                      <span className="font-bold text-on-surface tabular-nums">
                        {filteredCompanies.length}
                      </span>{' '}
                      organizaciones verificadas disponibles para encuentro (Página{' '}
                      {safeCurrentPage} de {totalPages})
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={safeCurrentPage <= 1}
                        onClick={() => handlePageChange(safeCurrentPage - 1)}
                        className="px-3 h-9 rounded-lg font-label-md flex items-center gap-1 bg-surface-container-lowest ring-1 ring-outline-variant/60 text-on-surface hover:bg-surface-container-low disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          chevron_left
                        </span>
                        <span>Anterior</span>
                      </button>

                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                        (p) => (
                          <button
                            key={p}
                            type="button"
                            aria-current={safeCurrentPage === p ? 'page' : undefined}
                            onClick={() => handlePageChange(p)}
                            className={`w-9 h-9 rounded-lg font-title-md flex items-center justify-center transition-colors cursor-pointer ${
                              safeCurrentPage === p
                                ? 'bg-primary text-on-primary shadow-xs font-bold'
                                : 'bg-surface-container-lowest ring-1 ring-outline-variant/60 text-on-surface hover:bg-surface-container-low'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        disabled={safeCurrentPage >= totalPages}
                        onClick={() => handlePageChange(safeCurrentPage + 1)}
                        className="px-3 h-9 rounded-lg font-label-md flex items-center gap-1 bg-surface-container-lowest ring-1 ring-outline-variant/60 text-on-surface hover:bg-surface-container-low disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <span>Siguiente</span>
                        <span className="material-symbols-outlined text-[16px]">
                          chevron_right
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Dark 4-Column Institutional Footer (Matches Image 2) */}
      <InstitutionalFooter
        hasAccess={hasInvitationAccess}
        onNavigate={(view) => setActiveView(view)}
        onOpenLegalNotice={(sec) => setLegalModalSection(sec)}
      />

      {/* Mobile Bottom Navigation Bar (Matches Image_2 & Image_10) */}
      <nav
        aria-label="Navegación Móvil Inferior"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(15,23,42,0.06)] border-t border-surface-container-high"
      >
        <div className="grid grid-cols-5 items-center h-16 px-2">
          <button
            type="button"
            onClick={() => setActiveView('lobby')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
              activeView === 'lobby'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              storefront
            </span>
            <span className="font-label-sm text-[10px]">Explorar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('bw2-directory')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
              activeView === 'bw2-directory'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              swap_horiz
            </span>
            <span className="font-label-sm text-[10px]">Match BW2</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('virtual-room')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
              activeView === 'virtual-room'
                ? 'text-secondary font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              videocam
            </span>
            <span className="font-label-sm text-[10px]">Sala Jitsi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('agenda')}
            className={`flex flex-col items-center justify-center min-h-[44px] relative transition-colors cursor-pointer ${
              activeView === 'agenda' || activeView === 'connections'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              notifications
            </span>
            <span className="absolute top-1.5 right-5 w-2 h-2 rounded-full bg-secondary" />
            <span className="font-label-sm text-[10px]">Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('accreditation')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
              activeView === 'accreditation'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              domain
            </span>
            <span className="font-label-sm text-[10px]">Empresa</span>
          </button>
        </div>
      </nav>

      {/* MODAL 1: SPEED-PITCH CONNECTION MODAL (from Image_8) */}
      {speedPitchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/45 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">
                    handshake
                  </span>
                </div>
                <div className="flex flex-col">
                  <h4 className="font-headline-sm text-on-surface">
                    Iniciar Vínculo Inmediato
                  </h4>
                  <span className="font-label-sm text-secondary font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    Contraparte en línea para Speed-Pitch
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSpeedPitchTarget(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-1">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">
                Empresa Destino
              </span>
              <span className="font-headline-sm text-primary font-extrabold leading-tight">
                {speedPitchTarget.name}
              </span>
              <span className="font-body-sm text-on-surface">
                {speedPitchTarget.representative.name} ·{' '}
                {speedPitchTarget.representative.role}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="pitch-message"
                className="font-label-md text-on-surface font-bold"
              >
                Mensaje de Apertura o Propuesta Directa
              </label>
              <textarea
                id="pitch-message"
                rows={3}
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                placeholder="Hola, revisé su requerimiento de infraestructura y contamos con homologación inmediata..."
                className="w-full bg-surface-container-lowest ring-1 ring-outline-variant focus:ring-2 focus:ring-primary-container rounded-xl p-3 font-body-md text-on-surface placeholder:text-outline resize-none outline-none"
              />
            </div>

            {/* EmailJS Direct Notification Box inside Speed-Pitch Modal */}
            <div className="p-3.5 rounded-xl bg-primary-fixed/30 border border-primary/20 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 font-label-md text-primary font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendPitchEmailToggle}
                    onChange={(e) => setSendPitchEmailToggle(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span>Notificar por correo mediante EmailJS</span>
                </label>
                <span className="font-label-sm text-on-surface-variant text-[11px]">
                  CC: {ADMIN_EMAIL}
                </span>
              </div>

              {sendPitchEmailToggle && (
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="pitch-recipient-email"
                    className="font-label-sm text-on-surface-variant"
                  >
                    Correo Corporativo de la Contraparte:
                  </label>
                  <input
                    id="pitch-recipient-email"
                    type="email"
                    value={pitchRecipientEmail}
                    onChange={(e) => setPitchRecipientEmail(e.target.value)}
                    placeholder="alianzas@empresa.com"
                    className="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-sm text-on-surface outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSpeedPitchTarget(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low font-title-md text-[14px] transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleSendConnectionAndJoinRoom(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-title-md text-[14px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  send
                </span>
                <span>Solo Enviar Invitación</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendConnectionAndJoinRoom(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-title-md text-[14px] shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  videocam
                </span>
                <span>Enviar & Abrir Sala Jitsi 1-a-1</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PUBLICAR OFERTA / DEMANDA B2B */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/45 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-xl w-full p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">
                    post_add
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-on-surface">
                    Publicar Nueva Oferta / Demanda B2B
                  </h3>
                  <p className="font-body-sm text-on-surface-variant">
                    Se agregará en tiempo real al directorio del Lobby Virtual
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form
              onSubmit={handlePublishNewOffer}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <label className="font-label-md text-on-surface block mb-1">
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Ej. Andina Cloud Logistics"
                    className="w-full px-3 py-2.5 rounded-xl bg-surface border border-outline-variant font-body-md outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <MultiSectorSelector
                    selectedSectors={newSectorsList}
                    onChange={(sectors, primaryCat) => {
                      setNewSectorsList(sectors);
                      setNewCategory(primaryCat);
                    }}
                    label="Sector Industrial (Hasta 2 sectores + opción Otro máx. 20 car.)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-label-md text-on-surface block mb-1">
                    Representante
                  </label>
                  <input
                    type="text"
                    value={newRepName}
                    onChange={(e) => setNewRepName(e.target.value)}
                    placeholder="Ej. Ing. Laura Gómez"
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant font-body-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-label-md text-on-surface block mb-1">
                    Cargo Ejecutivo
                  </label>
                  <input
                    type="text"
                    value={newRepRole}
                    onChange={(e) => setNewRepRole(e.target.value)}
                    placeholder="Ej. Directora Comercial"
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant font-body-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-label-md text-on-surface block mb-1">
                    Ciudad / País
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Ej. Santiago, Chile"
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant font-body-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#ECFDF5] flex flex-col gap-2">
                <label className="font-label-md text-[#047857] font-bold">
                  ¿Qué ofrece tu empresa? (Oferta B2B) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newOfferText}
                  onChange={(e) => setNewOfferText(e.target.value)}
                  placeholder="Describe los servicios, productos o capacidades disponibles..."
                  className="w-full p-2.5 rounded-lg bg-white border border-[#047857]/30 font-body-sm outline-none"
                />
                <input
                  type="text"
                  value={newOfferTags}
                  onChange={(e) => setNewOfferTags(e.target.value)}
                  placeholder="Etiquetas separadas por coma (ej. ERP Cloud, APIs Bancarias)"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#047857]/30 font-body-sm outline-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2">
                <label className="font-label-md text-primary font-bold">
                  ¿Qué demanda o requiere? (Demanda B2B) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newDemandText}
                  onChange={(e) => setNewDemandText(e.target.value)}
                  placeholder="Describe los proveedores, distribuidores o alianzas buscadas..."
                  className="w-full p-2.5 rounded-lg bg-white border border-outline-variant font-body-sm outline-none"
                />
                <input
                  type="text"
                  value={newDemandTags}
                  onChange={(e) => setNewDemandTags(e.target.value)}
                  placeholder="Etiquetas separadas por coma (ej. Distribuidores Cono Sur, Flota GPS)"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-outline-variant font-body-sm outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low font-title-md text-[14px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-title-md text-[14px] cursor-pointer"
                >
                  Publicar en el Directorio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FILTROS AVANZADOS B2B */}
      {isAdvancedFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/45 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  tune
                </span>
                <h3 className="font-headline-sm text-on-surface">
                  Filtros Avanzados B2B
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdvancedFilterOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="font-label-md text-on-surface font-bold block mb-2">
                  Afinidad Mínima (Match Score)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 90, 95, 98].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setMinMatchFilter(score)}
                      className={`py-2 rounded-xl font-label-md transition-colors cursor-pointer ${
                        minMatchFilter === score
                          ? 'bg-primary text-on-primary font-bold'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {score === 0 ? 'Todos' : `>${score}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-label-md text-on-surface font-bold block mb-2">
                  País / Hub Regional
                </label>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant font-body-md outline-none"
                >
                  <option value="ALL">Todos los países (LatAm & España)</option>
                  <option value="CL">🇨🇱 Chile</option>
                  <option value="MX">🇲🇽 México</option>
                  <option value="CO">🇨🇴 Colombia</option>
                  <option value="PE">🇵🇪 Perú</option>
                </select>
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low cursor-pointer">
                <span className="font-body-md text-on-surface font-medium">
                  Solo con Sala Jitsi 1-a-1 inmediata
                </span>
                <input
                  type="checkbox"
                  checked={onlyImmediateMatch}
                  onChange={(e) => setOnlyImmediateMatch(e.target.checked)}
                  className="w-5 h-5 accent-primary"
                />
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl text-outline hover:text-on-surface font-label-md cursor-pointer"
              >
                Limpiar todo
              </button>
              <button
                type="button"
                onClick={() => setIsAdvancedFilterOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-primary-container text-on-primary font-title-md text-[14px] cursor-pointer"
              >
                Aplicar ({filteredCompanies.length} resultados)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VIDEOLLAMADA B2B ENTRANTE (Matches Image_12 & Image_14) */}
      <IncomingCallModal
        isOpen={isIncomingCallOpen}
        callData={incomingCallData}
        onAcceptAndJoin={handleAcceptIncomingCall}
        onDecline={() => setIsIncomingCallOpen(false)}
        onPostpone15Min={handlePostponeIncomingCall}
        onOpenLegalNotice={(sec) => setLegalModalSection(sec)}
      />

      {/* MODAL 5: AVISO EN ROJO PARA CONSULTA CON ABOGADOS */}
      <LegalRedNoticeModal
        isOpen={Boolean(legalModalSection)}
        sectionTitle={legalModalSection || ''}
        onClose={() => setLegalModalSection(null)}
      />

      {/* MODAL 6: CENTRO DE NOTIFICACIONES EMAILJS Y APROBACIÓN OBLIGATORIA DE INGRESO (ADMIN OK) */}
      <AdminApprovalAndEmailModal
        isOpen={emailModalState.isOpen}
        initialTab={emailModalState.tab}
        isAdmin={isAdmin}
        userEmail={
          isAdmin
            ? ADMIN_EMAIL
            : userProfile
            ? `${userProfile.fullName
                .toLowerCase()
                .replace(/\s+/g, '.')}@empresa.com`
            : 'ejecutivo@empresab2b.com'
        }
        userName={
          userProfile?.fullName ||
          (isAdmin ? 'Administrador BWOS' : 'Ejecutivo Acreditado B2B')
        }
        userCompany={
          userProfile?.companyName ||
          (isAdmin ? 'Dirección General BWOS' : 'Empresa Invitada B2B')
        }
        companies={companies}
        accessRequests={accessRequests}
        emailLogs={emailLogs}
        onClose={() =>
          setEmailModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onApproveRequest={handleApproveAccessRequest}
        onRejectRequest={handleRejectAccessRequest}
        onManualAuthorizeEmail={handleManualAuthorizeEmail}
        onSendManualEmail={handleSendManualEmail}
      />

      {/* GLOBAL TOAST FEEDBACK (Matches Image_2 & Image_10) */}
      {toastMessage && (
        <aside className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-inverse-surface text-inverse-on-surface px-4 py-3.5 rounded-xl shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-secondary-fixed text-[22px] shrink-0">
                check_circle
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-title-md text-[14px] leading-tight truncate">
                  {toastMessage.title}
                </span>
                {toastMessage.subtitle && (
                  <span className="font-body-sm text-inverse-on-surface/80 truncate">
                    {toastMessage.subtitle}
                  </span>
                )}
              </div>
            </div>
            <span className="font-label-sm text-primary-fixed bg-surface-tint/20 px-2 py-1 rounded shrink-0">
              B2B Match
            </span>
          </div>
        </aside>
      )}
    </div>
  );
}
