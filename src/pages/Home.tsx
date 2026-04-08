import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Chronicle } from '../types';
import { Book, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchChronicles() {
      console.log('Fetching chronicles from rpg schema...');
      const { data, error } = await supabase
        .from('chronicles')
        .select('*, systems(*)');
      
      if (error) {
        console.error('Error fetching chronicles:', error);
      } else {
        console.log('Data fetched:', data);
        if (data) setChronicles(data);
      }
      setLoading(false);
    }
    fetchChronicles();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-parchment font-serif selection:bg-gold/30">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden border-b border-gold/10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549643276-fdf2fab574f5?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center brightness-[0.2]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
        
        <div className="relative z-10 text-center space-y-6 px-4">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-12 h-12 text-gold animate-pulse" />
          </div>
          <h1 className="text-6xl md:text-8xl font-cinzel font-bold text-gold tracking-tighter shadow-2xl">
            O Tomo das Aventuras
          </h1>
          <p className="max-w-xl mx-auto text-parchment/60 text-lg md:text-xl italic">
            Onde as histórias ganham vida e os mundos se encontram. Escolha seu destino e inicie sua jornada.
          </p>
        </div>
      </section>

      {/* Chronicle List */}
      <main className="max-w-5xl mx-auto px-8 py-24">
        <h2 className="font-cinzel text-3xl text-gold mb-12 tracking-widest text-center uppercase border-b border-gold/10 pb-4">
          Aventuras Disponíveis
        </h2>

        <div className="grid grid-cols-1 gap-6">
          {chronicles.map((chronicle) => (
            <button
              key={chronicle.id}
              onClick={() => navigate(`/${chronicle.slug}`)}
              className="group bg-ink/40 border border-gold/10 p-8 rounded-sm hover:border-gold/50 transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] relative overflow-hidden"
            >
              {/* Hover Background */}
              <div className="absolute inset-0 bg-gold/0 group-hover:bg-gold/[0.02] transition-colors" />
              
              <div className="flex items-center gap-8 relative z-10">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20 group-hover:scale-110 transition-transform">
                  <Book className="w-8 h-8 text-gold" />
                </div>
                <div className="text-left">
                  <h3 className="text-3xl font-cinzel text-parchment group-hover:text-gold transition-colors">
                    {chronicle.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs uppercase tracking-widest text-gold font-bold">
                      {chronicle.systems?.name}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gold/30" />
                    <span className="text-sm italic text-neutral-500">Mestre: {chronicle.master_name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 relative z-10">
                <span className="text-xs uppercase tracking-widest text-gold/60 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Inicar Jornada</span>
                <ChevronRight className="w-8 h-8 text-gold group-hover:translate-x-2 transition-transform" />
              </div>
            </button>
          ))}

          {chronicles.length === 0 && (
            <div className="text-center py-20 bg-ink/20 border border-dashed border-gold/10 rounded">
               <p className="text-neutral-500 italic">O horizonte está vazio... por enquanto.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-gold/10 text-center opacity-40 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => navigate('/admin')}
          className="text-xs uppercase tracking-widest text-gold hover:underline"
        >
          Acesso Restrito ao Mestre
        </button>
      </footer>
    </div>
  );
}
