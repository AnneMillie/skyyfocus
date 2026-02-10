
import React, { useState, useEffect, useRef } from 'react';
import { Airport, FlightPhase, TimerMode, PomodoroStatus } from './types.ts';
import MapView from './components/MapView.tsx';
import SearchPanel from './components/SearchPanel.tsx';
import AirplaneView from './components/AirplaneView.tsx';
import FlightTracker from './components/FlightTracker.tsx';
import SnackModal from './components/SnackModal.tsx';

const DING_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const App: React.FC = () => {
  const [phase, setPhase] = useState<FlightPhase>(FlightPhase.PLANNING);
  const [fromAirport, setFromAirport] = useState<Airport | null>(null);
  const [toAirport, setToAirport] = useState<Airport | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [timerMode, setTimerMode] = useState<TimerMode>(TimerMode.NORMAL);
  const [pomodoroStatus, setPomodoroStatus] = useState<PomodoroStatus>(PomodoroStatus.WORKING);
  const [showSnackModal, setShowSnackModal] = useState(false);
  const [flightProgress, setFlightProgress] = useState(0); 
  const [remainingTime, setRemainingTime] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(DING_SOUND_URL);
  }, []);

  const playDing = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(e => console.log('Audio play blocked', e));
    }
  };

  const handleStartBoarding = () => {
    setPhase(FlightPhase.BOARDING);
  };

  const handleConfirmFlight = (mode: TimerMode) => {
    setTimerMode(mode);
    setPhase(FlightPhase.IN_FLIGHT);
    setPomodoroStatus(PomodoroStatus.WORKING);
    setFlightProgress(0);
    if (mode === TimerMode.POMODORO) {
      setTimeout(playDing, 500);
    }
  };

  const handleReset = () => {
    setPhase(FlightPhase.PLANNING);
    setFromAirport(null);
    setToAirport(null);
    setSelectedSeat(null);
    setFlightProgress(0);
    setRemainingTime(0);
    setShowSnackModal(false);
  };

  const handleAbort = () => {
    // Return to "Home Page" state
    setPhase(FlightPhase.PLANNING);
    setFromAirport(null);
    setToAirport(null);
    setSelectedSeat(null);
    setFlightProgress(0);
    setRemainingTime(0);
    setShowSnackModal(false);
  };

  const handlePomodoroTransition = (newStatus: PomodoroStatus) => {
    setPomodoroStatus(newStatus);
    playDing();
    
    if (newStatus === PomodoroStatus.BREAK) {
      setShowSnackModal(true);
    } else {
      setShowSnackModal(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#0b1c2d] overflow-hidden">
      <MapView 
        from={fromAirport} 
        to={toAirport} 
        progress={flightProgress} 
        isFlying={phase === FlightPhase.IN_FLIGHT}
      />

      {phase === FlightPhase.PLANNING && (
        <SearchPanel 
          from={fromAirport} 
          to={toAirport} 
          setFrom={setFromAirport} 
          setTo={setToAirport} 
          onBoarding={handleStartBoarding} 
          onReset={handleReset}
        />
      )}

      {phase === FlightPhase.BOARDING && (
        <AirplaneView 
          from={fromAirport} 
          to={toAirport} 
          selectedSeat={selectedSeat}
          setSelectedSeat={setSelectedSeat}
          onConfirm={handleConfirmFlight}
          onBack={() => setPhase(FlightPhase.PLANNING)}
          onReset={handleReset}
        />
      )}

      {phase === FlightPhase.IN_FLIGHT && (
        <FlightTracker 
          from={fromAirport}
          to={toAirport}
          mode={timerMode}
          onProgressUpdate={setFlightProgress}
          onTimeUpdate={setRemainingTime}
          onArrived={() => setPhase(FlightPhase.ARRIVED)}
          onAbort={handleAbort}
          pomodoroStatus={pomodoroStatus}
          onPomodoroTransition={handlePomodoroTransition}
        />
      )}

      {phase === FlightPhase.ARRIVED && (
        <div className="absolute inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="text-center p-12 border-2 border-yellow-400 rounded-3xl bg-slate-900 shadow-2xl">
            <h2 className="text-5xl font-black text-yellow-400 mb-6 uppercase tracking-tighter">Touchdown!</h2>
            <p className="text-xl text-slate-300 mb-8">Welcome to {toAirport?.city}. Focus session complete.</p>
            <button 
              onClick={handleReset}
              className="px-10 py-4 bg-yellow-400 text-black font-black rounded-full hover:scale-110 transition-transform uppercase tracking-widest"
            >
              Start New Flight
            </button>
          </div>
        </div>
      )}

      <SnackModal 
        show={showSnackModal} 
        onClose={() => setShowSnackModal(false)} 
      />
      
      {phase === FlightPhase.IN_FLIGHT && timerMode === TimerMode.POMODORO && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[3000] flex items-center gap-2 px-6 py-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
          <div className={`w-3 h-3 rounded-full ${pomodoroStatus === PomodoroStatus.WORKING ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
            {pomodoroStatus === PomodoroStatus.WORKING ? 'Fasten Seatbelts' : 'Seatbelts Off'}
          </span>
        </div>
      )}
    </div>
  );
};

export default App;
