import React, { useState } from 'react';
import {
  EXECUTIVE_AVATARS,
  SUMMIT_HERO_IMAGE,
  UserProfile,
} from '../data/b2bData';
import { InlineLegalRedBanner } from './LegalRedNoticeModal';

interface AccreditationViewProps {
  userProfile: UserProfile | null;
  isAdmin?: boolean;
  onCompleteAccreditation: (profile: UserProfile) => void;
  onOpenLegalNotice: (section: string) => void;
}

export const AccreditationView: React.FC<AccreditationViewProps> = ({
  userProfile,
  isAdmin = false,
  onCompleteAccreditation,
  onOpenLegalNotice,
}) => {
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [companyName, setCompanyName] = useState(userProfile?.companyName || '');
  const [countryCode, setCountryCode] = useState(userProfile?.countryCode || '+52');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [offering, setOffering] = useState(userProfile?.offering || '');
  const [demand, setDemand] = useState(userProfile?.demand || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittingState, setSubmittingState] = useState<'idle' | 'syncing' | 'done'>('idle');

  const handleQuickFillDemo = () => {
    setFullName('Sofía Alarcón');
    setCompanyName('Logística Global S.A.');
    setCountryCode('+52');
    setPhone('55 1234 5678');
    setOffering(
      'Fabricación de empaques biodegradables para exportación masiva y logística de frío certificada en México, Cono Sur y Centroamérica.'
    );
    setDemand(
      'Proveedores de materia prima reciclada grado alimenticio (rPET) con capacidad de entrega mensual de 50 toneladas y partners SaaS de ruteo.'
    );
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !companyName.trim() || !phone.trim()) {
      setErrorMsg('Por favor completa tu Nombre completo, Empresa y WhatsApp Empresarial.');
      return;
    }

    if (offering.trim().length < 20) {
      setErrorMsg(
        'Por favor describe tu oferta comercial ("Qué ofrezco") con al menos 20 caracteres para activar el algoritmo de emparejamiento.'
      );
      return;
    }

    if (demand.trim().length < 20) {
      setErrorMsg(
        'Por favor describe tu demanda comercial ("Qué demando") con al menos 20 caracteres para sincronizar las reuniones 1:1.'
      );
      return;
    }

    setSubmittingState('syncing');
    setTimeout(() => {
      setSubmittingState('done');
      setTimeout(() => {
        onCompleteAccreditation({
          fullName: fullName.trim(),
          companyName: companyName.trim(),
          countryCode,
          phone: phone.trim(),
          offering: offering.trim(),
          demand: demand.trim(),
          accreditedAt: new Date().toISOString(),
        });
      }, 650);
    }, 900);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-10">
      {/* Mobile / Tablet Auditorium Hero Banner (from Image_4) */}
      <div className="lg:hidden relative w-full rounded-2xl overflow-hidden mb-6 shadow-sm bg-surface-container">
        <div
          className="w-full h-40 bg-cover bg-center relative"
          style={{ backgroundImage: `url('${SUMMIT_HERO_IMAGE}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/45 to-transparent flex flex-col justify-end p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm uppercase tracking-wider">
                Matchmaking B2B
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/20 backdrop-blur-sm text-inverse-on-surface font-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse" />
                En vivo
              </span>
            </div>
            <p className="font-headline-sm text-inverse-on-surface leading-tight">
              BWOS Summit 2025 · Acreditación Oficial
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
        {/* Left Column: Institutional & Live Social Proof (from Image_6 & Image_18) */}
        <section
          aria-labelledby="section-presentation"
          className="lg:col-span-5 flex flex-col gap-6"
        >
          {/* Event Header Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-label-md uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">handshake</span>
              Matchmaking B2B
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-md font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              En vivo
            </span>
          </div>

          {/* Headline & Subtitle */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-primary font-headline-sm uppercase tracking-wide text-[14px]">
              <span>BWOS Summit 2025</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-tertiary">Conectar</span>
            </div>
            <h1
              id="section-presentation"
              className="text-[28px] sm:text-[34px] font-extrabold text-on-surface leading-[1.2] tracking-tight"
            >
              Acreditación Empresarial - Ingreso al Evento
            </h1>
            <p className="font-body-lg text-on-surface-variant leading-relaxed">
              Completa tu perfil de intercambio comercial para conectar con contrapartes afines en tiempo real durante las sesiones plenarias y mesas de negociación.
            </p>
          </div>

          {/* Desktop Summit Auditorium Card Preview */}
          <div className="hidden lg:block relative w-full rounded-2xl overflow-hidden shadow-sm border border-surface-container">
            <img
              src={SUMMIT_HERO_IMAGE}
              alt="BWOS Summit 2025 Auditorium"
              referrerPolicy="no-referrer"
              className="w-full h-36 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/85 via-inverse-surface/30 to-transparent flex items-end justify-between p-4">
              <div>
                <span className="font-label-sm text-secondary-fixed uppercase tracking-wider">
                  Rondas de Negocios en Vivo
                </span>
                <p className="font-title-md text-white">
                  Salas 1-a-1 con Jitsi Meet Integrado
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md text-white font-label-sm">
                Acceso Directo
              </span>
            </div>
          </div>

          {/* Key Visual Feature Card: Motor Neuronal B2B */}
          <div className="relative overflow-hidden rounded-2xl bg-surface-container-low border border-surface-container p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[24px]">hub</span>
                </div>
                <div>
                  <h2 className="font-title-md text-on-surface">Motor Neuronal B2B</h2>
                  <p className="font-body-sm text-on-surface-variant">
                    Matching predictivo por sectores
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-secondary-container/50 text-on-secondary-container font-label-sm font-extrabold">
                98.4% Precisión
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={98}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Nivel de precisión del motor neuronal"
              className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden"
            >
              <div className="bg-primary-container h-full rounded-full w-[98%] transition-all duration-500" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container">
                <p className="font-label-sm text-outline uppercase">Tiempo Promedio</p>
                <p className="font-headline-sm text-on-surface mt-1 tabular-nums">
                  3.2 seg / Match
                </p>
              </div>
              <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container">
                <p className="font-label-sm text-outline uppercase">Reuniones 1:1</p>
                <p className="font-headline-sm text-secondary mt-1">Cupos dinámicos</p>
              </div>
            </div>
          </div>

          {/* Live Social Proof & Executive Avatars */}
          <div className="rounded-2xl bg-surface-container-lowest p-5 border border-surface-container flex items-center gap-4 shadow-sm">
            <div className="flex -space-x-3 overflow-hidden shrink-0">
              {EXECUTIVE_AVATARS.slice(0, 3).map((avatarUrl, idx) => (
                <img
                  key={idx}
                  src={avatarUrl}
                  alt={`Directivo conectado ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="inline-block h-11 w-11 rounded-full object-cover shadow-sm ring-2 ring-surface-container-lowest bg-surface-container"
                />
              ))}
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed font-label-md font-bold shadow-sm ring-2 ring-surface-container-lowest tabular-nums">
                +140
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="font-title-md text-on-surface">
                  Más de 140 directivos
                </span>
              </div>
              <p className="font-body-sm text-on-surface-variant">
                conectados e intercambiando fichas en este momento
              </p>
            </div>
          </div>

          {/* Quick Trust Indicators */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-on-surface-variant px-1 font-body-sm font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                verified_user
              </span>
              <span>Fichas verificadas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">
                lock
              </span>
              <span>Datos encriptados</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-tertiary">
                bolt
              </span>
              <span>Acceso inmediato</span>
            </div>
          </div>
        </section>

        {/* Right Column: Business Registration Form */}
        <section
          aria-labelledby="form-heading"
          className="lg:col-span-7 bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-md p-6 sm:p-8 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-1.5 border-b border-surface-container pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 id="form-heading" className="font-headline-md text-on-surface">
                  Ficha de Acreditación B2B
                </h2>
                <span className="material-symbols-outlined text-surface-tint text-[20px] material-fill">
                  verified
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleQuickFillDemo}
                    className="px-3 py-1 rounded-lg bg-primary-fixed/70 hover:bg-primary-fixed text-primary font-label-sm transition-colors cursor-pointer"
                  >
                    Autocompletar (Admin)
                  </button>
                )}
                <span className="font-label-sm uppercase bg-surface-container-high px-2.5 py-1 rounded-md text-tertiary">
                  Paso 1 de 1
                </span>
              </div>
            </div>
            <p className="font-body-sm text-on-surface-variant">
              Ingresa tus datos exactos para generar tu credencial digital y alimentar el algoritmo de rondas.
            </p>
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {/* Row 1: Full Name & Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="fullName"
                  className="font-label-md text-on-surface font-bold flex items-center justify-between"
                >
                  <span>
                    Nombre completo <span className="text-error font-black">*</span>
                  </span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                    person
                  </span>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Sofia Alarcón"
                    className="w-full pl-10 pr-3.5 py-3 bg-surface rounded-xl border border-outline-variant text-on-surface placeholder:text-outline font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="companyName"
                  className="font-label-md text-on-surface font-bold flex items-center justify-between"
                >
                  <span>
                    Empresa <span className="text-error font-black">*</span>
                  </span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                    domain
                  </span>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Logística Global S.A."
                    className="w-full pl-10 pr-3.5 py-3 bg-surface rounded-xl border border-outline-variant text-on-surface placeholder:text-outline font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp Phone with Country Code Picker */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="phone" className="font-label-md text-on-surface font-bold">
                  WhatsApp Empresarial <span className="text-error font-black">*</span>
                </label>
                <span className="text-outline font-label-sm">
                  Para alertas de reuniones 1:1
                </span>
              </div>
              <div className="flex rounded-xl border border-outline-variant overflow-hidden bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="relative flex items-center bg-surface-container-high px-3 text-on-surface border-r border-outline-variant shrink-0">
                  <span className="material-symbols-outlined text-secondary text-[18px] mr-1.5">
                    chat
                  </span>
                  <label htmlFor="country-code" className="sr-only">
                    Código de país telefónico
                  </label>
                  <select
                    id="country-code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-transparent font-title-md text-[14px] text-on-surface outline-none cursor-pointer pr-5 py-3 appearance-none"
                  >
                    <option value="+52">🇲🇽 +52</option>
                    <option value="+54">🇦🇷 +54</option>
                    <option value="+56">🇨🇱 +56</option>
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+51">🇵🇪 +51</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+1">🇺🇸 +1</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-1.5 text-outline text-[16px] pointer-events-none">
                    arrow_drop_down
                  </span>
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="55 1234 5678"
                  className="w-full px-3.5 py-3 bg-transparent text-on-surface placeholder:text-outline font-body-md outline-none"
                />
              </div>
            </div>

            {/* Section Divider: Matriz de Intercambio Comercial */}
            <div className="relative py-2 flex items-center justify-center">
              <div className="w-full h-px bg-surface-container-high" />
              <span className="absolute bg-surface-container-lowest px-3.5 font-label-sm text-outline uppercase font-extrabold tracking-wider">
                Matriz de Intercambio Comercial
              </span>
            </div>

            {/* Offer & Demand Textareas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Qué Ofrezco */}
              <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface-container-low border border-surface-container">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="offering"
                    className="font-title-md text-on-surface flex items-center gap-1.5"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    Qué ofrezco
                  </label>
                  <span className="font-label-sm px-2 py-0.5 rounded bg-secondary-container/60 text-on-secondary-container uppercase font-extrabold">
                    Oferta B2B
                  </span>
                </div>
                <p className="font-body-sm text-on-surface-variant">
                  Describe tus productos clave, capacidades industriales, soluciones SaaS o consultoría que pones a disposición del ecosistema.
                </p>
                <textarea
                  id="offering"
                  name="offering"
                  rows={4}
                  maxLength={300}
                  required
                  value={offering}
                  onChange={(e) => setOffering(e.target.value)}
                  placeholder="Ej. Fabricación de empaques biodegradables para exportación masiva y logística de frío en México y Centroamérica..."
                  className="w-full p-3 bg-surface-container-lowest rounded-lg border border-outline-variant text-on-surface placeholder:text-outline font-body-md resize-none focus:outline-none focus:border-secondary transition-colors"
                />
                <div className="flex items-center justify-between font-label-sm text-outline tabular-nums">
                  <span
                    className={
                      offering.trim().length >= 20 ? 'text-secondary font-bold' : ''
                    }
                  >
                    {offering.trim().length >= 20
                      ? '✓ Longitud válida'
                      : 'Mínimo 20 caracteres'}
                  </span>
                  <span>{offering.length}/300</span>
                </div>
              </div>

              {/* Qué Demando */}
              <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface-container-low border border-surface-container">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="demand"
                    className="font-title-md text-on-surface flex items-center gap-1.5"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    Qué demando
                  </label>
                  <span className="font-label-sm px-2 py-0.5 rounded bg-primary/10 text-primary uppercase font-extrabold">
                    Demanda B2B
                  </span>
                </div>
                <p className="font-body-sm text-on-surface-variant">
                  Especifica insumos, partners tecnológicos, proveedores certificados o alianzas estratégicas que buscas incorporar hoy.
                </p>
                <textarea
                  id="demand"
                  name="demand"
                  rows={4}
                  maxLength={300}
                  required
                  value={demand}
                  onChange={(e) => setDemand(e.target.value)}
                  placeholder="Ej. Proveedores de materia prima reciclada grado alimenticio (rPET) con capacidad de entrega mensual de 50 toneladas..."
                  className="w-full p-3 bg-surface-container-lowest rounded-lg border border-outline-variant text-on-surface placeholder:text-outline font-body-md resize-none focus:outline-none focus:border-primary transition-colors"
                />
                <div className="flex items-center justify-between font-label-sm text-outline tabular-nums">
                  <span
                    className={
                      demand.trim().length >= 20 ? 'text-primary font-bold' : ''
                    }
                  >
                    {demand.trim().length >= 20
                      ? '✓ Longitud válida'
                      : 'Mínimo 20 caracteres'}
                  </span>
                  <span>{demand.length}/300</span>
                </div>
              </div>
            </div>

            {/* Synchronizing Notice Banner */}
            <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-high flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-container text-on-primary shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">sync</span>
              </div>
              <p className="font-body-sm text-on-surface leading-relaxed">
                Tu ficha sincronizará con el{' '}
                <strong className="font-bold text-primary">
                  algoritmo de emparejamiento
                </strong>{' '}
                apenas ingreses al lobby, priorizando agendas comerciales directas.
              </p>
            </div>

            {/* Red Lawyer Consultation Placeholder Box */}
            <InlineLegalRedBanner
              compact
              title="Consentimiento de Acreditación, Habeas Data y Términos Legales B2B"
              onOpenModal={onOpenLegalNotice}
            />

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={submittingState !== 'idle'}
              className={`w-full h-13 px-6 rounded-xl font-title-md flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer ${
                submittingState === 'done'
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-primary-container hover:bg-primary text-on-primary'
              }`}
            >
              {submittingState === 'idle' && (
                <>
                  <span>Ingresar al Lobby</span>
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </>
              )}
              {submittingState === 'syncing' && (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                  <span>Acreditando y conectando...</span>
                </>
              )}
              {submittingState === 'done' && (
                <>
                  <span className="material-symbols-outlined text-[20px]">
                    check_circle
                  </span>
                  <span>¡Acreditación Exitosa! Redirigiendo al Lobby...</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
