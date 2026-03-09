"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { ArrowUpDown, Activity, TrendingUp, TrendingDown, Clock, Info } from 'lucide-react';

// Import dynamique pour ApexCharts (nécessaire pour Next.js)
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function ZenkaDashPro() {
  // --- ÉTATS ---
  const [currencyData, setCurrencyData] = useState({});
  const [codes, setCodes] = useState([]);
  const [fromCurr, setFromCurr] = useState('btc');
  const [toCurr, setToCurr] = useState('eur');
  const [amount, setAmount] = useState(1);
  const [timeframe, setTimeframe] = useState('30');
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- LOGIQUE PARALLAXE ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 45, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 45, damping: 20 });

  useEffect(() => {
    const handleMove = (e) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 50);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 50);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [mouseX, mouseY]);

  // --- 1. INITIALISATION DES DONNÉES DE CHANGE ---
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/exchange_rates');
        if (!res.ok) throw new Error("API Limit reached");
        const data = await res.json();
        setCurrencyData(data.rates);
        setCodes(Object.keys(data.rates));
      } catch (e) {
        setError("Serveur de taux indisponible");
        console.error(e);
      }
    };
    fetchRates();
  }, []);

  // --- 2. LOGIQUE DE DEBOUNCE & RÉCUPÉRATION GRAPHIQUE ---
  useEffect(() => {
    if (codes.length === 0) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const [resFrom, resTo] = await Promise.all([
          fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${fromCurr}&days=${timeframe}`),
          fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${toCurr}&days=${timeframe}`)
        ]);

        if (resFrom.status === 429 || resTo.status === 429) throw new Error("Trop de requêtes (429)");

        const dataFrom = await resFrom.json();
        const dataTo = await resTo.json();

        const relativePrices = dataTo.prices.map((point, index) => ({
          x: point[0],
          y: (point[1] / (dataFrom.prices[index] ? dataFrom.prices[index][1] : 1)).toFixed(4)
        }));

        setSeries([{ name: `${fromCurr.toUpperCase()}/${toCurr.toUpperCase()}`, data: relativePrices }]);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [fromCurr, toCurr, timeframe, codes]);

  // --- 3. CALCULS EN TEMPS RÉEL ---
  const currentRate = useMemo(() => {
    if (!currencyData[fromCurr] || !currencyData[toCurr]) return 0;
    return currencyData[toCurr].value / currencyData[fromCurr].value;
  }, [fromCurr, toCurr, currencyData]);

  const isBullish = useMemo(() => {
    if (!series[0]?.data.length) return true;
    const data = series[0].data;
    return parseFloat(data[data.length - 1].y) >= parseFloat(data[0].y);
  }, [series]);

  const accentColor = isBullish ? "#4ade80" : "#f87171";

  // --- 4. CONFIGURATION DU GRAPHIQUE ---
  const chartOptions = {
    chart: { sparkline: { enabled: true }, animations: { enabled: true, speed: 600 } },
    stroke: { curve: 'smooth', width: 2, colors: [accentColor] },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0 } },
    xaxis: { type: 'datetime' },
    tooltip: {
      theme: 'dark',
      x: { show: true, format: 'dd MMM yyyy HH:mm' },
      y: { formatter: (v) => `${v} ${toCurr.toUpperCase()}` }
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] text-white flex items-center justify-center p-6 font-sans overflow-hidden relative">
      
      {/* --- DYNAMIC BACKGROUND (PARALLAX + GLOW) --- */}
      <motion.div style={{ x: smoothX, y: smoothY, scale: 1.2 }} className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ backgroundColor: accentColor }}
          transition={{ duration: 1.5 }}
          className="absolute top-1/4 left-1/3 w-[500px] h-[500px] opacity-[0.12] blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ backgroundColor: accentColor }}
          transition={{ duration: 1.5 }}
          className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] opacity-[0.08] blur-[140px] rounded-full" 
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-15 mix-blend-overlay" />
      </motion.div>

      {/* --- MAIN DASHBOARD WIDGET --- */}
      <motion.div 
        style={{ 
          x: useSpring(mouseX, {stiffness: 150, damping: 30}), 
          y: useSpring(mouseY, {stiffness: 150, damping: 30}) 
        }}
        className="z-10 w-full max-w-[440px] space-y-5"
      >
        
        {/* TUILE 1 : PERFORMANCE */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1 flex items-center gap-2">
                <Activity size={12} /> Live Analytics
              </p>
              <h2 className="text-3xl font-light tracking-tighter">
                {(amount * currentRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                <span className="text-sm text-gray-600 ml-2 uppercase font-bold">{toCurr}</span>
              </h2>
            </div>
            <div className={`p-2 rounded-xl transition-colors duration-1000`} style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
              {isBullish ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>

          <div className="h-[150px] mt-4 -mx-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-700 text-[10px] uppercase tracking-widest animate-pulse font-bold">Fetching Market Data...</div>
            ) : (
              <Chart options={chartOptions} series={series} type="area" height="100%" />
            )}
          </div>

          <div className="flex justify-between mt-6 bg-white/5 p-1 rounded-2xl border border-white/5">
            {['1', '7', '30', '365'].map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)} 
                className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${timeframe === tf ? 'bg-white/10 text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}>
                {tf}D
              </button>
            ))}
          </div>
        </div>

        {/* TUILE 2 : CONVERTISSEUR */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 shadow-2xl space-y-2">
          
          <div className="bg-white/5 rounded-[2rem] p-6 hover:ring-1 ring-white/10 transition-all">
            <div className="flex justify-between items-center mb-2 text-[9px] uppercase tracking-widest text-gray-600 font-black">
              <span>Source</span>
              <span className="text-gray-500 lowercase italic">{currencyData[fromCurr]?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} 
                className="bg-transparent border-none text-2xl font-light outline-none w-1/2 text-white" />
              <select value={fromCurr} onChange={(e) => setFromCurr(e.target.value)} 
                className="bg-white/5 text-[11px] font-bold text-gray-300 px-3 py-2 rounded-xl outline-none cursor-pointer border-none">
                {codes.map(c => <option key={c} value={c} className="bg-[#020205]">{c.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-center -my-7 relative z-20">
            <button onClick={() => { setFromCurr(toCurr); setToCurr(fromCurr); }} 
              className="bg-[#020205] border border-white/10 p-3 rounded-full hover:rotate-180 transition-all duration-500 shadow-2xl"
              style={{ color: accentColor }}>
              <ArrowUpDown size={20} />
            </button>
          </div>

          <div className="bg-white/5 rounded-[2rem] p-6 hover:ring-1 ring-white/10 transition-all">
            <div className="flex justify-between items-center mb-2 text-[9px] uppercase tracking-widest text-gray-600 font-black">
              <span>Estimated</span>
              <span className="text-gray-500 lowercase italic">{currencyData[toCurr]?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-light text-white tracking-tight">
                {(amount * currentRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <select value={toCurr} onChange={(e) => setToCurr(e.target.value)} 
                className="bg-white/5 text-[11px] font-bold text-gray-300 px-3 py-2 rounded-xl outline-none cursor-pointer border-none">
                {codes.map(c => <option key={c} value={c} className="bg-[#020205]">{c.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* FEEDBACK & FOOTER */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] p-3 rounded-2xl text-center font-bold tracking-widest animate-pulse">
            {error.toUpperCase()}
          </div>
        )}

        <div className="flex items-center justify-between px-6 text-[9px] text-gray-700 font-black uppercase tracking-[0.2em]">
           <div className="flex items-center gap-2"><Clock size={10} /> Market Live</div>
           <div>1 {fromCurr} = {currentRate.toFixed(4)} {toCurr}</div>
        </div>

      </motion.div>
    </div>
  );
}