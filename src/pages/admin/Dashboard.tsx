import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Chronicle, RPGSystem } from '../../types';
import { Plus, Settings, BookOpen, User, LogOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [systems, setSystems] = useState<RPGSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: chrData } = await supabase
      .from('chronicles')
      .select('*, systems(*)');
    
    const { data: sysData } = await supabase
      .from('systems')
      .select('*');

    if (chrData) setChronicles(chrData);
    if (sysData) setSystems(sysData);
    setLoading(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans">
      {/* Header */}
      <header className="bg-ink border-b border-gold/20 p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <BookOpen className="w-8 h-8 text-gold" />
          <h1 className="text-2xl font-cinzel tracking-widest uppercase">Tomo Administrativo</h1>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-cinzel mb-2">Suas Crônicas</h2>
            <p className="text-neutral-400 italic">Gerencie suas aventuras e sessões</p>
          </div>
          <button className="bg-gold text-ink font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-yellow-500 transition-all shadow-lg hover:scale-105">
            <Plus className="w-5 h-5" />
            Nova Crônica
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {chronicles.map((chronicle) => (
            <div key={chronicle.id} className="bg-ink border border-gold/10 p-6 rounded-lg hover:border-gold/40 transition-colors group relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-gold/5 blur-3xl group-hover:bg-gold/10 transition-all" />
               
               <div className="relative z-10 flex flex-col h-full">
                 <div className="flex justify-between items-start mb-4">
                   <h3 className="text-xl font-cinzel text-gold">{chronicle.title}</h3>
                   <span className="text-xs bg-gold/10 text-gold px-2 py-1 rounded border border-gold/20">
                     {chronicle.systems?.name || 'Sistema Desconhecido'}
                   </span>
                 </div>
                 
                 <div className="space-y-2 mb-8 flex-grow">
                   <p className="text-sm text-neutral-400 flex items-center gap-2">
                     <User className="w-4 h-4" />
                     Mestre: {chronicle.master_name}
                   </p>
                   <p className="text-xs text-neutral-500">
                     URL: /{chronicle.slug}
                   </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => navigate(`/admin/chronicle/${chronicle.id}`)}
                      className="bg-neutral-800 hover:bg-neutral-700 p-2 rounded flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Editar
                    </button>
                    <button 
                      onClick={() => window.open(`/${chronicle.slug}`, '_blank')}
                      className="bg-gold/10 hover:bg-gold/20 p-2 border border-gold/20 rounded flex items-center justify-center gap-2 text-sm text-gold transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      Ver Site
                    </button>
                 </div>
               </div>
            </div>
          ))}

          {chronicles.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-neutral-800 rounded-xl">
              <p className="text-neutral-500 italic">Nenhuma crônica encontrada. Comece criando uma nova aventura!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
