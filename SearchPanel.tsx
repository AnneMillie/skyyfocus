
import React, { useState, useEffect } from 'react';
import { Airport } from '../types';

interface SearchPanelProps {
  from: Airport | null;
  to: Airport | null;
  setFrom: (a: Airport) => void;
  setTo: (a: Airport) => void;
  onBoarding: () => void;
  onReset: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ from, to, setFrom, setTo, onBoarding, onReset }) => {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromMatches, setFromMatches] = useState<Airport[]>([]);
  const [toMatches, setToMatches] = useState<Airport[]>([]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/mwgg/Airports/master/airports.json')
      .then(res => res.json())
      .then(data => {
        const list = Object.values(data) as Airport[];
        setAirports(list.filter(a => a.iata && a.iata.length === 3));
      });
  }, []);

  const handleSearch = (query: string, setter: (list: Airport[]) => void) => {
    if (query.length < 2) {
      setter([]);
      return;
    }
    const q = query.toLowerCase();
    const filtered = airports.filter(a => 
      a.city.toLowerCase().includes(q) || 
      a.iata.toLowerCase().includes(q) || 
      a.name.toLowerCase().includes(q)
    ).slice(0, 5);
    setter(filtered);
  };

  const getEstTime = () => {
    if (!from || !to) return "00:00:00";
    const R = 6371; 
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lon - from.lon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const totalSeconds = Math.floor((dist / 850) * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  return (
    <div className="absolute top-8 left-8 z-[1000] w-80 p-6 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
      <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter">SkyFocus</h2>
      <p className="text-xs text-slate-400 mb-6 font-medium">Select your departure & destination</p>
      
      <div className="space-y-4">
        <div className="relative">
          <input 
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-yellow-400 focus:outline-none focus:border-yellow-400 transition-colors"
            placeholder="Departure (e.g. London)"
            value={from?.city || fromQuery}
            onChange={(e) => {
              setFromQuery(e.target.value);
              handleSearch(e.target.value, setFromMatches);
            }}
          />
          {fromMatches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-yellow-400/20 rounded-xl overflow-hidden shadow-xl z-10">
              {fromMatches.map(a => (
                <div 
                  key={a.iata} 
                  className="px-4 py-2 hover:bg-yellow-400/10 cursor-pointer text-sm text-yellow-200"
                  onClick={() => { setFrom(a); setFromMatches([]); setFromQuery(''); }}
                >
                  {a.city} ({a.iata})
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <input 
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-yellow-400 focus:outline-none focus:border-yellow-400 transition-colors"
            placeholder="Destination (e.g. Tokyo)"
            value={to?.city || toQuery}
            onChange={(e) => {
              setToQuery(e.target.value);
              handleSearch(e.target.value, setToMatches);
            }}
          />
          {toMatches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-yellow-400/20 rounded-xl overflow-hidden shadow-xl z-10">
              {toMatches.map(a => (
                <div 
                  key={a.iata} 
                  className="px-4 py-2 hover:bg-yellow-400/10 cursor-pointer text-sm text-yellow-200"
                  onClick={() => { setTo(a); setToMatches([]); setToQuery(''); }}
                >
                  {a.city} ({a.iata})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {from && to && (
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Estimated Flight Time</div>
          <div className="text-3xl font-black text-yellow-400 mb-6">{getEstTime()}</div>
          <button 
            onClick={onBoarding}
            className="w-full py-4 bg-yellow-400 text-black font-black rounded-xl hover:bg-yellow-300 transition-colors uppercase tracking-widest shadow-lg shadow-yellow-400/20"
          >
            Enter Airplane
          </button>
        </div>
      )}

      <button 
        onClick={onReset}
        className="w-full mt-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold hover:text-red-400 transition-colors"
      >
        Reset Selection
      </button>
    </div>
  );
};

export default SearchPanel;
