import React, { useMemo, useState } from 'react';
import {
  Check,
  Search,
  X,
  ArrowRight,
  RotateCcw,
  ChevronUp,
  Minus,
  Plus,
  Info,
  AlertCircle,
} from 'lucide-react';
import {
  MENU_ITEMS,
  MENU_PRICING,
  SPICE_TAG_LABELS,
  findVenueHall,
  getRecommendedHall,
} from '../data/menuData';
import {
  CustomerDetails,
  DietaryType,
  DrinksPackageOption,
  KitchenBrand,
  MenuItem,
  MenuSelection,
} from '../types/booking';
import { calculatePricing, getMenuItem, getSelectedDesserts } from '../utils/bookingFormatter';
import { HallSelector } from './HallSelector';

interface MenuBuilderProps {
  selection: MenuSelection;
  details: CustomerDetails;
  isLocked: boolean;
  mobileTrayOpen: boolean;
  onOpenMobileTray: () => void;
  onCloseMobileTray: () => void;
  onChangeSelection: (next: MenuSelection) => void;
  onChangeDetails: (next: CustomerDetails) => void;
  onProceedToDetails: () => void;
}

type CourseTab = 'starter' | 'main' | 'accompaniments' | 'dessert' | 'drink';

const DAL_ACCOMPANIMENT_OPTIONS = ['None', 'Dal Makhani', 'Tadka Dal', 'Dal Methi Saag'];

export const MenuBuilder: React.FC<MenuBuilderProps> = ({
  selection,
  details,
  isLocked,
  mobileTrayOpen,
  onOpenMobileTray,
  onCloseMobileTray,
  onChangeSelection,
  onChangeDetails,
  onProceedToDetails,
}) => {
  const [activeCourse, setActiveCourse] = useState<CourseTab>('starter');
  const [kitchenFilter, setKitchenFilter] = useState<'All' | KitchenBrand>('All');
  const [dietFilter, setDietFilter] = useState<'All' | DietaryType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedDesserts = getSelectedDesserts(selection);
  const startersSelected = selection.starters.length;
  const mainsSelected = selection.mains.length;
  const dessertSelected = selectedDesserts.length;
  const pricing = calculatePricing(details, selection);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MENU_ITEMS.filter((item) => {
      if (activeCourse === 'accompaniments') {
        if (item.category !== 'rice' && item.category !== 'side') return false;
      } else if (item.category !== activeCourse) {
        return false;
      }
      if (kitchenFilter !== 'All' && item.kitchen !== kitchenFilter) return false;
      if (dietFilter !== 'All' && item.dietary !== dietFilter) return false;
      if (q && !item.name.toLowerCase().includes(q) && !item.kitchen.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [activeCourse, kitchenFilter, dietFilter, searchQuery]);

  const isSelected = (item: MenuItem): boolean => {
    switch (item.category) {
      case 'starter':
        return selection.starters.includes(item.id);
      case 'main':
        return selection.mains.includes(item.id);
      case 'dessert':
        return selectedDesserts.includes(item.id);
      case 'rice':
        return selection.rice === item.id;
      case 'side':
        return selection.side === item.id;
      case 'drink':
        return selection.drinks.includes(item.id);
    }
  };

  const toggleItem = (item: MenuItem) => {
    if (isLocked) return;

    if (item.category === 'starter') {
      const exists = selection.starters.includes(item.id);
      if (exists) {
        onChangeSelection({
          ...selection,
          starters: selection.starters.filter((id) => id !== item.id),
        });
      } else if (selection.starters.length < MENU_PRICING.maxStarters) {
        onChangeSelection({
          ...selection,
          starters: [...selection.starters, item.id],
        });
      }
      return;
    }

    if (item.category === 'main') {
      const exists = selection.mains.includes(item.id);
      if (exists) {
        onChangeSelection({
          ...selection,
          mains: selection.mains.filter((id) => id !== item.id),
        });
      } else if (selection.mains.length < MENU_PRICING.maxMains) {
        onChangeSelection({
          ...selection,
          mains: [...selection.mains, item.id],
        });
      }
      return;
    }

    if (item.category === 'dessert') {
      const exists = selectedDesserts.includes(item.id);
      if (exists) {
        onChangeSelection({
          ...selection,
          desserts: selectedDesserts.filter((id) => id !== item.id),
          dessert: null,
        });
      } else if (selectedDesserts.length < MENU_PRICING.maxDesserts) {
        onChangeSelection({
          ...selection,
          desserts: [...selectedDesserts, item.id],
          dessert: null,
        });
      }
      return;
    }

    if (item.category === 'rice') {
      onChangeSelection({
        ...selection,
        rice: selection.rice === item.id ? null : item.id,
      });
      return;
    }

    if (item.category === 'side') {
      onChangeSelection({
        ...selection,
        side: selection.side === item.id ? null : item.id,
      });
      return;
    }

    if (item.category === 'drink') {
      const exists = selection.drinks.includes(item.id);
      if (exists) {
        onChangeSelection({
          ...selection,
          drinks: selection.drinks.filter((id) => id !== item.id),
        });
      } else if (selection.drinks.length < MENU_PRICING.maxDrinks) {
        onChangeSelection({
          ...selection,
          drinks: [...selection.drinks, item.id],
        });
      }
    }
  };

  const removeStarter = (id: string) => {
    if (isLocked) return;
    onChangeSelection({
      ...selection,
      starters: selection.starters.filter((x) => x !== id),
    });
  };

  const removeMain = (id: string) => {
    if (isLocked) return;
    onChangeSelection({
      ...selection,
      mains: selection.mains.filter((x) => x !== id),
    });
  };

  const removeDessert = (id: string) => {
    if (isLocked) return;
    onChangeSelection({
      ...selection,
      desserts: selectedDesserts.filter((x) => x !== id),
      dessert: null,
    });
  };

  const resetAllSelections = () => {
    if (isLocked) return;
    onChangeSelection({
      starters: [],
      mains: [],
      desserts: [],
      rice: null,
      side: null,
      drinks: [],
    });
  };

  const canSelectMoreInCurrent = (item: MenuItem): boolean => {
    if (isSelected(item)) return true;
    if (item.category === 'starter') return selection.starters.length < MENU_PRICING.maxStarters;
    if (item.category === 'main') return selection.mains.length < MENU_PRICING.maxMains;
    if (item.category === 'dessert') return selectedDesserts.length < MENU_PRICING.maxDesserts;
    if (item.category === 'drink') return selection.drinks.length < MENU_PRICING.maxDrinks;
    return true;
  };

  const adjustGuests = (field: 'adults' | 'kids', delta: number) => {
    if (isLocked) return;
    const nextVal = Math.max(0, details[field] + delta);
    const nextDetails = {
      ...details,
      [field]: nextVal,
    };
    const nextTotal = (Number(nextDetails.adults) || 0) + (Number(nextDetails.kids) || 0);
    const currentHall = findVenueHall(details.area);
    if (!currentHall || nextTotal > currentHall.maxCapacity) {
      nextDetails.area = getRecommendedHall(nextTotal).name;
    }
    onChangeDetails(nextDetails);
  };

  const riceItems = filteredItems.filter((i) => i.category === 'rice');
  const sideItems = filteredItems.filter((i) => i.category === 'side');

  const renderDishCard = (item: MenuItem) => {
    const selected = isSelected(item);
    const selectable = canSelectMoreInCurrent(item);
    const disabled = isLocked || (!selected && !selectable);

    const wouldCostExtra =
      !selected &&
      ((item.category === 'starter' && startersSelected >= MENU_PRICING.requiredStarters) ||
        (item.category === 'main' && mainsSelected >= MENU_PRICING.requiredMains));

    const selectedIndex =
      item.category === 'starter'
        ? selection.starters.indexOf(item.id)
        : item.category === 'main'
        ? selection.mains.indexOf(item.id)
        : -1;
    const isExtraDish =
      (item.category === 'starter' && selectedIndex >= MENU_PRICING.requiredStarters) ||
      (item.category === 'main' && selectedIndex >= MENU_PRICING.requiredMains);

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => toggleItem(item)}
        disabled={disabled}
        className={`group text-left p-4 min-h-[68px] rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 active:scale-[0.99] ${
          selected
            ? 'bg-[#EEF2FB] border-[#25408F] ring-1 ring-[#25408F]'
            : disabled
            ? 'bg-slate-50 border-slate-200 opacity-55 cursor-not-allowed'
            : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50/50'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-slate-900 leading-snug">
            {item.name}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-slate-600">
            <span
              className={
                item.kitchen === 'Blue Zenzer'
                  ? 'text-[#25408F] font-semibold'
                  : 'text-amber-800 font-semibold'
              }
            >
              {item.kitchen}
            </span>
            <span aria-hidden="true">·</span>
            <span className={item.dietary === 'veg' ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
              {item.dietary === 'veg' ? 'Vegetarian' : 'Meat or Fish'}
            </span>
            {item.tags.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-700">
                  {item.tags.map((t) => SPICE_TAG_LABELS[t].label).join(' · ')}
                </span>
              </>
            )}
            {isExtraDish && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#25408F]">Extra (+£1/person)</span>
              </>
            )}
            {wouldCostExtra && selectable && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-amber-800">Add as extra (+£1/person)</span>
              </>
            )}
          </div>
        </div>

        <div
          className={`w-8 h-8 rounded-xl border-2 shrink-0 flex items-center justify-center transition-colors ${
            selected
              ? 'bg-[#25408F] border-[#25408F] text-white'
              : 'border-slate-300 bg-white text-transparent group-hover:border-slate-400'
          }`}
          aria-hidden="true"
        >
          <Check className="w-5 h-5 stroke-[2.75]" />
        </div>
      </button>
    );
  };

  const courseComplete =
    startersSelected >= MENU_PRICING.requiredStarters &&
    mainsSelected >= MENU_PRICING.requiredMains &&
    dessertSelected >= MENU_PRICING.requiredDesserts;

  const renderCostSummaryBox = () => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-700">
        <span>
          {details.adults} {details.adults === 1 ? 'Adult' : 'Adults'} × £{MENU_PRICING.adultPerPerson}
        </span>
        <span className="font-semibold tabular-nums text-slate-900">
          £{pricing.adultsTotal.toFixed(2)}
        </span>
      </div>
      {details.kids > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-700">
          <span>
            {details.kids} {details.kids === 1 ? 'Child' : 'Kids'} (5–10 yrs) × £{MENU_PRICING.childPerPerson}
          </span>
          <span className="font-semibold tabular-nums text-slate-900">
            £{pricing.kidsTotal.toFixed(2)}
          </span>
        </div>
      )}
      {pricing.extraDishesCount > 0 && (
        <div className="flex items-center justify-between text-sm text-amber-900">
          <span>
            {pricing.extraDishesCount} Extra {pricing.extraDishesCount === 1 ? 'Dish' : 'Dishes'} (+£1/person × {pricing.totalGuests})
          </span>
          <span className="font-semibold tabular-nums">
            £{pricing.extraDishesTotal.toFixed(2)}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between text-sm text-slate-700">
        <span>2 Desserts</span>
        <span className="font-semibold text-emerald-700">Included</span>
      </div>
      {pricing.drinksTotal > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-700">
          <span>Soft Drinks ({pricing.totalGuests} × £3)</span>
          <span className="font-semibold tabular-nums text-slate-900">
            £{pricing.drinksTotal.toFixed(2)}
          </span>
        </div>
      )}
      {details.includeTeaAndCoffee && (
        <div className="flex items-center justify-between text-sm text-slate-700">
          <span>Tea &amp; Coffee ({pricing.totalGuests} × £{MENU_PRICING.teaAndCoffeePerPerson})</span>
          <span className="font-semibold tabular-nums text-slate-900">
            £{pricing.teaAndCoffeeTotal.toFixed(2)}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between text-sm text-slate-700">
        <span>10% Service Charge</span>
        <span className="font-semibold tabular-nums text-slate-900">
          £{pricing.serviceCharge.toFixed(2)}
        </span>
      </div>
      {details.golfIncluded && pricing.golfTotal > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-700">
          <span>Golf Package</span>
          <span className="font-semibold tabular-nums text-slate-900">
            £{pricing.golfTotal.toFixed(2)}
          </span>
        </div>
      )}
      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
        <span className="text-base font-bold text-slate-900">Estimated Total</span>
        <span className="text-xl font-bold tabular-nums text-[#25408F]">
          £{pricing.grandTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );

  const renderTrayContent = (inModal = false) => (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-900">
            Your Party Menu &amp; Cost
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            4 starters, 4 mains &amp; 2 desserts included. 5th starter or main is +£1/person.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isLocked && (
            <button
              type="button"
              onClick={resetAllSelections}
              className="min-h-[44px] px-3 text-sm font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl hover:bg-slate-100"
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </button>
          )}
          {inModal && (
            <button
              type="button"
              onClick={onCloseMobileTray}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Close party menu drawer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Always-Visible Cost Box */}
      {renderCostSummaryBox()}

      {/* Starters Slot */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
          <span>Starters (4 Included)</span>
          <span
            className={`tabular-nums ${
              startersSelected >= 4 ? 'text-emerald-700' : 'text-[#25408F]'
            }`}
          >
            {startersSelected} picked{pricing.extraStartersCount > 0 ? ` (+${pricing.extraStartersCount} extra)` : ' / 4'}
          </span>
        </div>
        {selection.starters.length > 0 ? (
          <ul className="space-y-1.5">
            {selection.starters.map((id, idx) => {
              const item = getMenuItem(id);
              if (!item) return null;
              return (
                <li
                  key={id}
                  className="flex items-center justify-between gap-2 text-sm font-medium text-slate-900 bg-slate-50 pl-3.5 pr-1 min-h-[44px] rounded-xl border border-slate-200"
                >
                  <span className="truncate py-1">
                    {item.kitchenLabel}
                    {idx >= MENU_PRICING.requiredStarters ? ' (+£1/pp)' : ''}
                  </span>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => removeStarter(id)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 hover:text-rose-600 shrink-0"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <button
            type="button"
            onClick={() => {
              setActiveCourse('starter');
              if (inModal) onCloseMobileTray();
            }}
            className="w-full min-h-[44px] text-left text-sm text-slate-600 border-2 border-dashed border-slate-300 rounded-xl px-3.5 py-2.5 hover:border-slate-400"
          >
            Tap here to pick 4 starters
          </button>
        )}
      </div>

      {/* Mains Slot */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
          <span>Mains (4 Included)</span>
          <span
            className={`tabular-nums ${
              mainsSelected >= 4 ? 'text-emerald-700' : 'text-[#25408F]'
            }`}
          >
            {mainsSelected} picked{pricing.extraMainsCount > 0 ? ` (+${pricing.extraMainsCount} extra)` : ' / 4'}
          </span>
        </div>
        {selection.mains.length > 0 ? (
          <ul className="space-y-1.5">
            {selection.mains.map((id, idx) => {
              const item = getMenuItem(id);
              if (!item) return null;
              return (
                <li
                  key={id}
                  className="flex items-center justify-between gap-2 text-sm font-medium text-slate-900 bg-slate-50 pl-3.5 pr-1 min-h-[44px] rounded-xl border border-slate-200"
                >
                  <span className="truncate py-1">
                    {item.kitchenLabel}
                    {idx >= MENU_PRICING.requiredMains ? ' (+£1/pp)' : ''}
                  </span>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => removeMain(id)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 hover:text-rose-600 shrink-0"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <button
            type="button"
            onClick={() => {
              setActiveCourse('main');
              if (inModal) onCloseMobileTray();
            }}
            className="w-full min-h-[44px] text-left text-sm text-slate-600 border-2 border-dashed border-slate-300 rounded-xl px-3.5 py-2.5 hover:border-slate-400"
          >
            Tap here to pick 4 mains
          </button>
        )}
      </div>

      {/* Dessert Slot */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
          <span>Desserts (2 Included)</span>
          <span
            className={`tabular-nums ${
              dessertSelected >= MENU_PRICING.requiredDesserts
                ? 'text-emerald-700'
                : 'text-[#25408F]'
            }`}
          >
            {dessertSelected} picked / {MENU_PRICING.requiredDesserts}
          </span>
        </div>
        {selectedDesserts.length > 0 ? (
          <ul className="space-y-1.5">
            {selectedDesserts.map((id) => {
              const item = getMenuItem(id);
              if (!item) return null;
              return (
                <li
                  key={id}
                  className="flex items-center justify-between gap-2 text-sm font-medium text-slate-900 bg-slate-50 pl-3.5 pr-1 min-h-[44px] rounded-xl border border-slate-200"
                >
                  <span className="truncate py-1">{item.kitchenLabel}</span>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => removeDessert(id)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 hover:text-rose-600 shrink-0"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <button
            type="button"
            onClick={() => {
              setActiveCourse('dessert');
              if (inModal) onCloseMobileTray();
            }}
            className="w-full min-h-[44px] text-left text-sm text-slate-600 border-2 border-dashed border-slate-300 rounded-xl px-3.5 py-2.5 hover:border-slate-400"
          >
            Tap here to pick 2 desserts
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          if (inModal) onCloseMobileTray();
          onProceedToDetails();
        }}
        className="w-full min-h-[52px] py-3.5 px-4 rounded-xl bg-[#25408F] text-white text-base font-semibold hover:bg-[#1D3270] active:scale-[0.99] transition-all flex items-center justify-center gap-2 whitespace-nowrap"
      >
        <span>
          {courseComplete ? 'Next: Enter Party Details' : 'Go to Party Details'}
        </span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderNextCourseButton = () => {
    if (activeCourse === 'starter') {
      return (
        <button
          type="button"
          onClick={() => setActiveCourse('main')}
          className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#25408F] text-white text-sm sm:text-base font-semibold hover:bg-[#1D3270] inline-flex items-center justify-center gap-2"
        >
          <span>Next: Pick 4 Mains</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      );
    }
    if (activeCourse === 'main') {
      return (
        <button
          type="button"
          onClick={() => setActiveCourse('accompaniments')}
          className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#25408F] text-white text-sm sm:text-base font-semibold hover:bg-[#1D3270] inline-flex items-center justify-center gap-2"
        >
          <span>Next: Pick Rice &amp; Sides</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      );
    }
    if (activeCourse === 'accompaniments') {
      return (
        <button
          type="button"
          onClick={() => setActiveCourse('dessert')}
          className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#25408F] text-white text-sm sm:text-base font-semibold hover:bg-[#1D3270] inline-flex items-center justify-center gap-2"
        >
          <span>Next: Pick 2 Free Desserts</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      );
    }
    if (activeCourse === 'dessert') {
      return (
        <button
          type="button"
          onClick={() => setActiveCourse('drink')}
          className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#25408F] text-white text-sm sm:text-base font-semibold hover:bg-[#1D3270] inline-flex items-center justify-center gap-2"
        >
          <span>Next: Drinks, Tea &amp; Coffee</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={onProceedToDetails}
        className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#25408F] text-white text-sm sm:text-base font-semibold hover:bg-[#1D3270] inline-flex items-center justify-center gap-2"
      >
        <span>Next Step: Enter Party Date &amp; Name</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Friendly Live Guest & Cost Calculator */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
          <h2 className="font-display text-xl font-bold text-slate-900">
            How many people are coming?
          </h2>
          <p className="text-sm text-slate-600">
            Minimum <strong className="text-slate-900">{MENU_PRICING.minimumGuests} guests</strong>{' '}
            required (adults &amp; kids combined).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Adults Stepper */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-900">Adults</div>
              <div className="text-xs text-slate-600">£{MENU_PRICING.adultPerPerson} per person</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isLocked || details.adults <= 0}
                onClick={() => adjustGuests('adults', -1)}
                className="w-10 h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-800 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                aria-label="Decrease adults"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center text-lg font-bold tabular-nums text-slate-900">
                {details.adults}
              </span>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => adjustGuests('adults', 1)}
                className="w-10 h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-800 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                aria-label="Increase adults"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Kids Stepper */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-900">Kids (5–10 yrs)</div>
              <div className="text-xs text-slate-600">£{MENU_PRICING.childPerPerson} per child</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isLocked || details.kids <= 0}
                onClick={() => adjustGuests('kids', -1)}
                className="w-10 h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-800 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                aria-label="Decrease kids"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center text-lg font-bold tabular-nums text-slate-900">
                {details.kids}
              </span>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => adjustGuests('kids', 1)}
                className="w-10 h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-800 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                aria-label="Increase kids"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Cost Output Card */}
          <div className="bg-[#EEF2FB] border border-[#25408F]/25 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#25408F]">
                Estimated Party Total
              </div>
              <div className="text-xs text-slate-600 mt-0.5 tabular-nums">
                {pricing.totalGuests} guests · incl. 10% service
                {pricing.extraDishesCount > 0 ? ` · +£${pricing.extraDishesPerPerson}/pp extras` : ''}
              </div>
            </div>
            <div className="text-2xl font-bold tabular-nums text-[#25408F] shrink-0">
              £{pricing.grandTotal.toFixed(2)}
            </div>
          </div>
        </div>

        {pricing.belowMinimumGuests && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-950">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Minimum {MENU_PRICING.minimumGuests} guests required to book</strong> (adults &amp; kids combined). You currently have{' '}
              <strong className="tabular-nums">{pricing.totalGuests}</strong>{' '}
              ({details.adults} adults + {details.kids} kids) — add{' '}
              <strong className="tabular-nums">
                {MENU_PRICING.minimumGuests - pricing.totalGuests} more
              </strong>{' '}
              to lock in this set menu.
            </span>
          </div>
        )}

        {/* Simple Soft Drinks + Optional Tea & Coffee Quick Toggles */}
        <div className="pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-700 mr-1">Drinks Package:</span>
            {(
              [
                { value: 'Included', label: 'Unlimited Soft Drinks (+£3/pp)' },
                { value: 'Not Included', label: 'No Drinks Package' },
              ] as { value: DrinksPackageOption; label: string }[]
            ).map((opt) => {
              const active = details.drinksPackage === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isLocked}
                  onClick={() => onChangeDetails({ ...details, drinksPackage: opt.value })}
                  className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#25408F] text-white border-[#25408F]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <label className="inline-flex items-center gap-2.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100/80 cursor-pointer shrink-0 transition-colors">
            <input
              type="checkbox"
              disabled={isLocked}
              checked={details.includeTeaAndCoffee}
              onChange={(e) =>
                onChangeDetails({ ...details, includeTeaAndCoffee: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-[#25408F]"
            />
            <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">
              Add Tea &amp; Coffee (+£2/pp)
            </span>
          </label>
        </div>

        {/* Venue Hall Selector based on Guest Count */}
        <div className="pt-4 border-t border-slate-100">
          <HallSelector
            selectedArea={details.area}
            totalGuests={pricing.totalGuests}
            disabled={isLocked}
            onSelectHall={(hallName) => onChangeDetails({ ...details, area: hallName })}
          />
        </div>
      </section>

      {/* Mobile Inline Selection & Cost Card */}
      <button
        type="button"
        onClick={onOpenMobileTray}
        className="lg:hidden w-full bg-[#EEF2FB] border-2 border-[#25408F]/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-left active:scale-[0.99] transition-transform"
      >
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#25408F]">
            Tap to Review Your Picks · Total £{pricing.grandTotal.toFixed(2)}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-slate-900 tabular-nums">
            <span>Starters {startersSelected}/4</span>
            <span aria-hidden="true">·</span>
            <span>Mains {mainsSelected}/4</span>
            <span aria-hidden="true">·</span>
            <span>Desserts {dessertSelected}/2</span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#25408F] px-3.5 py-2.5 rounded-xl shrink-0">
          <span>Review</span>
          <ChevronUp className="w-4 h-4" />
        </div>
      </button>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
        <div className="lg:col-span-8 space-y-5">
          {/* Course Navigation Bar — 5 equal columns on md+ so zero tabs ever clip on PC */}
          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar md:grid md:grid-cols-5 md:overflow-visible">
            {(
              [
                {
                  id: 'starter',
                  label: 'Starters',
                  count: `${startersSelected}/4`,
                  done: startersSelected >= MENU_PRICING.requiredStarters,
                },
                {
                  id: 'main',
                  label: 'Mains',
                  count: `${mainsSelected}/4`,
                  done: mainsSelected >= MENU_PRICING.requiredMains,
                },
                {
                  id: 'accompaniments',
                  label: 'Rice & Sides',
                  count: `${(selection.rice ? 1 : 0) + (selection.side ? 1 : 0)}`,
                  done: Boolean(selection.rice || selection.side),
                },
                {
                  id: 'dessert',
                  label: 'Desserts',
                  count: `${dessertSelected}/2`,
                  done: dessertSelected >= MENU_PRICING.requiredDesserts,
                },
                {
                  id: 'drink',
                  label: 'Drinks & Tea',
                  count: `${selection.drinks.length}/4`,
                  done: selection.drinks.length > 0 || details.includeTeaAndCoffee,
                },
              ] as const
            ).map((tab) => {
              const active = activeCourse === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCourse(tab.id)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#25408F] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`tabular-nums text-xs ${
                      active
                        ? 'text-blue-100'
                        : tab.done
                        ? 'text-emerald-700 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Course Instructions & Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  {activeCourse === 'starter' && 'Tap Any 4 Starters (Or Add a 5th)'}
                  {activeCourse === 'main' && 'Tap Any 4 Mains (Or Add a 5th)'}
                  {activeCourse === 'accompaniments' && 'Pick Rice, Side Order & Naan'}
                  {activeCourse === 'dessert' && 'Tap Any 2 Desserts'}
                  {activeCourse === 'drink' && 'Soft Drinks, Tea & Coffee'}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-1">
                  {activeCourse === 'starter' &&
                    '4 starters are included in your £28 menu. Adding a 5th starter costs £1.00 extra per person.'}
                  {activeCourse === 'main' &&
                    '4 mains are included in your £28 menu. Adding a 5th main costs £1.00 extra per person.'}
                  {activeCourse === 'accompaniments' &&
                    'Pick 1 rice, 1 side order (like chips or salad), and optional traditional Indian accompaniments.'}
                  {activeCourse === 'dessert' &&
                    '2 desserts are included as standard in your £28/adult (£21/child) set price at no extra charge.'}
                  {activeCourse === 'drink' &&
                    'Unlimited soft drinks from the menu cost £3.00 extra per person. Tea & Coffee is £2.00 extra per person.'}
                </p>
              </div>
              <div className="text-base font-bold tabular-nums text-[#25408F] shrink-0">
                {activeCourse === 'starter' &&
                  (startersSelected >= 4
                    ? `${startersSelected} picked (${pricing.extraStartersCount > 0 ? `+£${pricing.extraStartersCount}/pp` : '4 included'})`
                    : `${4 - startersSelected} more to pick`)}
                {activeCourse === 'main' &&
                  (mainsSelected >= 4
                    ? `${mainsSelected} picked (${pricing.extraMainsCount > 0 ? `+£${pricing.extraMainsCount}/pp` : '4 included'})`
                    : `${4 - mainsSelected} more to pick`)}
                {activeCourse === 'dessert' &&
                  (dessertSelected >= MENU_PRICING.requiredDesserts
                    ? `${dessertSelected} picked (2 included)`
                    : `${MENU_PRICING.requiredDesserts - dessertSelected} more to pick`)}
                {activeCourse === 'drink' && `${selection.drinks.length} of 4 picked`}
              </div>
            </div>

            {/* Clear Extra Dish Notice when base starters or mains are picked */}
            {((activeCourse === 'starter' && startersSelected >= MENU_PRICING.requiredStarters) ||
              (activeCourse === 'main' && mainsSelected >= MENU_PRICING.requiredMains)) && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-950 flex items-start gap-2.5">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {`4 ${activeCourse === 'starter' ? 'starters' : 'mains'} included at £28/adult. `}
                  </span>
                  <span>
                    {`Want to add a 5th ${activeCourse === 'starter' ? 'starter' : 'main'}? It costs `}
                    <strong>£1.00 extra per person</strong> and updates your total automatically.
                  </span>
                </div>
              </div>
            )}

            {/* Filter Toolbar — concise labels so filters + search align on one crisp row on PC */}
            {activeCourse !== 'drink' && (
              <div className="flex flex-col xl:flex-row gap-2.5 items-stretch xl:items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                    {(['All', 'Blue Zenzer', 'Blue Ginger'] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKitchenFilter(k)}
                        className={`min-h-[38px] px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                          kitchenFilter === k
                            ? 'bg-white text-slate-900 shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {k === 'All' ? 'All Food' : k}
                      </button>
                    ))}
                  </div>

                  {(activeCourse === 'starter' || activeCourse === 'main') && (
                    <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl">
                      {(
                        [
                          { id: 'All', label: 'All' },
                          { id: 'veg', label: 'Veg' },
                          { id: 'non-veg', label: 'Meat & Fish' },
                        ] as const
                      ).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDietFilter(d.id)}
                          className={`min-h-[38px] px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                            dietFilter === d.id
                              ? 'bg-white text-slate-900 shadow-xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative xl:w-56 shrink-0">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find a dish..."
                    className="w-full min-h-[42px] pl-9 pr-9 py-2 text-base sm:text-sm border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-[#25408F]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-500 hover:text-slate-800"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Dishes Grid / Drink + Tea & Coffee */}
            {activeCourse === 'accompaniments' ? (
              <div className="space-y-6 pt-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-3">
                    Rice Choice (Pick 1)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {riceItems.map(renderDishCard)}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-3">
                    Side Order Choice (Pick 1)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sideItems.map(renderDishCard)}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <h3 className="text-base font-bold text-slate-900">
                    Table Extras (Naan, Poppadums &amp; Dal)
                  </h3>

                  <label className="flex items-start gap-3 p-4 min-h-[56px] rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isLocked}
                      checked={details.includeFixedIndianAccompaniments}
                      onChange={(e) =>
                        onChangeDetails({
                          ...details,
                          includeFixedIndianAccompaniments: e.target.checked,
                        })
                      }
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-[#25408F] focus:ring-[#25408F]"
                    />
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        Include Mix Naan, Poppadums, Raita, Salad &amp; Chutneys
                      </div>
                      <div className="text-sm text-slate-600 mt-0.5">
                        Recommended when choosing Indian curries or grills.
                      </div>
                    </div>
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white">
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        Optional Dal Side Dish
                      </div>
                      <div className="text-sm text-slate-600 mt-0.5">
                        Add a dal alongside your rice and naan if needed.
                      </div>
                    </div>
                    <select
                      disabled={isLocked}
                      value={details.extraAccompanimentDal}
                      onChange={(e) =>
                        onChangeDetails({ ...details, extraAccompanimentDal: e.target.value })
                      }
                      className="min-h-[44px] px-3.5 py-2 text-base sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-[#25408F]"
                    >
                      {DAL_ACCOMPANIMENT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : activeCourse === 'drink' ? (
              <div className="space-y-6 pt-1">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="text-base font-bold text-slate-900">
                    1. Soft Drinks Package
                  </div>
                  <p className="text-sm text-slate-600">
                    Unlimited soft drinks from the menu cost <strong>£3.00 extra per person</strong>.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: 'Included', label: 'Unlimited Soft Drinks (+£3/person)' },
                        { value: 'Not Included', label: 'No Drinks Package (Pay at bar)' },
                      ] as { value: DrinksPackageOption; label: string }[]
                    ).map((opt) => {
                      const active = details.drinksPackage === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={isLocked}
                          onClick={() => onChangeDetails({ ...details, drinksPackage: opt.value })}
                          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors ${
                            active
                              ? 'bg-[#25408F] text-white border-[#25408F]'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-3">
                    2. Pick Up to 4 Soft Drinks for the Table
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredItems.map(renderDishCard)}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-base font-bold text-slate-900 mb-3">
                    3. Optional Tea &amp; Coffee (+£2.00 per person)
                  </h3>
                  <label className="flex items-start gap-3 p-4 min-h-[56px] rounded-xl border-2 border-slate-200 bg-slate-50 cursor-pointer hover:border-slate-300">
                    <input
                      type="checkbox"
                      disabled={isLocked}
                      checked={details.includeTeaAndCoffee}
                      onChange={(e) =>
                        onChangeDetails({ ...details, includeTeaAndCoffee: e.target.checked })
                      }
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-[#25408F]"
                    />
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        Add Tea &amp; Coffee Service (+£2.00 extra per person)
                      </div>
                      <div className="text-sm text-slate-600 mt-0.5">
                        Adds £2.00 per guest ({pricing.totalGuests} × £2 = £{(pricing.totalGuests * 2).toFixed(2)}) for Tea &amp; Coffee.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {filteredItems.length > 0 ? (
                  filteredItems.map(renderDishCard)
                ) : (
                  <div className="col-span-full py-10 text-center text-base text-slate-600">
                    No dishes found for that search. Tap &quot;All Food&quot; or clear the search box to see everything.
                  </div>
                )}
              </div>
            )}

            {/* Clear Next Step Button */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                Estimated party total so far:{' '}
                <strong className="text-slate-900 tabular-nums">
                  £{pricing.grandTotal.toFixed(2)}
                </strong>
              </div>
              {renderNextCourseButton()}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Desktop Sticky Party Summary Tray (scrollable inside viewport so CTA is never clipped) */}
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto bg-white border border-slate-200 rounded-2xl p-5 xl:p-6">
          {renderTrayContent(false)}
        </aside>
      </div>

      {/* Mobile Slide-Up Bottom Sheet Drawer */}
      {mobileTrayOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onCloseMobileTray}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto px-5 pt-3 pb-8 pb-safe">
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />
            {renderTrayContent(true)}
          </div>
        </div>
      )}
    </div>
  );
};
