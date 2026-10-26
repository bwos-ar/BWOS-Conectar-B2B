import React, { useEffect, useMemo, useState } from 'react';

export interface SectorOption {
  id: string;
  label: string;
  categoryKey: 'saas' | 'logistica' | 'manufactura' | 'servicios';
}

export const B2B_SECTOR_OPTIONS: SectorOption[] = [
  {
    id: 'saas-tech',
    label: 'SaaS & Tecnología',
    categoryKey: 'saas',
  },
  {
    id: 'logistica-supply',
    label: 'Logística & Supply Chain',
    categoryKey: 'logistica',
  },
  {
    id: 'fintech-banca',
    label: 'Fintech & Servicios Financieros',
    categoryKey: 'logistica',
  },
  {
    id: 'manufactura-40',
    label: 'Manufactura & Industria 4.0',
    categoryKey: 'manufactura',
  },
  {
    id: 'servicios-corp',
    label: 'Servicios Corporativos & BPO',
    categoryKey: 'servicios',
  },
  {
    id: 'agroindustria',
    label: 'Agroindustria & Alimentos',
    categoryKey: 'manufactura',
  },
  {
    id: 'energia-esg',
    label: 'Energía Limpia & Sostenibilidad',
    categoryKey: 'servicios',
  },
  {
    id: 'salud-farma',
    label: 'Salud, Farma & Biotech',
    categoryKey: 'logistica',
  },
  {
    id: 'construccion-infra',
    label: 'Construcción & Infraestructura',
    categoryKey: 'manufactura',
  },
  {
    id: 'comercio-retail',
    label: 'Comercio Exterior & Retail B2B',
    categoryKey: 'logistica',
  },
];

interface MultiSectorSelectorProps {
  selectedSectors: string[];
  onChange: (
    sectors: string[],
    primaryCategory: 'saas' | 'logistica' | 'manufactura' | 'servicios'
  ) => void;
  label?: string;
}

/**
 * Parses raw "Otro" text into up to `maxAllowed` sectors.
 * Each comma-separated segment is capped at 20 characters.
 */
export function parseOtherSectorsInput(
  rawInput: string,
  maxAllowed: number
): {
  formattedInput: string;
  parsedSectors: string[];
} {
  if (maxAllowed <= 0) {
    return { formattedInput: '', parsedSectors: [] };
  }

  if (maxAllowed === 1) {
    // Only 1 slot remaining: strip commas and cap at 20 characters
    const single = rawInput.replace(/,/g, '').slice(0, 20);
    const trimmed = single.trim();
    return {
      formattedInput: single,
      parsedSectors: trimmed.length > 0 ? [trimmed] : [],
    };
  }

  // Up to 2 slots available in "Otro": split by comma, max 2 parts, each max 20 chars
  const rawParts = rawInput.split(',');
  const limitedParts = rawParts.slice(0, 2).map((part, idx) => {
    // Preserve leading space right after comma while typing, but limit content to 20 chars
    const leadingSpace = idx === 1 && part.startsWith(' ') ? ' ' : '';
    const cleanPart = part.trimStart().slice(0, 20);
    return leadingSpace + cleanPart;
  });

  const formattedInput = limitedParts.join(',');
  const parsedSectors = limitedParts
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return {
    formattedInput,
    parsedSectors,
  };
}

export const MultiSectorSelector: React.FC<MultiSectorSelectorProps> = ({
  selectedSectors,
  onChange,
  label = 'Sector Industrial de Interés (Máximo 2)',
}) => {
  const [predefinedSelected, setPredefinedSelected] = useState<string[]>(() => {
    const knownLabels = new Set(B2B_SECTOR_OPTIONS.map((o) => o.label));
    const matches = selectedSectors.filter((s) => knownLabels.has(s));
    return matches.length > 0 ? matches.slice(0, 2) : ['SaaS & Tecnología'];
  });

  const [isOtherChecked, setIsOtherChecked] = useState<boolean>(false);
  const [otherRawText, setOtherRawText] = useState<string>('');
  const [limitFeedback, setLimitFeedback] = useState<string | null>(null);

  // Maximum slots available for "Otro" given how many predefined sectors are chosen
  const maxOtherSlots = Math.max(0, 2 - predefinedSelected.length);

  const { parsedSectors: parsedOtherSectors } = useMemo(
    () =>
      isOtherChecked
        ? parseOtherSectorsInput(otherRawText, maxOtherSlots)
        : { formattedInput: '', parsedSectors: [] },
    [isOtherChecked, otherRawText, maxOtherSlots]
  );

  const combinedSectors = useMemo(() => {
    return [...predefinedSelected, ...parsedOtherSectors].slice(0, 2);
  }, [predefinedSelected, parsedOtherSectors]);

  // Propagate changes upward whenever combinedSectors changes
  useEffect(() => {
    const firstPredefined = B2B_SECTOR_OPTIONS.find(
      (opt) => opt.label === predefinedSelected[0]
    );
    const primaryCat = firstPredefined ? firstPredefined.categoryKey : 'servicios';
    onChange(combinedSectors, primaryCat);
  }, [combinedSectors, predefinedSelected]);

  const handleTogglePredefined = (sectorLabel: string) => {
    setLimitFeedback(null);
    const isAlreadySelected = predefinedSelected.includes(sectorLabel);

    if (isAlreadySelected) {
      setPredefinedSelected((prev) => prev.filter((s) => s !== sectorLabel));
      return;
    }

    // Check total active sectors
    const currentTotal =
      predefinedSelected.length + (isOtherChecked ? Math.max(1, parsedOtherSectors.length) : 0);

    if (currentTotal >= 2) {
      setLimitFeedback(
        'Puedes seleccionar hasta un máximo de 2 sectores en total.'
      );
      return;
    }

    setPredefinedSelected((prev) => [...prev, sectorLabel]);
  };

  const handleToggleOther = () => {
    setLimitFeedback(null);
    if (isOtherChecked) {
      setIsOtherChecked(false);
      setOtherRawText('');
      return;
    }

    if (predefinedSelected.length >= 2) {
      setLimitFeedback(
        'Ya tienes 2 sectores seleccionados. Desmarca uno para agregar "Otro".'
      );
      return;
    }

    setIsOtherChecked(true);
  };

  const handleOtherInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLimitFeedback(null);
    const raw = e.target.value;

    if (maxOtherSlots === 1 && raw.includes(',')) {
      setLimitFeedback(
        'Ya seleccionaste 1 sector de la lista; en "Otro" solo puedes agregar 1 sector adicional (máx. 20 caracteres).'
      );
    }

    const { formattedInput } = parseOtherSectorsInput(raw, maxOtherSlots);
    setOtherRawText(formattedInput);
  };

  // Compute current segment lengths for the character counter
  const currentOtherParts = otherRawText.split(',').map((p) => p.trim());

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="font-label-md text-on-surface font-bold">
          {label} <span className="text-error">*</span>
        </label>
        <span
          className={`font-label-sm px-2 py-0.5 rounded-md tabular-nums ${
            combinedSectors.length === 2
              ? 'bg-primary-fixed text-primary font-bold'
              : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          Seleccionados: {combinedSectors.length} / 2
        </span>
      </div>

      {/* Grid of Selectable Sector Chips (plus "Otro") */}
      <div className="p-3 rounded-xl bg-surface border border-outline-variant/80 flex flex-col gap-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {B2B_SECTOR_OPTIONS.map((option) => {
            const isSelected = predefinedSelected.includes(option.label);
            const isDisabled =
              !isSelected &&
              predefinedSelected.length +
                (isOtherChecked ? Math.max(1, parsedOtherSectors.length) : 0) >=
                2;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleTogglePredefined(option.label)}
                disabled={isDisabled}
                className={`px-3 py-2 rounded-lg text-left font-body-sm flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary font-bold shadow-2xs'
                    : isDisabled
                    ? 'bg-surface-container-low/50 text-outline opacity-50 cursor-not-allowed'
                    : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <span className="truncate">{option.label}</span>
                <span className="material-symbols-outlined text-[16px] shrink-0">
                  {isSelected ? 'check_circle' : 'add_circle_outline'}
                </span>
              </button>
            );
          })}

          {/* Option: Otro (Especificar) */}
          <button
            type="button"
            onClick={handleToggleOther}
            disabled={!isOtherChecked && predefinedSelected.length >= 2}
            className={`px-3 py-2 rounded-lg text-left font-body-sm flex items-center justify-between gap-2 transition-all cursor-pointer ${
              isOtherChecked
                ? 'bg-secondary text-on-secondary font-bold shadow-2xs'
                : predefinedSelected.length >= 2
                ? 'bg-surface-container-low/50 text-outline opacity-50 cursor-not-allowed'
                : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-dashed border-outline-variant'
            }`}
          >
            <span className="truncate">Otro (Agregar sector corto)</span>
            <span className="material-symbols-outlined text-[16px] shrink-0">
              {isOtherChecked ? 'edit_note' : 'add'}
            </span>
          </button>
        </div>

        {/* Custom "Otro" Input Box */}
        {isOtherChecked && (
          <div className="pt-2 border-t border-surface-container flex flex-col gap-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label
                htmlFor="custom-other-sector-input"
                className="font-label-sm text-secondary font-bold"
              >
                {maxOtherSlots === 2
                  ? 'Escribe 1 sector (máx. 20 caract.) o 2 separados por coma (,):'
                  : 'Escribe 1 sector corto adicional (máx. 20 caracteres):'}
              </label>
              <span className="font-label-sm text-on-surface-variant tabular-nums">
                {currentOtherParts.length > 1
                  ? `Sector 1: ${currentOtherParts[0].length}/20 · Sector 2: ${currentOtherParts[1].length}/20`
                  : `${(currentOtherParts[0] || '').length}/20 caracteres`}
              </span>
            </div>

            <input
              id="custom-other-sector-input"
              type="text"
              value={otherRawText}
              onChange={handleOtherInputChange}
              placeholder={
                maxOtherSlots === 2
                  ? 'Ej: Minería, Textil (máx. 20 caract. c/u)'
                  : 'Ej: Minería (máx. 20 caracteres)'
              }
              className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-secondary/50 font-body-sm text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>
        )}

        {/* Active Selection Summary Bar */}
        <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {combinedSectors.length === 0 ? (
              <span className="font-label-sm text-outline">
                Selecciona al menos 1 sector (hasta 2 sectores).
              </span>
            ) : (
              combinedSectors.map((sec, idx) => (
                <span
                  key={`${sec}-${idx}`}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-label-sm font-bold"
                >
                  <span>
                    Sector {idx + 1}: {sec}
                  </span>
                </span>
              ))
            )}
          </div>

          {limitFeedback && (
            <span className="font-label-sm text-error font-semibold">
              {limitFeedback}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
