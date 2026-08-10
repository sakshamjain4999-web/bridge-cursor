import jsPDF from "jspdf";

// ─── Types ────────────────────────────────────────────────────────────────────
type RGB = [number, number, number];
type Align = "left" | "center" | "right";

// ─── Palette (cloned from invoice-master-template.png) ───────────────────────
const CLR = {
  charcoal:   [45, 45, 45]     as RGB,   // header & table-header dark fill
  white:      [255, 255, 255]  as RGB,
  orange:     [230, 126, 34]   as RGB,   // vibrant orange banners / accents
  cream:      [247, 244, 238]  as RGB,   // page background canvas
  black:      [20, 20, 20]    as RGB,
  darkText:   [30, 30, 30]     as RGB,
  muted:      [110, 110, 110]  as RGB,
  border:     [180, 180, 180]  as RGB,
  pinkBg:     [254, 232, 232]  as RGB,   // RCM container background
  redDash:    [190, 50, 50]    as RGB,   // RCM dashed border
  rowAlt:     [250, 249, 246]  as RGB,   // alternate table row
  lightGray:  [215, 215, 215]  as RGB,
  headerDiv:  [80, 80, 80]    as RGB,   // column dividers inside dark headers
  subtleText: [200, 200, 200]  as RGB,   // lighter text on dark backgrounds
};

// ─── Business Constants (Y.S. Logistics) ──────────────────────────────────────
const BIZ = {
  name:       "Y.S. LOGISTICS (INDIA)",
  tagline:    "FLEET OWNERS & TRANSPORT CONTRACTORS",
  address:    "B-89, FLAT NO. 7, VISHWAKARMA COLONY, M.B. ROAD, NEW DELHI-44",
  email:      "suresh.jainyslindia@gmail.com",
  gstin:      "07AHGOJ6090E2ZD",
  phone:      "M. : 9953459961, 7982847013",
  bankName:   "STATE BANK OF INDIA",
  bankAcc:    "XXXXXXXXXXXXXXX",
  bankHolder: "SURESH KUMAR JAIN",
  bankIFSC:   "SBINXXXXXXXX",
  bankBranch: "Delhi",
};

// ─── Drawing Primitives ───────────────────────────────────────────────────────

/**
 * Set font + colour + explicitly reset charSpace to 0.
 * This is the CRITICAL fix that prevents the "m u m b a i" wide-tracking bug
 * caused by jsPDF inheriting stale character-spacing values across text draws.
 */
function sf(
  doc: jsPDF,
  sz: number,
  style: "normal" | "bold" | "italic" | "bolditalic" = "normal",
  col: RGB = CLR.darkText,
) {
  doc.setFontSize(sz);
  doc.setFont("helvetica", style);
  doc.setTextColor(col[0], col[1], col[2]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (doc as any).setCharSpace === "function") (doc as any).setCharSpace(0);
}

/** Fill a rectangle */
function fillRect(doc: jsPDF, x: number, y: number, w: number, h: number, col: RGB) {
  doc.setFillColor(col[0], col[1], col[2]);
  doc.rect(x, y, w, h, "F");
}

/** Stroke (outline only) a rectangle */
function strokeRect(doc: jsPDF, x: number, y: number, w: number, h: number, col: RGB = CLR.border, lw = 0.3) {
  doc.setDrawColor(col[0], col[1], col[2]);
  doc.setLineWidth(lw);
  doc.rect(x, y, w, h, "S");
}

/** Rounded rectangle – fill, optionally stroke */
function roundRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fill: RGB, stroke?: RGB, lw = 0.3) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  if (stroke) {
    doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
    doc.setLineWidth(lw);
    doc.roundedRect(x, y, w, h, r, r, "FD");
  } else {
    doc.roundedRect(x, y, w, h, r, r, "F");
  }
}

/** Horizontal line */
function hLine(doc: jsPDF, x1: number, x2: number, y: number, col: RGB = CLR.border, lw = 0.25) {
  doc.setDrawColor(col[0], col[1], col[2]);
  doc.setLineWidth(lw);
  doc.line(x1, y, x2, y);
}

/** Vertical line */
function vLine(doc: jsPDF, x: number, y1: number, y2: number, col: RGB = CLR.border, lw = 0.25) {
  doc.setDrawColor(col[0], col[1], col[2]);
  doc.setLineWidth(lw);
  doc.line(x, y1, x, y2);
}

/** Draw text with alignment */
function txt(doc: jsPDF, text: string, x: number, y: number, align: Align = "left", maxW?: number) {
  if (!text) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts: any = { align };
  if (maxW) opts.maxWidth = maxW;
  doc.text(text, x, y, opts);
}

/** Format currency – uses "Rs." prefix (safe for built-in helvetica fonts) */
function fmtRs(n: number): string {
  return "Rs. " + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Number to Indian-English words (Lakh / Crore system) */
function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const below100 = (x: number): string => {
    if (x < 20) return ones[x];
    return tens[Math.floor(x / 10)] + (x % 10 ? "-" + ones[x % 10] : "");
  };
  const below1000 = (x: number): string => {
    if (x < 100) return below100(x);
    return ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " and " + below100(x % 100) : "");
  };

  let num = Math.abs(Math.round(n));
  let result = "";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore) result += below1000(crore) + " Crore ";
  if (lakh) result += below100(lakh) + " Lakh ";
  if (thousand) result += below100(thousand) + " Thousand ";
  if (num) result += below1000(num);

  return result.trim();
}

// ─── Public Interface (preserved for backward compatibility) ──────────────────
export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate:   string;
  dueDate:       string;
  partyName:     string;
  partyAddress?: string;
  partyGstin?:   string;
  partyState?:   string;
  vehicleNo?:    string;
  grNo?:         string;
  grDate?:       string;
  containerNo?:  string;
  fromCity?:     string;
  toCity?:       string;
  freightAmount:    number;
  loadingCharges?:  number;
  haltCharges?:     number;
  advanceReceived?: number;
  qrDataUrl?:       string;
  weightString?:    string;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PDF BUILDER
// ═════════════════════════════════════════════════════════════════════════════
export async function buildInvoicePDF(data: InvoiceData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const PW  = 210;                 // A4 width
  const PH  = 297;                 // A4 height
  const M   = 10;                  // left / right margin
  const CW  = PW - 2 * M;         // content width = 190 mm

  // Global charSpace reset – belt-and-braces fix for tracking bugs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (doc as any).setCharSpace === "function") (doc as any).setCharSpace(0);

  // ── Full-page cream canvas ──
  fillRect(doc, 0, 0, PW, PH, CLR.cream);

  // ── Financial calculations ──
  const freight    = data.freightAmount || 0;
  const loading    = data.loadingCharges || 0;
  const halt       = data.haltCharges || 0;
  const gross      = freight + loading + halt;
  const advance    = data.advanceReceived || 0;
  const netPayable = gross - advance;
  const cgst       = +(gross * 0.025).toFixed(2);
  const sgst       = +(gross * 0.025).toFixed(2);
  const totalGst   = +(cgst + sgst).toFixed(2);

  let y = 0;
  const ROW = 8;  // standard table row height

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. DARK CHARCOAL HEADER BANNER
  // ═══════════════════════════════════════════════════════════════════════════
  const HDR = 48;
  fillRect(doc, 0, 0, PW, HDR, CLR.charcoal);

  // ── Top bar: GSTIN (left) | INVOICE (center) | Phone (right) ──
  sf(doc, 7.5, "bold", CLR.white);
  txt(doc, "GSTIN: " + BIZ.gstin, M + 2, 7);

  sf(doc, 15, "bold", CLR.white);
  txt(doc, "INVOICE", PW / 2, 7.5, "center");

  sf(doc, 7, "normal", CLR.white);
  txt(doc, BIZ.phone, PW - M - 2, 7, "right");

  // ── Left: QR code (placed below GSTIN line) ──
  const qrHdrSz = 22;
  const qrHdrX  = M + 2;
  const qrHdrY  = 11;
  if (data.qrDataUrl) {
    try { doc.addImage(data.qrDataUrl, "PNG", qrHdrX, qrHdrY, qrHdrSz, qrHdrSz); } catch { /* skip */ }
  } else {
    strokeRect(doc, qrHdrX, qrHdrY, qrHdrSz, qrHdrSz, CLR.white, 0.4);
    sf(doc, 5.5, "normal", CLR.white);
    txt(doc, "QR", qrHdrX + qrHdrSz / 2, qrHdrY + qrHdrSz / 2 + 1.5, "center");
  }

  // ── Center: Company name block ──
  const cx = PW / 2;
  sf(doc, 22, "bold", CLR.white);
  txt(doc, BIZ.name, cx, 20, "center");

  sf(doc, 9.5, "bold", CLR.white);
  txt(doc, BIZ.tagline, cx, 27, "center");

  sf(doc, 7.5, "normal", CLR.subtleText);
  txt(doc, BIZ.address, cx, 33, "center");

  sf(doc, 7.5, "normal", CLR.subtleText);
  txt(doc, "E-MAIL: " + BIZ.email, cx, 38, "center");

  // ── Right: YSL circular brand badge ──
  const badgeR  = 12;
  const badgeCX = PW - M - badgeR - 2;
  const badgeCY = 24;
  doc.setDrawColor(CLR.white[0], CLR.white[1], CLR.white[2]);
  doc.setLineWidth(1.5);
  doc.circle(badgeCX, badgeCY, badgeR, "S");
  // Inner ring (double-circle effect)
  doc.setLineWidth(0.4);
  doc.circle(badgeCX, badgeCY, badgeR - 1.8, "S");
  sf(doc, 12, "bold", CLR.white);
  txt(doc, "YSL", badgeCX, badgeCY + 1, "center");
  sf(doc, 5.5, "bold", CLR.white);
  txt(doc, "INDIA", badgeCX, badgeCY + 5.5, "center");

  y = HDR + 4;

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SIDE-BY-SIDE METADATA CARDS
  // ═══════════════════════════════════════════════════════════════════════════
  const CARD_W   = (CW - 4) / 2;   // 93 mm each
  const CARD_H   = 36;
  const CARD_GAP = 4;
  const TAB_H    = 7;               // orange header-tab height

  // ── Left Card: Invoice Details ──────────────────────────────────────────
  const lcX = M;
  const lcY = y;
  fillRect(doc, lcX, lcY, CARD_W, CARD_H, CLR.white);
  strokeRect(doc, lcX, lcY, CARD_W, CARD_H, CLR.border, 0.3);
  // Orange header tab
  fillRect(doc, lcX, lcY, CARD_W, TAB_H, CLR.orange);
  sf(doc, 8, "bold", CLR.white);
  txt(doc, "Invoice Details", lcX + 4, lcY + 5);

  // Field rows
  let lcFY = lcY + TAB_H + 6;
  const lcLbl = lcX + 4;
  const lcVal = lcX + 34;

  const leftField = (label: string, value: string) => {
    sf(doc, 7.5, "normal", CLR.muted);
    txt(doc, label, lcLbl, lcFY);
    sf(doc, 8, "bold", CLR.darkText);
    txt(doc, value || "-", lcVal, lcFY);
    lcFY += 8;
  };

  leftField("Invoice No:", data.invoiceNumber);
  leftField("Invoice Date:", data.invoiceDate);
  leftField("Due Date:", data.dueDate);

  // ── Right Card: Party (Billed To) Details ──────────────────────────────
  const rcX = M + CARD_W + CARD_GAP;
  const rcY = y;
  fillRect(doc, rcX, rcY, CARD_W, CARD_H, CLR.white);
  strokeRect(doc, rcX, rcY, CARD_W, CARD_H, CLR.border, 0.3);
  // Orange header tab
  fillRect(doc, rcX, rcY, CARD_W, TAB_H, CLR.orange);
  sf(doc, 8, "bold", CLR.white);
  txt(doc, "Party (Billed To) Details", rcX + 4, rcY + 5);

  // Field rows with underlines for form-style
  let rcFY      = rcY + TAB_H + 6;
  const rcLbl   = rcX + 4;
  const rcVal   = rcX + 30;
  const rcEnd   = rcX + CARD_W - 4;

  const rightField = (label: string, value: string) => {
    sf(doc, 7.5, "normal", CLR.muted);
    txt(doc, label, rcLbl, rcFY);
    sf(doc, 8, "normal", CLR.darkText);
    if (value) txt(doc, value, rcVal, rcFY);
    hLine(doc, rcVal, rcEnd, rcFY + 1.5, CLR.lightGray, 0.2);
    rcFY += 8;
  };

  rightField("Party Name:", data.partyName);
  rightField("Address:", data.partyAddress || "");
  rightField("State Code:", data.partyState || "");

  y += CARD_H + 4;

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. VEHICLE & TRIP INFORMATION
  // ═══════════════════════════════════════════════════════════════════════════
  sf(doc, 9, "bold", CLR.black);
  txt(doc, "VEHICLE & TRIP INFORMATION:", M, y + 4);
  y += 7;

  // Column boundaries (offsets from M)
  const v1 = 0;     // Vehicle / Truck No.   (63 mm)
  const v2 = 63;    // LR / GR No. & Date    (63 mm)
  const v3 = 126;   // Route (From -> To)     (64 mm)

  // Header row
  fillRect(doc, M, y, CW, ROW, CLR.charcoal);
  sf(doc, 7, "bold", CLR.white);
  txt(doc, "Vehicle / Truck No.", M + v1 + 3, y + 5.5);
  txt(doc, "LR / GR No. & Date", M + v2 + 3, y + 5.5);
  txt(doc, "Route (From -> To)", M + v3 + 3, y + 5.5);
  vLine(doc, M + v2, y, y + ROW, CLR.headerDiv, 0.2);
  vLine(doc, M + v3, y, y + ROW, CLR.headerDiv, 0.2);
  y += ROW;

  // Data row
  fillRect(doc, M, y, CW, ROW, CLR.white);
  strokeRect(doc, M, y, CW, ROW, CLR.border, 0.2);
  vLine(doc, M + v2, y, y + ROW, CLR.border, 0.2);
  vLine(doc, M + v3, y, y + ROW, CLR.border, 0.2);
  sf(doc, 7.5, "normal", CLR.darkText);
  txt(doc, data.vehicleNo || "", M + v1 + 3, y + 5.5);
  const grStr = (data.grNo || "") + (data.grDate ? " / " + data.grDate : "");
  txt(doc, grStr, M + v2 + 3, y + 5.5);
  const routeStr = [data.fromCity, data.toCity].filter(Boolean).join(" -> ");
  txt(doc, routeStr, M + v3 + 3, y + 5.5);
  y += ROW + 3;

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. BILLING STRUCTURE (RCM COMPLIANT)
  // ═══════════════════════════════════════════════════════════════════════════
  sf(doc, 9, "bold", CLR.black);
  txt(doc, "BILLING STRUCTURE (RCM COMPLIANT):", M, y + 4);
  y += 7;

  // Column boundaries
  const b1 = 0;     // S.No.           (15 mm)
  const b2 = 15;    // Description     (95 mm)
  const b3 = 110;   // SAC Code        (35 mm)
  const b4 = 145;   // Amount          (45 mm)

  // Header row
  fillRect(doc, M, y, CW, ROW, CLR.charcoal);
  sf(doc, 7, "bold", CLR.white);
  txt(doc, "S.No.", M + b1 + 3, y + 5.5);
  txt(doc, "Description of Services", M + b2 + 3, y + 5.5);
  txt(doc, "SAC Code", M + b3 + 3, y + 5.5);
  txt(doc, "Amount (Rs.)", M + b4 + 3, y + 5.5);
  vLine(doc, M + b2, y, y + ROW, CLR.headerDiv, 0.2);
  vLine(doc, M + b3, y, y + ROW, CLR.headerDiv, 0.2);
  vLine(doc, M + b4, y, y + ROW, CLR.headerDiv, 0.2);
  y += ROW;

  /** Render one billing data row */
  const billingRow = (sno: string, desc: string, sac: string, amount: number | null, shade: boolean) => {
    fillRect(doc, M, y, CW, ROW, shade ? CLR.rowAlt : CLR.white);
    strokeRect(doc, M, y, CW, ROW, CLR.border, 0.15);
    vLine(doc, M + b2, y, y + ROW, CLR.border, 0.15);
    vLine(doc, M + b3, y, y + ROW, CLR.border, 0.15);
    vLine(doc, M + b4, y, y + ROW, CLR.border, 0.15);
    sf(doc, 7.5, "normal", CLR.darkText);
    txt(doc, sno, M + (b2 / 2), y + 5.5, "center");
    txt(doc, desc, M + b2 + 3, y + 5.5);
    txt(doc, sac, M + b3 + (b4 - b3) / 2, y + 5.5, "center");
    if (amount !== null && amount !== undefined) {
      sf(doc, 7.5, "bold", CLR.darkText);
      txt(doc, fmtRs(amount), M + CW - 3, y + 5.5, "right");
    }
    y += ROW;
  };

  const mainFreightDesc = data.weightString
    ? `Base Freight Charges (Weight: ${data.weightString})`
    : "Base Freight Charges (Main Bhada)";
  billingRow("1.", mainFreightDesc, "996511", freight, false);
  billingRow("2.", "Loading / Unloading Charges", "996511", data.loadingCharges ?? null, true);
  billingRow("3.", "Halt / Detention Charges (2 Days at Unloading Point)", "996511", data.haltCharges ?? null, false);

  // Gross Total row
  fillRect(doc, M, y, CW, ROW, CLR.cream);
  strokeRect(doc, M, y, CW, ROW, CLR.border, 0.15);
  vLine(doc, M + b4, y, y + ROW, CLR.border, 0.15);
  sf(doc, 8, "bold", CLR.darkText);
  txt(doc, "Gross Total", M + b4 - 3, y + 5.5, "right");
  txt(doc, fmtRs(gross), M + CW - 3, y + 5.5, "right");
  y += ROW + 3;

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. GST BREAKDOWN (For Information Only)
  // ═══════════════════════════════════════════════════════════════════════════
  sf(doc, 9, "bold", CLR.black);
  txt(doc, "GST BREAKDOWN (For Information Only):", M, y + 4);
  y += 7;

  // 5 columns – each ~38 mm
  const g1 = 0;      // Tax Rate       (30 mm)
  const g2 = 30;     // Taxable Amount (40 mm)
  const g3 = 70;     // CGST           (40 mm)
  const g4 = 110;    // SGST           (40 mm)
  const g5 = 150;    // Total GST      (40 mm)
  const gCols = [g2, g3, g4, g5];

  // Header
  fillRect(doc, M, y, CW, ROW, CLR.charcoal);
  sf(doc, 6.5, "bold", CLR.white);
  txt(doc, "Tax Rate", M + g1 + 3, y + 5.5);
  txt(doc, "Taxable Amount (Rs.)", M + g2 + 2, y + 5.5);
  txt(doc, "CGST (2.5%) (Rs.)", M + g3 + 2, y + 5.5);
  txt(doc, "SGST (2.5%) (Rs.)", M + g4 + 2, y + 5.5);
  txt(doc, "Total GST Tax (Rs.)", M + g5 + 2, y + 5.5);
  gCols.forEach(c => vLine(doc, M + c, y, y + ROW, CLR.headerDiv, 0.2));
  y += ROW;

  // Data row
  fillRect(doc, M, y, CW, ROW, CLR.white);
  strokeRect(doc, M, y, CW, ROW, CLR.border, 0.15);
  gCols.forEach(c => vLine(doc, M + c, y, y + ROW, CLR.border, 0.15));
  sf(doc, 7.5, "normal", CLR.darkText);
  txt(doc, "GST @ 5%", M + g1 + 3, y + 5.5);
  txt(doc, fmtRs(gross), M + g2 + 2, y + 5.5);
  txt(doc, fmtRs(cgst), M + g3 + 2, y + 5.5);
  txt(doc, fmtRs(sgst), M + g4 + 2, y + 5.5);
  sf(doc, 7.5, "bold", CLR.darkText);
  txt(doc, fmtRs(totalGst), M + g5 + 2, y + 5.5);
  y += ROW + 3;

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. NET PAYABLE AMOUNT BANNER
  // ═══════════════════════════════════════════════════════════════════════════
  const BANNER_H = 14;
  roundRect(doc, M, y, CW, BANNER_H, 2, CLR.orange);

  // Amount line
  sf(doc, 11, "bold", CLR.white);
  const amtStr = "NET PAYABLE AMOUNT: Rs. " + netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  txt(doc, amtStr, PW / 2, y + 6, "center");

  // Amount in words line
  sf(doc, 7, "italic", [255, 240, 220] as RGB);
  const wordsStr = "(Amount in Words: Rupees " + numberToWords(netPayable) + " Only)";
  txt(doc, wordsStr, PW / 2, y + 11.5, "center");

  y += BANNER_H + 4;

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. LEGAL STATUTORY DECLARATION (RCM SAFETY) CONTAINER
  // ═══════════════════════════════════════════════════════════════════════════
  sf(doc, 9, "bold", CLR.black);
  txt(doc, "LEGAL STATUTORY DECLARATION (RCM SAFETY) CONTAINER:", M, y + 4);
  y += 7;

  const RCM_H = 32;
  // Pink background
  fillRect(doc, M, y, CW, RCM_H, CLR.pinkBg);
  // Red dashed border
  doc.setDrawColor(CLR.redDash[0], CLR.redDash[1], CLR.redDash[2]);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([2.5, 1.5], 0);
  doc.rect(M, y, CW, RCM_H, "S");
  doc.setLineDashPattern([], 0);  // reset to solid

  let ry = y + 5;
  sf(doc, 7.5, "bold", CLR.redDash);
  txt(doc, "LEGAL STATUTORY DECLARATION (RCM Compliant):", M + 6, ry);
  ry += 5;

  sf(doc, 7, "bold", CLR.darkText);
  txt(doc, "Reverse Charge Applicable: YES [cite: 37]", M + 6, ry);
  ry += 5;

  sf(doc, 6.5, "italic", CLR.muted);
  const rcmBody =
    "\"Whether tax is payable on reverse charge basis: YES. Goods Transport Agency (GTA) has not opted " +
    "for forward charge payment of GST. GST under Reverse Charge Mechanism (RCM) applicability to be " +
    "verified by the consignee/consignor as per GTA rules.\"";
  const rcmLines: string[] = doc.splitTextToSize(rcmBody, CW - 12);
  rcmLines.forEach((line: string) => { txt(doc, line, M + 6, ry); ry += 3.5; });
  sf(doc, 6.5, "normal", CLR.muted);
  txt(doc, "[cite: 36, 40]", M + 6, ry);

  y += RCM_H + 4;

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. FOOTER: QR CODE | BANK DETAILS | AUTHORIZED SIGNATORY
  // ═══════════════════════════════════════════════════════════════════════════
  const FOOT_H = Math.min(PH - y - 6, 50);   // use remaining space, max 50 mm
  const fW1 = 40;                              // QR code column
  const fW2 = 80;                              // Bank details column
  const fW3 = CW - fW1 - fW2;                 // Signatory column (70 mm)
  const footY = y;

  // Draw column backgrounds + borders
  const footCols: [number, number][] = [
    [M, fW1],
    [M + fW1, fW2],
    [M + fW1 + fW2, fW3],
  ];
  footCols.forEach(([fx, fw]) => {
    fillRect(doc, fx, footY, fw, FOOT_H, CLR.white);
    strokeRect(doc, fx, footY, fw, FOOT_H, CLR.border, 0.3);
  });

  // ── Left Column: UPI Payment QR Code (28 × 28 mm) ──
  const qrSz = 28;
  const qrX  = M + (fW1 - qrSz) / 2;
  const qrY  = footY + (FOOT_H - qrSz) / 2;
  if (data.qrDataUrl) {
    try { doc.addImage(data.qrDataUrl, "PNG", qrX, qrY, qrSz, qrSz); } catch { /* skip */ }
  } else {
    strokeRect(doc, qrX, qrY, qrSz, qrSz, CLR.border, 0.3);
    sf(doc, 6, "normal", CLR.muted);
    txt(doc, "QR Code", qrX + qrSz / 2, qrY + qrSz / 2 + 1.5, "center");
  }

  // ── Center Column: Bank Account Details ──
  const bankX = M + fW1 + 4;
  let bankY = footY + 5;
  sf(doc, 7.5, "bold", CLR.darkText);
  txt(doc, "Bank Account Details", bankX, bankY);
  bankY += 3.5;
  sf(doc, 6, "normal", CLR.muted);
  txt(doc, "(For RTGS / NEFT / IMPS):", bankX, bankY);
  bankY += 5;

  sf(doc, 6.5, "normal", CLR.darkText);
  txt(doc, "Account Name: " + BIZ.bankHolder, bankX, bankY);   bankY += 4;
  txt(doc, "Account Number: " + BIZ.bankAcc, bankX, bankY);    bankY += 4;
  txt(doc, "Bank Name: " + BIZ.bankName, bankX, bankY);        bankY += 4;
  txt(doc, "IFSC Code: " + BIZ.bankIFSC + " | Branch: " + BIZ.bankBranch, bankX, bankY);

  // ── Right Column: Authorized Signatory ──
  const sigCX = M + fW1 + fW2 + fW3 / 2;   // horizontal centre of column
  sf(doc, 7, "bold", CLR.darkText);
  txt(doc, "AUTHORIZED SIGNATORY:", sigCX, footY + 5, "center");

  // Elegant italic signature
  sf(doc, 14, "italic", CLR.darkText);
  txt(doc, "Suresh Kumar Jain", sigCX, footY + FOOT_H / 2 + 2, "center");

  // Signature line
  hLine(doc, M + fW1 + fW2 + 8, M + fW1 + fW2 + fW3 - 8, footY + FOOT_H / 2 + 5, CLR.lightGray, 0.3);

  // Name label
  sf(doc, 7.5, "normal", CLR.muted);
  txt(doc, "(SURESH KUMAR JAIN)", sigCX, footY + FOOT_H - 6, "center");

  return doc;
}

// ─── Helper: load image URL as base64 data-URL (browser only) ────────────────
export function loadImageAsDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width  = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}