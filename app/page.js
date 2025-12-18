"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, ChevronDown } from 'lucide-react';

// Liste étendue des monnaies mondiales
const CURRENCY_LIST = [
  { code: 'usd', symbol: '$', name: 'US Dollar' },
  { code: 'eur', symbol: '€', name: 'Euro' },
  { code: 'gbp', symbol: '£', name: 'Pound Sterling' },
  { code: 'jpy', symbol: '¥', name: 'Japanese Yen' },
  { code: 'aud', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'cad', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'chf', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'cny', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'inr', symbol: '₹', name: 'Indian Rupee' },
  { code: 'btc', symbol: '₿', name: 'Bitcoin' }
];

export default function CryptoPulse() {
  const [prices, setPrices] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCY_LIST[0]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    try {
      // On demande à l'API le prix directement dans la monnaie sélectionnée
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano&vs_currencies=${selectedCurrency.code}&include_24hr_change=true`
      );
      const data = await res.json();
      setPrices(data);
      setLoading(false);
    } catch (e) { console.error(e); }
  };

  // On recharge les prix dès que la monnaie change avec intervalle
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [selectedCurrency]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">SYNC...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-16">
        <h1 className="font-crimson text-2xl font-bold italic flex items-center gap-3">          
          <Activity className="text-purple-500" /> CRYPTO.PULSE
        </h1>

        <div className="relative group">
          <select 
            value={selectedCurrency.code}
            onChange={(e) => {
              const newCurr = CURRENCY_LIST.find(c => c.code === e.target.value);
              setSelectedCurrency(newCurr);
              setLoading(true);
            }}
            className="appearance-none bg-white/[0.03] border border-white/10 text-white text-xs font-bold py-3 px-6 pr-12 rounded-2xl cursor-pointer hover:bg-white/[0.07] transition-all outline-none"
          >
            {CURRENCY_LIST.map((c) => (
              <option key={c.code} value={c.code} className="bg-[#050505] text-white">
                {c.code.toUpperCase()} - {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(prices).map(([id, data]) => {
          const price = data[selectedCurrency.code];
          const change = data[`${selectedCurrency.code}_24h_change`];

          return (
            <motion.div 
              key={id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem]"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-gray-500 text-[10px] font-black tracking-widest uppercase">{id}</span>
                <span className={`text-[10px] font-bold ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change?.toFixed(2)}%
                </span>
              </div>
              <div className="text-3xl font-itim font-bold">
                <span className="text-purple-500 mr-2">{selectedCurrency.symbol}</span>
                {price?.toLocaleString()}
              </div>
            </motion.div>
          );
        })}
      </main>
    </div>
  );
}