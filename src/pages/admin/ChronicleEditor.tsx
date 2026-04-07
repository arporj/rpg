import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Chronicle, Session, Player, RPGSystem, Chapter } from '../../types';
import { 
  ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown, 
  Users, Book, MessageSquare, Image as ImageIcon, Loader2,
  CheckCircle2, XCircle, Upload, UserCheck, Wand2, Copy, Check, X
} from 'lucide-react';
import { getStorageUrl, STORAGE_BUCKET } from '../../lib/supabase';

export default function ChronicleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [chronicle, setChronicle] = useState<Chronicle | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [systems, setSystems] = useState<RPGSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'sessions' | 'players' | 'settings'>('sessions');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorAI, setErrorAI] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: chr } = await supabase.from('chronicles').select('*').eq('id', id).single();
      const { data: sess } = await supabase.from('sessions').select('*, chapters(*)').eq('chronicle_id', id).order('order_index', { ascending: true });
      const { data: plrs } = await supabase.from('players').select('*').eq('chronicle_id', id).order('real_name', { ascending: true });
      const { data: sys } = await supabase.from('systems').select('*');

      if (chr) setChronicle(chr);
      if (sess) {
        // Ensure chapters are sorted
        const sortedSess = sess.map(s => ({
          ...s,
          chapters: (s.chapters || []).sort((a,b) => a.order_index - b.order_index)
        }));
        setSessions(sortedSess);
      }
      if (plrs) setPlayers(plrs);
      if (sys) setSystems(sys);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  }

  // --- Upload Logic ---
  const handleFileUpload = async (file: File, path: string, existingPath: string | null) => {
    // 1. If existingPath exists and is different from current path, we might want to delete it 
    // but the user said "assume the name of the one being deleted".
    // So if existingPath is not null, we just use it.
    
    const targetPath = existingPath || path;
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(targetPath, file, { 
        upsert: true,
        contentType: file.type 
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }
    return targetPath;
  };

  const handleGeneratePrompt = async (chapter: any) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      setErrorAI("Chave de API do Gemini não configurada no arquivo .env");
      setShowPromptModal(true);
      return;
    }

    setIsGeneratingPrompt(true);
    setErrorAI(null);
    setGeneratedPrompt('');
    setShowPromptModal(true);

    try {
      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = `Você é um Engenheiro de Prompts para IAs de imagem (Midjourney, Leonardo.ai).
Seu objetivo é ler o título e a descrição de um capítulo de RPG (em Português) e extrair a ESSÊNCIA VISUAL mais importante para criar um prompt artístico em INGLÊS.

Regras:
1. IGNORE diálogos ou nomes de jogadores se não forem essenciais para a cena.
2. FOQUE no ambiente, clima, cores e no evento principal (ex: se o texto fala de um churrasco que termina em uma tempestade épica, o prompt deve ser sobre a TEMPESTADE).
3. ESTILO: High fantasy, digital oil painting, cinematic lighting, epic composition, highly detailed, 8k.
4. IDIOMA: O prompt final deve ser obrigatoriamente em INGLÊS.
5. FORMATO: Finalize sempre com "--ar 16:9".
6. SAÍDA: Responda APENAS o texto do prompt, sem explicações.`;

      const userContent = `Título: ${chapter.title || "Sem título"}\nConteúdo: ${chapter.content || ""}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userContent,
        config: {
          systemInstruction: systemPrompt,
        },
      });
      
      const text = (response.text ?? '').trim();
      
      setGeneratedPrompt(text);
    } catch (err: any) {
      console.error('Gemini Error:', err);
      setErrorAI("Erro ao gerar prompt: " + (err.message || "Tente novamente."));
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // --- Global Save ---
  const saveAll = async () => {
    if (!chronicle || !id) return;
    setSaving(true);
    setSaveStatus('saving');
    
    try {
      // 1. Save Chronicle Metadata
      await supabase.from('chronicles').update({
        title: chronicle.title,
        master_name: chronicle.master_name,
        system_id: chronicle.system_id,
        slug: chronicle.slug
      }).eq('id', id);

      // 2. Save Sessions & Chapters
      for (const session of sessions) {
        await supabase.from('sessions').update({
          title: session.title,
          date_str: session.date_str,
          order_index: session.order_index
        }).eq('id', session.id);

        if (session.chapters) {
          for (const chapter of session.chapters) {
            await supabase.from('chapters').update({
              title: chapter.title,
              content: chapter.content,
              image_url: chapter.image_url,
              order_index: chapter.order_index
            }).eq('id', chapter.id);
          }
        }
      }

      // 3. Save Players
      for (const player of players) {
        await supabase.from('players').update({
          real_name: player.real_name,
          char_name: player.char_name,
          description: player.description,
          face_url: player.face_url,
          body_url: player.body_url,
          is_active: player.is_active
        }).eq('id', player.id);
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
    }
    setSaving(false);
  };

  // --- Session Actions ---
  const addSession = async () => {
    const { data } = await supabase.from('sessions').insert({
      chronicle_id: id,
      title: 'Nova Sessão',
      date_str: 'Dia X',
      order_index: sessions.length
    }).select().single();
    if (data) setSessions([...sessions, { ...data, chapters: [] }]);
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sessão e todos os seus capítulos?')) return;
    await supabase.from('sessions').delete().eq('id', sessionId);
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  // --- Chapter Actions ---
  const addChapter = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const { data } = await supabase.from('chapters').insert({
      session_id: sessionId,
      title: 'Novo Capítulo',
      content: '',
      image_url: '',
      order_index: (session.chapters?.length || 0)
    }).select().single();
    
    if (data) {
      setSessions(sessions.map(s => s.id === sessionId ? { ...s, chapters: [...(s.chapters || []), data].sort((a,b) => a.order_index - b.order_index) } : s));
    }
  };

  const deleteChapter = async (sessionId: string, chapterId: string) => {
    if (!confirm('Excluir este capítulo?')) return;
    await supabase.from('chapters').delete().eq('id', chapterId);
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, chapters: s.chapters?.filter(c => c.id !== chapterId) } : s));
  };

  const moveChapter = (sessionId: string, chapterId: string, direction: 'up' | 'down') => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.chapters) return;
    
    const chapters = [...session.chapters].sort((a,b) => a.order_index - b.order_index);
    const idx = chapters.findIndex(c => c.id === chapterId);
    if (direction === 'up' && idx > 0) {
      [chapters[idx], chapters[idx-1]] = [chapters[idx-1], chapters[idx]];
    } else if (direction === 'down' && idx < chapters.length - 1) {
      [chapters[idx], chapters[idx+1]] = [chapters[idx+1], chapters[idx]];
    } else {
      return;
    }

    const updated = chapters.map((c, i) => ({ ...c, order_index: i }));
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, chapters: updated } : s));
  };

  // --- Player Actions ---
  const addPlayer = async () => {
    const { data } = await supabase.from('players').insert({
      chronicle_id: id,
      real_name: 'Novo Jogador',
      char_name: 'Novo Personagem',
      description: '',
      is_active: true
    }).select().single();
    if (data) setPlayers([...players, data]);
  };

  const deletePlayer = async (playerId: string) => {
    if (!confirm('Remover este jogador?')) return;
    await supabase.from('players').delete().eq('id', playerId);
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setPlayers(players.map(p => p.id === playerId ? { ...p, ...updates } : p));
  };

  if (loading || !chronicle) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gold" size={48} /></div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans">
      <header className="bg-ink border-b border-gold/20 p-4 sticky top-0 z-40 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/rpg/admin/dashboard')} className="hover:text-gold transition-colors p-2"><ArrowLeft /></button>
          <div className="flex flex-col">
            <h1 className="font-cinzel text-xl text-gold leading-tight">{chronicle.title}</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Painel de Controle</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {saveStatus === 'success' && <span className="text-green-500 text-sm flex items-center gap-1"><CheckCircle2 size={16}/> Salvo com sucesso</span>}
          {saveStatus === 'error' && <span className="text-red-500 text-sm flex items-center gap-1"><XCircle size={16}/> Erro ao salvar</span>}
          <button 
            onClick={saveAll} 
            disabled={saving}
            className="bg-gold text-ink px-6 py-2.5 rounded-sm flex items-center gap-2 font-bold hover:bg-yellow-500 transition-all shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18}/>}
            {saving ? 'Salvando...' : 'Salvar Tudo'}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-8 mb-10 border-b border-neutral-800">
          {[
            { id: 'sessions', label: 'Jornada', icon: Book },
            { id: 'players', label: 'Grupo', icon: Users },
            { id: 'settings', label: 'Meta', icon: MessageSquare },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 flex items-center gap-2 font-cinzel tracking-widest text-sm transition-all relative ${
                activeTab === tab.id ? 'text-gold' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
            </button>
          ))}
        </div>

        {activeTab === 'sessions' && (
          <div className="space-y-12">
            <div className="flex justify-between items-center bg-neutral-800/30 p-4 rounded-sm border border-neutral-700/50">
              <div>
                <h2 className="text-xl font-cinzel text-gold uppercase tracking-tighter">Estrutura das Crônicas</h2>
                <p className="text-sm text-neutral-500 italic">Organize suas sessões e capítulos narrativos</p>
              </div>
              <button onClick={addSession} className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-sm flex items-center gap-2 border border-gold/30 text-gold font-bold text-sm transition-colors">
                <Plus size={16}/> Nova Sessão
              </button>
            </div>

            {sessions.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-neutral-800 rounded">
                <p className="text-neutral-500 font-cinzel">Nenhuma sessão registrada. Comece criando uma!</p>
              </div>
            )}

            {sessions.map((session) => (
              <div key={session.id} className="bg-ink/60 border border-gold/10 rounded-sm overflow-hidden shadow-2xl">
                <div className="bg-ink p-4 border-b border-gold/10 flex justify-between items-center">
                  <div className="flex gap-6 items-center flex-1">
                    <div className="flex flex-col">
                       <label className="text-[10px] text-gold/40 font-bold uppercase mb-1">Título da Sessão</label>
                       <input 
                        value={session.title} 
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setSessions(sessions.map(s => s.id === session.id ? { ...s, title: newTitle } : s));
                        }}
                        placeholder="Ex: O Despertar da Churrasqueira"
                        className="bg-transparent border-b border-transparent focus:border-gold outline-none text-gold font-cinzel text-lg w-full"
                      />
                    </div>
                    <div className="flex flex-col">
                       <label className="text-[10px] text-gold/40 font-bold uppercase mb-1">Data/Identificador</label>
                       <input 
                        value={session.date_str} 
                        onChange={(e) => {
                          const newDate = e.target.value;
                          setSessions(sessions.map(s => s.id === session.id ? { ...s, date_str: newDate } : s));
                        }}
                        placeholder="Ex: Dia 1"
                        className="bg-transparent border-b border-transparent focus:border-gold outline-none text-neutral-400 text-sm italic"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => addChapter(session.id)} className="text-xs bg-gold/10 hover:bg-gold/20 text-gold px-4 py-2 rounded-sm border border-gold/20 transition-all font-bold">
                      + CAPÍTULO
                    </button>
                    <button onClick={() => deleteSession(session.id)} className="p-2 text-red-900 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6 bg-black/20">
                  {session.chapters?.length === 0 && <p className="text-center text-neutral-600 italic text-sm py-4">Sessão vazia</p>}
                  {session.chapters?.map((chapter) => (
                    <div key={chapter.id} className="bg-neutral-800/40 p-5 rounded-sm border border-neutral-700/50 group hover:border-gold/20 transition-all">
                      <div className="flex gap-6 items-start">
                        <div className="flex flex-col gap-2 pt-2">
                          <button onClick={() => moveChapter(session.id, chapter.id, 'up')} className="p-1 hover:text-gold text-neutral-600 transition-colors"><ChevronUp size={20}/></button>
                          <button onClick={() => moveChapter(session.id, chapter.id, 'down')} className="p-1 hover:text-gold text-neutral-600 transition-colors"><ChevronDown size={20}/></button>
                        </div>
                        <div className="flex-1 space-y-6">
                          {/* 1. Título do Capítulo */}
                          <div>
                            <label className="text-[10px] text-gold/60 font-bold uppercase tracking-widest block mb-2">Título do Capítulo</label>
                            <input 
                              value={chapter.title}
                              placeholder="Nome do Capítulo"
                              onChange={(e) => {
                                const newTitle = e.target.value;
                                setSessions(sessions.map(s => s.id === session.id ? { ...s, chapters: s.chapters?.map(c => c.id === chapter.id ? { ...c, title: newTitle } : c) } : s));
                              }}
                              className="w-full bg-transparent text-parchment font-cinzel text-xl border-b border-neutral-700 focus:border-gold outline-none pb-2 transition-all"
                            />
                          </div>

                          {/* 2. Ilustração (16:9) */}
                          <div className="space-y-3">
                            <label className="text-[10px] text-gold/60 font-bold uppercase tracking-widest block">Ilustração do Capítulo</label>
                            
                            <div className="aspect-video w-full bg-neutral-900 rounded border border-neutral-700 flex items-center justify-center overflow-hidden relative group/img shadow-2xl">
                               {chapter.image_url ? (
                                 <img 
                                  src={`${getStorageUrl(chapter.image_url)}?t=${Date.now()}`} 
                                  key={chapter.image_url}
                                  className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" 
                                 />
                               ) : (
                                 <div className="flex flex-col items-center gap-2 opacity-20">
                                   <ImageIcon size={48} />
                                   <span className="text-[10px] uppercase font-bold tracking-tighter">Sem Imagem</span>
                                 </div>
                               )}
                               <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]">
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    className="hidden" 
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const fileName = `pic_chr${chronicle.id.slice(0,4)}_cap${chapter.id.slice(0,4)}.jpg`;
                                      const path = await handleFileUpload(file, fileName, chapter.image_url);
                                      setSessions(sessions.map(s => s.id === session.id ? { ...s, chapters: s.chapters?.map(c => c.id === chapter.id ? { ...c, image_url: path } : c) } : s));
                                    }}
                                  />
                                  <Upload className="text-gold mb-2" size={32} />
                                  <span className="text-xs font-bold text-white uppercase tracking-widest">Fazer Upload Ilustração</span>
                                  <p className="text-[10px] text-gold/60 mt-1">AR 16:9 (1920x1080px)</p>
                               </label>
                            </div>
                          </div>

                          {/* 3. Narrativa (Texto) */}
                          <div className="space-y-2">
                             <div className="flex justify-between items-center mb-2">
                               <label className="text-[10px] text-gold/60 font-bold uppercase tracking-widest block">Narrativa do Capítulo</label>
                               <button 
                                onClick={() => handleGeneratePrompt(chapter)}
                                title="Gerar Prompt sugerido para IA"
                                className="flex items-center gap-1 text-[9px] uppercase font-bold text-gold/40 hover:text-gold transition-colors bg-gold/5 px-2 py-1 rounded-sm border border-gold/10"
                               >
                                <Wand2 size={12} /> Prompt IA Mágico
                               </button>
                             </div>
                             <textarea 
                                value={chapter.content}
                                placeholder="Conte a história aqui..."
                                rows={10}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setSessions(sessions.map(s => s.id === session.id ? { ...s, chapters: s.chapters?.map(c => c.id === chapter.id ? { ...c, content: newVal } : c) } : s));
                                }}
                                className="w-full bg-ink/30 border border-neutral-700/50 p-6 rounded text-parchment/90 text-base focus:border-gold outline-none leading-relaxed resize-none font-merriweather shadow-inner min-h-[300px]"
                             />
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteChapter(session.id, chapter.id)}
                          className="p-2 text-red-900/50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={20}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'players' && (
           <div className="space-y-10">
              <div className="flex justify-between items-center bg-neutral-800/30 p-4 rounded-sm border border-neutral-700/50">
                <div>
                  <h2 className="text-xl font-cinzel text-gold uppercase tracking-tighter">O Grupo de Aventureiros</h2>
                  <p className="text-sm text-neutral-500 italic">Gerencie os personagens que fazem parte desta jornada</p>
                </div>
                <button onClick={addPlayer} className="bg-gold text-ink font-bold px-5 py-2 rounded-sm flex items-center gap-2 hover:bg-yellow-500 transition-all text-sm">
                  <Plus size={16}/> Novo Jogador
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {players.map((p) => (
                  <div key={p.id} className="bg-ink p-6 border border-gold/10 rounded-sm flex gap-6 group hover:border-gold/30 transition-all shadow-xl relative">
                     <button 
                      onClick={() => deletePlayer(p.id)}
                      className="absolute top-2 right-2 p-2 text-neutral-800 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                     >
                        <Trash2 size={16} />
                     </button>
                     <div className="space-y-4">
                       <div className="w-24 h-24 rounded-full border-2 border-gold/20 overflow-hidden bg-neutral-800 shadow-inner">
                         {p.face_url ? <img src={getStorageUrl(p.face_url)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Users className="text-neutral-700" /></div>}
                       </div>
                       <label className="flex items-center gap-2 text-[10px] font-bold text-gold cursor-pointer hover:text-yellow-400">
                         <input 
                          type="checkbox" 
                          checked={p.is_active} 
                          onChange={(e) => updatePlayer(p.id, { is_active: e.target.checked })}
                          className="accent-gold w-4 h-4" 
                         /> ATIVO
                       </label>
                     </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] uppercase text-neutral-600 font-bold block mb-1">Nome do Personagem</label>
                            <input 
                            value={p.char_name} 
                            onChange={(e) => updatePlayer(p.id, { char_name: e.target.value })}
                            placeholder="Nome do Herói" 
                            className="block w-full bg-transparent font-cinzel text-xl text-gold outline-none border-b border-transparent focus:border-gold pb-1" 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase text-neutral-600 font-bold block mb-1">Jogador Real</label>
                            <input 
                            value={p.real_name} 
                            onChange={(e) => updatePlayer(p.id, { real_name: e.target.value })}
                            placeholder="Responsável" 
                            className="block w-full bg-transparent text-sm text-neutral-300 outline-none italic border-b border-transparent focus:border-gold/30 pb-1" 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] uppercase text-gold/40 font-bold block">Rosto (1:1)</label>
                              <div className="w-full aspect-square bg-neutral-900 border border-neutral-800 rounded-sm relative group/face overflow-hidden">
                                 {p.face_url ? (
                                   <img src={getStorageUrl(p.face_url)} className="w-full h-full object-cover" />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center opacity-20"><ImageIcon size={20}/></div>
                                 )}
                                 <label className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover/face:opacity-100 cursor-pointer transition-opacity">
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const fileName = `pic_plr_${p.char_name.toLowerCase().replace(/\s/g, '_')}_face.jpg`;
                                      const path = await handleFileUpload(file, fileName, p.face_url);
                                      updatePlayer(p.id, { face_url: path });
                                    }}/>
                                    <Upload size={16} className="text-gold" />
                                 </label>
                              </div>
                              <p className="text-[8px] text-neutral-600 font-medium">Recomendado: 400x400px</p>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] uppercase text-gold/40 font-bold block">Corpo Inteiro</label>
                              <div className="w-full h-[100px] bg-neutral-900 border border-neutral-800 rounded-sm relative group/body overflow-hidden">
                                {p.body_url ? (
                                   <img src={getStorageUrl(p.body_url)} className="w-full h-full object-cover" />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center opacity-20"><UserCheck size={20}/></div>
                                 )}
                                 <label className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover/body:opacity-100 cursor-pointer transition-opacity">
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const fileName = `pic_plr_${p.char_name.toLowerCase().replace(/\s/g, '_')}_body.jpg`;
                                      const path = await handleFileUpload(file, fileName, p.body_url);
                                      updatePlayer(p.id, { body_url: path });
                                    }}/>
                                    <Upload size={16} className="text-gold" />
                                 </label>
                              </div>
                              <p className="text-[8px] text-neutral-600 font-medium whitespace-nowrap">Recomendado: Retrato (Ex: 800x1200px)</p>
                           </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase text-neutral-600 font-bold block mb-1">Descrição</label>
                          <textarea 
                          value={p.description || ''} 
                          onChange={(e) => updatePlayer(p.id, { description: e.target.value })}
                          placeholder="Breve história..." 
                          className="w-full bg-black/20 text-sm text-neutral-400 outline-none border border-neutral-800 p-2 rounded focus:border-gold/20 resize-none font-serif" 
                          rows={2} 
                          />
                        </div>
                      </div>
                  </div>
                ))}
              </div>
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-ink p-10 border border-gold/10 rounded-sm space-y-10 shadow-2xl">
              <div>
                <h3 className="font-cinzel text-gold text-xl mb-6 flex items-center gap-3">
                  <MessageSquare size={20} /> Metadados da Crônica
                </h3>
                <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-xs uppercase tracking-widest text-gold/60 font-bold">Título Principal</label>
                     <input 
                       value={chronicle.title} 
                       onChange={(e) => setChronicle({...chronicle, title: e.target.value})}
                       className="w-full bg-neutral-800/50 border border-neutral-700 p-4 rounded-sm outline-none focus:ring-1 focus:ring-gold text-lg font-cinzel text-gold"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs uppercase tracking-widest text-gold/60 font-bold">Mestre da Mesa</label>
                     <input 
                       value={chronicle.master_name}
                       onChange={(e) => setChronicle({...chronicle, master_name: e.target.value})}
                       className="w-full bg-neutral-800/50 border border-neutral-700 p-4 rounded-sm outline-none focus:ring-1 focus:ring-gold"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs uppercase tracking-widest text-gold/60 font-bold">Sistema de RPG</label>
                     <select 
                       value={chronicle.system_id || ''}
                       onChange={(e) => setChronicle({...chronicle, system_id: e.target.value})}
                       className="w-full bg-neutral-800/50 border border-neutral-700 p-4 rounded-sm outline-none focus:ring-1 focus:ring-gold text-white appearance-none cursor-pointer"
                     >
                       <option value="">Selecione um sistema</option>
                       {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs uppercase tracking-widest text-gold/60 font-bold">URL Pública (Slug)</label>
                     <div className="flex items-center gap-4 bg-neutral-800/50 border border-neutral-700 p-4 rounded-sm">
                       <span className="text-neutral-500 text-sm font-mono tracking-tighter">andreric.com/rpg/</span>
                       <input 
                          value={chronicle.slug}
                          onChange={(e) => setChronicle({...chronicle, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                          className="bg-transparent border-none outline-none flex-1 font-bold text-gold placeholder:text-neutral-700"
                          placeholder="meu-rpg-fantastico"
                       />
                     </div>
                     <p className="text-[10px] text-neutral-600 italic">O slug define o link final da sua aventura.</p>
                   </div>
                </div>
              </div>
          </div>
        )}
      </div>

      {/* AI Prompt Modal */}
      <AnimatePresence>
        {showPromptModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-neutral-900 border border-gold/30 rounded-sm shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gold/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Wand2 className="text-gold" size={20} />
                  <h3 className="font-cinzel text-lg text-gold uppercase tracking-tighter">Prompt Perfeito para IA</h3>
                </div>
                <button onClick={() => setShowPromptModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <p className="text-sm text-neutral-400 italic">
                  O Gemini AI está analisando sua história para extrair a essência visual perfeita. 
                  <br />
                  <span className="text-gold/60">💡 Dica Leonardo.ai: Use o seletor lateral em 16:9.</span>
                </p>

                {isGeneratingPrompt ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="text-gold animate-spin" size={48} />
                    <p className="text-gold animate-pulse font-cinzel">Invocando Inteligência Arcano...</p>
                  </div>
                ) : errorAI ? (
                  <div className="p-4 bg-red-900/20 border border-red-500/50 rounded text-red-200 text-sm">
                    {errorAI}
                  </div>
                ) : (
                  <>
                    <div className="relative group">
                      <textarea 
                        readOnly
                        value={generatedPrompt}
                        className="w-full h-40 bg-black/40 border border-gold/20 p-6 rounded text-parchment/70 text-sm italic font-serif leading-relaxed outline-none resize-none"
                      />
                    </div>
                    <button 
                      onClick={copyToClipboard}
                      className={`w-full py-4 rounded-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        copySuccess ? 'bg-green-600 text-white' : 'bg-gold text-ink hover:bg-yellow-500 shadow-lg'
                      }`}
                    >
                      {copySuccess ? (
                        <><Check size={20} /> COPIADO!</>
                      ) : (
                        <><Copy size={20} /> COPIAR PROMPT</>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
