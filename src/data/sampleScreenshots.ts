// Generates realistic SVG data URLs of Indian UPI payment slips (GPay, PhonePe, Paytm)
// These can be passed to Gemini API for real OCR vision extraction or testing!

function createSvgDataUrl(svgString: string): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
}

export interface SampleSlip {
  id: string;
  name: string;
  app: 'Google Pay' | 'PhonePe' | 'Paytm';
  amount: number;
  merchant: string;
  dataUrl: string;
}

export const SAMPLE_UPI_SCREENSHOTS: SampleSlip[] = [
  {
    id: 'sample-gpay-chai',
    name: 'GPay - ₹40 (Ramu Tea Stall & Snacks)',
    app: 'Google Pay',
    amount: 40,
    merchant: 'Ramu Tea Stall & Snacks',
    dataUrl: createSvgDataUrl(`
      <svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="#1A73E8"/>
        <rect y="120" width="400" height="480" rx="24" fill="#FFFFFF"/>
        
        <!-- Checkmark circle -->
        <circle cx="200" cy="120" r="36" fill="#1E8E3E"/>
        <path d="M188 120 L196 128 L214 110" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        
        <text x="200" y="190" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="#202124">₹40.00</text>
        <text x="200" y="220" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="600" fill="#3C4043">Paid to Ramu Tea Stall &amp; Snacks</text>
        <text x="200" y="242" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#70757A">ramu.tapri@upi</text>
        
        <line x1="30" y1="270" x2="370" y2="270" stroke="#E8EAED" stroke-width="1"/>
        
        <text x="40" y="310" font-family="sans-serif" font-size="14" fill="#70757A">UPI transaction ID</text>
        <text x="40" y="332" font-family="sans-serif" font-size="14" font-weight="600" fill="#202124">492019384912</text>
        
        <text x="40" y="375" font-family="sans-serif" font-size="14" fill="#70757A">To</text>
        <text x="40" y="397" font-family="sans-serif" font-size="14" font-weight="600" fill="#202124">Ramu Tea Stall</text>
        
        <text x="40" y="440" font-family="sans-serif" font-size="14" fill="#70757A">From: State Bank of India</text>
        <text x="40" y="462" font-family="sans-serif" font-size="14" font-weight="600" fill="#202124">A/C No. **4821 (UPI)</text>
        
        <text x="40" y="505" font-family="sans-serif" font-size="14" fill="#70757A">Google Transaction ID</text>
        <text x="40" y="527" font-family="sans-serif" font-size="13" fill="#202124">CICAgOCS4_HqPA</text>
        
        <rect x="40" y="550" width="320" height="36" rx="8" fill="#E8F0FE"/>
        <text x="200" y="573" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="600" fill="#1967D2">Payment Completed • 09 Sep 2026, 04:15 PM</text>
      </svg>
    `),
  },
  {
    id: 'sample-phonepe-kirana',
    name: 'PhonePe - ₹450 (Sharma Kirana & General Store)',
    app: 'PhonePe',
    amount: 450,
    merchant: 'Sharma Kirana Store',
    dataUrl: createSvgDataUrl(`
      <svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="#5F259F"/>
        <rect y="110" width="400" height="490" rx="20" fill="#FFFFFF"/>
        
        <circle cx="200" cy="110" r="32" fill="#00AA6C"/>
        <path d="M190 110 L197 117 L212 102" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        
        <text x="200" y="170" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="600" fill="#00AA6C">Transaction Successful</text>
        <text x="200" y="210" text-anchor="middle" font-family="sans-serif" font-size="32" font-weight="bold" fill="#1C1C1E">₹450</text>
        <text x="200" y="235" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="600" fill="#2D2D2D">Paid to Sharma Daily Kirana</text>
        <text x="200" y="255" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#8E8E93">sharmakirana@ybl</text>
        
        <rect x="25" y="280" width="350" height="1" fill="#E5E5EA"/>
        
        <text x="35" y="320" font-family="sans-serif" font-size="14" fill="#8E8E93">Debited from</text>
        <text x="35" y="342" font-family="sans-serif" font-size="14" font-weight="600" fill="#1C1C1E">HDFC Bank - 2910 (UPI)</text>
        
        <text x="35" y="390" font-family="sans-serif" font-size="14" fill="#8E8E93">UTR / Ref No.</text>
        <text x="35" y="412" font-family="sans-serif" font-size="14" font-weight="600" fill="#1C1C1E">391829019283</text>
        
        <text x="35" y="460" font-family="sans-serif" font-size="14" fill="#8E8E93">Date &amp; Time</text>
        <text x="35" y="482" font-family="sans-serif" font-size="14" font-weight="600" fill="#1C1C1E">09 Sep 2026, 01:20 PM</text>
        
        <rect x="35" y="520" width="330" height="44" rx="10" fill="#F4EEFB"/>
        <text x="200" y="547" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#5F259F">Groceries &amp; Daily Mess Supplies</text>
      </svg>
    `),
  },
  {
    id: 'sample-paytm-swiggy',
    name: 'Paytm - ₹240 (College Canteen & Biryani)',
    app: 'Paytm',
    amount: 240,
    merchant: 'Campus Food Court',
    dataUrl: createSvgDataUrl(`
      <svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="#002E6E"/>
        <rect y="120" width="400" height="480" rx="20" fill="#F5F9FD"/>
        
        <circle cx="200" cy="120" r="32" fill="#00BAF2"/>
        <path d="M190 120 L197 127 L212 112" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        
        <text x="200" y="175" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold" fill="#00BAF2">Money Sent Successfully</text>
        <text x="200" y="215" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="800" fill="#002E6E">₹240</text>
        <text x="200" y="240" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="600" fill="#333333">To Campus Food Court (Dosa &amp; Meals)</text>
        
        <rect x="30" y="270" width="340" height="200" rx="12" fill="#FFFFFF" stroke="#E1E9F0"/>
        
        <text x="50" y="305" font-family="sans-serif" font-size="13" fill="#666666">UPI Ref No</text>
        <text x="350" y="305" text-anchor="end" font-family="sans-serif" font-size="13" font-weight="600" fill="#222222">829102938192</text>
        
        <text x="50" y="345" font-family="sans-serif" font-size="13" fill="#666666">Payment Source</text>
        <text x="350" y="345" text-anchor="end" font-family="sans-serif" font-size="13" font-weight="600" fill="#222222">Paytm UPI / SBI</text>
        
        <text x="50" y="385" font-family="sans-serif" font-size="13" fill="#666666">Paid On</text>
        <text x="350" y="385" text-anchor="end" font-family="sans-serif" font-size="13" font-weight="600" fill="#222222">08 Sep 2026, 08:30 PM</text>
        
        <text x="50" y="425" font-family="sans-serif" font-size="13" fill="#666666">Category</text>
        <text x="350" y="425" text-anchor="end" font-family="sans-serif" font-size="13" font-weight="600" fill="#00BAF2">Food &amp; Dining</text>
        
        <rect x="50" y="500" width="300" height="40" rx="8" fill="#00BAF2"/>
        <text x="200" y="525" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF">Verified Student Payment</text>
      </svg>
    `),
  },
];
