"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ArrowUpDown, Activity, Search, TrendingUp, TrendingDown, Clock } from 'lucide-react';

// Import dynamique pour éviter les erreurs de rendu côté serveur
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function ProfessionalCryptoDashboard() {
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
        setError("L'API est temporairement indisponible.");
        console.error(e);
      }
    };
    fetchRates();
  }, []);

  // --- 2. LOGIQUE DE DEBOUNCE & RÉCUPÉRATION GRAPHIQUE ---
  // On utilise un useEffect avec un timer pour éviter de spammer l'API
  useEffect(() => {
    if (codes.length === 0) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        // On récupère l'historique du BTC par rapport aux deux devises pour calculer le ratio réel
        const [resFrom, resTo] = await Promise.all([
          fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${fromCurr}&days=${timeframe}`),
          fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${toCurr}&days=${timeframe}`)
        ]);

        if (resFrom.status === 429 || resTo.status === 429) {
          throw new Error("Trop de requêtes. Attendez une minute.");
        }

        const dataFrom = await resFrom.json();
        const dataTo = await resTo.json();

        // Calcul du ratio historique point par point
        const relativePrices = dataTo.prices.map((point, index) => {
          const timestamp = point[0];
          const priceToInBtc = point[1];
          const priceFromInBtc = dataFrom.prices[index] ? dataFrom.prices[index][1] : 1;
          return { x: timestamp, y: (priceToInBtc / priceFromInBtc).toFixed(4) };
        });

        setSeries([{ name: `${fromCurr.toUpperCase()}/${toCurr.toUpperCase()}`, data: relativePrices }]);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }, 600); // Délai de 600ms (Debounce)

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

  // --- 4. CONFIGURATION DU GRAPHIQUE ---
  const chartOptions = {
    chart: { sparkline: { enabled: true }, animations: { enabled: true, speed: 600 } },
    stroke: { curve: 'smooth', width: 2, colors: [isBullish ? '#4ade80' : '#f87171'] },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0, stops: [0, 100] }
    },
    xaxis: { type: 'datetime' },
    tooltip: {
      theme: 'dark',
      x: { show: true, format: 'dd MMM yyyy HH:mm' },
      y: { formatter: (v) => `${v.toLocaleString()} ${toCurr.toUpperCase()}` }
    },
    markers: { size: 0, hover: { size: 5 } }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[440px] space-y-5">
        
        {/* TUILE 1 : PERFORMANCE & GRAPH */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1 flex items-center gap-2">
                <Activity size={12} /> Live Performance
              </p>
              <h2 className="text-3xl font-light tracking-tighter">
                {(amount * currentRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                <span className="text-sm text-gray-600 ml-2 uppercase font-bold">{toCurr}</span>
              </h2>
            </div>
            <div className={`p-2 rounded-xl ${isBullish ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {isBullish ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>

          {/* Graphique */}
          <div className="h-[160px] mt-4 -mx-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-700 text-xs animate-pulse">Loading data...</div>
            ) : (
              <Chart options={chartOptions} series={series} type="area" height="100%" />
            )}
          </div>

          {/* Timeframe Selector */}
          <div className="flex justify-between mt-6 bg-black/40 p-1 rounded-2xl border border-white/5 relative z-10">
            {['1', '7', '30', '365'].map(tf => (
              <button 
                key={tf} 
                onClick={() => setTimeframe(tf)} 
                className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${timeframe === tf ? 'bg-[#1a1a1a] text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}
              >
                {tf}D
              </button>
            ))}
          </div>
        </div>

        {/* TUILE 2 : CONVERTISSEUR DASHBOARD STYLE */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-3 shadow-2xl space-y-2">
          
          {/* Input Source */}
          <div className="bg-[#161616] rounded-[2rem] p-6 hover:ring-1 ring-white/10 transition-all">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] uppercase tracking-widest text-gray-600 font-black">From Amount</span>
              <span className="text-[10px] text-gray-500 font-medium">{currencyData[fromCurr]?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="bg-transparent border-none text-2xl font-light outline-none w-1/2 text-white placeholder-gray-800"
              />
              <select 
                value={fromCurr} 
                onChange={(e) => setFromCurr(e.target.value)} 
                className="bg-[#1f1f1f] text-xs font-bold text-gray-300 px-3 py-2 rounded-xl outline-none cursor-pointer border-none"
              >
                {codes.map(c => <option key={c} value={c} className="bg-[#0f0f0f]">{c.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-7 relative z-20">
            <button 
              onClick={() => { setFromCurr(toCurr); setToCurr(fromCurr); }} 
              className="bg-[#0f0f0f] border border-white/10 p-3 rounded-full hover:rotate-180 transition-all duration-500 text-blue-400 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            >
              <ArrowUpDown size={20} />
            </button>
          </div>

          {/* Output Target */}
          <div className="bg-[#161616] rounded-[2rem] p-6 hover:ring-1 ring-white/10 transition-all">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] uppercase tracking-widest text-gray-600 font-black">Estimated To</span>
              <span className="text-[10px] text-gray-500 font-medium">{currencyData[toCurr]?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-light text-white tracking-tight">
                {(amount * currentRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <select 
                value={toCurr} 
                onChange={(e) => setToCurr(e.target.value)} 
                className="bg-[#1f1f1f] text-xs font-bold text-gray-300 px-3 py-2 rounded-xl outline-none cursor-pointer border-none"
              >
                {codes.map(c => <option key={c} value={c} className="bg-[#0f0f0f]">{c.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* FEEDBACK & ERRORS */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] p-3 rounded-2xl text-center font-bold animate-pulse">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between px-6 text-[9px] text-gray-700 font-black uppercase tracking-widest">
           <div className="flex items-center gap-2"><Clock size={10} /> Real-time Updates</div>
           <div>1 {fromCurr} = {currentRate.toFixed(4)} {toCurr}</div>
        </div>

      </div>
    </div>
  );
}