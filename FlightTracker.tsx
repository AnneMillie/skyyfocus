
import React, { useState, useEffect, useRef } from 'react';
import { Airport, TimerMode, PomodoroStatus } from '../types.ts';
import { POMODORO_WORK_TIME, POMODORO_BREAK_TIME } from '../constants.tsx';

interface FlightTrackerProps {
  from: Airport | null;
  to: Airport | null;
  mode: TimerMode;
  onProgressUpdate: (p: number) => void;
  onTimeUpdate: (t: number) => void;
  onArrived: () => void;
  onAbort: () => void;
  pomodoroStatus: PomodoroStatus;
  onPomodoroTransition: (s: PomodoroStatus) => void;
}

const FlightTracker: React.FC<FlightTrackerProps> = ({ 
  from, to, mode, onProgressUpdate, onTimeUpdate, onArrived, onAbort, pomodoroStatus, onPomodoroTransition 
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [totalFlightSeconds, setTotalFlightSeconds] = useState(0);

  useEffect(() => {
    if (!from || !to) return;
    const R = 6371; 
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lon - from.lon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Cruise speed ~850km/h
    setTotalFlightSeconds(Math.max(600, Math.floor((dist / 850) * 3600)));
  }, [from, to]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        onProgressUpdate(Math.min(next / totalFlightSeconds, 1));
        if (next >= totalFlightSeconds && totalFlightSeconds > 0) {
          clearInterval(timer);
          onArrived();
        }
        return next;
      });

      if (mode === TimerMode.POMODORO) {
        setPomodoroSeconds(prev => {
          const next = prev + 1;
          const limit = pomodoroStatus === PomodoroStatus.WORKING ? POMODORO_WORK_TIME : POMODORO_BREAK_TIME;
          
          if (next >= limit) {
            const nextStatus = pomodoroStatus === PomodoroStatus.WORKING ? PomodoroStatus.BREAK : PomodoroStatus.WORKING;
            onPomodoroTransition(nextStatus);
            return 0;
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [totalFlightSeconds, mode, pomodoroStatus, onPomodoroTransition, onArrived, onProgressUpdate]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const remainingFlight = Math.max(0, totalFlightSeconds - elapsedSeconds);
  const pomodoroDisplayTime = (pomodoroStatus === PomodoroStatus.WORKING ? POMODORO_WORK_TIME : POMODORO_BREAK_TIME) - pomodoroSeconds;

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[1500] flex flex-col items-center gap-6 w-full px-4 max-w-lg">
      {/* Pomodoro Indicator */}
      {mode === TimerMode.POMODORO && (
        <div className={`w-full px-8 py-4 rounded-3xl border-2 backdrop-blur-md shadow-2xl flex items-center justify-between transition-all duration-700
          ${pomodoroStatus === PomodoroStatus.WORKING ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' : 'bg-green-400/20 border-green-400 text-green-400'}
        `}>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60 mb-1">
              {pomodoroStatus === PomodoroStatus.WORKING ? 'FASTEN SEATBELTS' : 'SNACK TIME - SEATBELTS OFF'}
            </span>
            <span className="text-4xl font-black">
              {Math.floor(pomodoroDisplayTime / 60)}:{ (pomodoroDisplayTime % 60).toString().padStart(2,'0') }
            </span>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-current ${pomodoroStatus === PomodoroStatus.WORKING ? 'animate-pulse' : 'bg-green-400 text-slate-900'}`}>
             {pomodoroStatus === PomodoroStatus.WORKING ? '✈' : '🥨'}
          </div>
        </div>
      )}

      {/* Main Flight Timer */}
      <div className="w-full p-8 bg-slate-900/95 backdrop-blur-2xl border-2 border-white/10 rounded-[40px] shadow-2xl text-center">
        <h4 className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em] mb-3">Estimated Time of Arrival</h4>
        <div className="text-7xl font-black text-white tracking-tighter mb-8 tabular-nums">
          {formatTime(remainingFlight)}
        </div>
        
        <div className="flex gap-4">
           <button 
             onClick={onAbort}
             className="flex-1 py-4 bg-red-600/10 text-red-500 text-xs font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest border border-red-600/30"
           >
             Abort Flight
           </button>
        </div>
      </div>
    </div>
  );
};

export default FlightTracker;
