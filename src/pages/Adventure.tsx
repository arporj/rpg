import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, getStorageUrl } from '../lib/supabase';
import { Chronicle, Session, Player } from '../types';
import { Loader2, Scroll, Ghost, Skull, Sword, Users, Info, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SubscribeBox } from '../components/SubscribeBox';

export default function Adventure() {
  const { slug, sessionId } = useParams<{ slug: string; sessionId?: string }>();
  const [chronicle, setChronicle] = useState<Chronicle | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    if (sessData) {
      setSessions(sessData);
      if (sessionId) {
        setActiveSession(sessData.find(s => s.id === sessionId) || sessData[0] || null);
      } else {
        setActiveSession(sessData[0] || null);
      }
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
    <div className="flex flex-col md:flex-row h-screen h-[100dvh] bg-ink text-parchment overflow-hidden selection:bg-gold/30 selection:text-white">
      {/* Sidebar - Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-ink/98 border-r border-gold/20 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:relative md:flex'}
      `}>
        <div className="p-6 md:p-8 border-b border-gold/10 flex justify-between items-center">
          <h1 className="font-cinzel text-xl md:text-2xl font-bold text-gold tracking-tighter leading-tight">
            {chronicle.title}
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gold/60 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-2 border-b border-gold/5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/40 font-bold">
            {chronicle.systems?.name}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                setActiveSession(session);
                setIsSidebarOpen(false);
              }}
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

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative min-w-0 min-h-0">
        {/* Top Player Bar */}
        <header className="h-auto md:h-20 bg-ink/90 backdrop-blur-md border-b border-gold/10 flex items-center justify-between px-4 md:px-8 z-30 sticky top-0 shadow-lg py-3 md:py-0">
          <div className="flex items-center gap-4 min-w-0 flex-1">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gold p-1 shrink-0 -ml-1">
                <Scroll size={24} />
             </button>
             <span className="hidden sm:block text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-gold/40 font-bold shrink-0">O Grupo</span>
             <div className="flex items-center gap-3 md:gap-4 overflow-x-auto custom-scrollbar-hide pb-1 -mb-1 scroll-smooth px-1">
              {players.map((player) => (
                <motion.div 
                  key={player.id}
                  whileHover={{ scale: 1.1, y: -2 }}
                  onClick={() => setSelectedPlayer(player)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-gold/30 overflow-hidden bg-neutral-900 shadow-xl transition-all group-hover:border-gold shrink-0">
                    <img 
                      src={getStorageUrl(player.face_url)} 
                      alt={player.char_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[8px] uppercase tracking-tighter text-gold/60 font-bold group-hover:text-gold transition-colors">
                    {player.char_name.split(' ')[0]}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-6 shrink-0">
             <div className="text-right hidden sm:block">
                <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-gold/60 font-bold leading-none mb-1">{chronicle.systems?.name}</p>
                <p className="text-xs md:text-sm font-cinzel text-parchment leading-none max-w-[120px] truncate">{chronicle.title}</p>
             </div>
             <div className="w-[1px] h-8 bg-gold/10" />
             <button onClick={() => navigate('/')} className="text-gold/40 hover:text-gold transition-colors p-2 underline text-xs uppercase tracking-widest font-bold">Voltar ao Tomo</button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/papyros.png')] bg-scroll md:bg-fixed custom-scrollbar overscroll-contain">
        <AnimatePresence mode="wait">
          {activeSession ? (
            <motion.div
              key={activeSession.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-20 space-y-12 md:space-y-16"
            >
              <div className="text-center space-y-4 mb-20 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-16 opacity-5 sm:opacity-10">
                   <Scroll className="w-32 h-32 md:w-40 md:h-40 text-gold" />
                </div>
                <h2 className="text-3xl md:text-5xl font-cinzel text-gold font-bold tracking-tight uppercase px-2 text-balance leading-tight">
                  {activeSession.title}
                </h2>
                <div className="flex flex-col items-center gap-2 mt-4">
                  <p className="text-gold/60 font-cinzel tracking-[0.3em] md:tracking-[0.5em] text-sm md:text-base italic uppercase">
                    — {activeSession.date_str} —
                  </p>
                  {activeSession.session_date && (
                    <p className="text-gold/40 font-mono tracking-widest text-xs md:text-sm">
                      {new Date(activeSession.session_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-20 md:space-y-32">
                {activeSession.chapters?.sort((a: any, b: any) => a.order_index - b.order_index).map((chapter, idx) => (
                  <article key={chapter.id} className="space-y-8 relative group">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                       <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-gold/30" />
                       <h3 className="font-cinzel text-xl md:text-2xl text-gold/80 px-2 md:px-4 text-center">
                         Capítulo {idx + 1} <span className="hidden sm:inline">—</span> <br className="sm:hidden" /> {chapter.title}
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

                <div className="pt-12 border-t border-gold/10">
                   <SubscribeBox chronicleId={chronicle.id} />
                </div>
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
              className="relative w-full max-w-5xl bg-neutral-950 border border-gold/30 shadow-[0_0_100px_rgba(212,175,55,0.2)] rounded-sm overflow-y-auto md:overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-none"
            >
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-4 right-4 z-20 p-2 text-gold/40 hover:text-gold transition-colors bg-black/50 rounded-full"
              >
                <X size={20} className="md:w-6 md:h-6" />
              </button>

              {/* Player Body Portrait */}
              <div className="w-full md:w-[40%] bg-ink border-b md:border-b-0 md:border-r border-gold/10 relative overflow-hidden group min-h-[300px] md:min-h-0 shrink-0">
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
              <div className="flex-1 p-6 md:p-12 flex flex-col justify-center space-y-6 md:space-y-8 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
                 <div className="space-y-6">
                    {/* Character Header with Round Photo */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6 mb-4 text-center sm:text-left">
                       <div className="w-20 h-20 rounded-full border-2 border-gold/30 overflow-hidden bg-ink shadow-xl shrink-0">
                          <img 
                            src={getStorageUrl(selectedPlayer.face_url)} 
                            alt={selectedPlayer.char_name}
                            className="w-full h-full object-cover"
                          />
                       </div>
                       <div className="space-y-1">
                          <h2 className="text-3xl md:text-5xl font-cinzel text-parchment font-bold tracking-tighter uppercase leading-tight md:leading-none">
                            {selectedPlayer.char_name}
                          </h2>
                          <div className="flex items-center justify-center sm:justify-start gap-2 text-gold/60 italic font-serif text-base md:text-lg">
                             <span>Jogador: {selectedPlayer.real_name}</span>
                          </div>
                       </div>
                    </div>

                    <div className="h-[1px] w-full bg-gradient-to-r from-gold/30 to-transparent" />
                    
                    {/* Race, Class, Level Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
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
