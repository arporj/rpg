import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Session } from '../../../types';

interface Props {
  session: Session;
  onSave: (updated: Session) => void;
  onClose: () => void;
}

export function SessionModal({ session: initialSession, onSave, onClose }: Props) {
  const [session, setSession] = useState<Session>(initialSession);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-ink border border-gold/30 p-6 md:p-8 rounded shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
      >
        <div className="flex justify-between items-center mb-8 border-b border-gold/10 pb-4">
          <h3 className="font-cinzel text-gold text-xl uppercase tracking-widest">
            {initialSession.title === 'Nova Sessão' ? 'Criar Sessão' : 'Editar Sessão'}
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] text-gold/40 font-bold uppercase mb-2 block tracking-widest">Título da Sessão</label>
            <input 
              value={session.title} 
              onChange={(e) => setSession({ ...session, title: e.target.value })}
              placeholder="Ex: O Despertar"
              className="bg-neutral-900/50 border border-neutral-700 focus:border-gold outline-none p-3 rounded text-gold font-cinzel text-lg w-full transition-colors"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] text-gold/40 font-bold uppercase mb-2 block tracking-widest">Identificador (Ex: Sessão 001)</label>
              <input 
                value={session.date_str} 
                onChange={(e) => setSession({ ...session, date_str: e.target.value })}
                placeholder="Ex: Sessão 001"
                className="bg-neutral-900/50 border border-neutral-700 focus:border-gold outline-none p-3 rounded text-neutral-300 w-full transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-gold/40 font-bold uppercase mb-2 block tracking-widest">Data Real da Sessão</label>
              <input 
                type="date"
                value={session.session_date || ''} 
                onChange={(e) => setSession({ ...session, session_date: e.target.value })}
                className="bg-neutral-900/50 border border-neutral-700 focus:border-gold outline-none p-3 rounded w-full text-neutral-300 transition-colors css-date-picker"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gold/10 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2 text-neutral-400 hover:text-white font-bold text-sm tracking-widest uppercase transition-colors">Cancelar</button>
          <button 
            onClick={() => onSave(session)}
            className="bg-gold text-ink px-8 py-2 font-bold hover:bg-yellow-500 transition-colors rounded-sm flex items-center gap-2"
          >
            <Save size={18} /> CONFIRMAR
          </button>
        </div>
      </motion.div>
    </div>
  );
}
