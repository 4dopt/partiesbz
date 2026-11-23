import React from 'react';
import { MENU_PRICING, TERMS_AND_CONDITIONS } from '../data/menuData';
import { CustomerDetails, MenuSelection } from '../types/booking';
import {
  buildAccompanimentLines,
  calculatePricing,
  formatEventDate,
  formatSlashDate,
  getMenuItem,
  getSelectedDesserts,
} from '../utils/bookingFormatter';

interface BookingFormDocumentProps {
  bookingId?: string | null;
  details: CustomerDetails;
  selection: MenuSelection;
}

function SheetHeader() {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2.5 mb-3.5 print:pb-2 print:mb-2.5">
      <div className="flex items-center">
        <img
          src="/assets/logos/playgolf_logo.png"
          alt="Playgolf Northwick Park"
          className="h-9 sm:h-11 print:h-9 w-auto object-contain"
        />
      </div>

      <div className="flex items-center justify-end">
        <img
          src="/assets/logos/blue_zenzer_sanjay_logo.png"
          alt="Blue Zenzer Bar & Restaurant"
          className="h-11 sm:h-13 print:h-11 w-auto object-contain"
        />
      </div>
    </div>
  );
}

function SheetFooter() {
  return (
    <div className="mt-5 pt-2.5 print:mt-3 print:pt-2 border-t border-slate-200 text-center text-[11px] leading-snug text-slate-800 booking-sheet-font">
      <div>Blue Ginger Bar &amp; Restaurant Limited T/A Blue Zenzer</div>
      <div>Company Registration No: 05024839 VAT No: 927675188</div>
    </div>
  );
}

export const BookingFormDocument: React.FC<BookingFormDocumentProps> = ({
  bookingId,
  details,
  selection,
}) => {
  const pricing = calculatePricing(details, selection);

  const starters = selection.starters
    .map((id) => getMenuItem(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const mains = selection.mains
    .map((id) => getMenuItem(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const desserts = getSelectedDesserts(selection)
    .map((id) => getMenuItem(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const drinks = selection.drinks
    .map((id) => getMenuItem(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const accompaniments = buildAccompanimentLines(details, selection);

  const notesLines = details.notes
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const specialReqLines = details.specialRequests
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="print-only-container space-y-6 sm:space-y-8 print:space-y-0">
      {/* ==================== PAGE 1 ==================== */}
      <section className="print-page bg-white border border-slate-300 shadow-sm mx-auto max-w-[820px] p-4 sm:p-8 md:p-10 print:p-0 print:border-none overflow-hidden">
        <SheetHeader />

        <div className="text-center mb-4 print:mb-3 booking-sheet-heading">
          <h2 className="text-[17px] sm:text-[20px] print:text-[18px] font-bold tracking-wide text-[#2B6CB0] uppercase">
            BLUE ZENZER
          </h2>
          <h3 className="text-[15px] sm:text-[18px] print:text-[16px] font-bold tracking-wide text-[#2B6CB0] uppercase">
            PARTY &amp; EVENT BOOKING FORM
          </h3>
          {bookingId && (
            <div className="text-[11px] tabular-nums text-slate-500 mt-0.5">
              Ref: {bookingId}
            </div>
          )}
        </div>

        {/* Customer Details */}
        <div className="mb-4 print:mb-3">
          <div className="text-[13px] font-semibold text-[#2B6CB0] mb-1 booking-sheet-heading">
            Customer Details
          </div>
          <table className="w-full table-fixed border-collapse border border-black text-[12px] sm:text-[13.5px] print:text-[12px] booking-sheet-font break-words">
            <tbody>
              <tr>
                <td className="border border-black px-2 sm:px-2.5 py-1.5 print:py-1 font-bold w-1/2">
                  Name: {details.name || 'TBD'}
                </td>
                <td className="border border-black px-2 sm:px-2.5 py-1.5 print:py-1 font-bold w-1/2">
                  Date of Event: {formatEventDate(details.eventDate)}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 sm:px-2.5 py-1.5 print:py-1 font-bold">
                  Time: {details.eventTime || 'TBD'}
                </td>
                <td className="border border-black px-2 sm:px-2.5 py-1.5 print:py-1 font-bold tabular-nums">
                  Adults / Kids: {details.adults} Adults / {details.kids} Kids
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 sm:px-2.5 py-1.5 print:py-1 font-bold">
                  Area: {details.area || 'TBD'}
                </td>
                <td className="border border-black px-2 sm:px-2.5 py-1.5 print:py-1 font-bold tabular-nums">
                  Deposit: £{Number(details.deposit) || 0}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 sm:px-2.5 py-1.5 print:py-1 font-bold">
                  Drinks Package: {details.drinksPackage}
                </td>
                <td className="border border-black px-2 sm:px-2.5 py-1.5 print:py-1 font-bold">
                  Service: {details.serviceStyle}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 sm:px-2.5 py-1.5 print:py-1 font-bold">
                  Golf: {details.golfIncluded ? 'Included' : 'Not Included'}
                </td>
                <td className="border border-black px-2 sm:px-2.5 py-1.5 print:py-1 font-bold">
                  {details.phone || details.email ? `${details.phone || details.email}` : '\u00A0'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Starters */}
        <div className="mb-4 print:mb-3">
          <div className="text-[13px] font-semibold text-[#2B6CB0] mb-1 booking-sheet-heading">
            Starters{pricing.extraStartersCount > 0 ? ` (${starters.length} Selected — +£${pricing.extraStartersCount}/person extra)` : ''}
          </div>
          <table className="w-full border-collapse border border-black text-[12px] sm:text-[13.5px] print:text-[12px] booking-sheet-font text-center">
            <tbody>
              {details.startersTime.trim() && (
                <tr>
                  <td className="border border-black px-3 py-1.5 print:py-1 font-bold">
                    Starters @ {details.startersTime.trim()}
                  </td>
                </tr>
              )}
              {starters.length > 0 ? (
                starters.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="border border-black px-3 py-1.5 print:py-1 font-bold">
                      {item.kitchenLabel}
                      {idx >= MENU_PRICING.requiredStarters ? ' (Extra +£1/pp)' : ''}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-black px-3 py-1.5 text-slate-400 italic">
                    No starters selected yet (Select 4 starters)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mains */}
        <div className="mb-4 print:mb-3">
          <div className="text-[13px] font-semibold text-[#2B6CB0] mb-1 booking-sheet-heading">
            Mains{pricing.extraMainsCount > 0 ? ` (${mains.length} Selected — +£${pricing.extraMainsCount}/person extra)` : ''}
          </div>
          <table className="w-full border-collapse border border-black text-[12px] sm:text-[13.5px] print:text-[12px] booking-sheet-font text-center">
            <tbody>
              {mains.length > 0 ? (
                mains.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="border border-black px-3 py-1.5 print:py-1 font-bold">
                      {item.kitchenLabel}
                      {idx >= MENU_PRICING.requiredMains ? ' (Extra +£1/pp)' : ''}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-black px-3 py-1.5 text-slate-400 italic">
                    No mains selected yet (Select 4 mains)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Accompaniments / Sides */}
        <div className="mb-3 print:mb-2">
          <div className="text-[13px] font-semibold text-[#2B6CB0] mb-1 booking-sheet-heading">
            Accompaniments / Sides
          </div>
          <table className="w-full border-collapse border border-black text-[12px] sm:text-[13.5px] print:text-[12px] booking-sheet-font text-center">
            <tbody>
              {accompaniments.length > 0 ? (
                accompaniments.map((line, i) => (
                  <tr key={`${line}-${i}`}>
                    <td className="border border-black px-3 py-1.5 print:py-1 font-bold">{line}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-black px-3 py-1.5 font-bold">NA</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <SheetFooter />
      </section>

      {/* ==================== PAGE 2 ==================== */}
      <section className="print-page bg-white border border-slate-300 shadow-sm mx-auto max-w-[820px] p-4 sm:p-8 md:p-10 print:p-0 print:border-none overflow-hidden">
        <SheetHeader />

        {/* Desserts */}
        <div className="mb-3.5 print:mb-2">
          <div className="text-[13px] font-semibold text-[#2B6CB0] mb-0.5 text-center booking-sheet-heading">
            Desserts (2 Included)
          </div>
          <table className="w-full border-collapse border border-black text-[12px] sm:text-[13.5px] print:text-[11.5px] booking-sheet-font text-center">
            <tbody>
              {desserts.length > 0 ? (
                desserts.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-black px-3 py-1.5 print:py-1 font-bold">
                      {item.kitchenLabel}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-black px-3 py-1.5 print:py-1 text-slate-400 italic">
                    None selected (Select 2 desserts)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Drinks & Tea/Coffee */}
        <div className="mb-3.5 print:mb-2">
          <div className="text-[13px] font-semibold text-[#2B6CB0] mb-0.5 text-center booking-sheet-heading">
            Drinks
          </div>
          <table className="w-full border-collapse border border-black text-[12px] sm:text-[13.5px] print:text-[11.5px] booking-sheet-font text-center">
            <tbody>
              {details.drinksPackage === 'Not Included' ? (
                <tr>
                  <td className="border border-black px-3 py-1.5 print:py-1 font-bold">
                    Soft Drinks: Not Included (Pay as you go)
                  </td>
                </tr>
              ) : drinks.length > 0 ? (
                drinks.map((drink) => (
                  <tr key={drink.id}>
                    <td className="border border-black px-3 py-1.5 print:py-1 font-bold">
                      {drink.kitchenLabel}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-black px-3 py-1.5 print:py-1 font-bold">
                    Package Included — Soft Drinks To Be Confirmed
                  </td>
                </tr>
              )}
              {details.includeTeaAndCoffee && (
                <tr>
                  <td className="border border-black px-3 py-1.5 print:py-1 font-bold">
                    Tea &amp; Coffee (+£2/person)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Food Allergies / Dietary Requirements */}
        <div className="mb-3.5 print:mb-2">
          <div className="text-[13px] font-semibold text-[#2B6CB0] mb-0.5 text-center booking-sheet-heading">
            Food Allergies / Dietary Requirements
          </div>
          <table className="w-full border-collapse border border-black text-[12px] sm:text-[13.5px] print:text-[11.5px] booking-sheet-font text-center">
            <tbody>
              <tr>
                <td className="border border-black px-3 py-1.5 print:py-1 font-bold">
                  {details.allergies.trim() || 'NA'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Special Requests */}
        <div className="mb-3.5 print:mb-2">
          <div className="text-[13px] font-semibold text-[#2B6CB0] mb-0.5 text-center booking-sheet-heading">
            Special Requests
          </div>
          <table className="w-full border-collapse border border-black text-[12px] sm:text-[13.5px] print:text-[11.5px] booking-sheet-font text-center">
            <tbody>
              {specialReqLines.length > 0 ? (
                specialReqLines.map((line, i) => (
                  <tr key={i}>
                    <td className="border border-black px-3 py-1.5 print:py-1 font-bold">{line}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-black px-3 py-1.5 print:py-1 font-bold">NA</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Notes & Set Up Details Side-by-Side on Print to fit comfortably without blank overflow */}
        <div className="mb-3.5 print:mb-2 grid grid-cols-1 sm:grid-cols-2 gap-3 print:gap-2">
          <div>
            <div className="text-[13px] font-semibold text-[#2B6CB0] mb-0.5 text-center booking-sheet-heading">
              Notes
            </div>
            <table className="w-full border-collapse border border-black text-[12px] sm:text-[13px] print:text-[11.5px] booking-sheet-font text-center">
              <tbody>
                {notesLines.length > 0 ? (
                  notesLines.map((line, i) => (
                    <tr key={i}>
                      <td className="border border-black px-2.5 py-1.5 print:py-1 font-bold">{line}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border border-black px-2.5 py-1.5 print:py-1 font-bold">NA</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div>
            <div className="text-[13px] font-semibold text-[#2B6CB0] mb-0.5 text-center booking-sheet-heading">
              Set Up Details
            </div>
            <table className="w-full border-collapse border border-black text-[12px] sm:text-[13px] print:text-[11.5px] booking-sheet-font text-center">
              <tbody>
                <tr>
                  <td className="border border-black px-2.5 py-1.5 print:py-1 font-bold">
                    {details.setupDetails.trim() || 'NA'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mb-3.5 print:mb-2">
          <div className="text-[13px] font-semibold text-[#2B6CB0] mb-0.5 booking-sheet-heading">
            Payment Summary
          </div>
          <table className="w-full table-fixed border-collapse border border-black text-[12px] sm:text-[13px] print:text-[11.5px] booking-sheet-font break-words">
            <tbody>
              <tr>
                <td className="border border-black px-2.5 py-1 print:py-0.5 w-1/2">Adults</td>
                <td className="border border-black px-2.5 py-1 print:py-0.5 w-1/2 tabular-nums">
                  {details.adults} (× £{MENU_PRICING.adultPerPerson} = £{pricing.adultsTotal.toFixed(2)})
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2.5 py-1 print:py-0.5">Kids</td>
                <td className="border border-black px-2.5 py-1 print:py-0.5 tabular-nums">
                  {details.kids} (× £{MENU_PRICING.childPerPerson} = £{pricing.kidsTotal.toFixed(2)})
                </td>
              </tr>
              {pricing.extraDishesCount > 0 && (
                <tr>
                  <td className="border border-black px-2.5 py-1 print:py-0.5">
                    Extra Dishes (+£1/person each)
                  </td>
                  <td className="border border-black px-2.5 py-1 print:py-0.5 tabular-nums">
                    {pricing.extraDishesCount} extra × {pricing.totalGuests} guests = £{pricing.extraDishesTotal.toFixed(2)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="border border-black px-2.5 py-1 print:py-0.5">
                  Soft Drinks ({details.drinksPackage === 'Included' ? '+£3/pp' : details.drinksPackage})
                </td>
                <td className="border border-black px-2.5 py-1 print:py-0.5 tabular-nums">
                  {details.drinksPackage}
                  {pricing.drinksTotal > 0 ? ` (£${pricing.drinksTotal.toFixed(2)})` : ''}
                </td>
              </tr>
              {details.includeTeaAndCoffee && (
                <tr>
                  <td className="border border-black px-2.5 py-1 print:py-0.5">
                    Tea &amp; Coffee (+£2/person)
                  </td>
                  <td className="border border-black px-2.5 py-1 print:py-0.5 tabular-nums">
                    {pricing.totalGuests} × £{MENU_PRICING.teaAndCoffeePerPerson} = £{pricing.teaAndCoffeeTotal.toFixed(2)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="border border-black px-2.5 py-1 print:py-0.5">Service Charge</td>
                <td className="border border-black px-2.5 py-1 print:py-0.5 tabular-nums">
                  10% On the Bill (£{pricing.serviceCharge.toFixed(2)})
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2.5 py-1 print:py-0.5">Golf</td>
                <td className="border border-black px-2.5 py-1 print:py-0.5 tabular-nums">
                  {details.golfIncluded ? `£${pricing.golfTotal.toFixed(2)}` : 'NA'}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2.5 py-1 print:py-0.5">Deposit Paid</td>
                <td className="border border-black px-2.5 py-1 print:py-0.5 tabular-nums">
                  £{(Number(details.deposit) || 0).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2.5 py-1 print:py-0.5 font-bold">
                  Estimated Total / Balance
                </td>
                <td className="border border-black px-2.5 py-1 print:py-0.5 font-bold tabular-nums">
                  £{pricing.grandTotal.toFixed(2)} (Balance: £{pricing.balanceRemaining.toFixed(2)})
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2.5 py-1 print:py-0.5">Event Date</td>
                <td className="border border-black px-2.5 py-1 print:py-0.5">
                  {formatSlashDate(details.eventDate)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Consent & Agreement + Staff Use (merged cleanly onto Page 2 — zero blank Page 3!) */}
        <div className="mb-3 print:mb-1.5">
          <div className="text-[13px] font-semibold text-[#2B6CB0] mb-1.5 print:mb-1 booking-sheet-heading">
            Consent &amp; Agreement
          </div>
          <div className="space-y-1 text-[12px] print:text-[11px] booking-sheet-font mb-2.5 print:mb-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black text-[10px] leading-none">
                {details.consentTerms ? '✓' : ''}
              </span>
              <span>I have read and agree to the Terms &amp; Conditions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black text-[10px] leading-none">
                {details.consentContact ? '✓' : ''}
              </span>
              <span>I consent to Blue Zenzer contacting me regarding my booking</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black text-[10px] leading-none">
                {details.consentMarketing ? '✓' : ''}
              </span>
              <span>I would like to receive marketing offers and updates</span>
            </div>
          </div>

          <table className="w-full table-fixed border-collapse border border-black text-[12px] print:text-[11.5px] booking-sheet-font break-words">
            <tbody>
              <tr>
                <td className="border border-black px-2.5 py-1.5 print:py-1 w-1/2">
                  Customer Name: <span className="font-bold">{details.name || ''}</span>
                </td>
                <td className="border border-black px-2.5 py-1.5 print:py-1 w-1/2">
                  Signature:{' '}
                  <span className="italic font-semibold">
                    {details.signatureName || (details.consentTerms ? details.name : '')}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2.5 py-1.5 print:py-1 text-slate-600">
                  Date Received:
                </td>
                <td className="border border-black px-2.5 py-1.5 print:py-1 text-slate-600">
                  Staff Use / Kitchen Sign-off:
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <SheetFooter />
      </section>

      {/* ==================== PAGE 3 (TERMS & CONDITIONS) ==================== */}
      <section className="print-page-flow bg-white border border-slate-300 shadow-sm mx-auto max-w-[820px] p-4 sm:p-8 md:p-10 print:p-0 print:border-none overflow-hidden">
        <SheetHeader />

        <div className="text-[14px] font-semibold text-[#2B6CB0] mb-3 booking-sheet-heading">
          Cancellation Terms &amp; Conditions
        </div>

        <div className="space-y-2.5 print:space-y-2 text-[12px] print:text-[11px] leading-relaxed print:leading-snug booking-sheet-font text-slate-900">
          {TERMS_AND_CONDITIONS.map((clause) => (
            <div key={clause.title}>
              <div className="font-semibold">{clause.title}</div>
              <div>{clause.body}</div>
            </div>
          ))}
        </div>

        <SheetFooter />
      </section>
    </div>
  );
};
