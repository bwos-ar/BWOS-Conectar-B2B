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
import { CompanyCard, MeetingItem } from '../data/b2bData';

interface NetworkingInsightsProps {
  companies: CompanyCard[];
  meetings: MeetingItem[];
  activeExecsCount: number;
  selectedSector: 'all' | 'saas' | 'logistica' | 'manufactura' | 'servicios';
  onSelectSector: (
    sector: 'all' | 'saas' | 'logistica' | 'manufactura' | 'servicios'
  ) => void;
}

export const NetworkingInsights: React.FC<NetworkingInsightsProps> = ({
  companies,
  meetings,
  activeExecsCount,
  selectedSector,
  onSelectSector,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [chartMetric, setChartMetric] = useState<'connections' | 'match'>(
    'connections'
  );

  // Compute dynamic sector networking data from live state + summit baseline
  const sectorData = useMemo(() => {
    const definitions: Array<{
      key: 'saas' | 'logistica' | 'manufactura' | 'servicios';
      sector: string;
      shortName: string;
      baseConnections: number;
      baseCalls: number;
      color: string;
    }> = [
      {
        key: 'saas',
        sector: 'SaaS & Tech',
        shortName: 'SaaS & Tech',
        baseConnections: 124,
        baseCalls: 38,
        color: '#004ac6',
      },
      {
        key: 'logistica',
        sector: 'Logística & Fintech',
        shortName: 'Logística',
        baseConnections: 98,
        baseCalls: 29,
        color: '#006c49',
      },
      {
        key: 'manufactura',
        sector: 'Manufactura 4.0',
        shortName: 'Manufactura',
        baseConnections: 86,
        baseCalls: 24,
        color: '#2563eb',
      },
      {
        key: 'servicios',
        sector: 'Servicios Corp.',
        shortName: 'Servicios',
        baseConnections: 74,
        baseCalls: 21,
        color: '#0d9488',
      },
    ];

    return definitions.map((def) => {
      const sectorCompanies = companies.filter((c) => c.category === def.key);
      const userConnections = sectorCompanies.filter(
        (c) => c.isConnected || c.isBookmarked
      ).length;
      const totalMutual = sectorCompanies.reduce(
        (acc, c) => acc + (c.mutualConnections || 0),
        0
      );
      const avgMatch =
        sectorCompanies.length > 0
          ? Math.round(
              sectorCompanies.reduce((acc, c) => acc + c.matchScore, 0) /
                sectorCompanies.length
            )
          : 90;

      const connectionsVolume =
        def.baseConnections + totalMutual + userConnections * 8;
      const liveRooms =
        def.baseCalls +
        sectorCompanies.filter((c) => c.immediateCallAvailable).length * 2 +
        userConnections * 2;

      return {
        key: def.key,
        sector: def.sector,
        shortName: def.shortName,
        conexiones: connectionsVolume,
        salasJitsi: liveRooms,
        afinidadPromedio: avgMatch,
        empresasActivas: sectorCompanies.length,
        color: def.color,
      };
    });
  }, [companies]);

  // Hourly Summit pulse data
  const hourlyPulseData = useMemo(() => {
    const connectedBoost =
      companies.filter((c) => c.isConnected).length * 6 + meetings.length * 3;
    return [
      { hora: '09:00', conexiones: 42, salasActivas: 14 },
      { hora: '10:30', conexiones: 78, salasActivas: 26 },
      { hora: '12:00', conexiones: 115, salasActivas: 39 },
      { hora: '13:30', conexiones: 96, salasActivas: 31 },
      { hora: '15:00', conexiones: 148, salasActivas: 52 },
      {
        hora: 'Ahora',
        conexiones: 164 + connectedBoost,
        salasActivas: 58 + Math.round(connectedBoost / 2),
      },
    ];
  }, [companies, meetings]);

  const totalConnectionsVolume = useMemo(
    () => sectorData.reduce((acc, item) => acc + item.conexiones, 0),
    [sectorData]
  );

  const totalLiveRooms = useMemo(
    () => sectorData.reduce((acc, item) => acc + item.salasJitsi, 0),
    [sectorData]
  );

  const overallAvgMatch = useMemo(() => {
    if (companies.length === 0) return 92;
    return (
      companies.reduce((acc, c) => acc + c.matchScore, 0) / companies.length
    ).toFixed(1);
  }, [companies]);

  return (
    <section
      aria-label="Insights de Networking del Summit"
      className="w-full px-4 md:px-8 pt-5 pb-1"
    >
      <div className="max-w-[1400px] mx-auto bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-xs overflow-hidden transition-all">
        {/* Top Bar / Header of Insights */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-primary-fixed/40 via-surface-container-lowest to-secondary-container/25 border-b border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                monitoring
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-title-md text-on-surface font-bold tracking-tight">
                  Insights de Networking · Summit 2025
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-sm font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  Telemetría Comercial en Vivo
                </span>
              </div>
              <p className="font-body-sm text-on-surface-variant">
                Volumen de conexiones B2B por sector industrial, salas Jitsi 1-a-1 y ritmo de actividad del evento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {selectedSector !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectSector('all')}
                className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-label-sm font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Filtro activo: {selectedSector.toUpperCase()}</span>
                <span className="material-symbols-outlined text-[14px]">
                  close
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-label-md flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isExpanded ? 'expand_less' : 'expand_more'}
              </span>
              <span>{isExpanded ? 'Ocultar gráficos' : 'Ver gráficos'}</span>
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-5 flex flex-col gap-5">
            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-surface-container-low/70 rounded-xl p-3.5 border border-surface-container-high flex items-center justify-between">
                <div>
                  <span className="font-label-sm uppercase text-on-surface-variant block">
                    Conexiones del Summit
                  </span>
                  <span className="font-headline-md text-primary font-extrabold tabular-nums">
                    {totalConnectionsVolume}
                  </span>
                  <span className="font-label-sm text-secondary block mt-0.5 font-semibold">
                    +18.4% vs última hora
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">
                    handshake
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-low/70 rounded-xl p-3.5 border border-surface-container-high flex items-center justify-between">
                <div>
                  <span className="font-label-sm uppercase text-on-surface-variant block">
                    Salas Jitsi 1-a-1 Activas
                  </span>
                  <span className="font-headline-md text-secondary font-extrabold tabular-nums">
                    {totalLiveRooms}
                  </span>
                  <span className="font-label-sm text-on-surface-variant block mt-0.5">
                    {meetings.length} en tu agenda personal
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">
                    videocam
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-low/70 rounded-xl p-3.5 border border-surface-container-high flex items-center justify-between">
                <div>
                  <span className="font-label-sm uppercase text-on-surface-variant block">
                    Índice de Match B2B
                  </span>
                  <span className="font-headline-md text-on-surface font-extrabold tabular-nums">
                    {overallAvgMatch}%
                  </span>
                  <span className="font-label-sm text-primary block mt-0.5 font-semibold">
                    Afinidad Oferta / Demanda
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">
                    bolt
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-low/70 rounded-xl p-3.5 border border-surface-container-high flex items-center justify-between">
                <div>
                  <span className="font-label-sm uppercase text-on-surface-variant block">
                    Directivos en Rueda
                  </span>
                  <span className="font-headline-md text-on-surface font-extrabold tabular-nums">
                    {activeExecsCount}
                  </span>
                  <span className="font-label-sm text-secondary block mt-0.5 font-semibold">
                    Disponibles para llamada
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">
                    groups
                  </span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Chart (7 cols): BarChart - Connections Volume by Sector */}
              <div className="lg:col-span-7 bg-surface-container-low/40 rounded-xl p-4 border border-surface-container-high flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-title-sm text-on-surface font-bold">
                      Volumen de Conexiones por Sector Industrial
                    </h3>
                    <p className="font-body-sm text-on-surface-variant text-[12px]">
                      Haz clic en una barra para filtrar el directorio por ese sector
                    </p>
                  </div>

                  <div className="inline-flex rounded-lg bg-surface-container p-0.5 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setChartMetric('connections')}
                      className={`px-2.5 py-1 rounded-md font-label-sm transition-colors cursor-pointer ${
                        chartMetric === 'connections'
                          ? 'bg-surface-container-lowest text-primary font-bold shadow-2xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Conexiones & Salas
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMetric('match')}
                      className={`px-2.5 py-1 rounded-md font-label-sm transition-colors cursor-pointer ${
                        chartMetric === 'match'
                          ? 'bg-surface-container-lowest text-primary font-bold shadow-2xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      % Match Promedio
                    </button>
                  </div>
                </div>

                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartMetric === 'connections' ? (
                      <BarChart
                        data={sectorData}
                        margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e0e3e5"
                        />
                        <XAxis
                          dataKey="shortName"
                          tick={{ fill: '#434655', fontSize: 12, fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#737686', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(0, 74, 198, 0.06)' }}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderColor: '#e0e3e5',
                            borderRadius: '12px',
                            fontSize: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          }}
                        />
                        <Bar
                          dataKey="conexiones"
                          name="Conexiones B2B"
                          radius={[6, 6, 0, 0]}
                          barSize={32}
                          onClick={(data) => {
                            if (data?.key) {
                              onSelectSector(
                                selectedSector === data.key ? 'all' : (data.key as any)
                              );
                            }
                          }}
                          className="cursor-pointer"
                        >
                          {sectorData.map((entry) => (
                            <Cell
                              key={entry.key}
                              fill={
                                selectedSector === 'all' ||
                                selectedSector === entry.key
                                  ? entry.color
                                  : '#c3c6d7'
                              }
                            />
                          ))}
                        </Bar>
                        <Bar
                          dataKey="salasJitsi"
                          name="Salas Jitsi 1-a-1"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    ) : (
                      <BarChart
                        data={sectorData}
                        margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e0e3e5"
                        />
                        <XAxis
                          dataKey="shortName"
                          tick={{ fill: '#434655', fontSize: 12, fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[70, 100]}
                          tick={{ fill: '#737686', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(0, 108, 73, 0.06)' }}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderColor: '#e0e3e5',
                            borderRadius: '12px',
                            fontSize: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          }}
                        />
                        <Bar
                          dataKey="afinidadPromedio"
                          name="Match Promedio (%)"
                          fill="#006c49"
                          radius={[6, 6, 0, 0]}
                          barSize={36}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Chart (5 cols): AreaChart - Hourly Summit Networking Velocity */}
              <div className="lg:col-span-5 bg-surface-container-low/40 rounded-xl p-4 border border-surface-container-high flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-title-sm text-on-surface font-bold">
                      Curva de Actividad del Summit (Hoy)
                    </h3>
                    <p className="font-body-sm text-on-surface-variant text-[12px]">
                      Evolución de vinculaciones efectivas y videollamadas 1-a-1
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-primary-fixed text-primary font-label-sm font-bold">
                    Hora Pico
                  </span>
                </div>

                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={hourlyPulseData}
                      margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorConexiones"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#004ac6"
                            stopOpacity={0.32}
                          />
                          <stop
                            offset="95%"
                            stopColor="#004ac6"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorSalas"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#006c49"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="#006c49"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e0e3e5"
                      />
                      <XAxis
                        dataKey="hora"
                        tick={{ fill: '#434655', fontSize: 11, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#737686', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e0e3e5',
                          borderRadius: '12px',
                          fontSize: '12px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="conexiones"
                        name="Vínculos B2B"
                        stroke="#004ac6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorConexiones)"
                      />
                      <Area
                        type="monotone"
                        dataKey="salasActivas"
                        name="Salas Jitsi 1-a-1"
                        stroke="#006c49"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSalas)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
