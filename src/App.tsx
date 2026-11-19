import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Lock,
  Mail,
  Printer,
  Unlock,
  AlertCircle,
  FilePlus2,
  ClipboardList,
  ChevronUp,
  ArrowRight,
  X,
} from 'lucide-react';
import { BookingFormDocument } from './components/BookingFormDocument';
import { EventDetailsForm } from './components/EventDetailsForm';
import { KitchenQueueView } from './components/KitchenQueueView';
import { MenuBuilder } from './components/MenuBuilder';
import {
  MAX_VENUE_CAPACITY,
  MENU_PRICING,
  SANJAY_REFERENCE_PRESET,
  findVenueHall,
} from './data/menuData';
import {
  BookingStatus,
  CustomerDetails,
  MenuSelection,
  SavedBooking,
} from './types/booking';
import {
  calculatePricing,
  generatePlainTextBookingEmail,
  getSelectedDesserts,
} from './utils/bookingFormatter';

type AppTab = 'menu' | 'details' | 'form' | 'queue';

const DEFAULT_DETAILS: CustomerDetails = {
  name: '',
  email: '',
  phone: '',
  eventDate: '',
  eventTime: '1700',
  startersTime: '1800',
  adults: 45,
  kids: 0,
  area: 'Fairway Hall',
  deposit: 100,
  drinksPackage: 'Not Included',
  serviceStyle: 'Buffet',
  golfIncluded: false,
  golfCost: 0,
  allergies: '',
  specialRequests: '',
  notes: '',
  setupDetails: '',
  includeFixedIndianAccompaniments: true,
  extraAccompanimentDal: 'None',
  includeTeaAndCoffee: false,
  consentTerms: false,
  consentContact: false,
  consentMarketing: false,
  signatureName: '',
};

const DEFAULT_SELECTION: MenuSelection = {
  starters: [],
  mains: [],
  desserts: [],
  rice: 'bg-rice-pilao',
  side: 'bz-side-potato-chips',
  drinks: [],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('menu');
  const [details, setDetails] = useState<CustomerDetails>(DEFAULT_DETAILS);
  const [selection, setSelection] = useState<MenuSelection>(DEFAULT_SELECTION);
  const [lockedBookingId, setLockedBookingId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [mobileTrayOpen, setMobileTrayOpen] = useState(false);

  const [bookings, setBookings] = useState<SavedBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [venueEmail, setVenueEmail] = useState<string>(() => {
    return localStorage.getItem('bz_venue_email') || 'events@bluezenzer.co.uk';
  });

  const pricing = calculatePricing(details, selection);

  const updateVenueEmail = (next: string) => {
    setVenueEmail(next);
    localStorage.setItem('bz_venue_email', next);
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = (await res.json()) as SavedBooking[];
        setBookings(data);
      }
    } catch {
      // Fallback gracefully if offline
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const params = new URLSearchParams(window.location.search);
    const bookingParam = params.get('booking');
    if (bookingParam) {
      fetch(`/api/bookings/${encodeURIComponent(bookingParam)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((found: SavedBooking | null) => {
          if (found) {
            setDetails(found.details);
            setSelection({
              ...found.selection,
              desserts: getSelectedDesserts(found.selection),
            });
            setLockedBookingId(found.id);
            setIsLocked(true);
            setActiveTab('form');
          }
        })
        .catch(() => {});
    }
  }, []);

  const switchTab = (tab: AppTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const missingRequirements = (): string[] => {
    const missing: string[] = [];
    if (selection.starters.length < MENU_PRICING.requiredStarters) {
      missing.push(
        `Pick at least ${MENU_PRICING.requiredStarters} starters (${selection.starters.length}/4)`
      );
    }
    if (selection.mains.length < MENU_PRICING.requiredMains) {
      missing.push(
        `Pick at least ${MENU_PRICING.requiredMains} mains (${selection.mains.length}/4)`
      );
    }
    if (getSelectedDesserts(selection).length < MENU_PRICING.requiredDesserts) {
      missing.push('Pick 1 included dessert (0/1)');
    }
    const totalGuests =
      Math.max(0, Number(details.adults) || 0) + Math.max(0, Number(details.kids) || 0);
    if (totalGuests < MENU_PRICING.minimumGuests) {
      missing.push(
        `Minimum ${MENU_PRICING.minimumGuests} guests required (adults + kids combined — currently ${totalGuests})`
      );
    }
    const selectedHall = findVenueHall(details.area);
    if (totalGuests > MAX_VENUE_CAPACITY) {
      missing.push(
        `Maximum hall capacity is ${MAX_VENUE_CAPACITY} guests (Bunker Bar Hall)`
      );
    } else if (!selectedHall) {
      missing.push('Choose a hall (Fairway Hall, Anthem Bar, or Bunker Bar Hall)');
    } else if (totalGuests > selectedHall.maxCapacity) {
      missing.push(
        `${selectedHall.name} fits up to ${selectedHall.maxCapacity} guests max — choose a larger hall`
      );
    }
    if (!details.name.trim()) {
      missing.push('Enter your name');
    }
    if (!details.eventDate) {
      missing.push('Pick your party date');
    }
    if (!details.consentTerms || !details.consentContact) {
      missing.push('Tick the agreement boxes');
    }
    return missing;
  };

  const handleLockAndSubmit = async () => {
    const missing = missingRequirements();
    if (missing.length > 0) {
      setSubmitError(missing[0]);
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lockedBookingId || undefined,
          status: 'Locked & Submitted',
          details: {
            ...details,
            signatureName: details.signatureName.trim() || details.name.trim(),
          },
          selection,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errData?.error || 'Could not save booking.');
      }

      const saved = (await res.json()) as SavedBooking;
      setLockedBookingId(saved.id);
      setIsLocked(true);
      setDetails(saved.details);
      setActiveTab('form');

      const url = new URL(window.location.href);
      url.searchParams.set('booking', saved.id);
      window.history.replaceState({}, '', url.toString());

      await fetchBookings();
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : 'Unable to save booking to server. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailKitchen = (
    targetId: string | null = lockedBookingId,
    targetDetails: CustomerDetails = details,
    targetSelection: MenuSelection = selection
  ) => {
    const shareUrl = targetId
      ? `${window.location.origin}/?booking=${encodeURIComponent(targetId)}`
      : window.location.href;
    const { subject, body } = generatePlainTextBookingEmail(
      targetId,
      targetDetails,
      targetSelection,
      shareUrl
    );
    const mailtoUrl = `mailto:${encodeURIComponent(venueEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleCopySummary = async () => {
    const shareUrl = lockedBookingId
      ? `${window.location.origin}/?booking=${encodeURIComponent(lockedBookingId)}`
      : undefined;
    const { subject, body } = generatePlainTextBookingEmail(
      lockedBookingId,
      details,
      selection,
      shareUrl
    );
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleLoadSanjayPreset = () => {
    setDetails(SANJAY_REFERENCE_PRESET.details);
    setSelection(SANJAY_REFERENCE_PRESET.selection);
    setLockedBookingId(null);
    setIsLocked(false);
    setSubmitError(null);
    switchTab('form');
  };

  const handleStartNewBooking = () => {
    setDetails(DEFAULT_DETAILS);
    setSelection(DEFAULT_SELECTION);
    setLockedBookingId(null);
    setIsLocked(false);
    setSubmitError(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('booking');
    window.history.replaceState({}, '', url.toString());
    switchTab('menu');
  };

  const handleOpenSavedBooking = (booking: SavedBooking, autoPrint = false) => {
    setDetails(booking.details);
    setSelection({
      ...booking.selection,
      desserts: getSelectedDesserts(booking.selection),
    });
    setLockedBookingId(booking.id);
    setIsLocked(true);
    setSubmitError(null);
    switchTab('form');
    if (autoPrint) {
      setTimeout(() => window.print(), 180);
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: BookingStatus) => {
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
        if (lockedBookingId === id) {
          handleStartNewBooking();
        }
      }
    } catch {
      // ignore
    }
  };

  const missing = missingRequirements();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-900 print:min-h-0 print:block print:bg-white">
      {/* ==================== TOP BRAND HEADER ==================== */}
      <header className="no-print md:sticky md:top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-12 md:h-16 flex items-center justify-between gap-3 md:gap-8">
          {/* Zone 1: Single-line Brand Title */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              switchTab('menu');
            }}
            className="font-display text-lg md:text-xl font-bold tracking-tight text-[#1D4E89] whitespace-nowrap shrink-0"
          >
            Blue Zenzer
          </a>

          {/* Zone 2: Desktop single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => switchTab('menu')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'menu'
                  ? 'border-[#25408F] text-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              1. Pick Food
            </button>
            <button
              type="button"
              onClick={() => switchTab('details')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'details'
                  ? 'border-[#25408F] text-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              2. Party Info
            </button>
            <button
              type="button"
              onClick={() => switchTab('form')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'form'
                  ? 'border-[#25408F] text-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              3. Review &amp; Print
            </button>
            <button
              type="button"
              onClick={() => switchTab('queue')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'queue'
                  ? 'border-[#25408F] text-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Kitchen List
            </button>
          </nav>

          {/* Zone 3: Mobile quick Kitchen / Back toggle or Desktop Primary Action */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => switchTab(activeTab === 'queue' ? 'menu' : 'queue')}
              className="md:hidden min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{activeTab === 'queue' ? 'Back to Menu' : 'Kitchen List'}</span>
            </button>

            <button
              type="button"
              onClick={() => (activeTab === 'form' ? window.print() : switchTab('form'))}
              className="hidden md:inline-flex min-h-[40px] px-4 py-2 rounded-xl bg-[#25408F] text-white text-sm font-semibold hover:bg-[#1D3270] transition-colors items-center gap-2 whitespace-nowrap shrink-0 tabular-nums"
            >
              {activeTab === 'form' ? (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Print · £{pricing.grandTotal.toFixed(2)}</span>
                </>
              ) : (
                <span>Total £{pricing.grandTotal.toFixed(2)} · Review</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ==================== MAIN CONTENT ==================== */}
      <main
        id="top"
        className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 pt-5 pb-28 md:py-8 print:p-0 print:max-w-none"
      >
        {/* Simple 3-Step Guide Strip (Mobile only — Desktop already has steps in top navigation) */}
        {activeTab !== 'queue' && (
          <div className="no-print md:hidden mb-5 bg-white border border-slate-200 rounded-2xl p-1.5 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => switchTab('menu')}
              className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors text-center ${
                activeTab === 'menu'
                  ? 'bg-[#EEF2FB] text-[#25408F] border border-[#25408F]/30'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              1. Pick Food
            </button>
            <button
              type="button"
              onClick={() => switchTab('details')}
              className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors text-center ${
                activeTab === 'details'
                  ? 'bg-[#EEF2FB] text-[#25408F] border border-[#25408F]/30'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              2. Party Info
            </button>
            <button
              type="button"
              onClick={() => switchTab('form')}
              className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors text-center ${
                activeTab === 'form'
                  ? 'bg-[#EEF2FB] text-[#25408F] border border-[#25408F]/30'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              3. Lock &amp; Send
            </button>
          </div>
        )}

        {/* Hero Split on Set Menu View */}
        {activeTab === 'menu' && (
          <section className="no-print mb-6 md:mb-7">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-7 p-5 sm:p-7 lg:p-8 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-5 pb-1">
                    <img
                      src="/assets/logos/playgolf_logo.png"
                      alt="Playgolf Northwick Park"
                      className="h-7 sm:h-8 w-auto object-contain"
                    />
                    <img
                      src="/assets/logos/blue_zenzer_menu_logo.png"
                      alt="Blue Zenzer Bar & Restaurant"
                      className="h-9 sm:h-10 w-auto object-contain"
                    />
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-bold text-slate-900 leading-[1.15] tracking-tight text-balance">
                    Pick Your Party Food in 3 Easy Steps
                  </h1>
                  <p className="text-[15px] sm:text-base text-slate-600 leading-relaxed max-w-xl">
                    Choose any <strong className="text-slate-900">4 starters</strong>,{' '}
                    <strong className="text-slate-900">4 mains</strong>, and{' '}
                    <strong className="text-slate-900">1 dessert</strong> for{' '}
                    <strong className="text-slate-900">£28 per adult</strong> and{' '}
                    <strong className="text-slate-900">£21 per child (5–10 yrs)</strong>. Minimum{' '}
                    <strong className="text-slate-900">{MENU_PRICING.minimumGuests} guests</strong>{' '}
                    (adults &amp; kids combined). Add a 5th starter, 5th main, or 2nd dessert for{' '}
                    <strong className="text-slate-900">£1 extra per person</strong>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 pt-1">
                  <a
                    href="#menu-workspace"
                    className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#25408F] text-white text-sm sm:text-base font-semibold hover:bg-[#1D3270] transition-colors flex items-center justify-center whitespace-nowrap"
                  >
                    Start Picking Food
                  </a>
                  <button
                    type="button"
                    onClick={handleLoadSanjayPreset}
                    className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center whitespace-nowrap"
                  >
                    See Example Booking (Sanjay)
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 h-48 sm:h-60 lg:h-auto lg:min-h-[260px] bg-slate-900 relative overflow-hidden">
                <img
                  src="/src/assets/images/hero_party_feast_1794794365504.jpg"
                  alt="Blue Zenzer and Blue Ginger party banquet featuring wood-fired pizza, curries, naan, and tandoori skewers"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>
        )}

        {/* Locked Banner */}
        {isLocked && activeTab !== 'queue' && (
          <div className="no-print mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <div className="text-base font-bold text-emerald-950">
                  Your Menu is Locked In! {lockedBookingId ? `(${lockedBookingId})` : ''}
                </div>
                <div className="text-sm text-emerald-800">
                  Total estimated cost: £{pricing.grandTotal.toFixed(2)} · Ready to print or email to the kitchen.
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsLocked(false)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-emerald-300 bg-white text-sm font-semibold text-emerald-900 hover:bg-emerald-100 inline-flex items-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                Make Changes
              </button>
              <button
                type="button"
                onClick={handleStartNewBooking}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
              >
                <FilePlus2 className="w-4 h-4" />
                New Party
              </button>
            </div>
          </div>
        )}

        {/* Active View */}
        {activeTab === 'menu' && (
          <div id="menu-workspace" className="no-print">
            <MenuBuilder
              selection={selection}
              details={details}
              isLocked={isLocked}
              mobileTrayOpen={mobileTrayOpen}
              onOpenMobileTray={() => setMobileTrayOpen(true)}
              onCloseMobileTray={() => setMobileTrayOpen(false)}
              onChangeSelection={setSelection}
              onChangeDetails={setDetails}
              onProceedToDetails={() => switchTab('details')}
            />
          </div>
        )}

        {activeTab === 'details' && (
          <div className="no-print">
            <EventDetailsForm
              details={details}
              selection={selection}
              isLocked={isLocked}
              onChangeDetails={setDetails}
              onBackToMenu={() => switchTab('menu')}
              onGenerateBookingForm={() => switchTab('form')}
            />
          </div>
        )}

        {activeTab === 'form' && (
          <div className="space-y-6">
            {/* Dispatch & Lock-In Toolbar (Hidden when printing) */}
            <div className="no-print bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">
                    Step 3: Review, Lock &amp; Send
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                    Estimated Total:{' '}
                    <strong className="text-[#25408F] tabular-nums">
                      £{pricing.grandTotal.toFixed(2)}
                    </strong>{' '}
                    ({details.adults} adults, {details.kids} kids, incl. 10% service)
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2.5">
                  {!isLocked && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleLockAndSubmit}
                      className="sm:col-span-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#25408F] text-white text-sm font-semibold hover:bg-[#1D3270] disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{submitting ? 'Saving...' : 'Lock In & Confirm Menu'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleEmailKitchen()}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email to Restaurant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Save PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="sm:col-span-2 lg:col-span-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedText ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>

              {/* Validation Checklist before locking */}
              {!isLocked && missing.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Almost ready — please finish: </span>
                      <span>{missing.join(' · ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {(selection.starters.length < 4 ||
                      selection.mains.length < 4 ||
                      getSelectedDesserts(selection).length < 1) && (
                      <button
                        type="button"
                        onClick={() => switchTab('menu')}
                        className="min-h-[40px] underline font-bold hover:text-amber-950 whitespace-nowrap"
                      >
                        Pick Food
                      </button>
                    )}
                    {(pricing.belowMinimumGuests ||
                      pricing.totalGuests > MAX_VENUE_CAPACITY ||
                      !findVenueHall(details.area) ||
                      pricing.totalGuests > (findVenueHall(details.area)?.maxCapacity ?? 0) ||
                      !details.name.trim() ||
                      !details.eventDate ||
                      !details.consentTerms ||
                      !details.consentContact) && (
                      <button
                        type="button"
                        onClick={() => switchTab('details')}
                        className="min-h-[40px] underline font-bold hover:text-amber-950 whitespace-nowrap"
                      >
                        Fill Party Info
                      </button>
                    )}
                  </div>
                </div>
              )}

              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm font-medium text-rose-800">
                  {submitError}
                </div>
              )}
            </div>

            {/* Standardized Printable Booking Form */}
            <BookingFormDocument
              bookingId={lockedBookingId}
              details={details}
              selection={selection}
            />
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="no-print">
            <KitchenQueueView
              bookings={bookings}
              loading={loadingBookings}
              venueEmail={venueEmail}
              onChangeVenueEmail={updateVenueEmail}
              onOpenBooking={handleOpenSavedBooking}
              onUpdateStatus={handleUpdateBookingStatus}
              onDeleteBooking={handleDeleteBooking}
              onEmailBooking={(b) => handleEmailKitchen(b.id, b.details, b.selection)}
            />
          </div>
        )}
      </main>

      {/* ==================== DESKTOP FOOTER ==================== */}
      <footer className="no-print hidden md:block border-t border-slate-200 bg-white mt-14">
        <div className="max-w-[1240px] mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Blue Ginger Bar &amp; Restaurant Limited T/A Blue Zenzer · Company Reg: 05024839 · VAT: 927675188
          </div>
          <div>
            Playgolf Northwick Park · Party Set Menu (£28/adult · £21/child · Min. {MENU_PRICING.minimumGuests} guests)
          </div>
        </div>
      </footer>

      {/* ==================== MOBILE PRICE BREAKDOWN DRAWER (For Details & Form tabs) ==================== */}
      {mobileTrayOpen && activeTab !== 'menu' && (
        <div className="no-print md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileTrayOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto px-5 pt-3 pb-8 pb-safe space-y-4">
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto" />
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  Party Cost Breakdown
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Live total for {pricing.totalGuests} guests
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileTrayOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
                aria-label="Close breakdown"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-700">
                  Adults ({details.adults} × £{MENU_PRICING.adultPerPerson})
                </dt>
                <dd className="tabular-nums font-semibold text-slate-900">
                  £{pricing.adultsTotal.toFixed(2)}
                </dd>
              </div>
              {details.kids > 0 && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-700">
                    Kids 5–10 ({details.kids} × £{MENU_PRICING.childPerPerson})
                  </dt>
                  <dd className="tabular-nums font-semibold text-slate-900">
                    £{pricing.kidsTotal.toFixed(2)}
                  </dd>
                </div>
              )}
              {pricing.extraDishesCount > 0 && (
                <div className="flex justify-between gap-2 text-amber-900">
                  <dt>
                    Extra Dishes ({pricing.extraDishesCount} × £1 × {pricing.totalGuests})
                  </dt>
                  <dd className="tabular-nums font-semibold">
                    £{pricing.extraDishesTotal.toFixed(2)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-slate-700">1 Dessert</dt>
                <dd className="font-semibold text-emerald-700">Included Free</dd>
              </div>
              {pricing.drinksTotal > 0 && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-700">
                    Unlimited Soft Drinks ({pricing.totalGuests} × £3)
                  </dt>
                  <dd className="tabular-nums font-semibold text-slate-900">
                    £{pricing.drinksTotal.toFixed(2)}
                  </dd>
                </div>
              )}
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
              {details.golfIncluded && pricing.golfTotal > 0 && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-700">Golf Package</dt>
                  <dd className="tabular-nums font-semibold text-slate-900">
                    £{pricing.golfTotal.toFixed(2)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-2 pt-2.5 border-t border-slate-200 text-base font-bold text-slate-900">
                <dt>Estimated Total</dt>
                <dd className="tabular-nums text-[#25408F]">£{pricing.grandTotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between gap-2 text-xs text-slate-600">
                <dt>Deposit Paid</dt>
                <dd className="tabular-nums">-£{(Number(details.deposit) || 0).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between gap-2 text-sm font-bold text-slate-900">
                <dt>Balance Left on the Day</dt>
                <dd className="tabular-nums">£{pricing.balanceRemaining.toFixed(2)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => setMobileTrayOpen(false)}
              className="w-full min-h-[48px] rounded-xl bg-[#25408F] text-white text-base font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ==================== E-COMMERCE STICKY BOTTOM PRICING BAR (MOBILE) ==================== */}
      {activeTab !== 'queue' && (
        <div className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-6px_24px_rgba(15,23,42,0.10)] pb-safe">
          <div className="px-4 py-2.5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileTrayOpen(true)}
              className="min-w-0 flex-1 text-left py-0.5 active:opacity-80"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <span>Total</span>
                <span className="text-[#25408F] inline-flex items-center gap-0.5 font-bold">
                  Breakdown
                  <ChevronUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-extrabold tabular-nums text-slate-900 leading-tight">
                £{pricing.grandTotal.toFixed(2)}
              </div>
              <div className="text-[11px] font-medium text-slate-600 truncate tabular-nums">
                {details.adults} adult{details.adults === 1 ? '' : 's'}
                {details.kids > 0 ? ` + ${details.kids} kid${details.kids === 1 ? '' : 's'}` : ''}
                {pricing.extraDishesCount > 0 ? ` · +${pricing.extraDishesCount} extra` : ''}
                {pricing.drinksTotal > 0 ? ' · +Drinks' : ''}
                {details.includeTeaAndCoffee ? ' · +Tea' : ''}
                {' · incl. 10%'}
              </div>
            </button>

            {activeTab === 'menu' && (
              <button
                type="button"
                onClick={() => switchTab('details')}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-[#25408F] text-white text-sm font-bold hover:bg-[#1D3270] active:scale-[0.98] transition-all inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <span>Party Info</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {activeTab === 'details' && (
              <button
                type="button"
                onClick={() => switchTab('form')}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-[#25408F] text-white text-sm font-bold hover:bg-[#1D3270] active:scale-[0.98] transition-all inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <span>Review &amp; Lock</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {activeTab === 'form' && (
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-[#25408F] text-white text-sm font-bold hover:bg-[#1D3270] active:scale-[0.98] transition-all inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Printer className="w-4 h-4" />
                <span>Print / PDF</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
