import React from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Minus, Plus } from 'lucide-react';
import {
  MENU_PRICING,
  TERMS_AND_CONDITIONS,
  findVenueHall,
  getRecommendedHall,
} from '../data/menuData';
import {
  CustomerDetails,
  DrinksPackageOption,
  MenuSelection,
  ServiceStyleOption,
} from '../types/booking';
import { calculatePricing } from '../utils/bookingFormatter';
import { HallSelector } from './HallSelector';

interface EventDetailsFormProps {
  details: CustomerDetails;
  selection: MenuSelection;
  isLocked: boolean;
  onChangeDetails: (next: CustomerDetails) => void;
  onBackToMenu: () => void;
  onGenerateBookingForm: () => void;
}

export const EventDetailsForm: React.FC<EventDetailsFormProps> = ({
  details,
  selection,
  isLocked,
  onChangeDetails,
  onBackToMenu,
  onGenerateBookingForm,
}) => {
  const pricing = calculatePricing(details, selection);

  const update = <K extends keyof CustomerDetails>(key: K, value: CustomerDetails[K]) => {
    if (isLocked) return;
    const nextDetails = { ...details, [key]: value };
    if (key === 'adults' || key === 'kids') {
      const nextTotal = (Number(nextDetails.adults) || 0) + (Number(nextDetails.kids) || 0);
      const currentHall = findVenueHall(nextDetails.area);
      if (!currentHall || nextTotal > currentHall.maxCapacity) {
        nextDetails.area = getRecommendedHall(nextTotal).name;
      }
    }
    onChangeDetails(nextDetails);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left 8 Columns: Structured Party & Event Inputs */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Step 2: Party &amp; Contact Details
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-1">
                Tell us your name, party date, and how many guests are coming.
              </p>
            </div>
            <div className="lg:hidden bg-[#EEF2FB] border border-[#25408F]/30 rounded-xl px-4 py-2 shrink-0">
              <div className="text-xs font-semibold text-[#25408F]">Estimated Total</div>
              <div className="text-lg font-bold tabular-nums text-slate-900">
                £{pricing.grandTotal.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Your Name *
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={details.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Sanjay"
                className="w-full px-3.5 py-2.5 min-h-[48px] text-base border border-slate-300 rounded-xl focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Your Email Address *
              </label>
              <input
                type="email"
                disabled={isLocked}
                value={details.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 min-h-[48px] text-base border border-slate-300 rounded-xl focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                inputMode="tel"
                disabled={isLocked}
                value={details.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="e.g. 07700 900123"
                className="w-full px-3.5 py-2.5 min-h-[48px] text-base border border-slate-300 rounded-xl focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Date of Your Party *
              </label>
              <input
                type="date"
                disabled={isLocked}
                value={details.eventDate}
                onChange={(e) => update('eventDate', e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[48px] text-base border border-slate-300 rounded-xl focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Arrival Time
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={details.eventTime}
                onChange={(e) => update('eventTime', e.target.value)}
                placeholder="e.g. 1700 (5:00 PM)"
                className="w-full px-3.5 py-2.5 min-h-[48px] text-base border border-slate-300 rounded-xl focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                When should Starters be served?
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={details.startersTime}
                onChange={(e) => update('startersTime', e.target.value)}
                placeholder="e.g. 1800 (6:00 PM)"
                className="w-full px-3.5 py-2.5 min-h-[48px] text-base border border-slate-300 rounded-xl focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
              />
            </div>

            {/* Adults with big +/- steppers */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                How many Adults? (£{MENU_PRICING.adultPerPerson} each) *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLocked || details.adults <= 0}
                  onClick={() => update('adults', Math.max(0, details.adults - 1))}
                  className="w-12 h-12 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 shrink-0"
                  aria-label="Fewer adults"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  disabled={isLocked}
                  value={details.adults}
                  onChange={(e) => update('adults', Math.max(0, Number(e.target.value) || 0))}
                  className="w-full text-center px-3 py-2.5 min-h-[48px] text-base font-bold border border-slate-300 rounded-xl tabular-nums focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
                />
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => update('adults', details.adults + 1)}
                  className="w-12 h-12 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 shrink-0"
                  aria-label="More adults"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Kids with big +/- steppers */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                How many Kids aged 5–10? (£{MENU_PRICING.childPerPerson} each)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLocked || details.kids <= 0}
                  onClick={() => update('kids', Math.max(0, details.kids - 1))}
                  className="w-12 h-12 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 shrink-0"
                  aria-label="Fewer kids"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  disabled={isLocked}
                  value={details.kids}
                  onChange={(e) => update('kids', Math.max(0, Number(e.target.value) || 0))}
                  className="w-full text-center px-3 py-2.5 min-h-[48px] text-base font-bold border border-slate-300 rounded-xl tabular-nums focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
                />
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => update('kids', details.kids + 1)}
                  className="w-12 h-12 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 shrink-0"
                  aria-label="More kids"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Soft Drinks Package
              </label>
              <select
                disabled={isLocked}
                value={details.drinksPackage}
                onChange={(e) =>
                  update('drinksPackage', e.target.value as DrinksPackageOption)
                }
                className="w-full px-3.5 py-2.5 min-h-[48px] text-base border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
              >
                <option value="Included">
                  Unlimited Soft Drinks (+£{MENU_PRICING.unlimitedSoftDrinksPerPerson}/person)
                </option>
                <option value="Not Included">No Drinks Package (Pay at bar)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Food Service Style
              </label>
              <select
                disabled={isLocked}
                value={details.serviceStyle}
                onChange={(e) => update('serviceStyle', e.target.value as ServiceStyleOption)}
                className="w-full px-3.5 py-2.5 min-h-[48px] text-base border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
              >
                <option value="Buffet">Buffet (Self-serve table)</option>
                <option value="Table Service">Table Service</option>
              </select>
            </div>

            {/* Hall Selection based on combined guest count */}
            <div className="sm:col-span-2 pt-1">
              <HallSelector
                selectedArea={details.area}
                totalGuests={pricing.totalGuests}
                disabled={isLocked}
                onSelectHall={(hallName) => update('area', hallName)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Deposit Amount (£)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                disabled={isLocked}
                value={details.deposit}
                onChange={(e) => update('deposit', Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 min-h-[48px] text-base border border-slate-300 rounded-xl tabular-nums focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
              />
            </div>
          </div>

          {pricing.belowMinimumGuests && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-950">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Minimum {MENU_PRICING.minimumGuests} guests required to book</strong> (adults &amp; kids combined). You currently have{' '}
                <strong className="tabular-nums">{pricing.totalGuests}</strong> guests ({details.adults} adults + {details.kids} kids) — please add{' '}
                <strong className="tabular-nums">
                  {MENU_PRICING.minimumGuests - pricing.totalGuests} more
                </strong>{' '}
                before locking in your menu.
              </span>
            </div>
          )}

          {/* Tea & Coffee + Golf Add-ons */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
              <input
                type="checkbox"
                disabled={isLocked}
                checked={details.includeTeaAndCoffee}
                onChange={(e) => update('includeTeaAndCoffee', e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-[#25408F]"
              />
              <span className="text-base font-semibold text-slate-900">
                Add Tea &amp; Coffee Service (+£2.00 extra per person)
              </span>
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isLocked}
                  checked={details.golfIncluded}
                  onChange={(e) => update('golfIncluded', e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-[#25408F]"
                />
                <span className="text-base font-semibold text-slate-900">
                  Add Playgolf Bays or Mini Golf
                </span>
              </label>

              {details.golfIncluded && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">Golf Price (£):</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    disabled={isLocked}
                    value={details.golfCost}
                    onChange={(e) => update('golfCost', Math.max(0, Number(e.target.value) || 0))}
                    className="w-28 min-h-[44px] px-3 py-1.5 text-base border border-slate-300 rounded-xl tabular-nums focus:outline-none focus:border-[#25408F]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kitchen Notes, Allergies, Requests */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <h3 className="font-display text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
            Allergies &amp; Extra Requests (Optional)
          </h3>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Does anyone have food allergies?
            </label>
            <textarea
              rows={2}
              disabled={isLocked}
              value={details.allergies}
              onChange={(e) => update('allergies', e.target.value)}
              placeholder="Write any nut, dairy, or gluten allergies here (or leave empty if none)"
              className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Any extra food or special requests?
            </label>
            <textarea
              rows={2}
              disabled={isLocked}
              value={details.specialRequests}
              onChange={(e) => update('specialRequests', e.target.value)}
              placeholder="e.g. Extra kids pizzas or celebration cake table"
              className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Golf or Party Notes
            </label>
            <textarea
              rows={2}
              disabled={isLocked}
              value={details.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="e.g. 1 Hour Mini Golf Complimentary, 2 Hours 5 Bays"
              className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Room Setup Details
            </label>
            <input
              type="text"
              disabled={isLocked}
              value={details.setupDetails}
              onChange={(e) => update('setupDetails', e.target.value)}
              placeholder="e.g. Long table, birthday balloons (or leave blank)"
              className="w-full px-3.5 py-2.5 min-h-[48px] text-base border border-slate-300 rounded-xl focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Consent & Agreement */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h3 className="font-display text-xl font-bold text-slate-900">
              Agreement &amp; Signature
            </h3>
            <details className="text-sm text-[#25408F]">
              <summary className="cursor-pointer font-semibold hover:underline py-1">
                Read Booking Terms (11 short rules)
              </summary>
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl max-h-60 overflow-y-auto space-y-2.5 text-slate-700 text-sm">
                {TERMS_AND_CONDITIONS.map((c) => (
                  <div key={c.title}>
                    <div className="font-bold text-slate-900">{c.title}</div>
                    <div>{c.body}</div>
                  </div>
                ))}
              </div>
            </details>
          </div>

          <div className="space-y-3 text-base text-slate-800">
            <label className="flex items-start gap-3 min-h-[48px] py-1 cursor-pointer">
              <input
                type="checkbox"
                disabled={isLocked}
                checked={details.consentTerms}
                onChange={(e) => update('consentTerms', e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-[#25408F]"
              />
              <span>
                I agree to the Booking Terms &amp; Conditions *{' '}
                <span className="block text-sm text-slate-600">
                  10% service charge applies; leftover buffet food cannot be taken home.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 min-h-[48px] py-1 cursor-pointer">
              <input
                type="checkbox"
                disabled={isLocked}
                checked={details.consentContact}
                onChange={(e) => update('consentContact', e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-[#25408F]"
              />
              <span>Blue Zenzer may contact me about this party booking *</span>
            </label>

            <label className="flex items-start gap-3 min-h-[48px] py-1 cursor-pointer">
              <input
                type="checkbox"
                disabled={isLocked}
                checked={details.consentMarketing}
                onChange={(e) => update('consentMarketing', e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-[#25408F]"
              />
              <span>Send me occasional offers and updates (optional)</span>
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Type Your Full Name to Sign
            </label>
            <input
              type="text"
              disabled={isLocked}
              value={details.signatureName}
              onChange={(e) => update('signatureName', e.target.value)}
              placeholder={details.name ? `Type "${details.name}" here` : 'Type your full name'}
              className="w-full sm:w-80 min-h-[48px] px-3.5 py-2.5 text-base border border-slate-300 rounded-xl italic focus:outline-none focus:border-[#25408F] disabled:bg-slate-50"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToMenu}
            className="min-h-[48px] px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Food Choices</span>
          </button>

          <button
            type="button"
            onClick={onGenerateBookingForm}
            className="min-h-[52px] px-6 py-3 rounded-xl bg-[#25408F] text-white text-base font-semibold hover:bg-[#1D3270] inline-flex items-center justify-center gap-2 lg:hidden"
          >
            <span>Review &amp; Lock Menu (£{pricing.grandTotal.toFixed(2)})</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right 4 Columns: Live Payment Breakdown */}
      <aside className="lg:col-span-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="font-display text-xl font-bold text-slate-900">
            What It Costs
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Live breakdown for your party.
          </p>
        </div>

        <dl className="space-y-3 text-base">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-700">
              Adults ({details.adults} × £{MENU_PRICING.adultPerPerson})
            </dt>
            <dd className="tabular-nums font-semibold text-slate-900">
              £{pricing.adultsTotal.toFixed(2)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-700">
              Kids 5–10 ({details.kids} × £{MENU_PRICING.childPerPerson})
            </dt>
            <dd className="tabular-nums font-semibold text-slate-900">
              £{pricing.kidsTotal.toFixed(2)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-700">2 Desserts</dt>
            <dd className="font-semibold text-emerald-700">Included Free</dd>
          </div>
          {pricing.extraDishesCount > 0 && (
            <div className="flex justify-between gap-2 text-amber-900">
              <dt>
                Extra Dishes ({pricing.extraDishesCount} × £1 × {pricing.totalGuests})
              </dt>
              <dd className="tabular-nums font-semibold">£{pricing.extraDishesTotal.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <dt className="text-slate-700">Soft Drinks</dt>
            <dd className="tabular-nums font-semibold text-slate-900">
              £{pricing.drinksTotal.toFixed(2)}
            </dd>
          </div>
          {details.includeTeaAndCoffee && (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-700">
                Tea &amp; Coffee ({pricing.totalGuests} × £{MENU_PRICING.teaAndCoffeePerPerson})
              </dt>
              <dd className="tabular-nums font-semibold text-slate-900">
                £{pricing.teaAndCoffeeTotal.toFixed(2)}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-2 pt-2 border-t border-slate-100">
            <dt className="text-slate-700">Service Charge (10%)</dt>
            <dd className="tabular-nums font-semibold text-slate-900">
              £{pricing.serviceCharge.toFixed(2)}
            </dd>
          </div>
          {details.golfIncluded && (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-700">Golf Package</dt>
              <dd className="tabular-nums font-semibold text-slate-900">
                £{pricing.golfTotal.toFixed(2)}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-2 pt-3 border-t border-slate-200 text-lg font-bold text-slate-900">
            <dt>Estimated Total</dt>
            <dd className="tabular-nums text-[#25408F]">£{pricing.grandTotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between gap-2 text-sm text-slate-600">
            <dt>Deposit Paid</dt>
            <dd className="tabular-nums">-£{(Number(details.deposit) || 0).toFixed(2)}</dd>
          </div>
          <div className="flex justify-between gap-2 text-base font-bold text-slate-900">
            <dt>Balance Left on the Day</dt>
            <dd className="tabular-nums">£{pricing.balanceRemaining.toFixed(2)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onGenerateBookingForm}
          className="w-full min-h-[52px] py-3.5 px-4 rounded-xl bg-[#25408F] text-white text-base font-semibold hover:bg-[#1D3270] active:scale-[0.99] transition-all flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <span>Step 3: Review &amp; Lock Menu</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </aside>
    </div>
  );
};
