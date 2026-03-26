import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  History, 
  Plus, 
  ArrowRight,
  Zap,
  Filter,
  ArrowUpDown,
  BarChart3,
  DollarSign,
  Package,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ZONES, 
  CUSTOMER_TYPES, 
  PRICE_TIER_SCORE, 
  PRICE_TIER_MARGIN, 
  ZONE_CUSTOMERS, 
  CUST_INTEL, 
  PRODUCT_RETS 
} from './data';
import { 
  DailyTarget, 
  ScoredCustomer, 
  Customer, 
  CustomerIntel, 
  Zone,
  ZoneAllocation
} from './types';

// Utility to format numbers
const formatNum = (n: number) => Math.round(n).toLocaleString();

export default function App() {
  const [role, setRole] = useState<'hos' | 'zsm'>('hos');
  const [step, setStep] = useState<number>(1);
  const [mgmtDate, setMgmtDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalTarget, setTotalTarget] = useState<number>(9015);
  const [zoneAlloc, setZoneAlloc] = useState<Record<string, number>>({
    kohat: 21,
    peshawar: 44.5,
    rawalpindi: 9,
    central_punjab: 7,
    south_punjab: 11,
    sindh: 1,
    baluchistan: 0,
    projects: 6.5
  });
  const [submittedTargets, setSubmittedTargets] = useState<DailyTarget[]>([]);
  const [zsmDate, setZsmDate] = useState('');
  const [zsmZone, setZsmZone] = useState('');
  const [zsmAlloc, setZsmAlloc] = useState<Record<string, number>>({});
  const [zsmSortMode, setZsmSortMode] = useState<'score' | 'tier' | 'hist' | 'ytd'>('score');
  const [zsmFilterMode, setZsmFilterMode] = useState<'all' | 'high' | 'med' | 'low'>('all');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  // HOS Calculations
  const zoneData = useMemo(() => {
    let subtotalPct = 0;
    let subtotalQty = 0;
    let retSum = 0;
    let retCount = 0;

    const zones = ZONES.map(z => {
      const pct = zoneAlloc[z.id] || 0;
      const qty = Math.round(totalTarget * pct / 100);
      const avgRet = Math.round((PRODUCT_RETS.grey[z.id as keyof typeof PRODUCT_RETS.grey] + 
                               PRODUCT_RETS.precast[z.id as keyof typeof PRODUCT_RETS.precast] + 
                               PRODUCT_RETS.composite[z.id as keyof typeof PRODUCT_RETS.composite]) / 3);
      
      if (!z.isProjects) {
        subtotalPct += pct;
        subtotalQty += qty;
      }
      if (avgRet) {
        retSum += avgRet;
        retCount++;
      }
      return { ...z, pct, qty, avgRet };
    });

    const globalRet = retCount ? Math.round(retSum / retCount) : 0;
    return { zones, subtotalPct, subtotalQty, globalRet };
  }, [totalTarget, zoneAlloc]);

  const totalAllocPct = zoneData.zones.reduce((acc, z) => acc + z.pct, 0);
  const isAllocValid = Math.abs(totalAllocPct - 100) < 0.05;

  // ZSM Scoring Logic
  const scoredCustomers = useMemo(() => {
    if (!zsmZone || !zsmDate) return [];
    const target = submittedTargets.find(t => t.date === zsmDate);
    if (!target) return [];
    
    const zd = target.zones[zsmZone];
    if (!zd) return [];

    const customers = ZONE_CUSTOMERS[zsmZone] || [];
    const intelArr = CUST_INTEL[zsmZone] || [];

    const scored = customers.map((c, ci) => {
      const intel = intelArr[ci];
      const tier = CUSTOMER_TYPES[c.type] || 'C';
      
      // 1. Retention Score (40 pts)
      const retScore = Math.min((intel.retention / 1000) * 40, 40);

      // 2. YTD Comparison Score (30 pts)
      // Comparison: This Year vs Last Year. 15 points if equal, up to 30 if growing.
      const ytdGrowth = intel.ytdLastYearMT > 0 ? (intel.ytdMT / intel.ytdLastYearMT) : 1;
      const ytdScore = Math.min(ytdGrowth * 15, 30);

      // 3. Credit Limit Remaining Score (20 pts)
      // Priority if weekly limit is not utilized well this year.
      // Assuming ~12 weeks passed for YTD comparison.
      const avgWeeklyOfftake = intel.ytdMT / 12;
      const utilization = intel.creditLimitMT > 0 ? (avgWeeklyOfftake / intel.creditLimitMT) : 1;
      const creditScore = Math.max(0, (1 - utilization) * 20);

      // 4. Consistency Score (10 pts)
      const conScore = (intel.consistencyPct / 100) * 10;

      const totalScore = Math.round(retScore + ytdScore + creditScore + conScore);
      const score = Math.max(5, Math.min(100, totalScore));
      const priority = score >= 75 ? 'high' : score >= 50 ? 'med' : 'low';

      const hist = intel.last3wAvgDaily || 1;
      const rawSuggest = hist * (score / 60);

      return {
        c, ci, intel, score, priority, tier,
        tierMargin: PRICE_TIER_MARGIN[tier],
        scores: {
          retention: Math.round(retScore),
          ytd: Math.round(ytdScore),
          consistency: Math.round(conScore),
          credit: Math.round(creditScore)
        },
        rawSuggest,
        suggestMT: 0 // Will be normalized
      };
    });

    // Normalize suggestions
    const rawSum = scored.reduce((a, s) => a + s.rawSuggest, 0);
    scored.forEach(s => {
      s.suggestMT = rawSum > 0 ? Math.round(zd.qty * s.rawSuggest / rawSum) : Math.round(zd.qty / customers.length);
    });

    return scored;
  }, [zsmZone, zsmDate, submittedTargets]);

  const filteredAndSortedCustomers = useMemo(() => {
    let list = [...scoredCustomers];
    if (zsmFilterMode !== 'all') list = list.filter(s => s.priority === zsmFilterMode);
    
    if (zsmSortMode === 'score') list.sort((a, b) => b.score - a.score);
    if (zsmSortMode === 'tier') list.sort((a, b) => a.tier.localeCompare(b.tier));
    if (zsmSortMode === 'hist') list.sort((a, b) => b.intel.last3wAvgDaily - a.intel.last3wAvgDaily);
    if (zsmSortMode === 'ytd') list.sort((a, b) => b.intel.ytdMT - a.intel.ytdMT);
    
    return list;
  }, [scoredCustomers, zsmSortMode, zsmFilterMode]);

  const zsmTotalAllocPct = useMemo(() => {
    return Object.values(zsmAlloc).reduce((acc: number, val: number) => acc + val, 0);
  }, [zsmAlloc]);

  const zsmTotalAllocMT = useMemo(() => {
    const target = submittedTargets.find(t => t.date === zsmDate);
    const zd = target?.zones[zsmZone];
    if (!zd) return 0;
    return Object.values(zsmAlloc).reduce((acc: number, val: number) => {
      return acc + Math.round(zd.qty * val / 100);
    }, 0);
  }, [zsmAlloc, submittedTargets, zsmDate, zsmZone]);

  const zsmZoneQty = useMemo(() => {
    const target = submittedTargets.find(t => t.date === zsmDate);
    return target?.zones[zsmZone]?.qty || 0;
  }, [zsmDate, zsmZone, submittedTargets]);

  // Handlers
  const handleSubmitTarget = () => {
    const zones: Record<string, ZoneAllocation> = {};
    zoneData.zones.forEach(z => {
      zones[z.id] = { pct: z.pct, qty: z.qty, ret: z.avgRet };
    });
    const newTarget: DailyTarget = {
      date: mgmtDate,
      total: totalTarget,
      globalRet: zoneData.globalRet,
      zones
    };
    setSubmittedTargets([newTarget, ...submittedTargets.filter(t => t.date !== mgmtDate)]);
    setStep(2);
  };

  const toggleCard = (ci: number) => {
    const next = new Set(expandedCards);
    if (next.has(ci)) next.delete(ci);
    else next.add(ci);
    setExpandedCards(next);
  };

  const smartFill = () => {
    const next: Record<string, number> = {};
    scoredCustomers.forEach(s => {
      next[s.ci] = zsmZoneQty > 0 ? (s.suggestMT / zsmZoneQty * 100) : 0;
    });
    setZsmAlloc(next);
  };

  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <header className="bg-blue-900 text-white h-14 flex items-center justify-between px-6 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white text-blue-900 p-1 rounded font-black text-xs">KCCL</div>
          <h1 className="font-bold text-sm tracking-tight uppercase">Daily Target Management</h1>
        </div>
        <div className="flex bg-blue-800/50 rounded-lg p-1">
          <button 
            onClick={() => setRole('hos')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${role === 'hos' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'}`}
          >
            HOS VIEW
          </button>
          <button 
            onClick={() => setRole('zsm')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${role === 'zsm' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'}`}
          >
            ZSM VIEW
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 pb-24">
        <AnimatePresence mode="wait">
          {role === 'hos' ? (
            <motion.div 
              key="hos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-extrabold text-blue-900">Set Daily Target</h2>
                      <p className="text-slate-500 text-sm">Allocate volume and set retention benchmarks across zones</p>
                    </div>
                    <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg font-bold text-blue-900 shadow-sm flex items-center gap-2">
                      <Calendar size={16} />
                      {new Date(mgmtDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Date & Total Target */}
                  <div className="card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Date</label>
                        <input 
                          type="date" 
                          value={mgmtDate} 
                          onChange={(e) => setMgmtDate(e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Target (MT)</label>
                        <input 
                          type="number" 
                          value={totalTarget} 
                          onChange={(e) => setTotalTarget(Number(e.target.value))}
                          className="input w-full text-lg font-bold text-blue-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Retention</label>
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg px-4 py-2 text-right">
                          <span className="text-lg font-black text-amber-700">{formatNum(zoneData.globalRet)}</span>
                          <span className="text-[10px] font-bold text-amber-600 ml-1">PKR/MT</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Zone Table */}
                  <div className="card">
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Zone-wise Allocation</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                            <th className="px-6 py-3 text-left font-bold">Zone</th>
                            <th className="px-6 py-3 text-right font-bold">Allocation %</th>
                            <th className="px-6 py-3 text-right font-bold">Quantity (MT)</th>
                            <th className="px-6 py-3 text-right font-bold">Avg Retention</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {zoneData.zones.map(z => (
                            <tr key={z.id} className={z.isProjects ? 'bg-amber-50/30' : ''}>
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-700">{z.name}</div>
                                {z.isProjects && <span className="text-[9px] font-bold text-amber-600 uppercase">Special Projects</span>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <input 
                                    type="number" 
                                    value={z.pct}
                                    onChange={(e) => setZoneAlloc({ ...zoneAlloc, [z.id]: Number(e.target.value) })}
                                    className="w-20 text-right border-2 border-slate-200 rounded px-2 py-1 font-bold text-blue-600 outline-none focus:border-blue-600"
                                  />
                                  <span className="text-slate-400 font-bold">%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={`font-bold ${z.qty === 0 ? 'text-slate-300' : 'text-slate-900'}`}>
                                  {z.qty > 0 ? formatNum(z.qty) : '—'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="inline-block bg-amber-100 text-amber-800 px-2 py-1 rounded text-[10px] font-black uppercase">
                                  {formatNum(z.avgRet)} PKR/MT
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-blue-50/50 font-bold">
                          <tr className="border-t-2 border-blue-100">
                            <td className="px-6 py-4 text-blue-900">Grand Total</td>
                            <td className={`px-6 py-4 text-right ${isAllocValid ? 'text-green-600' : 'text-red-600'}`}>
                              {totalAllocPct.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 text-right text-blue-900">
                              {formatNum(totalTarget)} MT
                            </td>
                            <td className="px-6 py-4 text-right text-amber-700">
                              {formatNum(zoneData.globalRet)} PKR/MT
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    {/* Progress Bar */}
                    <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                          <span className={isAllocValid ? 'text-green-600' : totalAllocPct > 100 ? 'text-red-600' : 'text-slate-400'}>
                            {isAllocValid ? '✓ Fully Allocated' : totalAllocPct > 100 ? `⚠ Over by ${(totalAllocPct - 100).toFixed(1)}%` : `${(100 - totalAllocPct).toFixed(1)}% Remaining`}
                          </span>
                          <span className="text-blue-900">{totalAllocPct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(totalAllocPct, 100)}%` }}
                            className={`h-full ${isAllocValid ? 'bg-green-500' : totalAllocPct > 100 ? 'bg-red-500' : 'bg-blue-600'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 leading-relaxed">
                    <p className="font-bold mb-1">💡 Allocation Guidelines:</p>
                    <ul className="list-disc list-inside space-y-1 opacity-80">
                      <li>Minimum Standard Quantity for Kohat, Peshawar & Projects is fixed.</li>
                      <li>Adjust other zones to reach 100% total allocation.</li>
                      <li>Retention benchmarks are used to guide ZSM sales strategy.</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setStep(2)}
                      className="btn btn-ghost flex items-center gap-2"
                    >
                      <History size={16} />
                      View History
                    </button>
                    <button 
                      disabled={!isAllocValid || totalTarget <= 0}
                      onClick={handleSubmitTarget}
                      className="btn btn-primary px-8 flex items-center gap-2"
                    >
                      Submit Daily Target
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-extrabold text-blue-900">Submitted Targets</h2>
                    <button 
                      onClick={() => setStep(1)}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Plus size={16} />
                      New Target
                    </button>
                  </div>
                  <div className="card">
                    {submittedTargets.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <History size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No targets submitted yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {submittedTargets.map(t => (
                          <div key={t.date} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="bg-blue-100 text-blue-900 p-2 rounded-lg">
                                  <Calendar size={20} />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{new Date(t.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                  <div className="text-xs text-slate-500 font-medium">Retention: {formatNum(t.globalRet)} PKR/MT</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-black text-blue-900">{formatNum(t.total)} <span className="text-xs font-bold text-slate-400">MT</span></div>
                                <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Active</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="zsm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-extrabold text-blue-900">ZSM Allocation</h2>
                  <p className="text-slate-500 text-sm">Split zone target among customers using AI suggestions</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  Intelligent View
                </div>
              </div>

              {/* Selectors */}
              <div className="card p-6 bg-blue-900 text-white border-none shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Select Date</label>
                    <select 
                      value={zsmDate} 
                      onChange={(e) => { setZsmDate(e.target.value); setZsmZone(''); }}
                      className="w-full bg-blue-800 border-2 border-blue-700 rounded-lg px-3 py-2 outline-none focus:border-blue-400 transition-all font-bold"
                    >
                      <option value="">— Select Date —</option>
                      {submittedTargets.map(t => (
                        <option key={t.date} value={t.date}>{new Date(t.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Select Zone</label>
                    <select 
                      disabled={!zsmDate}
                      value={zsmZone} 
                      onChange={(e) => setZsmZone(e.target.value)}
                      className="w-full bg-blue-800 border-2 border-blue-700 rounded-lg px-3 py-2 outline-none focus:border-blue-400 transition-all font-bold disabled:opacity-50"
                    >
                      <option value="">— Select Zone —</option>
                      {ZONES.map(z => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {zsmZone && zsmDate ? (
                <div className="space-y-6">
                  {/* Summary Strip */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card p-4">
                      <div className="text-2xl font-black text-blue-900">{formatNum(zsmZoneQty)}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zone Target (MT)</div>
                    </div>
                    <div className="card p-4">
                      <div className="text-2xl font-black text-green-600">{scoredCustomers.filter(s => s.priority === 'high').length}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High Priority</div>
                    </div>
                    <div className="card p-4">
                      <div className="text-2xl font-black text-blue-600">{Math.round(scoredCustomers.reduce((a, s) => a + s.score, 0) / scoredCustomers.length)}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Score</div>
                    </div>
                    <div className="card p-4">
                      <div className="text-2xl font-black text-amber-600">{formatNum(submittedTargets.find(t => t.date === zsmDate)?.zones[zsmZone]?.ret || 0)}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Retention</div>
                    </div>
                  </div>

                  {/* Smart Fill Bar */}
                  <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                      <h3 className="text-lg font-bold flex items-center gap-2 justify-center md:justify-start">
                        <Zap size={20} className="text-yellow-400 fill-yellow-400" />
                        AI Dispatch Recommendation
                      </h3>
                      <p className="text-blue-200 text-xs mt-1">Factors: Retention · Avg Dispatch · YTD Volume · Consistency · Growth · Dues</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={smartFill}
                        className="bg-white text-blue-900 px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-md"
                      >
                        ⚡ Auto-fill by Score
                      </button>
                      <button 
                        onClick={() => setZsmAlloc({})}
                        className="bg-blue-800/50 text-white border border-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-800 transition-colors"
                      >
                        ↺ Clear
                      </button>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sort:</span>
                      <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                        {(['score', 'tier', 'hist', 'ytd'] as const).map(m => (
                          <button 
                            key={m}
                            onClick={() => setZsmSortMode(m)}
                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${zsmSortMode === m ? 'bg-blue-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
                      <div className="flex gap-2">
                        {(['all', 'high', 'med', 'low'] as const).map(f => (
                          <button 
                            key={f}
                            onClick={() => setZsmFilterMode(f)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${
                              zsmFilterMode === f 
                                ? 'bg-slate-900 text-white border-slate-900' 
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Customer Cards */}
                  <div className="space-y-4">
                    {filteredAndSortedCustomers.map(({ c, ci, intel, score, priority, tier, tierMargin, scores, suggestMT }) => {
                      const isExpanded = expandedCards.has(ci);
                      const allocPct = zsmAlloc[ci] || 0;
                      const allocMT = Math.round(zsmZoneQty * allocPct / 100);
                      const tierLabel = {'A':'Premium','B':'Standard','C':'Budget'}[tier];

                      return (
                        <div 
                          key={ci} 
                          className={`card transition-all duration-300 border-l-4 ${
                            priority === 'high' ? 'border-l-green-500' : priority === 'med' ? 'border-l-amber-500' : 'border-l-red-500'
                          }`}
                        >
                          <div 
                            className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50"
                            onClick={() => toggleCard(ci)}
                          >
                            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-lg ${
                              priority === 'high' ? 'bg-green-50 border-green-500 text-green-600' : 
                              priority === 'med' ? 'bg-amber-50 border-amber-500 text-amber-600' : 
                              'bg-red-50 border-red-500 text-red-600'
                            }`}>
                              {score}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-slate-900">{c.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.type} · Tier {tierLabel}</div>
                            </div>
                            <div className="hidden md:flex items-center gap-6">
                              <div className="text-right">
                                <div className="text-sm font-black text-blue-900">{formatNum(intel.last3wAvgDaily)}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase">Avg MT</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-black text-amber-600">{formatNum(intel.retention)}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase">Retention</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-black text-slate-700">{formatNum(intel.ytdMT)}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase">YTD MT</div>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              priority === 'high' ? 'bg-green-100 text-green-700' : 
                              priority === 'med' ? 'bg-amber-100 text-amber-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {priority === 'high' ? 'High Priority' : priority === 'med' ? 'Monitor' : 'Hold'}
                            </div>
                            {isExpanded ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-slate-50 border-t border-slate-100"
                              >
                                <div className="p-6 space-y-6">
                                  {/* Score Breakdown */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <ScoreItem label="Retention" val={scores.retention} max={40} sub={`${formatNum(intel.retention)} PKR/MT`} />
                                    <ScoreItem label="YTD Growth" val={scores.ytd} max={30} sub={`${formatNum(intel.ytdMT)} vs ${formatNum(intel.ytdLastYearMT)}`} />
                                    <ScoreItem label="Credit Space" val={scores.credit} max={20} sub={`${formatNum(intel.creditLimitMT)} MT Limit`} />
                                    <ScoreItem label="Consistency" val={scores.consistency} max={10} sub={`${intel.consistencyPct.toFixed(0)}% Reliable`} />
                                  </div>

                                  {/* Allocation Input */}
                                  <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="text-center md:text-left">
                                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Allocate MT for Today</div>
                                      <div className="text-sm font-bold text-green-600 mt-1 flex items-center gap-1 justify-center md:justify-start">
                                        <Zap size={14} className="fill-green-600" />
                                        Suggested: {formatNum(suggestMT)} MT
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <button 
                                        onClick={() => {
                                          const pct = zsmZoneQty > 0 ? (suggestMT / zsmZoneQty * 100) : 0;
                                          setZsmAlloc({ ...zsmAlloc, [ci]: pct });
                                        }}
                                        className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                                      >
                                        Accept Suggestion
                                      </button>
                                      <div className="flex items-center gap-2">
                                        <input 
                                          type="number" 
                                          value={allocPct || ''}
                                          placeholder={Math.round(zsmZoneQty > 0 ? (suggestMT / zsmZoneQty * 100) : 0).toString()}
                                          onChange={(e) => setZsmAlloc({ ...zsmAlloc, [ci]: Number(e.target.value) })}
                                          className="w-24 text-right border-2 border-blue-600 rounded-lg px-3 py-2 font-black text-blue-900 outline-none focus:ring-4 focus:ring-blue-100"
                                        />
                                        <span className="text-blue-900 font-black">%</span>
                                      </div>
                                      <div className="w-24 text-right">
                                        <div className="text-lg font-black text-blue-900">{allocMT > 0 ? formatNum(allocMT) : '—'}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">MT</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  {/* ZSM Progress Bar */}
                  <div className="card bg-slate-900 text-white p-6 sticky bottom-6 shadow-2xl border-none">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Total Allocation Progress</div>
                        <div className={`text-lg font-black ${Math.abs(zsmTotalAllocPct - 100) < 0.1 ? 'text-green-400' : 'text-white'}`}>
                          {zsmTotalAllocMT.toLocaleString()} <span className="text-xs font-bold opacity-50">/ {zsmZoneQty.toLocaleString()} MT</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-black ${Math.abs(zsmTotalAllocPct - 100) < 0.1 ? 'text-green-400' : 'text-blue-300'}`}>
                          {zsmTotalAllocPct.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="h-3 bg-blue-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(zsmTotalAllocPct, 100)}%` }}
                        className={`h-full ${Math.abs(zsmTotalAllocPct - 100) < 0.1 ? 'bg-green-400' : 'bg-blue-400'}`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card p-12 text-center text-slate-400">
                  <MapPin size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Select a date and zone to load targets.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ScoreItem({ label, val, max, sub, isPenalty = false }: { label: string, val: number, max: number, sub: string, isPenalty?: boolean }) {
  const pct = max !== 0 ? Math.min(Math.abs(val) / Math.abs(max) * 100, 100) : 0;
  const color = isPenalty ? 'bg-red-500' : val > (max * 0.7) ? 'bg-green-500' : val > (max * 0.4) ? 'bg-amber-500' : 'bg-slate-400';
  const textColor = isPenalty ? 'text-red-600' : val > (max * 0.7) ? 'text-green-600' : val > (max * 0.4) ? 'text-amber-600' : 'text-slate-500';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-sm font-black ${textColor}`}>{val > 0 && !isPenalty ? '+' : ''}{val}</div>
      <div className="text-[9px] font-medium text-slate-500 mt-0.5">{sub}</div>
      <div className="h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
