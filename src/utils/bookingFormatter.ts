import { MENU_ITEMS, MENU_PRICING } from '../data/menuData';
import { CustomerDetails, MenuSelection, MenuItem } from '../types/booking';

const ITEM_MAP = new Map<string, MenuItem>(MENU_ITEMS.map((item) => [item.id, item]));

export function getMenuItem(id: string | null): MenuItem | undefined {
  if (!id) return undefined;
  return ITEM_MAP.get(id);
}

export function getSelectedDesserts(selection?: MenuSelection): string[] {
  if (!selection) return [];
  if (Array.isArray(selection.desserts)) return selection.desserts;
  return selection.dessert ? [selection.dessert] : [];
}

export function formatEventDate(isoDate: string): string {
  if (!isoDate) return 'TBD';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const [year, month, day] = parts;
  const dateObj = new Date(year, month - 1, day);
  const weekday = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
  return `${day}.${month}.${year} (${weekday})`;
}

export function formatSlashDate(isoDate: string): string {
  if (!isoDate) return 'TBD';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const [year, month, day] = parts;
  const dateObj = new Date(year, month - 1, day);
  const weekday = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${dd}/${mm}/${year} (${weekday})`;
}

export interface PriceBreakdown {
  totalGuests: number;
  adultsTotal: number;
  kidsTotal: number;
  extraStartersCount: number;
  extraMainsCount: number;
  extraDessertsCount: number;
  extraDishesCount: number;
  extraDishesPerPerson: number;
  extraDishesTotal: number;
  drinksPerPerson: number;
  drinksTotal: number;
  teaAndCoffeePerPerson: number;
  teaAndCoffeeTotal: number;
  golfTotal: number;
  foodAndDrinksSubtotal: number;
  serviceCharge: number;
  grandTotal: number;
  balanceRemaining: number;
  belowMinimumGuests: boolean;
}

export function calculatePricing(
  details: CustomerDetails,
  selection?: MenuSelection
): PriceBreakdown {
  const adults = Math.max(0, Number(details.adults) || 0);
  const kids = Math.max(0, Number(details.kids) || 0);
  const totalGuests = adults + kids;

  const adultsTotal = adults * MENU_PRICING.adultPerPerson;
  const kidsTotal = kids * MENU_PRICING.childPerPerson;

  const extraStartersCount = selection
    ? Math.max(0, selection.starters.length - MENU_PRICING.requiredStarters)
    : 0;
  const extraMainsCount = selection
    ? Math.max(0, selection.mains.length - MENU_PRICING.requiredMains)
    : 0;
  const selectedDesserts = getSelectedDesserts(selection);
  const extraDessertsCount = Math.max(0, selectedDesserts.length - MENU_PRICING.requiredDesserts);
  const extraDishesCount = extraStartersCount + extraMainsCount + extraDessertsCount;
  const extraDishesPerPerson = extraDishesCount * MENU_PRICING.extraDishPerPerson;
  const extraDishesTotal = totalGuests * extraDishesPerPerson;

  const drinksPerPerson =
    details.drinksPackage === 'Included' ? MENU_PRICING.unlimitedSoftDrinksPerPerson : 0;
  const drinksTotal = totalGuests * drinksPerPerson;
  const teaAndCoffeePerPerson = details.includeTeaAndCoffee
    ? MENU_PRICING.teaAndCoffeePerPerson
    : 0;
  const teaAndCoffeeTotal = totalGuests * teaAndCoffeePerPerson;
  const golfTotal = details.golfIncluded ? Math.max(0, Number(details.golfCost) || 0) : 0;

  const foodAndDrinksSubtotal =
    adultsTotal + kidsTotal + extraDishesTotal + drinksTotal + teaAndCoffeeTotal;
  const serviceCharge = Number(
    ((foodAndDrinksSubtotal * MENU_PRICING.serviceChargePercent) / 100).toFixed(2)
  );
  const grandTotal = Number((foodAndDrinksSubtotal + serviceCharge + golfTotal).toFixed(2));
  const deposit = Math.max(0, Number(details.deposit) || 0);
  const balanceRemaining = Number(Math.max(0, grandTotal - deposit).toFixed(2));

  return {
    totalGuests,
    adultsTotal,
    kidsTotal,
    extraStartersCount,
    extraMainsCount,
    extraDessertsCount,
    extraDishesCount,
    extraDishesPerPerson,
    extraDishesTotal,
    drinksPerPerson,
    drinksTotal,
    teaAndCoffeePerPerson,
    teaAndCoffeeTotal,
    golfTotal,
    foodAndDrinksSubtotal,
    serviceCharge,
    grandTotal,
    balanceRemaining,
    belowMinimumGuests: totalGuests < MENU_PRICING.minimumGuests,
  };
}

export function buildAccompanimentLines(
  details: CustomerDetails,
  selection: MenuSelection
): string[] {
  const lines: string[] = [];
  if (details.extraAccompanimentDal && details.extraAccompanimentDal !== 'None') {
    lines.push(details.extraAccompanimentDal);
  }
  const riceItem = getMenuItem(selection.rice);
  if (riceItem) {
    lines.push(riceItem.kitchenLabel);
  }
  const sideItem = getMenuItem(selection.side);
  if (sideItem) {
    lines.push(sideItem.kitchenLabel);
  }
  if (details.includeFixedIndianAccompaniments) {
    lines.push('Mix Naan');
    lines.push('Poppadums / Chutneys / Salad / Raita');
  }
  return lines;
}

export function generatePlainTextBookingEmail(
  bookingId: string | null,
  details: CustomerDetails,
  selection: MenuSelection,
  shareUrl?: string
): { subject: string; body: string } {
  const pricing = calculatePricing(details, selection);
  const starters = selection.starters
    .map((id) => getMenuItem(id)?.kitchenLabel)
    .filter(Boolean) as string[];
  const mains = selection.mains
    .map((id) => getMenuItem(id)?.kitchenLabel)
    .filter(Boolean) as string[];
  const desserts = getSelectedDesserts(selection)
    .map((id) => getMenuItem(id)?.kitchenLabel)
    .filter(Boolean) as string[];
  const accompaniments = buildAccompanimentLines(details, selection);
  const drinks = selection.drinks
    .map((id) => getMenuItem(id)?.kitchenLabel)
    .filter(Boolean) as string[];

  const dateFormatted = formatEventDate(details.eventDate);
  const subject = `BLUE ZENZER PARTY BOOKING — ${details.name || 'Party'} (${dateFormatted})${
    bookingId ? ` [${bookingId}]` : ''
  }`;

  const lines = [
    'BLUE ZENZER — PARTY & EVENT BOOKING FORM',
    '==========================================',
    ...(bookingId ? [`Booking Reference: ${bookingId}`] : []),
    ...(shareUrl ? [`Direct Printable Link: ${shareUrl}`] : []),
    '',
    'CUSTOMER DETAILS',
    `Name: ${details.name || 'TBD'}`,
    `Email: ${details.email || 'NA'} | Phone: ${details.phone || 'NA'}`,
    `Date of Event: ${dateFormatted}`,
    `Time: ${details.eventTime || 'TBD'}`,
    `Adults / Kids: ${details.adults} Adults / ${details.kids} Kids`,
    `Area: ${details.area || 'TBD'}`,
    `Deposit: £${details.deposit || 0}`,
    `Drinks Package: ${details.drinksPackage}`,
    `Tea & Coffee: ${details.includeTeaAndCoffee ? 'Included (+£2/pp)' : 'No'}`,
    `Service: ${details.serviceStyle}`,
    `Golf: ${details.golfIncluded ? `Included (£${details.golfCost || 0})` : 'Not Included'}`,
    '',
    'STARTERS',
    ...(details.startersTime ? [`Starters @ ${details.startersTime}`] : []),
    ...(starters.length ? starters : ['None selected']),
    '',
    'MAINS',
    ...(mains.length ? mains : ['None selected']),
    '',
    'ACCOMPANIMENTS / SIDES',
    ...(accompaniments.length ? accompaniments : ['NA']),
    '',
    'DESSERTS (2 INCLUDED)',
    ...(desserts.length ? desserts : ['None selected']),
    '',
    'DRINKS',
    ...(details.drinksPackage === 'Not Included'
      ? ['Not Included']
      : drinks.length
      ? drinks
      : ['To be confirmed']),
    ...(details.includeTeaAndCoffee ? ['Tea & Coffee (+£2/person)'] : []),
    '',
    'FOOD ALLERGIES / DIETARY REQUIREMENTS',
    details.allergies.trim() || 'NA',
    '',
    'SPECIAL REQUESTS',
    details.specialRequests.trim() || 'NA',
    '',
    'NOTES',
    details.notes.trim() || 'NA',
    '',
    'SET UP DETAILS',
    details.setupDetails.trim() || 'NA',
    '',
    'PAYMENT SUMMARY',
    `Adults: ${details.adults} × £${MENU_PRICING.adultPerPerson} = £${pricing.adultsTotal.toFixed(2)}`,
    `Kids (5-10 yrs): ${details.kids} × £${MENU_PRICING.childPerPerson} = £${pricing.kidsTotal.toFixed(2)}`,
    ...(pricing.extraDishesCount > 0
      ? [
          `Extra Dishes (5th Starter/Main @ +£1/person each): ${pricing.extraDishesCount} extra × ${pricing.totalGuests} guests = £${pricing.extraDishesTotal.toFixed(2)}`,
        ]
      : []),
    `Drinks Package: ${details.drinksPackage}${
      pricing.drinksTotal > 0 ? ` (+£3/pp = £${pricing.drinksTotal.toFixed(2)})` : ''
    }`,
    `Tea & Coffee: ${
      details.includeTeaAndCoffee
        ? `Included (+£2/pp = £${pricing.teaAndCoffeeTotal.toFixed(2)})`
        : 'Not Added'
    }`,
    `Service Charge: 10% On the Bill (£${pricing.serviceCharge.toFixed(2)})`,
    `Golf: ${details.golfIncluded ? `£${pricing.golfTotal.toFixed(2)}` : 'NA'}`,
    `Deposit Paid: £${(Number(details.deposit) || 0).toFixed(2)}`,
    `Estimated Total: £${pricing.grandTotal.toFixed(2)}`,
    `Event Date: ${formatSlashDate(details.eventDate)}`,
    '',
    'CONSENT & AGREEMENT',
    `[${details.consentTerms ? 'x' : ' '}] Agreed to Terms & Conditions`,
    `[${details.consentContact ? 'x' : ' '}] Consented to booking contact`,
    `[${details.consentMarketing ? 'x' : ' '}] Marketing updates`,
    `Signed: ${details.signatureName || details.name || 'Pending'}`,
    '',
    'Blue Ginger Bar & Restaurant Limited T/A Blue Zenzer',
    'Company Registration No: 05024839 | VAT No: 927675188',
  ];

  return { subject, body: lines.join('\n') };
}
