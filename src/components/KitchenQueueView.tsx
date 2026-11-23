import React from 'react';
import { Printer, Trash2, FileText, Mail } from 'lucide-react';
import { BookingStatus, SavedBooking } from '../types/booking';
import { formatEventDate } from '../utils/bookingFormatter';

interface KitchenQueueViewProps {
  bookings: SavedBooking[];
  loading: boolean;
  venueEmail: string;
  onChangeVenueEmail: (email: string) => void;
  onOpenBooking: (booking: SavedBooking, autoPrint?: boolean) => void;
  onUpdateStatus: (id: string, status: BookingStatus) => void;
  onDeleteBooking: (id: string) => void;
  onEmailBooking: (booking: SavedBooking) => void;
}

const STATUS_OPTIONS: BookingStatus[] = ['Locked & Submitted', 'In Kitchen Prep', 'Completed'];

export const KitchenQueueView: React.FC<KitchenQueueViewProps> = ({
  bookings,
  loading,
  venueEmail,
  onChangeVenueEmail,
  onOpenBooking,
  onUpdateStatus,
  onDeleteBooking,
  onEmailBooking,
}) => {
  return (
    <div className="space-y-6">
      {/* Venue / Kitchen Email Configuration */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Venue &amp; Kitchen Recipient Email
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            When customers submit their locked-in menu or you dispatch a booking to the kitchen, emails open pre-addressed to this address.
          </p>
        </div>
        <div className="w-full md:w-auto shrink-0">
          <input
            type="email"
            value={venueEmail}
            onChange={(e) => onChangeVenueEmail(e.target.value)}
            placeholder="kitchen@bluezenzer.co.uk"
            className="w-full md:w-64 min-h-[44px] px-3.5 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#25408F]"
          />
        </div>
      </div>

      {/* Saved Bookings */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              Locked-In Party Bookings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} saved for kitchen preparation
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading locked-in party bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-2">
            <div className="text-sm font-medium text-slate-800">No locked-in bookings yet</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Once a customer selects their 4 starters, 4 mains, and 2 desserts and clicks &quot;Lock In &amp; Submit Menu&quot;, their formatted booking sheet appears here ready to print or email to the kitchen.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-slate-200">
              {bookings.map((b) => (
                <div key={b.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-slate-900 truncate">
                        {b.details.name}
                      </div>
                      <div className="text-xs font-mono-tabular text-slate-500 mt-0.5">
                        {b.id}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteBooking(b.id)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 -mr-2 -mt-2"
                      title="Delete booking"
                      aria-label={`Delete booking ${b.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="font-medium text-slate-800">
                      {formatEventDate(b.details.eventDate)} · Arrival {b.details.eventTime || 'TBD'}
                    </div>
                    <div className="tabular-nums">
                      {b.details.adults} Adults / {b.details.kids} Kids · {b.details.area || 'Main'} ·{' '}
                      {b.details.serviceStyle}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Kitchen Status
                    </label>
                    <select
                      value={b.status}
                      onChange={(e) => onUpdateStatus(b.id, e.target.value as BookingStatus)}
                      className="w-full min-h-[44px] px-3 py-2 text-base sm:text-sm font-medium border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#25408F]"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenBooking(b, false)}
                      className="min-h-[44px] px-2 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenBooking(b, true)}
                      className="min-h-[44px] px-2 py-2 text-xs font-semibold text-[#25408F] border border-[#25408F]/30 bg-[#EEF2FB]/50 rounded-lg flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={() => onEmailBooking(b)}
                      className="min-h-[44px] px-2 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Booking Ref</th>
                    <th className="px-5 py-3">Party / Host</th>
                    <th className="px-5 py-3">Event Date &amp; Time</th>
                    <th className="px-5 py-3">Guests &amp; Area</th>
                    <th className="px-5 py-3">Kitchen Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-mono-tabular text-xs font-medium text-slate-700 whitespace-nowrap">
                        {b.id}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{b.details.name}</div>
                        {b.details.email && (
                          <div className="text-xs text-slate-500">{b.details.email}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="text-slate-900">{formatEventDate(b.details.eventDate)}</div>
                        <div className="text-xs text-slate-500 font-mono-tabular">
                          Arrival: {b.details.eventTime || 'TBD'} · Starters @{' '}
                          {b.details.startersTime || 'TBD'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 tabular-nums whitespace-nowrap">
                        <div className="text-slate-900">
                          {b.details.adults} Adults / {b.details.kids} Kids
                        </div>
                        <div className="text-xs text-slate-500">
                          {b.details.area || 'Main'} · {b.details.serviceStyle}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <select
                          value={b.status}
                          onChange={(e) =>
                            onUpdateStatus(b.id, e.target.value as BookingStatus)
                          }
                          className="px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:border-[#25408F]"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenBooking(b, false)}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-100 inline-flex items-center gap-1"
                            title="Open Booking Form"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenBooking(b, true)}
                            className="px-2.5 py-1.5 text-xs font-medium text-[#25408F] border border-[#25408F]/30 rounded-md hover:bg-[#EEF2FB] inline-flex items-center gap-1"
                            title="Print Kitchen Sheet"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print
                          </button>
                          <button
                            type="button"
                            onClick={() => onEmailBooking(b)}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-100 inline-flex items-center gap-1"
                            title="Email to Kitchen"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteBooking(b.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                            title="Delete booking"
                            aria-label={`Delete booking ${b.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
