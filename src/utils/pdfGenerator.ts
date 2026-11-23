import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { MENU_PRICING, TERMS_AND_CONDITIONS } from '../data/menuData';
import { CustomerDetails, MenuSelection } from '../types/booking';
import {
  buildAccompanimentLines,
  calculatePricing,
  formatEventDate,
  formatSlashDate,
  getMenuItem,
  getSelectedDesserts,
} from './bookingFormatter';

interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

type JsPdfWithTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

const BRAND_BLUE: [number, number, number] = [43, 108, 176]; // #2B6CB0 matching BookingFormDocument
const DARK_TEXT: [number, number, number] = [15, 23, 42];
const MUTED_TEXT: [number, number, number] = [100, 116, 139];
const BORDER_COLOR: [number, number, number] = [15, 15, 15];

function sanitizePdfText(text: string): string {
  return text
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ');
}

async function loadLogoImage(src: string): Promise<LoadedImage | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
    };
  } catch {
    return null;
  }
}

function drawHeader(
  doc: JsPdfWithTable,
  leftLogo: LoadedImage | null,
  rightLogo: LoadedImage | null,
  marginX: number,
  pageWidth: number
): number {
  const topY = 9;
  const targetH = 11;

  if (leftLogo) {
    const w = (leftLogo.width / leftLogo.height) * targetH;
    doc.addImage(leftLogo.dataUrl, 'PNG', marginX, topY, Math.min(w, 55), targetH);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_BLUE);
    doc.text('PLAYGOLF NORTHWICK PARK', marginX, topY + 7);
  }

  if (rightLogo) {
    const logoH = 12.5;
    const w = Math.min((rightLogo.width / rightLogo.height) * logoH, 58);
    doc.addImage(rightLogo.dataUrl, 'PNG', pageWidth - marginX - w, topY - 0.5, w, logoH);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_BLUE);
    doc.text('BLUE ZENZER', pageWidth - marginX, topY + 7, { align: 'right' });
  }

  const lineY = topY + 14.5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(marginX, lineY, pageWidth - marginX, lineY);
  return lineY + 4;
}

function drawFooterOnAllPages(doc: JsPdfWithTable, marginX: number, pageWidth: number, pageHeight: number) {
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const footerLineY = pageHeight - 13;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerLineY, pageWidth - marginX, footerLineY);

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Blue Ginger Bar & Restaurant Limited T/A Blue Zenzer', pageWidth / 2, footerLineY + 4, {
      align: 'center',
    });
    doc.text('Company Registration No: 05024839 VAT No: 927675188', pageWidth / 2, footerLineY + 8, {
      align: 'center',
    });
  }
}

function drawSectionLabel(
  doc: JsPdfWithTable,
  label: string,
  x: number,
  y: number,
  centered = false,
  pageWidth = 210
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND_BLUE);
  if (centered) {
    doc.text(sanitizePdfText(label), pageWidth / 2, y, { align: 'center' });
  } else {
    doc.text(sanitizePdfText(label), x, y);
  }
  return y + 1.8;
}

function runTable(doc: JsPdfWithTable, options: UserOptions): number {
  autoTable(doc, {
    theme: 'grid',
    margin: { left: 12, right: 12, bottom: 18 },
    styles: {
      font: 'times',
      fontSize: 9.2,
      textColor: DARK_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.25,
      cellPadding: { top: 1.8, right: 2.5, bottom: 1.8, left: 2.5 },
      valign: 'middle',
    },
    ...options,
  });
  return doc.lastAutoTable?.finalY ?? 40;
}

function buildSafeFilename(bookingId: string | null, details: CustomerDetails): string {
  const nameSlug = (details.name || 'Party')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'Party';
  const datePart = details.eventDate || new Date().toISOString().slice(0, 10);
  const idPart = bookingId ? `-${bookingId}` : '';
  return `Blue-Zenzer-Booking-${nameSlug}-${datePart}${idPart}.pdf`;
}

export async function downloadBookingPdf(
  bookingId: string | null,
  details: CustomerDetails,
  selection: MenuSelection
): Promise<string> {
  const [leftLogo, rightLogo] = await Promise.all([
    loadLogoImage('/assets/logos/playgolf_logo.png'),
    loadLogoImage('/assets/logos/blue_zenzer_sanjay_logo.png'),
  ]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  }) as JsPdfWithTable;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2;

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

  // ==================== PAGE 1 ====================
  let y = drawHeader(doc, leftLogo, rightLogo, marginX, pageWidth);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(...BRAND_BLUE);
  doc.text('BLUE ZENZER', pageWidth / 2, y + 2, { align: 'center' });
  doc.setFontSize(12);
  doc.text('PARTY & EVENT BOOKING FORM', pageWidth / 2, y + 7.2, { align: 'center' });
  y += 10.5;

  if (bookingId) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED_TEXT);
    doc.text(`Ref: ${bookingId}`, pageWidth / 2, y, { align: 'center' });
    y += 4;
  } else {
    y += 1.5;
  }

  // Customer Details Table
  y = drawSectionLabel(doc, 'Customer Details', marginX, y);
  y = runTable(doc, {
    startY: y,
    tableWidth: contentWidth,
    styles: {
      font: 'times',
      fontStyle: 'bold',
      fontSize: 9.3,
      textColor: DARK_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.25,
      cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 },
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 },
    },
    body: [
      [
        `Name: ${sanitizePdfText(details.name || 'TBD')}`,
        `Date of Event: ${sanitizePdfText(formatEventDate(details.eventDate))}`,
      ],
      [
        `Time: ${sanitizePdfText(details.eventTime || 'TBD')}`,
        `Adults / Kids: ${details.adults} Adults / ${details.kids} Kids`,
      ],
      [
        `Area: ${sanitizePdfText(details.area || 'TBD')}`,
        `Deposit: £${Number(details.deposit) || 0}`,
      ],
      [
        `Drinks Package: ${sanitizePdfText(details.drinksPackage)}`,
        `Service: ${sanitizePdfText(details.serviceStyle)}`,
      ],
      [
        `Golf: ${details.golfIncluded ? 'Included' : 'Not Included'}`,
        sanitizePdfText(details.phone || details.email || ''),
      ],
    ],
  });

  // Starters
  y += 5;
  const startersHeading =
    pricing.extraStartersCount > 0
      ? `Starters (${starters.length} Selected - +£${pricing.extraStartersCount}/person extra)`
      : 'Starters';
  y = drawSectionLabel(doc, startersHeading, marginX, y);
  const starterRows: string[][] = [];
  if (details.startersTime.trim()) {
    starterRows.push([`Starters @ ${sanitizePdfText(details.startersTime.trim())}`]);
  }
  if (starters.length > 0) {
    starters.forEach((item, idx) => {
      starterRows.push([
        sanitizePdfText(
          `${item.kitchenLabel}${idx >= MENU_PRICING.requiredStarters ? ' (Extra +£1/pp)' : ''}`
        ),
      ]);
    });
  } else {
    starterRows.push(['No starters selected yet (Select 4 starters)']);
  }
  y = runTable(doc, {
    startY: y,
    tableWidth: contentWidth,
    styles: {
      font: 'times',
      fontStyle: starters.length > 0 ? 'bold' : 'italic',
      fontSize: 9.3,
      halign: 'center',
      textColor: starters.length > 0 ? DARK_TEXT : MUTED_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.25,
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
    },
    body: starterRows,
  });

  // Mains
  y += 5;
  const mainsHeading =
    pricing.extraMainsCount > 0
      ? `Mains (${mains.length} Selected - +£${pricing.extraMainsCount}/person extra)`
      : 'Mains';
  y = drawSectionLabel(doc, mainsHeading, marginX, y);
  const mainRows: string[][] =
    mains.length > 0
      ? mains.map((item, idx) => [
          sanitizePdfText(
            `${item.kitchenLabel}${idx >= MENU_PRICING.requiredMains ? ' (Extra +£1/pp)' : ''}`
          ),
        ])
      : [['No mains selected yet (Select 4 mains)']];
  y = runTable(doc, {
    startY: y,
    tableWidth: contentWidth,
    styles: {
      font: 'times',
      fontStyle: mains.length > 0 ? 'bold' : 'italic',
      fontSize: 9.3,
      halign: 'center',
      textColor: mains.length > 0 ? DARK_TEXT : MUTED_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.25,
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
    },
    body: mainRows,
  });

  // Accompaniments / Sides
  y += 5;
  y = drawSectionLabel(doc, 'Accompaniments / Sides', marginX, y);
  const accompanimentRows =
    accompaniments.length > 0 ? accompaniments.map((line) => [sanitizePdfText(line)]) : [['NA']];
  runTable(doc, {
    startY: y,
    tableWidth: contentWidth,
    styles: {
      font: 'times',
      fontStyle: 'bold',
      fontSize: 9.3,
      halign: 'center',
      textColor: DARK_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.25,
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
    },
    body: accompanimentRows,
  });

  // ==================== PAGE 2 ====================
  doc.addPage();
  y = drawHeader(doc, leftLogo, rightLogo, marginX, pageWidth);

  // Desserts (2 Included)
  y = drawSectionLabel(doc, 'Desserts (2 Included)', marginX, y, true, pageWidth);
  const dessertRows =
    desserts.length > 0
      ? desserts.map((item) => [sanitizePdfText(item.kitchenLabel)])
      : [['None selected (Select 2 desserts)']];
  y = runTable(doc, {
    startY: y,
    tableWidth: contentWidth,
    styles: {
      font: 'times',
      fontStyle: desserts.length > 0 ? 'bold' : 'italic',
      fontSize: 9,
      halign: 'center',
      textColor: desserts.length > 0 ? DARK_TEXT : MUTED_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.25,
      cellPadding: { top: 1.6, right: 3, bottom: 1.6, left: 3 },
    },
    body: dessertRows,
  });

  // Drinks
  y += 4;
  y = drawSectionLabel(doc, 'Drinks', marginX, y, true, pageWidth);
  const drinkRows: string[][] = [];
  if (details.drinksPackage === 'Not Included') {
    drinkRows.push(['Soft Drinks: Not Included (Pay as you go)']);
  } else if (drinks.length > 0) {
    drinks.forEach((d) => drinkRows.push([sanitizePdfText(d.kitchenLabel)]));
  } else {
    drinkRows.push(['Package Included - Soft Drinks To Be Confirmed']);
  }
  if (details.includeTeaAndCoffee) {
    drinkRows.push(['Tea & Coffee (+£2/person)']);
  }
  y = runTable(doc, {
    startY: y,
    tableWidth: contentWidth,
    styles: {
      font: 'times',
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      textColor: DARK_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.25,
      cellPadding: { top: 1.6, right: 3, bottom: 1.6, left: 3 },
    },
    body: drinkRows,
  });

  // Food Allergies / Dietary Requirements
  y += 4;
  y = drawSectionLabel(doc, 'Food Allergies / Dietary Requirements', marginX, y, true, pageWidth);
  y = runTable(doc, {
    startY: y,
    tableWidth: contentWidth,
    styles: {
      font: 'times',
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      textColor: DARK_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.25,
      cellPadding: { top: 1.6, right: 3, bottom: 1.6, left: 3 },
    },
    body: [[sanitizePdfText(details.allergies.trim() || 'NA')]],
  });

  // Special Requests
  y += 4;
  y = drawSectionLabel(doc, 'Special Requests', marginX, y, true, pageWidth);
  y = runTable(doc, {
    startY: y,
    tableWidth: contentWidth,
    styles: {
      font: 'times',
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      textColor: DARK_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.25,
      cellPadding: { top: 1.6, right: 3, bottom: 1.6, left: 3 },
    },
    body: specialReqLines.length > 0 ? specialReqLines.map((l) => [sanitizePdfText(l)]) : [['NA']],
  });

  // Notes & Set Up Details Side-by-Side
  y += 4;
  const halfGap = 4;
  const halfWidth = (contentWidth - halfGap) / 2;
  const rightColX = marginX + halfWidth + halfGap;

  drawSectionLabel(doc, 'Notes', marginX, y, true, marginX * 2 + halfWidth);
  drawSectionLabel(doc, 'Set Up Details', rightColX, y, true, rightColX * 2 + halfWidth);
  const sideTableStartY = y + 1.8;

  const notesFinalY = runTable(doc, {
    startY: sideTableStartY,
    margin: { left: marginX, right: marginX + halfWidth + halfGap, bottom: 18 },
    tableWidth: halfWidth,
    styles: {
      font: 'times',
      fontStyle: 'bold',
      fontSize: 8.8,
      halign: 'center',
      textColor: DARK_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.25,
      cellPadding: { top: 1.5, right: 2.5, bottom: 1.5, left: 2.5 },
    },
    body: notesLines.length > 0 ? notesLines.map((l) => [sanitizePdfText(l)]) : [['NA']],
  });

  const setupFinalY = runTable(doc, {
    startY: sideTableStartY,
    margin: { left: rightColX, right: marginX, bottom: 18 },
    tableWidth: halfWidth,
    styles: {
      font: 'times',
      fontStyle: 'bold',
      fontSize: 8.8,
      halign: 'center',
      textColor: DARK_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.25,
      cellPadding: { top: 1.5, right: 2.5, bottom: 1.5, left: 2.5 },
    },
    body: [[sanitizePdfText(details.setupDetails.trim() || 'NA')]],
  });

  y = Math.max(notesFinalY, setupFinalY) + 4;

  // Payment Summary
  y = drawSectionLabel(doc, 'Payment Summary', marginX, y);
  const paymentRows: (string | { content: string; styles?: { fontStyle?: 'bold' } })[][] = [
    [
      'Adults',
      `${details.adults} (× £${MENU_PRICING.adultPerPerson} = £${pricing.adultsTotal.toFixed(2)})`,
    ],
    [
      'Kids',
      `${details.kids} (× £${MENU_PRICING.childPerPerson} = £${pricing.kidsTotal.toFixed(2)})`,
    ],
  ];

  if (pricing.extraDishesCount > 0) {
    paymentRows.push([
      'Extra Dishes (+£1/person each)',
      `${pricing.extraDishesCount} extra × ${pricing.totalGuests} guests = £${pricing.extraDishesTotal.toFixed(2)}`,
    ]);
  }

  paymentRows.push([
    `Soft Drinks (${details.drinksPackage === 'Included' ? '+£3/pp' : details.drinksPackage})`,
    `${details.drinksPackage}${pricing.drinksTotal > 0 ? ` (£${pricing.drinksTotal.toFixed(2)})` : ''}`,
  ]);

  if (details.includeTeaAndCoffee) {
    paymentRows.push([
      'Tea & Coffee (+£2/person)',
      `${pricing.totalGuests} × £${MENU_PRICING.teaAndCoffeePerPerson} = £${pricing.teaAndCoffeeTotal.toFixed(2)}`,
    ]);
  }

  paymentRows.push(
    ['Service Charge', `10% On the Bill (£${pricing.serviceCharge.toFixed(2)})`],
    ['Golf', details.golfIncluded ? `£${pricing.golfTotal.toFixed(2)}` : 'NA'],
    ['Deposit Paid', `£${(Number(details.deposit) || 0).toFixed(2)}`],
    [
      { content: 'Estimated Total / Balance', styles: { fontStyle: 'bold' } },
      {
        content: `£${pricing.grandTotal.toFixed(2)} (Balance: £${pricing.balanceRemaining.toFixed(2)})`,
        styles: { fontStyle: 'bold' },
      },
    ],
    ['Event Date', sanitizePdfText(formatSlashDate(details.eventDate))]
  );

  y = runTable(doc, {
    startY: y,
    tableWidth: contentWidth,
    styles: {
      font: 'times',
      fontSize: 8.8,
      textColor: DARK_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.25,
      cellPadding: { top: 1.4, right: 2.5, bottom: 1.4, left: 2.5 },
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 },
    },
    body: paymentRows,
  });

  // Consent & Agreement
  y += 4;
  if (y > pageHeight - 45) {
    doc.addPage();
    y = drawHeader(doc, leftLogo, rightLogo, marginX, pageWidth);
  }

  y = drawSectionLabel(doc, 'Consent & Agreement', marginX, y);
  const consentItems = [
    {
      checked: details.consentTerms,
      text: 'I have read and agree to the Terms & Conditions',
    },
    {
      checked: details.consentContact,
      text: 'I consent to Blue Zenzer contacting me regarding my booking',
    },
    {
      checked: details.consentMarketing,
      text: 'I would like to receive marketing offers and updates',
    },
  ];

  doc.setFont('times', 'normal');
  doc.setFontSize(8.8);
  consentItems.forEach((item) => {
    const boxY = y;
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.25);
    doc.rect(marginX, boxY, 3.2, 3.2);
    if (item.checked) {
      doc.setLineWidth(0.45);
      doc.line(marginX + 0.6, boxY + 1.6, marginX + 1.35, boxY + 2.5);
      doc.line(marginX + 1.35, boxY + 2.5, marginX + 2.7, boxY + 0.7);
      doc.setLineWidth(0.25);
    }
    doc.setTextColor(...DARK_TEXT);
    doc.text(item.text, marginX + 5, boxY + 2.6);
    y += 4.5;
  });

  y += 1.5;
  runTable(doc, {
    startY: y,
    tableWidth: contentWidth,
    styles: {
      font: 'times',
      fontSize: 8.8,
      textColor: DARK_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.25,
      cellPadding: { top: 1.8, right: 2.5, bottom: 1.8, left: 2.5 },
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 },
    },
    body: [
      [
        `Customer Name: ${sanitizePdfText(details.name || '')}`,
        `Signature: ${sanitizePdfText(
          details.signatureName || (details.consentTerms ? details.name : '')
        )}`,
      ],
      ['Date Received:', 'Staff Use / Kitchen Sign-off:'],
    ],
  });

  // ==================== PAGE 3 (TERMS & CONDITIONS) ====================
  doc.addPage();
  y = drawHeader(doc, leftLogo, rightLogo, marginX, pageWidth);
  y = drawSectionLabel(doc, 'Cancellation Terms & Conditions', marginX, y);
  y += 2;

  TERMS_AND_CONDITIONS.forEach((clause) => {
    const titleText = sanitizePdfText(clause.title);
    const bodyLines = doc.splitTextToSize(sanitizePdfText(clause.body), contentWidth);
    const blockHeight = 4.5 + bodyLines.length * 4 + 2.5;

    if (y + blockHeight > pageHeight - 18) {
      doc.addPage();
      y = drawHeader(doc, leftLogo, rightLogo, marginX, pageWidth);
    }

    doc.setFont('times', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(...DARK_TEXT);
    doc.text(titleText, marginX, y);
    y += 4;

    doc.setFont('times', 'normal');
    doc.setFontSize(8.8);
    doc.text(bodyLines, marginX, y, { lineHeightFactor: 1.3 });
    y += bodyLines.length * 3.9 + 3;
  });

  drawFooterOnAllPages(doc, marginX, pageWidth, pageHeight);

  const filename = buildSafeFilename(bookingId, details);
  doc.save(filename);
  return filename;
}
