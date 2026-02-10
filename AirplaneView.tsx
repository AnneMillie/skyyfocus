
import React from 'react';
import { Airport, TimerMode } from '../types.ts';

interface AirplaneViewProps {
  from: Airport | null;
  to: Airport | null;
  selectedSeat: string | null;
  setSelectedSeat: (s: string) => void;
  onConfirm: (mode: TimerMode) => void;
  onBack: () => void;
  onReset: () => void;
}

const AirplaneView: React.FC<AirplaneViewProps> = ({ from, to, selectedSeat, setSelectedSeat, onConfirm, onBack, onReset }) => {
  const rows = 30;
  const cols = ['A', 'B', 'C', 'D'];

  return (
    <div className="absolute inset-0 z-[2000] bg-slate-950 flex flex-col items-center">
      {/* Flight Context Header */}
      <div className="fixed top-12 left-12 flex flex-col gap-4 z-[2001]">
        <h2 className="text-6xl font-black text-yellow-400 leading-none tracking-tighter">
          {from?.iata} <span className="text-white/20">→</span> {to?.iata}
        </h2>
        <div className="flex gap-4">
          <button onClick={onBack} className="px-6 py-2 bg-slate-800 text-yellow-400 border border-yellow-400/30 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-yellow-400/10 transition-colors">
            ← Change Route
          </button>
          <button onClick={onReset} className="px-6 py-2 bg-red-600/20 text-red-500 border border-red-600/30 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
            Cancel
          </button>
        </div>
      </div>

      {/* Interactive Seat Selection Grid */}
      <div className="w-full h-full pt-48 pb-64 overflow-y-auto no-scrollbar flex justify-center">
        <div className="w-[420px] bg-slate-900 border-x-[12px] border-t-[12px] border-slate-800 rounded-t-[200px] relative shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          {/* Cockpit / Nose area */}
          <div className="h-48 flex items-end justify-center pb-8 border-b border-white/5">
             <div className="w-48 h-2 bg-yellow-400/10 rounded-full"></div>
          </div>
          
          <div className="p-10">
            <div className="grid grid-cols-5 gap-3">
              {/* Header Row */}
              <div className="text-center"></div>
              {cols.map(c => <div key={c} className="text-center text-slate-500 font-black text-xs pb-4">{c}</div>)}
              
              {/* Seat Map */}
              {Array.from({ length: rows }).map((_, rIdx) => {
                const rowNum = rIdx + 1;
                return (
                  <React.Fragment key={rowNum}>
                    <div className="flex items-center justify-center text-slate-600 font-bold text-[10px]">{rowNum}</div>
                    {cols.map(l => {
                      const id = `${rowNum}${l}`;
                      // Deterministic "taken" seats for realism
                      const isTaken = (rowNum * 7 + l.charCodeAt(0)) % 5 === 0;
                      const isSelected = selectedSeat === id;
                      return (
                        <button 
                          key={id}
                          disabled={isTaken}
                          onClick={() => setSelectedSeat(id)}
                          className={`h-10 w-full rounded-md border-2 transition-all duration-200
                            ${isTaken ? 'bg-slate-950 border-slate-800/50 cursor-not-allowed opacity-30' : 
                              isSelected ? 'bg-yellow-400 border-white text-black font-black scale-110 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 
                              'bg-slate-800 border-slate-700 hover:border-yellow-400/50 hover:bg-slate-700'}
                          `}
                        >
                          {!isTaken && isSelected ? id : ''}
                        </button>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selection Footer */}
      <div className="fixed bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-slate-400 text-sm font-black tracking-[0.3em] uppercase">
          {selectedSeat ? `Boarding Seat ${selectedSeat}` : 'Please Select a Seat to Proceed'}
        </div>
        
        {selectedSeat && (
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
            <button 
              onClick={() => onConfirm(TimerMode.POMODORO)}
              className="flex-1 py-5 bg-yellow-400 text-black font-black rounded-2xl shadow-2xl shadow-yellow-400/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest flex flex-col items-center justify-center"
            >
              <span className="text-xl">Snacks</span>
              <span className="text-[10px] opacity-60 mt-1">30m Work / 10m Break</span>
            </button>
            <button 
              onClick={() => onConfirm(TimerMode.NORMAL)}
              className="flex-1 py-5 bg-slate-800 text-yellow-400 border-2 border-yellow-400/30 font-black rounded-2xl hover:bg-yellow-400/10 active:scale-95 transition-all uppercase tracking-widest flex flex-col items-center justify-center"
            >
              <span className="text-xl">No Snacks</span>
              <span className="text-[10px] opacity-60 mt-1">Standard Focus</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AirplaneView;
