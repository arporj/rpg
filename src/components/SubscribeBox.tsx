import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';

interface SubscribeBoxProps {
  chronicleId?: string;
  className?: string;
}

export function SubscribeBox({ chronicleId, className = '' }: SubscribeBoxProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    const { error } = await supabase.rpc('subscribe_to_newsletter', {
      p_email: email,
      p_chronicle_id: chronicleId || null,
    });

    if (error) {
      console.error('Subscription error:', error);
      setStatus('error');
      setErrorMessage('Falha ao se inscrever. Tente novamente.');
    } else {
      setStatus('success');
      setEmail('');
    }

    setLoading(false);
  };

  return (
    <div className={`bg-ink/40 border border-gold/20 p-6 md:p-8 rounded-sm shadow-xl relative overflow-hidden group ${className}`}>
      <div className="absolute inset-0 bg-gold/5 group-hover:bg-gold/10 transition-colors pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        <div className="w-12 h-12 rounded-full border border-gold/30 bg-gold/10 flex items-center justify-center shrink-0">
          <Mail className="w-6 h-6 text-gold" />
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-2">
          <h3 className="font-cinzel text-xl text-gold uppercase tracking-widest font-bold">
            {chronicleId ? 'Inscreva-se nesta Aventura' : 'As Crônicas do Códice'}
          </h3>
          <p className="text-parchment/60 font-serif italic text-sm md:text-base">
            {chronicleId 
              ? 'Receba um pergaminho (e-mail) sempre que uma nova parte desta aventura for revelada.' 
              : 'Seja avisado sobre novas aventuras e todos os novos capítulos publicados no Tomo.'}
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              disabled={loading || status === 'success'}
              className="w-full sm:w-64 bg-ink/80 border border-gold/30 text-parchment px-4 py-2 sm:py-3 font-serif outline-none focus:border-gold transition-colors placeholder:text-parchment/30 disabled:opacity-50"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || status === 'success'}
            className="flex items-center justify-center gap-2 px-6 py-2 sm:py-3 bg-gold/10 hover:bg-gold/20 border border-gold/50 text-gold font-cinzel font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : status === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Assinado
              </>
            ) : (
              'Assinar'
            )}
          </button>
        </form>
      </div>

      {status === 'error' && (
        <p className="mt-4 text-red-400 text-sm italic text-center md:text-right relative z-10">{errorMessage}</p>
      )}
      {status === 'success' && (
        <p className="mt-4 text-green-400 text-sm italic text-center md:text-right relative z-10">
          Inscrição confirmada. O corvo foi enviado com sucesso!
        </p>
      )}
    </div>
  );
}
