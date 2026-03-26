import { Zone, Customer, CustomerIntel } from './types';

export const ZONES: Zone[] = [
  { id: 'kohat', name: 'Kohat', minStd: 1800, minFixed: true },
  { id: 'peshawar', name: 'Peshawar', minStd: 3800, minFixed: true },
  { id: 'rawalpindi', name: 'Rawalpindi', minStd: null, minFixed: false },
  { id: 'central_punjab', name: 'Central Punjab', minStd: null, minFixed: false },
  { id: 'south_punjab', name: 'South Punjab', minStd: null, minFixed: false },
  { id: 'sindh', name: 'Sindh', minStd: null, minFixed: false },
  { id: 'baluchistan', name: 'Baluchistan', minStd: null, minFixed: false },
  { id: 'projects', name: 'Projects', minStd: 600, minFixed: true, isProjects: true },
];

export const CUSTOMER_TYPES: Record<string, 'A' | 'B' | 'C'> = {
  'Government': 'A', 'Housing Authority': 'A', 'Large Contractor': 'A', 'Infrastructure': 'A',
  'Real Estate': 'B', 'Consultancy': 'B', 'Contractor': 'B', 'Industrial': 'B',
  'Dealer Network': 'C', 'Wholesale': 'C', 'Retail Dealer': 'C', 'Housing': 'C'
};

export const PRICE_TIER_SCORE = { "A": 90, "B": 65, "C": 40 };
export const PRICE_TIER_MARGIN = { "A": 920, "B": 810, "C": 720 };

export const ZONE_CUSTOMERS: Record<string, Customer[]> = {
  kohat: [
    { name: 'SAHIB REHMAN CEMENT AGENCY', type: 'Retail Dealer' },
    { name: 'MUHAMMAD NAEEM & UMAR HAYAT KHAN', type: 'Retail Dealer' },
    { name: 'ALAM ZEB BROTHERS.', type: 'Wholesale' },
    { name: 'ITTAFAQ CEMENT DEALER', type: 'Retail Dealer' },
    { name: 'ASAD TRADERS KOHAT', type: 'Retail Dealer' },
    { name: 'KURRAM TRADERS KOHAT', type: 'Retail Dealer' },
    { name: 'UMAR ELLAHI TRADERS', type: 'Retail Dealer' },
    { name: 'AL-AHMED TRADERS', type: 'Retail Dealer' },
    { name: 'MUHAMMAD SHOAIB AFRIDI CEMENT DEALER', type: 'Retail Dealer' },
    { name: 'DANYAL AND BROTHERS', type: 'Retail Dealer' },
    { name: 'INAYAT ULLAH KHAN & SONS', type: 'Retail Dealer' },
    { name: 'ITTAFAQ CEMENT DEALER - DARABAN', type: 'Retail Dealer' },
    { name: 'SHAHEEN TRADERS [ Kohat ]', type: 'Retail Dealer' },
    { name: 'AMANAT AND SONS', type: 'Retail Dealer' },
    { name: 'MALIK TRADERS', type: 'Retail Dealer' },
    { name: 'AL HAMD TRADERS', type: 'Retail Dealer' },
    { name: 'AL-AHMED TRADERS (MIANWALI)', type: 'Retail Dealer' },
    { name: 'HAMZA TRADERS', type: 'Retail Dealer' },
    { name: 'MOHIB TRADERS', type: 'Retail Dealer' },
    { name: 'HASSAN & BROTHERS CEMENT AGENCY', type: 'Retail Dealer' },
  ],
  peshawar: [
    { name: 'KHATTAK BROTHERS', type: 'Contractor' },
    { name: 'SIDDIQ ULLAH ENTERPRISES', type: 'Contractor' },
    { name: 'AL-HOBAIB TRADERS', type: 'Wholesale' },
    { name: 'AURANGZEB & CO.', type: 'Contractor' },
    { name: 'SHAH ENTERPRISES', type: 'Wholesale' },
    { name: 'QURESHI BROTHERS CEMENT DEALER', type: 'Retail Dealer' },
    { name: 'ALI BROTHERS', type: 'Retail Dealer' },
    { name: 'FOUR STAR TRADERS', type: 'Retail Dealer' },
    { name: 'KHALIL ENTERPRISES', type: 'Retail Dealer' },
    { name: 'PIRZADA ENTERPRISES', type: 'Retail Dealer' },
    { name: 'SHER ALI A& CO', type: 'Retail Dealer' },
    { name: 'UNITED CEMENT DEALERS', type: 'Dealer Network' },
    { name: 'SHAMS CEMENT DEALER', type: 'Retail Dealer' },
    { name: 'BUNAIR CEMENT TRADERS', type: 'Retail Dealer' },
    { name: 'IFTIKHAR ENTERPRISES', type: 'Retail Dealer' },
    { name: 'ALI BROTHERS KOHAT CEMENT DEALERS', type: 'Retail Dealer' },
    { name: 'BABAR ALI & CO', type: 'Retail Dealer' },
    { name: 'HAQ TRADERS', type: 'Retail Dealer' },
    { name: 'NOSHAD CEMENT DEALER', type: 'Retail Dealer' },
    { name: 'NEW SWAT STEEL AND CEMENT CORPORATION', type: 'Wholesale' },
  ],
  rawalpindi: [
    { name: 'FAZAL TRADERS', type: 'Retail Dealer' },
    { name: 'AFTAB TRADERS', type: 'Retail Dealer' },
    { name: 'AK TRADERS', type: 'Retail Dealer' },
    { name: 'FOUR STAR TRADERS (RWP)', type: 'Retail Dealer' },
    { name: 'WALI AKBAR CEMENT AGENCY', type: 'Retail Dealer' },
    { name: 'MUGHAL CEMENT STORE', type: 'Retail Dealer' },
    { name: 'CHAUHADRY AQEEL AND SONS', type: 'Retail Dealer' },
    { name: 'AL AWAN STEEL AND CEMENT STORE', type: 'Retail Dealer' },
    { name: 'KHALID MASOOD', type: 'Retail Dealer' },
    { name: 'HAFIZ TRADERS', type: 'Retail Dealer' },
    { name: 'TAIMOOR BROTHERS', type: 'Retail Dealer' },
    { name: 'MUHAMMAD AMIN CEMENT DEALER', type: 'Retail Dealer' },
    { name: 'AYUB ENTERPRISES', type: 'Retail Dealer' },
    { name: 'QURESHI BROTHERS CEMENT DEALER (RWP)', type: 'Retail Dealer' },
    { name: 'AS TRADERS', type: 'Retail Dealer' },
    { name: 'SAHIB REHMAN CEMENT AGENCY (RWP)', type: 'Retail Dealer' },
    { name: 'ALI TRADERS', type: 'Retail Dealer' },
    { name: 'AL KHAIR TRADERS', type: 'Retail Dealer' },
    { name: 'SALMAN TRADERS', type: 'Retail Dealer' },
    { name: 'S & B ENTERPRISES', type: 'Retail Dealer' },
  ],
  central_punjab: [
    { name: 'TAJ TRADERS', type: 'Retail Dealer' },
    { name: 'KOMBOH AMARTI STORE', type: 'Retail Dealer' },
    { name: 'FAISAL TRADER', type: 'Retail Dealer' },
    { name: 'DATA WALEY', type: 'Retail Dealer' },
    { name: 'MALIK TRADERS (SAMUNDRI)', type: 'Retail Dealer' },
    { name: 'MIAN HASHIM BUILDING MATERIAL', type: 'Retail Dealer' },
    { name: 'SARGODHA TRADERS', type: 'Retail Dealer' },
    { name: 'PRIDE TRADING CO', type: 'Wholesale' },
    { name: 'GUJJAR TRADERS', type: 'Retail Dealer' },
    { name: 'SHAHZAD TRADERS', type: 'Retail Dealer' },
    { name: 'SAAD TRADERS', type: 'Retail Dealer' },
  ]
};

const KOHAT_CREDIT_LIMITS = [0, 840, 1505, 630, 2051, 1204, 35, 770, 490, 770, 0, 0, 0, 700, 0, 0, 770, 980, 805, 0];
const PESHAWAR_CREDIT_LIMITS = [980, 980, 1225, 1470, 1225, 2100, 700, 1400, 700, 1470, 700, 1750, 175, 700, 1470, 70, 70, 1225, 1050, 2450];
const RAWALPINDI_CREDIT_LIMITS = [150, 225, 80, 1020, 520, 90, 90, 0, 0, 70, 735, 490, 245, 540, 175, 970, 320, 320, 0, 0];
const CENTRAL_PUNJAB_CREDIT_LIMITS = [35, 625, 700, 0, 410, 140, 105, 1400, 1050, 70, 550];

// Helper to generate mock intel
const generateMockIntel = (zoneId: string, count: number): CustomerIntel[] => {
  const creditLimits = zoneId === 'kohat' ? KOHAT_CREDIT_LIMITS :
                      zoneId === 'peshawar' ? PESHAWAR_CREDIT_LIMITS :
                      zoneId === 'rawalpindi' ? RAWALPINDI_CREDIT_LIMITS :
                      zoneId === 'central_punjab' ? CENTRAL_PUNJAB_CREDIT_LIMITS : [];

  return Array.from({ length: count }, (_, i) => {
    const last3wAvgDaily = Math.random() * 400 + 30;
    return {
      last3wAvgDaily,
      daysSinceLastReceipt: Math.floor(Math.random() * 11),
      pendingDuesPct: Math.random() * 85,
      weeklyTarget: last3wAvgDaily * 7 * (0.8 + Math.random() * 0.4),
      weekToDateActual: last3wAvgDaily * 4 * (0.7 + Math.random() * 0.6),
      consistencyPct: 55 + Math.random() * 43,
      growthTrend: -15 + Math.random() * 40,
      ytdMT: last3wAvgDaily * 200 * (0.9 + Math.random() * 0.2),
      ytdLastYearMT: last3wAvgDaily * 200 * (0.8 + Math.random() * 0.4), // Mock YTD Last Year
      retention: 700 + Math.random() * 300,
      creditLimitMT: creditLimits[i] !== undefined ? creditLimits[i] : (Math.random() * 1000)
    };
  });
};

export const CUST_INTEL: Record<string, CustomerIntel[]> = {
  kohat: generateMockIntel('kohat', 20),
  peshawar: generateMockIntel('peshawar', 20),
  rawalpindi: generateMockIntel('rawalpindi', 20),
  central_punjab: generateMockIntel('central_punjab', 20),
  south_punjab: generateMockIntel('south_punjab', 20),
  sindh: generateMockIntel('sindh', 20),
  baluchistan: generateMockIntel('baluchistan', 20),
  projects: generateMockIntel('projects', 20),
};

export const PRODUCT_RETS = {
  grey: { kohat: 820, peshawar: 790, rawalpindi: 850, central_punjab: 860, south_punjab: 810, sindh: 750, baluchistan: 720, projects: 800 },
  precast: { kohat: 910, peshawar: 880, rawalpindi: 940, central_punjab: 950, south_punjab: 900, sindh: 840, baluchistan: 810, projects: 890 },
  composite: { kohat: 760, peshawar: 730, rawalpindi: 780, central_punjab: 790, south_punjab: 750, sindh: 690, baluchistan: 660, projects: 740 },
};
