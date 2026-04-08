import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, getStorageUrl } from '../lib/supabase';
import { Chronicle, Session, Player } from '../types';
import { Loader2, Scroll, Ghost, Skull, Sword, Users, Info, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Adventure() {
  const { slug } = useParams<{ slug: string }>();
  const [chronicle, setChronicle] = useState<Chronicle | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (slug) fetchAdventure();
  }, [slug]);

  async function fetchAdventure() {
    setLoading(true);
    // 1. Fetch Chronicle
    const { data: chrData } = await supabase
      .from('chronicles')
      .select('*, systems(*)')
      .eq('slug', slug)
      .single();

    if (!chrData) {
      navigate('/rpg');
      return;
    }

    setChronicle(chrData);

    // 2. Fetch Players
    const { data: plrData } = await supabase
      .from('players')
      .select('*')
      .eq('chronicle_id', chrData.id)
      .eq('is_active', true);
    
    if (plrData) setPlayers(plrData);

    // 3. Fetch Sessions and Chapters
    const { data: sessData } = await supabase
      .from('sessions')
      .select('*, chapters(*)')
      .eq('chronicle_id', chrData.id)
      .order('order_index', { ascending: true });

    if (sessData) {
      setSessions(sessData);
      setActiveSession(sessData[0] || null);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-gold animate-spin mx-auto mb-4" />
          <p className="font-cinzel text-gold tracking-widest">Abrindo o Tomo...</p>
        </div>
      </div>
    );
  }

  if (!chronicle) return null;

  return (
    <div className="flex h-screen bg-ink text-parchment overflow-hidden selection:bg-gold/30 selection:text-white">
      {/* Sidebar - Navigation */}
      <aside className="w-72 bg-ink/95 border-r border-gold/20 flex flex-col relative z-20 shadow-2xl">
        <div className="p-8 border-b border-gold/10">
          <h1 className="font-cinzel text-2xl font-bold text-gold tracking-tighter leading-tight">
            {chronicle.title}
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/40 mt-2 font-bold">
            {chronicle.systems?.name}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSession(session)}
              className={`w-full text-left p-4 rounded transition-all duration-300 group relative ${
                activeSession?.id === session.id 
                  ? 'bg-gold/10 border-l-4 border-gold text-gold' 
                  : 'hover:bg-gold/5 text-parchment/60'
              }`}
            >
              <div className="text-xs uppercase tracking-widest opacity-50 mb-1 font-bold group-hover:text-gold transition-colors">
                {session.date_str}
              </div>
              <div className="font-cinzel text-sm font-medium tracking-wide">
                {session.title}
              </div>
            </button>
          ))}
        </nav>

        <div className="p-6 bg-gold/5 border-t border-gold/10">
           <div className="text-[10px] uppercase tracking-widest text-gold/40 mb-4 font-bold flex items-center gap-2">
             <Ghost className="w-3 h-3" />
             Mestre da Mesa
           </div>
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center overflow-hidden">
                <Users className="w-5 h-5 text-gold/40" />
             </div>
             <span className="font-cinzel text-sm">{chronicle.master_name}</span>
           </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Player Bar */}
        <header className="h-20 bg-ink/90 backdrop-blur-md border-b border-gold/10 flex items-center justify-between px-8 z-30 sticky top-0 shadow-lg">
          <div className="flex items-center gap-4">
             <span className="text-[10px] uppercase tracking-[0.3em] text-gold/40 font-bold">O Grupo</span>
             <div className="flex -space-x-3">
              {players.map((player) => (
                <motion.div 
                  key={player.id}
                  whileHover={{ scale: 1.1, zIndex: 10, y: -2 }}
                  onClick={() => setSelectedPlayer(player)}
                  className="w-10 h-10 rounded-full border-2 border-gold/30 overflow-hidden bg-neutral-900 cursor-pointer shadow-xl transition-all"
                  title={player.char_name}
                >
                  <img 
                    src={getStorageUrl(player.face_url)} 
                    alt={player.char_name}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="text-right hidden md:block">
                <p className="text-[10px] uppercase tracking-widest text-gold/60 font-bold leading-none mb-1">{chronicle.systems?.name}</p>
                <p className="text-sm font-cinzel text-parchment leading-none">{chronicle.title}</p>
             </div>
             <div className="w-[1px] h-8 bg-gold/10" />
             <button onClick={() => navigate('/')} className="text-gold/40 hover:text-gold transition-colors p-2 underline text-xs uppercase tracking-widest font-bold">Voltar ao Tomo</button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/papyros.png')] bg-fixed custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeSession ? (
            <motion.div
              key={activeSession.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto px-8 py-20 space-y-16"
            >
              <div className="text-center space-y-4 mb-20 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-16 opacity-5">
                   <Scroll className="w-40 h-40 text-gold" />
                </div>
                <h2 className="text-5xl font-cinzel text-gold font-bold tracking-tight uppercase">
                  {activeSession.title}
                </h2>
                <p className="text-gold/40 font-cinzel tracking-[0.5em] text-sm italic">
                  — {activeSession.date_str} —
                </p>
              </div>

              <div className="space-y-32">
                {activeSession.chapters?.sort((a,b) => a.order_index - b.order_index).map((chapter, idx) => (
                  <article key={chapter.id} className="space-y-8 relative group">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-gold/30" />
                       <h3 className="font-cinzel text-2xl text-gold/80 px-4 text-center">
                         Capítulo {idx + 1} — {chapter.title}
                       </h3>
                       <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-gold/30" />
                    </div>

                    {chapter.image_url && (
                      <div className="relative rounded-sm overflow-hidden border border-gold/20 shadow-2xl bg-ink/40 group/img">
                        <img 
                          src={getStorageUrl(chapter.image_url)} 
                          alt={chapter.title}
                          className="w-full aspect-video object-cover object-top transition-transform duration-1000 group-hover/img:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                      </div>
                    )}

                    <div className="font-serif text-lg md:text-xl leading-relaxed text-parchment/90 space-y-6 first-letter:text-6xl first-letter:font-cinzel first-letter:text-gold first-letter:float-left first-letter:mr-4 first-letter:mt-2">
                       {chapter.content.split('\n\n').map((p, i) => (
                         <p key={i}>{p}</p>
                       ))}
                    </div>
                  </article>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-gold/20">
              <Scroll className="w-32 h-32 animate-pulse" />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Player Detail Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlayer(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
             <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-neutral-950 border border-gold/30 shadow-[0_0_100px_rgba(212,175,55,0.2)] rounded-sm overflow-hidden flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-4 right-4 z-10 p-2 text-gold/40 hover:text-gold transition-colors bg-black/50 rounded-full"
              >
                <X size={24} />
              </button>

              {/* Player Body Portrait */}
              <div className="w-full md:w-[40%] bg-ink border-r border-gold/10 relative overflow-hidden group">
                 {selectedPlayer.body_url ? (
                   <img 
                    src={getStorageUrl(selectedPlayer.body_url)} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                   />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10 py-40">
                       <Users size={120} className="text-gold" />
                    </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              </div>

              {/* Player Info */}
              <div className="flex-1 p-12 flex flex-col justify-center space-y-8 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
                 <div className="space-y-6">
                    {/* Character Header with Round Photo */}
                    <div className="flex items-center gap-6 mb-4">
                       <div className="w-20 h-20 rounded-full border-2 border-gold/30 overflow-hidden bg-ink shadow-xl">
                          <img 
                            src={getStorageUrl(selectedPlayer.face_url)} 
                            alt={selectedPlayer.char_name}
                            className="w-full h-full object-cover"
                          />
                       </div>
                       <div className="space-y-1">
                          <h2 className="text-5xl font-cinzel text-parchment font-bold tracking-tighter uppercase leading-none">
                            {selectedPlayer.char_name}
                          </h2>
                          <div className="flex items-center gap-2 text-gold/60 italic font-serif text-lg">
                             <span>Jogador: {selectedPlayer.real_name}</span>
                          </div>
                       </div>
                    </div>

                    <div className="h-[1px] w-full bg-gradient-to-r from-gold/30 to-transparent" />
                    
                    {/* Race, Class, Level Column */}
                    <div className="flex flex-col gap-6 py-4 max-w-xs">
                       <div className="space-y-1">
                          <p className="text-[10px] uppercase text-gold/40 font-bold tracking-widest">Raça</p>
                          <p className="text-xl font-cinzel text-parchment">{selectedPlayer.race || "—"}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] uppercase text-gold/40 font-bold tracking-widest">Classe</p>
                          <p className="text-xl font-cinzel text-parchment">{selectedPlayer.class || "—"}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] uppercase text-gold/40 font-bold tracking-widest">
                            {(chronicle as any)?.systems?.advancement_label || 'Nível'}
                          </p>
                          <p className="text-xl font-cinzel text-gold">{selectedPlayer.level_points || "—"}</p>
                       </div>
                    </div>

                    <div className="h-[1px] w-full bg-gradient-to-r from-gold/30 to-transparent" />

                    {/* Description */}
                    <div className="space-y-2">
                       <p className="text-[10px] uppercase text-gold/40 font-bold tracking-widest">História & Notas</p>
                       <p className="text-lg leading-relaxed text-parchment/80 font-serif italic max-h-48 overflow-y-auto pr-4 custom-scrollbar">
                         {selectedPlayer.description || "Nenhuma história escrita nas estrelas... ainda."}
                       </p>
                    </div>
                 </div>

                 <div className="pt-4 flex gap-6">
                    <div className="px-6 py-3 bg-gold/5 border border-gold/20 rounded-sm">
                       <p className="text-[8px] uppercase text-gold/40 font-bold mb-1 tracking-[0.2em]">Status</p>
                       <p className="text-[10px] font-cinzel text-green-500 flex items-center gap-2 font-bold whitespace-nowrap">
                          <CheckCircle2 size={12} /> PERSONAGEM ATIVO
                       </p>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
}

// Minimal missing component for the layout
const UserPlus = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
);
