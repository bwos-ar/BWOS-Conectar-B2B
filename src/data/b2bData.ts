export interface UserProfile {
  fullName: string;
  companyName: string;
  countryCode: string;
  phone: string;
  offering: string;
  demand: string;
  accreditedAt: string;
  role?: string;
  location?: string;
}

export interface CompanyCard {
  id: string;
  name: string;
  shortCode: string;
  iconName: string;
  verified: boolean;
  location: string;
  countryFlag: string;
  countryCode: string;
  category: 'saas' | 'logistica' | 'manufactura' | 'servicios';
  sectorLabel: string;
  matchScore: number;
  responseTime: string;
  tierBadge?: string;
  extraBadges?: string[];
  summaryDescription: string;
  representative: {
    name: string;
    role: string;
    altName?: string;
    altRole?: string;
    icon: string;
    avatarUrl?: string;
    whatsapp: string;
  };
  offer: {
    badge: string;
    description: string;
    tags: string[];
  };
  demand: {
    badge: string;
    description: string;
    tags: string[];
  };
  footerNote: string;
  footerIcon: string;
  mutualConnections?: number;
  logoUrl: string;
  buildingImgUrl?: string;
  isConnected?: boolean;
  isBookmarked?: boolean;
  immediateCallAvailable: boolean;
  pitchMessageSent?: string;
  jitsiRoomName: string;
}

export interface MeetingItem {
  id: string;
  companyId: string;
  companyName: string;
  repName: string;
  repRole: string;
  repAvatar: string;
  matchScore: number;
  topic: string;
  offerTag: string;
  demandTag: string;
  status: 'scheduled' | 'postponed' | 'live';
  timeSlot: string;
  roomNumber: string;
  jitsiRoomName: string;
}

export interface IncomingCallData {
  callerName: string;
  callerRole: string;
  companyId: string;
  companyName: string;
  location: string;
  matchScore: number;
  roomNumber: string;
  quarterLabel: string;
  syncInterest: string;
  offerSummary: string;
  demandSummary: string;
  avatarDesktopUrl: string;
  avatarMobileUrl: string;
  jitsiRoomName: string;
}

export const SUMMIT_HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAnuvJscNewwDTuhfZmaFRXNlqE_D9YAxUm0y-FWnTA6snypQenB31JBqFESQsSCvICUguRvFL6PA1e1pSCAjpEus3wPiMfwoZiCwo8plKP8i8ggFvovDoFq_K9SQIP4j0YomOhenOS1ACRVtzWQE_8srLw5LL5vF4gxcHqp3Tl2BMgwF_XOCthsloNynMhmmsNAQcjAAYV0PyYSEzUVN5jEst7iRR49N4WI2IPeEVtwfEP_NI8-8XzAQ';

export const EXECUTIVE_AVATARS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDTZIoFTfyrIY9DNnooG-l3PNxCTVfx4NX_k6wDFI6XKNS_-mekrbeQTrYSozZ2R3iJHtl_AoBXyOF22L6WzdbwlbP08Rk8ESR5OK0_FuOxPjg35uu2qxTM5wpCrquu-QYrKH8eXhhCecI4crHesCdH4Hyhi35FnZly5W8rjsX8R9OMmgeFks3TnnK-4f_-d4tClbc6V4D-1xHpE-s5sNvgdjcOqZBKhzsRdlFIYL8Lz2GSJbH6SXDYgw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDOtzUERb0jOpXN1VRv49ZI3m0258vvCpMXQ-QtU4zN8HEGt3td-ao_4AmfPr0Vq6P1ktOQdfYBiN60VeODogiplx8BVGbeiaWHAqXUHBNKgJuj49KsVut4-87fF70RRCPgKUisWpJvzRsB7VIE63TEXarJXx71C_I12aziPOTx9apeljWOqM0-UT2AqYg6GpoZbRXO2hpN7iTB_vsDdwzMOibhsX-saU2F_FjMe5TrSmlWtUp545opKA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAF4vkfrhM1ScqmxgW4tA4KPi1UeJtTb-SpHo1yqEXgbYwGp4bg5yHjDOmugnV3yz8AEgJlzii3lqUyl_cm7nSugMNsFQ5huirlSL3epJ6ZoBVRrQX-JB-w2gOZYGdNz9NX1IWA3rhegDmJNTcLhIfvwMNLnr4mbfDg9K1HDNLI-wU4ZL26HrXvnrdTukaegLaj2hBGbpyno5aM2eScg6s5a9JtpshPf9rQJH_Yf8r2jiYq0TLf1WE9hw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDLyYUiwyHfbaeLTWGjwoLMB3EKZ_tYv25Z3sZN6IKE0NvjCsPLVzrVvrT0HtE3KPll36y6Z7cuCl-t9cBJiCkGmr1sc5Xwmsa3ldqS-Y8KqcRSr6AA0V1VQayuWPAOjxdobrPsfy6MxZmctF1ahEbrVza8HeXYXuqVI1bKN2WNr-5Od2UCKnfMjFbJpzuYh9NSQDFkRQh8zt2KIgTthEe4FqmJAYfnJEFTeqcx3CDfXv8A9J9-UrgVuQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDG6uY5_fISakOhge_JRhtvUKW3lm5IdBg1E4zyHnAPCo5mrbViPzUymAsPgSAUholsw7xnEmRP8nBxWkDXZEVpUaCjHJ0jlJ6juN1DxCI162NaCA-0-VU0Y8LhsvDz6wKgyRyjC8-hEscbmgIuqXOsg4DiKJHsM6avSzUHg7oj74DO34LqCg7h-2Cf3WMa6TJC6mEGCRNdGImQn98DyWfKSMb36KiQoVoHH1S3wLGd7vp2y1FQA9GTrw',
];

export const DEFAULT_INCOMING_CALL: IncomingCallData = {
  callerName: 'Carlos Mendonça',
  callerRole: 'CEO de InnovaTech B2B',
  companyId: 'innovatech-b2b',
  companyName: 'InnovaTech Soluciones B2B',
  location: 'São Paulo, Brasil • Sede Cono Sur',
  matchScore: 96,
  roomNumber: 'SALA #14',
  quarterLabel: 'Q3 2025',
  syncInterest: 'Integración de pasarela API y distribución mayorista para el mercado regional Q3.',
  offerSummary: 'Ofrece: Pasarelas API Fintech',
  demandSummary: 'Busca: Hubs Logísticos B2B',
  avatarDesktopUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAvVGFnk8IdNlVMsr7QgdC_R85NemMa-6lsAr97BabvJvoBfxu5tYeUFFaLqC77eDmKj8D8X1_pR2ks8raJo__92qfm2wSTfZSRbMmnrBlg02dbGEU3_k_z8Uq2WUS8J_POj8lSaEUOTlywwiVXztv7HOBxZN3Nl20u2Qh01KF_Cmd-k4rjRrv02kCFfPWwIHThRyY-Kb_hwx5l2IwENJCBScjwhXyb9T1VW-FKLvWjMQWMeF5lX84l4A',
  avatarMobileUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBBiciFU1NrjhiILtE5eokDHmMG810VGHjDye4csE0o-dU3gmqk08wulUY7TssGzd42AynIpnHXWr9rz83oJWvgs0atgBjBpODXpDuHy4JCDNLRxZo1ryHJxs8Dbt3BatH6oYkb6rt-NpigbvbGtDHrlN4FPKZsdZXXqYUJYa2i3gQRx7l7M5ZcPdc7vCIlhqJ5tA4_46w_Fv1WIhKKyZvtCzIGK6wMQkPEZzhktp-Ol-PTDnIzFk-zQA',
  jitsiRoomName: 'BWOS_Conectar_B2B_Sala_14_InnovaTech',
};

export const INITIAL_COMPANIES: CompanyCard[] = [
  {
    id: 'kurox-cloud-ai',
    name: 'Kurox Cloud AI',
    shortCode: 'KX',
    iconName: 'hub',
    verified: true,
    location: 'Santiago, Chile / Madrid, ES',
    countryFlag: '🇨🇱',
    countryCode: 'CL',
    category: 'saas',
    sectorLabel: 'SaaS & Big Data',
    matchScore: 98,
    responseTime: 'Resp. < 15min',
    summaryDescription:
      'Modelos fundacionales para detección algorítmica de fraude en carritos B2B y prevención de desabastecimiento.',
    representative: {
      name: 'Ing. Carlos Mendoza',
      role: 'VP of Enterprise Partnerships',
      altName: 'Valeria Méndez',
      altRole: 'Directora de Expansión Latam',
      icon: 'badge',
      avatarUrl: EXECUTIVE_AVATARS[0],
      whatsapp: '+56982341100',
    },
    offer: {
      badge: 'Disponibilidad Q2',
      description:
        'Plataforma AutoML para predicción de fuga de clientes, conciliación fiscal multi-divisa y optimización en tiempo real de cadenas de distribución retail.',
      tags: ['AutoML detección de fraudes', 'Optimización de stock retail'],
    },
    demand: {
      badge: 'Ticket: $50k+ USD',
      description:
        'Alianzas con integradores de ERP (SAP, Oracle), despachos corporativos y directores de logística en México o Colombia con flotas sobre 100 unidades.',
      tags: ['Integradores ERP SAP/Oracle', 'Flotas de camiones con GPS'],
    },
    footerNote: 'Match Score 98%',
    footerIcon: 'verified_user',
    mutualConnections: 6,
    logoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCJJyXsmXxZSmJQtCtj9o87CZv9BZGQ0lNmxPUpwZmTAp7Tomh-QhuH9QtzsfCn82Y1drZN7njrUREbluYd_dJfCLIekpcEcvDTvhVRc8AB3qOJj8Ao2yhx7dB8g22KIgMshIur_gob0TYV9j6FvkN74xjTAYOKeVRun0aUr76192HoQMDic2IeynbB7V3W5R1PMDSwoPiFTuHAmu26AIevHbxZ0XGFFwgyL747_nHu1fKVXsU8bFZjZQ',
    buildingImgUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD060r9TfWAsbIjJBwsNY3j1kszvtMWj1Md1Exgv2lG9INZ7Q3_rHqeoFAhpEfBxlMcqBBUxDWlmy8pZk8ZU4pTIPO_X-dtzwURTV02zhs77WtePx3LeD0tGxrp9JUAa6IguHn3rXhMrXB0tcb8mzm05aSaFZclxLPdshsDNmwgh2Lh6CC_Lh8FiY8FReOU7-863fonD35xGw9ZgM8G1IKF5Ubd4gsHx6LByvRWWFCUb6xOs-VWn2753w',
    immediateCallAvailable: true,
    jitsiRoomName: 'BWOS_Conectar_B2B_Kurox_Cloud_AI',
  },
  {
    id: 'envases-bionova',
    name: 'Envases BioNova',
    shortCode: 'EB',
    iconName: 'eco',
    verified: true,
    location: 'Guadalajara / Monterrey, México',
    countryFlag: '🇲🇽',
    countryCode: 'MX',
    category: 'manufactura',
    sectorLabel: 'Manufactura & Empaques',
    matchScore: 94,
    responseTime: 'Resp. < 2h',
    summaryDescription:
      'Fabricante líder de soluciones poliméricas biodegradables para farmacéutica, horticultura y logística pesada.',
    representative: {
      name: 'Lic. Sofía Valenzuela',
      role: 'Directora Comercial de Cuentas Clave',
      altName: 'Ing. Carlos Villarreal',
      altRole: 'VP Comercial & Operaciones',
      icon: 'engineering',
      avatarUrl: EXECUTIVE_AVATARS[1],
      whatsapp: '+523319824500',
    },
    offer: {
      badge: 'Certificación FSC / ISO',
      description:
        'Packaging 100% compostable termorresistente grado alimenticio ISO-9001 para agroexportadoras, alimentos procesados y logística en frío grado médico.',
      tags: ['Packaging 100% compostable', 'Bio-film grado médico termorresistente'],
    },
    demand: {
      badge: 'Licitación Semestral',
      description:
        'Proveedores directos de biopolímeros base almidón de yuca/maíz certificado y servicios de flete marítimo consolidado hacia puertos del Pacífico.',
      tags: ['Biopolímeros fécula de maíz certificada', 'Maquinaria extrusora de film'],
    },
    footerNote: 'Disp. reunión inmediata',
    footerIcon: 'videocam',
    mutualConnections: 3,
    logoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCf5lUEPfoqMrQq6uCi1CQS1xIG4cs9svCdWaJrREo_ZDbogH2KKSAjGQ18yGnB4CjH7e6m0WpEt58ba568RlToQyUiA7bfDzmeumJm5EaEAzbv5A-WxErx-jvjXWnYGhqfGRMz2hxDa88AUUgvGtzW7C19CpDtG0vZ17fNPWqGJl0gZZtrjzAi-9PigL5XGjkvK7m4kPwjLwpjI4WOkP2_yIBUiX4fsX2GXqF4E1A-_KwRz920Rt2MFQ',
    buildingImgUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBM_hMQNhP5aWc6jUU_q-tIA-hiP2j7e3xg75p9vNP4maUuhd7CUviR4_HTm6wrVWipaSdN6XHg4NyOA3zbm9MIGHsbxOyIXu5i1rwYN-bSglBCc5JD_mh0Zx7VmNtlEyHrgvdsG_Lhgc-5PcuqB5RyKZYwuODFeYAsb3Ka3rFU3CfdefeqRfo6alivjo9g10NN57yI5AChvEMmK7q4XDnbS6bQB4DCnMvf_bbWDCiabroUNgbfTyIROA',
    immediateCallAvailable: true,
    jitsiRoomName: 'BWOS_Conectar_B2B_Envases_BioNova',
  },
  {
    id: 'vectra-logistics',
    name: 'Vectra Logistics & Factoring',
    shortCode: 'VL',
    iconName: 'account_balance',
    verified: true,
    location: 'Bogotá / Medellín, Colombia',
    countryFlag: '🇨🇴',
    countryCode: 'CO',
    category: 'logistica',
    sectorLabel: 'Cadena de Suministro & Factoring',
    matchScore: 96,
    responseTime: 'Resp. < 5 min',
    summaryDescription:
      'Agenciamiento de carga multimodal integrado con liquidez anticipada de facturas comerciales transfronterizas.',
    representative: {
      name: 'Mateo Giraldo C.',
      role: 'Gerente General de Operaciones Andinas',
      altName: 'Mariana Gómez Silva',
      altRole: 'Head of Global Trade Finance',
      icon: 'local_shipping',
      avatarUrl: EXECUTIVE_AVATARS[2],
      whatsapp: '+573104459821',
    },
    offer: {
      badge: '45k m² Almacén',
      description:
        'Corredor logístico aduanero multimodal LCL/FCL con tracking IoT satelital 24/7 y factoraje internacional con anticipo de liquidez en menos de 24 horas.',
      tags: ['Fletes marítimos LCL / FCL', 'Factoraje anticipado 24h'],
    },
    demand: {
      badge: 'SaaS B2B',
      description:
        'Sistemas de optimización de rutas con Machine Learning e importadores de insumos agroindustriales y tecnología médica en puertos del Pacífico.',
      tags: ['Importadores de insumos agro', 'Exportadores de café y fruta fresca'],
    },
    footerNote: 'Cupo activo USD $4.5M',
    footerIcon: 'currency_exchange',
    mutualConnections: 5,
    logoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCiDlCqg5U69TMrbWa69QX31u2kV2kwangDE2qCwAI-DBj0D4X5278qvdma83BNvE63DSH9DQZ2RHl4pEAyiT8MGHQ-pppGMdSwQtTa5zNrRROCZpS5suP0TzObVcEfGcN3kvPcTafD1n2zf3Rd2f2hGdl9pi39fc4eytowq59cYC8mE7FX6Q2INGmD2g1RcWSDYNPLw-1tCWgWbgXHoyfG18fCVidVxLlLD3sFdpOHNU6M1KmPcmijRg',
    buildingImgUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ4x7s26nfK38PI0oZeBWwYisX8uKR5vtPNPfpYVV-yZ6WmPHTrGJvnqWwolAZAyOwdDlPOyCx9KXem8e5XvCfCgmfyLGgHPmp6QE85nGl_tglIIxbFbukf5SgImtpMoh13euYq1WSnmml3NxA7C5uRqvfwpX5vyFz7mk1UNWJm_i7YHifvSvpNdFkpbRdthaZy_xDH7ipnaS9sRI47Bfm6EtPMy06Jp1BF1nOF2bsym8TstlAg2vQXw',
    immediateCallAvailable: true,
    jitsiRoomName: 'BWOS_Conectar_B2B_Vectra_Logistics',
  },
  {
    id: 'synapse-robotics',
    name: 'Synapse Robotics',
    shortCode: 'SR',
    iconName: 'smart_toy',
    verified: true,
    location: 'Monterrey, MX / Santiago, CL',
    countryFlag: '🇲🇽',
    countryCode: 'MX',
    category: 'manufactura',
    sectorLabel: 'Industria 4.0 & Robótica',
    matchScore: 95,
    responseTime: 'Resp. < 30min',
    summaryDescription:
      'Integración de celdas robóticas colaborativas e inteligencia artificial visual para manufactura de alta precisión.',
    representative: {
      name: 'Dra. Elena Villalobos',
      role: 'Chief Technology Officer & Founder',
      altName: 'Felipe Arancibia',
      altRole: 'Gerente de Soluciones IoT',
      icon: 'smart_toy',
      avatarUrl: EXECUTIVE_AVATARS[4],
      whatsapp: '+528183459012',
    },
    offer: {
      badge: 'Cobots Certificados',
      description:
        'Brazos robóticos colaborativos, sensores IoT industriales y visión artificial para control de calidad cero defectos en líneas de ensamble.',
      tags: ['Cobots de paletizado llave en mano', 'Visión artificial cero defectos'],
    },
    demand: {
      badge: 'Tier-1 / Tier-2',
      description:
        'Plantas manufactureras, embotelladoras o centros de distribución con volumen superior a 5,000 unidades diarias interesadas en automatización piloto.',
      tags: ['Plantas automotrices Tier-1', 'Centros de distribución en automatización'],
    },
    footerNote: 'Capacidad comprobada',
    footerIcon: 'speed',
    mutualConnections: 4,
    logoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBgt_uebaPtBvFa68R5CyvlpK8BFEUTPPpXgY_F3uwSRgPVsR8LC2DB_5wTNUKaAvbmA8_bajRJOjEEWQZrbrYt6QbXcmgHyiOOW7nO1pn-N2OvznN0TzFhpd_Pqy9Evboo8BWbHDqr1Myz1jVt-786HHj3d5z_WgokAs3PLQG2h-AO7LzFT445JV6i0AoIIVuzjv0H3sCsvXVc7PSDBXH04572ZZKpEZHJpaciMkpL9ofd5XeLhd66Kg',
    buildingImgUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDbK0Tp2w1ftGSFtgm-G52bC6ZM0AV9ejWt7vU8Yh8jQb1gfBVHcCaIe_Z5ojzGe8W0qE9JFwEr4tvNQayrygYTdc0-cmiXwq4m2-pDAUMJ3uMaYgJuYuT3XhJTJEFc3jlOOBDIEb4pPm2fApV7ZaJsK1EaOc5I8sje1CTgiHqemIwASxLIjlIh01QtOitDy5nFn50VK1h7UnkooA_vyGiA2efx-_evwIVRjSwXToiM2tLDrntp6De-zA',
    immediateCallAvailable: false,
    jitsiRoomName: 'BWOS_Conectar_B2B_Synapse_Robotics',
  },
  {
    id: 'innovatech-b2b',
    name: 'InnovaTech Soluciones B2B',
    shortCode: 'IT%',
    iconName: 'account_balance',
    verified: true,
    location: 'Bogotá, CO / Lima, PE / São Paulo',
    countryFlag: '🇵🇪',
    countryCode: 'PE',
    category: 'saas',
    sectorLabel: 'Software & IT · Fintech Enterprise',
    matchScore: 98,
    responseTime: 'Resp. < 2h',
    summaryDescription:
      'Desarrollo de infraestructura bancaria core y capas de orquestación SaaS para consorcios comerciales transfronterizos.',
    representative: {
      name: 'Carlos Mendonça',
      role: 'CEO de InnovaTech B2B',
      altName: 'Renato Paredes Ruiz',
      altRole: 'Gerente de Finanzas Corporativas B2B',
      icon: 'account_balance',
      avatarUrl: DEFAULT_INCOMING_CALL.avatarDesktopUrl,
      whatsapp: '+51987654321',
    },
    offer: {
      badge: 'Factoring & ERP Cloud',
      description:
        'Plataformas ERP cloud modulares, integraciones vía APIs bancarias y liquidación anticipada de cuentas por cobrar B2B transfronterizas indexadas a SOFR.',
      tags: ['ERP cloud para tesorería', 'APIs bancarias abiertas PSD2'],
    },
    demand: {
      badge: 'Exportadores & Retail',
      description:
        'Canales de distribución retail IT en Cono Sur y empresas agroindustriales de la Alianza del Pacífico con facturación mayor a $2M USD anuales.',
      tags: ['Distribución canal retail IT regional', 'Partners de soporte L3'],
    },
    footerNote: '12 acuerdos cerrados',
    footerIcon: 'handshake',
    mutualConnections: 4,
    logoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD1qSA9DIGTR39OcOLrJ2uu5ag4StDp3Sf8x2OxFUhQIwnGoeVzLTPDQPl9Wt2z6paIE0R0SuXmH9k04GuhI9VSil9alk7vAV2ftRM_djiTIatAhS2444m1RQlvKKtOEFnUsCd9QdyWNHaL5pORGGyVJNXw1smmrTbGxPM_otumb3zN3eo0NENScyU_TkiqysuGI0hXh3hN5qrbpjwkRUmoi5mBb0gtiyiGACPEsSKESBpHeyiXurimKA',
    buildingImgUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDWDmNuH4jmrvEGkmOxU8DfAaIY8VQJVAIwedgZbzZ6IDJehTNvCtE1gON_aEjmDTvBOrKGbejh0ok_R6MCGOigC3bvyRuh4g-EA4afMXZoMhLXZ02dEGjvz-S2tKor6tED8wg55sDwUjw3jRuvvBiqyhusITdPtthYWlXKl0QvPtgfKgcxRYWoNaF_h2Lx68x7a9oWVKuojA_7mFOqWGclbaEgWQmWjSBO7W2IHSYfxVpii5BzM05G0w',
    immediateCallAvailable: true,
    jitsiRoomName: 'BWOS_Conectar_B2B_Sala_14_InnovaTech',
  },
  {
    id: 'apex-renewable',
    name: 'Apex Renewable',
    shortCode: 'AR',
    iconName: 'solar_power',
    verified: true,
    location: 'Antofagasta, Chile',
    countryFlag: '🇨🇱',
    countryCode: 'CL',
    category: 'servicios',
    sectorLabel: 'Energía Limpia & ESG',
    matchScore: 93,
    responseTime: 'Resp. < 1h',
    summaryDescription:
      'Ingeniería energética e implementación de micro-redes solares fotovoltaicas e infraestructura de almacenamiento BESS.',
    representative: {
      name: 'Camila Santander',
      role: 'Directora de Soluciones de Eficiencia ESG',
      icon: 'solar_power',
      avatarUrl: EXECUTIVE_AVATARS[1],
      whatsapp: '+56977123490',
    },
    offer: {
      badge: 'PPA Comercial',
      description:
        'Micro-redes solares fotovoltaicas y almacenamiento en baterías industriales con cero inversión inicial (Capex $0).',
      tags: ['Micro-redes solares Capex $0', 'Baterías industriales BESS'],
    },
    demand: {
      badge: 'Alta Demanda',
      description:
        'Parques industriales o bodegas logísticas con más de 2,500 m² de superficie de cubierta libre para instalación técnica.',
      tags: ['Naves industriales >2,500 m²', 'Bodegas logísticas Cono Sur'],
    },
    footerNote: 'Disp. reunión inmediata',
    footerIcon: 'videocam',
    mutualConnections: 2,
    logoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCW-mS8q-vAiNzMmAdshZcjtZJ_vP4c8Qd5pfUo8kdXekSBnknEte1mv9FOLLBT5xkb7RxslSnBRjdmUJSY-4hgQXnxR-pUyFn_Xg8KHs1PiL7TckD15WSFbRpVFeyqmABAWo7gcJeBATUopdjF2CqOncf4xvS4RLTKrAoOZZWVk4lo2Pb4tpIJPIQyXpEHbVkJR1lb8AtbdHON-zqbJKLYFkNYQP-gBp03IYLyyqEAWIsUKdtF07nBRQ',
    immediateCallAvailable: true,
    jitsiRoomName: 'BWOS_Conectar_B2B_Apex_Renewable',
  },
  {
    id: 'logistica-integral-andina',
    name: 'Logística Integral Andina',
    shortCode: 'LA',
    iconName: 'local_shipping',
    verified: true,
    location: 'Lima, PE (Hub Pacífico)',
    countryFlag: '🇵🇪',
    countryCode: 'PE',
    category: 'logistica',
    sectorLabel: 'Logística & Supply Chain · Carga Pesada',
    matchScore: 95,
    responseTime: 'Resp. < 30 min',
    extraBadges: ['Flota Eléctrica 40%', 'BASC & ISO 9001'],
    summaryDescription:
      'Operador logístico de carga refrigerada y distribución B2B de última milla con trazabilidad aduanera en tiempo real.',
    representative: {
      name: 'Ing. Roberto Salazar',
      role: 'Director de Operaciones Hub Pacífico',
      icon: 'local_shipping',
      avatarUrl: EXECUTIVE_AVATARS[3],
      whatsapp: '+51998112233',
    },
    offer: {
      badge: 'Capacidad Inmediata',
      description:
        'Distribución de última milla B2B, almacenamiento con temperatura controlada y trazabilidad aduanera en tiempo real.',
      tags: ['Última milla B2B refrigerada', 'Cadena de frío pharma continua'],
    },
    demand: {
      badge: 'Licitación Abierta',
      description:
        'Proveedores de empaques sostenibles compostables y telemetría satelital IoT para remolques frigoríficos.',
      tags: ['Empaques compostables certificados', 'Sensores y telemetría IoT'],
    },
    footerNote: 'Auditoría BASC Vigente',
    footerIcon: 'task_alt',
    mutualConnections: 5,
    logoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAe6MOG__FXAPLNXOt3JVK_YzdH8cSMwb23vxGaP_tTOyGkOI44WFuk6apaLp4hNrDef9ZGpOXi88yW-gF4pk4TLKUlEckNHehQ2NWDkuR-z7-CR3aIZq0nabhlU3EYkK3CnXEBnkB3R13mS-qJ7JAcsyqaMZEyX9GLz3Dw8tHcDJJSrwPAXQpBhosDA8zAsOD9BVcb9hX1woT9UdZkER-0jy4Krx9J_IlGvuTsQfD8LANh9JHrkg886w',
    buildingImgUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAe6MOG__FXAPLNXOt3JVK_YzdH8cSMwb23vxGaP_tTOyGkOI44WFuk6apaLp4hNrDef9ZGpOXi88yW-gF4pk4TLKUlEckNHehQ2NWDkuR-z7-CR3aIZq0nabhlU3EYkK3CnXEBnkB3R13mS-qJ7JAcsyqaMZEyX9GLz3Dw8tHcDJJSrwPAXQpBhosDA8zAsOD9BVcb9hX1woT9UdZkER-0jy4Krx9J_IlGvuTsQfD8LANh9JHrkg886w',
    immediateCallAvailable: true,
    jitsiRoomName: 'BWOS_Conectar_B2B_Logistica_Andina',
  },
  {
    id: 'nexus-industrial-cloud',
    name: 'Nexus Industrial Cloud',
    shortCode: 'NX',
    iconName: 'precision_manufacturing',
    verified: true,
    location: 'Santiago, CL',
    countryFlag: '🇨🇱',
    countryCode: 'CL',
    category: 'servicios',
    sectorLabel: 'Servicios Industriales · Automatización',
    matchScore: 97,
    responseTime: 'Resp. < 1h',
    tierBadge: 'Tier 1 Partner',
    summaryDescription:
      'Automatización perimetral y gemelos digitales con IA en plantas de manufactura pesada y siderúrgica.',
    representative: {
      name: 'Ing. Martín Valdivia',
      role: 'VP de Ingeniería & Gemelos Digitales',
      icon: 'precision_manufacturing',
      avatarUrl: EXECUTIVE_AVATARS[2],
      whatsapp: '+56965432189',
    },
    offer: {
      badge: 'Capacidad Inmediata',
      description:
        'Mantenimiento predictivo basado en IA industrial, gemelos digitales para plantas de manufactura y sensores IoT.',
      tags: ['Mantenimiento predictivo con IA', 'Telemetría de turbinas'],
    },
    demand: {
      badge: 'Licitación Abierta',
      description:
        'Contratos de suministro de energía limpia fotovoltaica y consultoría para descarbonización operativa.',
      tags: ['PPA energía limpia solar >10MW', 'Inversores industriales'],
    },
    footerNote: 'Auditoría B2B Verificada',
    footerIcon: 'security',
    mutualConnections: 7,
    logoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAUR9Yks371rVw2rFfr6MjfdGjwKaMBMRN030rYRdqlkp-63K0F62F9Nqz8kgF2O5HvzsTxEziVy5DudIaskxLnOcasDF6A0m-00v52QuE0Sd4kglaiAI8br5voP4wGANibMyaz2rnLVhZ2JBOM8t2Gdyb5qWBgbBpnc2sgctlsPnSuiwgUe4kAylgjCET5kzamr21xA1LhojQ9KZvYNhe__470BY2qYzjNwZegaBJHWF2dIQxmrkUc5g',
    buildingImgUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAUR9Yks371rVw2rFfr6MjfdGjwKaMBMRN030rYRdqlkp-63K0F62F9Nqz8kgF2O5HvzsTxEziVy5DudIaskxLnOcasDF6A0m-00v52QuE0Sd4kglaiAI8br5voP4wGANibMyaz2rnLVhZ2JBOM8t2Gdyb5qWBgbBpnc2sgctlsPnSuiwgUe4kAylgjCET5kzamr21xA1LhojQ9KZvYNhe__470BY2qYzjNwZegaBJHWF2dIQxmrkUc5g',
    immediateCallAvailable: true,
    jitsiRoomName: 'BWOS_Conectar_B2B_Nexus_Industrial',
  },
];

export const INITIAL_MEETINGS: MeetingItem[] = [
  {
    id: 'meet-1',
    companyId: 'innovatech-b2b',
    companyName: 'InnovaTech Soluciones B2B',
    repName: 'Carlos Mendonça',
    repRole: 'CEO de InnovaTech B2B',
    repAvatar: DEFAULT_INCOMING_CALL.avatarDesktopUrl,
    matchScore: 96,
    topic: 'Integración de pasarela API y distribución mayorista para el mercado regional Q3.',
    offerTag: 'Pasarelas API Fintech',
    demandTag: 'Hubs Logísticos B2B',
    status: 'live',
    timeSlot: 'En vivo ahora · Mesa Activa',
    roomNumber: 'SALA #14',
    jitsiRoomName: 'BWOS_Conectar_B2B_Sala_14_InnovaTech',
  },
  {
    id: 'meet-2',
    companyId: 'kurox-cloud-ai',
    companyName: 'Kurox Cloud AI',
    repName: 'Ing. Carlos Mendoza',
    repRole: 'VP of Enterprise Partnerships',
    repAvatar: EXECUTIVE_AVATARS[0],
    matchScore: 98,
    topic: 'Alianza de integración ERP SAP/Oracle y analítica predictiva para cadena retail.',
    offerTag: 'AutoML detección de fraudes',
    demandTag: 'Integradores ERP SAP/Oracle',
    status: 'scheduled',
    timeSlot: 'Hoy · 11:30 AM (GMT-5)',
    roomNumber: 'SALA #08',
    jitsiRoomName: 'BWOS_Conectar_B2B_Kurox_Cloud_AI',
  },
  {
    id: 'meet-3',
    companyId: 'envases-bionova',
    companyName: 'Envases BioNova',
    repName: 'Lic. Sofía Valenzuela',
    repRole: 'Directora Comercial de Cuentas Clave',
    repAvatar: EXECUTIVE_AVATARS[1],
    matchScore: 94,
    topic: 'Suministro de empaques compostables grado médico y consolidación marítima.',
    offerTag: 'Packaging 100% compostable',
    demandTag: 'Flete marítimo Pacífico',
    status: 'scheduled',
    timeSlot: 'Hoy · 12:15 PM (GMT-5)',
    roomNumber: 'SALA #21',
    jitsiRoomName: 'BWOS_Conectar_B2B_Envases_BioNova',
  },
];
