import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import {
  MAX_VENUE_CAPACITY,
  VENUE_HALLS,
  findVenueHall,
  getRecommendedHall,
} from '../data/menuData';

interface HallSelectorProps {
  selectedArea: string;
  totalGuests: number;
  disabled?: boolean;
  onSelectHall: (hallName: string) => void;
}

export const HallSelector: React.FC<HallSelectorProps> = ({
  selectedArea,
  totalGuests,
  disabled = false,
  onSelectHall,
}) => {
  const activeHall = findVenueHall(selectedArea);
  const recommendedHall = getRecommendedHall(totalGuests);
  const overMaxVenue = totalGuests > MAX_VENUE_CAPACITY;

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
        <div className="text-sm font-bold text-slate-900">Choose Your Hall</div>
        <div className="text-xs text-slate-600 tabular-nums">
          {overMaxVenue
            ? `Max venue hall capacity is ${MAX_VENUE_CAPACITY} guests`
            : `Best fit for ${totalGuests} guests: ${recommendedHall.name}`}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {VENUE_HALLS.map((hall) => {
          const isSelected = activeHall?.id === hall.id;
          const tooSmall = totalGuests > hall.maxCapacity;
          const isBestFit = !overMaxVenue && recommendedHall.id === hall.id;
          const isTightFit = !tooSmall && totalGuests > hall.recommendedMax;
          const isDisabled = disabled || tooSmall;

          return (
            <button
              key={hall.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectHall(hall.name)}
              className={`text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start justify-between gap-3 ${
                isSelected && !tooSmall
                  ? 'bg-[#EEF2FB] border-[#25408F] ring-1 ring-[#25408F]'
                  : tooSmall
                  ? 'bg-slate-50 border-slate-200 opacity-55 cursor-not-allowed'
                  : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50/50'
              }`}
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="text-sm font-bold text-slate-900 leading-snug">
                  {hall.name}
                </div>
                <div className="text-xs font-medium text-slate-700 tabular-nums">
                  {hall.capacitySummary}
                </div>
                <div className="text-xs text-slate-600">{hall.recommendationNote}</div>
                <div className="pt-1 text-xs font-semibold">
                  {tooSmall ? (
                    <span className="text-rose-700">
                      Too small for {totalGuests} guests
                    </span>
                  ) : isTightFit ? (
                    <span className="text-amber-800">
                      Fits (above {hall.recommendedMax} recommended)
                    </span>
                  ) : isBestFit ? (
                    <span className="text-[#25408F]">
                      Recommended for {totalGuests} guests
                    </span>
                  ) : (
                    <span className="text-emerald-700">Fits {totalGuests} guests</span>
                  )}
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                  isSelected && !tooSmall
                    ? 'bg-[#25408F] border-[#25408F] text-white'
                    : 'border-slate-300 bg-white text-transparent'
                }`}
                aria-hidden="true"
              >
                <Check className="w-4 h-4 stroke-[2.75]" />
              </div>
            </button>
          );
        })}
      </div>

      {overMaxVenue && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Our largest space (<strong>Bunker Bar Hall</strong>) holds up to{' '}
            <strong>{MAX_VENUE_CAPACITY} guests max</strong> (100 recommended). For parties over{' '}
            {MAX_VENUE_CAPACITY} guests, please contact Blue Zenzer directly.
          </span>
        </div>
      )}
    </div>
  );
};
