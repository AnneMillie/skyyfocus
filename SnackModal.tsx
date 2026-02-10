
import React from 'react';

interface SnackModalProps {
  show: boolean;
  onClose: () => void;
}

const SnackModal: React.FC<SnackModalProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[6000] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
      <div className="bg-slate-900 border-4 border-green-400 rounded-[50px] p-12 max-w-md w-full text-center shadow-[0_0_100px_rgba(74,222,128,0.3)] animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <span className="text-5xl">🥨</span>
        </div>
        
        <h2 className="text-5xl font-black text-green-400 uppercase tracking-tighter mb-2">SNACK TIME!</h2>
        <div className="inline-block px-6 py-2 bg-green-400/10 border-2 border-green-400/40 rounded-full mb-10">
           <p className="text-green-400 font-black uppercase tracking-[0.3em] text-[12px]">SEATBELTS OFF</p>
        </div>
        
        <p className="text-slate-300 text-lg mb-10 leading-relaxed font-medium">
          The cabin crew is now serving refreshments. Take 10 minutes to stretch and refuel.
        </p>
        
        <button 
          onClick={onClose}
          className="w-full py-5 bg-green-400 text-slate-950 font-black rounded-3xl hover:bg-green-300 active:scale-95 transition-all uppercase tracking-[0.2em] text-lg shadow-xl shadow-green-400/20"
        >
          ENJOY SNACKS
        </button>
      </div>
    </div>
  );
};

export default SnackModal;
