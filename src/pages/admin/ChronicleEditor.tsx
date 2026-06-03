import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Chronicle, Session, Player, RPGSystem, Chapter } from '../../types';
import { SessionModal } from './components/SessionModal';
import { ChapterModal } from './components/ChapterModal';
import { 
  ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown, 
  Users, Book, MessageSquare, Image as ImageIcon, Loader2,
  CheckCircle2, XCircle, Upload, UserCheck, Wand2, Copy, Check, X
} from 'lucide-react';
import { getStorageUrl } from '../../lib/supabase';

// Helper to sanitize filenames for Supabase Storage
const slugify = (text: string) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

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
  const [activeTab, setActiveTab] = useState<'sessions' | 'players' | 'aventura'>('sessions');
  const [isDirty, setIsDirty] = useState({ sessions: false, players: false, aventura: false });
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptStatusText, setPromptStatusText] = useState('Consultando os Oráculos...');
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorAI, setErrorAI] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editingChapter, setEditingChapter] = useState<{sessionId: string; chapter: Chapter} | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
  const [playersTimestamp, setPlayersTimestamp] = useState<number>(Date.now());
  const [playerUploadError, setPlayerUploadError] = useState<{ playerId: string; type: 'face' | 'body'; message: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleAuthOrTechnicalError = (err: any, fallbackMessage: string) => {
    console.error(fallbackMessage, err);
    const isAuthError = 
      err?.message?.includes("JWT") || 
      err?.code === "PGRST301" || 
      err?.status === 401 || 
      err?.message?.includes("session") || 
      err?.message?.includes("claims") ||
      err?.message?.includes("unauthorized") ||
      err?.message?.toLowerCase().includes("jwt");
      
    if (isAuthError) {
      navigate('/admin', { 
        state: { 
          message: 'Sua sessão expirou. Por favor, faça login novamente para continuar.' 
        } 
      });
    } else {
      showToast(`${fallbackMessage}: ${err.message || 'Erro desconhecido'}`, 'error');
    }
  };

  const checkSession = async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin', { 
        state: { 
          message: 'Sua sessão expirou. Por favor, faça login novamente para continuar.' 
        } 
      });
      return false;
    }
    return true;
  };

  const handleOpenEditSession = async (session: Session) => {
    if (!(await checkSession())) return;
    setEditingSession(session);
  };

  const handleOpenEditChapter = async (chapter: Chapter, sessionId: string) => {
    if (!(await checkSession())) return;
    setEditingChapter({ chapter, sessionId });
  };

  useEffect(() => {
    async function init() {
      const active = await checkSession();
      if (active && id) {
        fetchData();
      }
    }
    init();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: chr } = await supabase.from('chronicles').select('*, systems(*)').eq('id', id).single();
      const { data: sess } = await supabase.from('sessions').select('*, chapters(*)').eq('chronicle_id', id).order('session_date', { ascending: true });
      const { data: plrs } = await supabase.from('players').select('*').eq('chronicle_id', id).order('real_name', { ascending: true });
      const { data: sys } = await supabase.from('systems').select('*');

      if (chr) setChronicle(chr);
      if (sess) {
        // Ensure chapters are sorted
        const sortedSess = sess.map(s => ({
          ...s,
          chapters: (s.chapters || []).sort((a: Chapter, b: Chapter) => a.order_index - b.order_index)
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
  const STORAGE_BUCKET = 'media';

  const handleChapterFileUpload = async (file: File, chapter: Chapter, sessionId: string): Promise<string> => {
    if (!(await checkSession())) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const session = sessions.find((s: Session) => s.id === sessionId);
    const sessionNum = (session?.order_index !== undefined ? session.order_index + 1 : 1);
    const sessionStr = `dia${String(sessionNum).padStart(3, '0')}`;
    
    const capNum = (chapter.order_index !== undefined ? chapter.order_index + 1 : 1);
    const capStr = `cap${String(capNum).padStart(3, '0')}`;
    
    const titleSlug = slugify(chapter.title || 'capitulo');
    const path = `codex/${sessionStr}/${capStr}_${titleSlug}.${ext}`;
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: true, cacheControl: '0' });

    if (error) {
      throw error;
    }
    return path;
  };

  const handlePlayerFileUpload = async (file: File, player: Player, type: 'face' | 'body'): Promise<string> => {
    if (!(await checkSession())) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const nameSlug = slugify(player.char_name || 'personagem');
    const path = `codex/players/${nameSlug}_${type}.${ext}`;
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: true, cacheControl: '0' });

    if (error) {
      throw error;
    }
    return path;
  };

  const handleGeneratePrompt = async (chapter: any) => {
    if (!(await checkSession())) return;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      setErrorAI("Chave de API do Gemini não configurada no arquivo .env");
      setShowPromptModal(true);
      return;
    }

    setIsGeneratingPrompt(true);
    setPromptStatusText('Consultando os Oráculos...');
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

      let response;
      const modelsToTry = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      
      for (let i = 0; i < modelsToTry.length; i++) {
        try {
          response = await ai.models.generateContent({
            model: modelsToTry[i],
            contents: userContent,
            config: {
              systemInstruction: systemPrompt,
            },
          });
          break; // Sucesso, aborta o loop
        } catch (err: any) {
          console.warn(`[IA] Falha com o modelo API ${modelsToTry[i]}:`, err.message || err);
          if (i === modelsToTry.length - 1) {
             throw new Error(err.message || "A cota de uso expirou ou ocorreu uma falha ao conectar com o Gemini.");
          }
        }
      }
      
      const text = (response?.text ?? '').trim();
      setGeneratedPrompt(text);

      // Inicia a geração de imagem automática com o Imagen 3
      setPromptStatusText('Pintando a Ilustração com IA...');
      
      try {
        const cleanPrompt = text.replace(/--ar\s+\d+:\d+/gi, '').trim();
        const imageResponse = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: cleanPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
          },
        });

        const imageBytes = imageResponse.generatedImages?.[0]?.image?.imageBytes;
        if (!imageBytes) {
          throw new Error("Nenhum dado de imagem retornado.");
        }

        // Converter base64 em File
        const byteCharacters = atob(imageBytes);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new File([byteArray], `ia_${chapter.id}.jpg`, { type: 'image/jpeg' });

        const sessionId = editingChapter?.sessionId;
        if (!sessionId) {
          throw new Error("Sessão não identificada para salvar imagem.");
        }

        // Fazer upload da imagem para o Supabase
        const storagePath = await handleChapterFileUpload(file, chapter, sessionId);

        // Salvar o caminho no banco de dados do capítulo
        const { error: dbError } = await supabase
          .from('chapters')
          .update({ image_url: storagePath })
          .eq('id', chapter.id);

        if (dbError) throw dbError;

        // Atualizar o estado de sessões do editor
        setSessions((prevSessions: Session[]) => prevSessions.map((s: Session) => 
          s.id === sessionId 
            ? { ...s, chapters: s.chapters?.map((c: Chapter) => c.id === chapter.id ? { ...c, image_url: storagePath } : c) } 
            : s
        ));

        // Atualizar a modal aberta
        if (editingChapter && editingChapter.chapter.id === chapter.id) {
          setEditingChapter({
            ...editingChapter,
            chapter: { ...editingChapter.chapter, image_url: storagePath }
          });
        }

        showToast("Ilustração gerada e salva com sucesso!");
        setShowPromptModal(false); // Fecha o modal de prompt
      } catch (imageErr: any) {
        console.warn("[IA] Geração de imagem falhou. Exibindo prompt para uso manual:", imageErr);
        setErrorAI(`Não foi possível gerar a imagem diretamente: ${imageErr.message || imageErr}. O prompt gerado em texto está exibido abaixo para uso manual.`);
      }
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

  const togglePublish = async (session: Session) => {
    if (!(await checkSession())) return;
    const newStatus = !session.is_published;
    if (confirm(newStatus ? 'Publicar esta sessão para todos?' : 'Remover publicação (Torna invisível)?')) {
      try {
        const { error } = await supabase.from('sessions').update({ is_published: newStatus }).eq('id', session.id);
        if (error) throw error;
        setSessions(sessions.map(s => s.id === session.id ? { ...s, is_published: newStatus } : s));
        showToast(newStatus ? 'Sessão publicada com sucesso!' : 'Publicação removida com sucesso!');
      } catch (err: any) {
        handleAuthOrTechnicalError(err, 'Erro ao alterar publicação');
      }
    }
  };

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId) 
        : [...prev, sessionId]
    );
  };

  // --- Section Saves ---
  const handleTabChange = (newTab: 'sessions' | 'players' | 'aventura') => {
    const hasChanges = isDirty.sessions || isDirty.players || isDirty.aventura;
    if (hasChanges && !window.confirm("Você tem alterações não salvas. Deseja sair sem salvar?")) {
      return;
    }
    setActiveTab(newTab);
  };

  const saveSessions = async () => {
    if (!id) return;
    if (!(await checkSession())) return;
    setSaving(true);
    setSaveStatus('saving');
    try {
      const sortedByDateAsc = [...sessions].sort((a: Session, b: Session) => {
        const dateA = a.session_date ? new Date(a.session_date).getTime() : 0;
        const dateB = b.session_date ? new Date(b.session_date).getTime() : 0;
        return dateA - dateB;
      });

      const updatedSessions = sortedByDateAsc.map((session: Session, idx: number) => ({
        ...session,
        order_index: idx
      }));

      for (const session of updatedSessions) {
        const { error: sessionError } = await supabase.from('sessions').update({
          title: session.title,
          date_str: session.date_str,
          order_index: session.order_index,
          session_date: session.session_date
        }).eq('id', session.id);

        if (sessionError) throw sessionError;

        if (session.chapters) {
          for (const chapter of session.chapters) {
            const { error: chapterError } = await supabase.from('chapters').update({
              title: chapter.title,
              content: chapter.content,
              image_url: chapter.image_url,
              order_index: chapter.order_index
            }).eq('id', chapter.id);

            if (chapterError) throw chapterError;
          }
        }
      }
      setSessions(updatedSessions);
      setIsDirty({ ...isDirty, sessions: false });
      setSaveStatus('success');
      showToast('Jornada salva com sucesso!');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      handleAuthOrTechnicalError(err, 'Falha ao salvar a jornada');
    }
    setSaving(false);
  };

  const savePlayers = async () => {
    if (!id) return;
    if (!(await checkSession())) return;
    setSaving(true);
    setSaveStatus('saving');
    try {
      for (const player of players) {
        const { error } = await supabase.from('players').update({
          real_name: player.real_name,
          char_name: player.char_name,
          description: player.description,
          face_url: player.face_url,
          body_url: player.body_url,
          is_active: player.is_active,
          race: player.race,
          class: player.class,
          level_points: player.level_points
        }).eq('id', player.id);

        if (error) throw error;
      }
      setIsDirty({ ...isDirty, players: false });
      setSaveStatus('success');
      showToast('Grupo de aventureiros salvo com sucesso!');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      handleAuthOrTechnicalError(err, 'Falha ao salvar os jogadores');
    }
    setSaving(false);
  };

  const saveAventura = async () => {
    if (!chronicle || !id) return;
    if (!(await checkSession())) return;
    setSaving(true);
    setSaveStatus('saving');
    try {
      const { error } = await supabase.from('chronicles').update({
        title: chronicle.title,
        master_name: chronicle.master_name,
        system_id: chronicle.system_id,
        slug: chronicle.slug
      }).eq('id', id);

      if (error) throw error;

      setIsDirty({ ...isDirty, aventura: false });
      setSaveStatus('success');
      showToast('Metadados da aventura salvos!');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      handleAuthOrTechnicalError(err, 'Falha ao salvar a aventura');
    }
    setSaving(false);
  };

  // --- Session Actions ---
  const addSession = async () => {
    if (!(await checkSession())) return;
    try {
      const nextOrderIndex = sessions.length > 0
        ? Math.max(...sessions.map((s: Session) => s.order_index ?? 0)) + 1
        : 0;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.from('sessions').insert({
        id: crypto.randomUUID(),
        chronicle_id: id,
        title: 'Nova Sessão',
        date_str: 'Dia X',
        order_index: nextOrderIndex,
        session_date: today
      }).select().single();

      if (error) throw error;

      if (data) {
        setSessions([...sessions, { ...data, chapters: [] }]);
        setEditingSession({ ...data, chapters: [] });
        setExpandedSessions((prev: string[]) => [...prev, data.id]);
        showToast('Nova sessão criada com sucesso!');
      }
    } catch (err: any) {
      handleAuthOrTechnicalError(err, 'Falha ao criar nova sessão');
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!(await checkSession())) return;
    if (!confirm('Tem certeza que deseja excluir esta sessão e todos os seus capítulos?')) return;
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
      if (error) throw error;
      setSessions(sessions.filter(s => s.id !== sessionId));
      showToast('Sessão excluída com sucesso!');
    } catch (err: any) {
      handleAuthOrTechnicalError(err, 'Erro ao excluir sessão');
    }
  };

  // --- Chapter Actions ---
  const addChapter = async (sessionId: string) => {
    if (!(await checkSession())) return;
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    try {
      const { data, error } = await supabase.from('chapters').insert({
        id: crypto.randomUUID(),
        session_id: sessionId,
        title: 'Novo Capítulo',
        content: '',
        image_url: '',
        order_index: (session.chapters?.length || 0) + 1
      }).select().single();

      if (error) throw error;
      
      if (data) {
        setSessions(sessions.map(s => s.id === sessionId ? { ...s, chapters: [...(s.chapters || []), data].sort((a: Chapter, b: Chapter) => a.order_index - b.order_index) } : s));
        setEditingChapter({ chapter: data, sessionId });
        showToast('Novo capítulo criado!');
      }
    } catch (err: any) {
      handleAuthOrTechnicalError(err, 'Falha ao adicionar capítulo');
    }
  };

  const deleteChapter = async (sessionId: string, chapterId: string) => {
    if (!(await checkSession())) return;
    if (!confirm('Excluir este capítulo?')) return;
    try {
      const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
      if (error) throw error;
      setSessions(sessions.map(s => s.id === sessionId ? { ...s, chapters: s.chapters?.filter(c => c.id !== chapterId) } : s));
      showToast('Capítulo excluído!');
    } catch (err: any) {
      handleAuthOrTechnicalError(err, 'Erro ao excluir capítulo');
    }
  };

  const moveChapter = (sessionId: string, chapterId: string, direction: 'up' | 'down') => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.chapters) return;
    
    const chapters = [...session.chapters].sort((a: Chapter, b: Chapter) => a.order_index - b.order_index);
    const idx = chapters.findIndex(c => c.id === chapterId);
    if (direction === 'up' && idx > 0) {
      [chapters[idx], chapters[idx-1]] = [chapters[idx-1], chapters[idx]];
    } else if (direction === 'down' && idx < chapters.length - 1) {
      [chapters[idx], chapters[idx+1]] = [chapters[idx+1], chapters[idx]];
    } else {
      return;
    }

    const updated = chapters.map((c: Chapter, i: number) => ({ ...c, order_index: i + 1 }));
    setSessions(sessions.map((s: Session) => s.id === sessionId ? { ...s, chapters: updated } : s));
    setIsDirty({ ...isDirty, sessions: true });
  };

  // --- Player Actions ---
  const addPlayer = async () => {
    if (!(await checkSession())) return;
    try {
      const { data, error } = await supabase.from('players').insert({
        id: crypto.randomUUID(),
        chronicle_id: id,
        real_name: 'Novo Jogador',
        char_name: 'Novo Personagem',
        description: '',
        is_active: true
      }).select().single();

      if (error) throw error;

      if (data) {
        setPlayers([...players, data]);
        showToast('Novo jogador adicionado!');
      }
    } catch (err: any) {
      handleAuthOrTechnicalError(err, 'Falha ao adicionar jogador');
    }
  };

  const deletePlayer = async (playerId: string) => {
    if (!(await checkSession())) return;
    if (!confirm('Remover este jogador?')) return;
    try {
      const { error } = await supabase.from('players').delete().eq('id', playerId);
      if (error) throw error;
      setPlayers(players.filter(p => p.id !== playerId));
      showToast('Jogador removido!');
    } catch (err: any) {
      handleAuthOrTechnicalError(err, 'Erro ao excluir jogador');
    }
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setPlayers(players.map(p => p.id === playerId ? { ...p, ...updates } : p));
  };

  if (loading || !chronicle) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gold" size={48} /></div>;

  return (
    <div className="h-screen h-[100dvh] bg-neutral-900 text-white font-sans flex flex-col overflow-hidden">
      <header className="bg-ink border-b border-gold/20 p-4 sticky top-0 z-50 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="hover:text-gold transition-colors p-2"><ArrowLeft /></button>
          <div className="flex flex-col">
            <h1 className="font-cinzel text-xl text-gold leading-tight">{chronicle.title}</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Painel de Controle</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {saveStatus === 'success' && <span className="text-green-500 text-sm flex items-center gap-1"><CheckCircle2 size={16}/> Salvo com sucesso</span>}
          {saveStatus === 'error' && <span className="text-red-500 text-sm flex items-center gap-1"><XCircle size={16}/> Erro ao salvar</span>}
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-ink border-b md:border-b-0 md:border-r border-gold/10 flex flex-row md:flex-col py-2 md:py-8 overflow-x-auto md:overflow-y-auto custom-scrollbar shrink-0">
          {[
            { id: 'sessions', label: 'Jornada', icon: Book },
            { id: 'players', label: 'Grupo', icon: Users },
            { id: 'aventura', label: 'Aventura', icon: MessageSquare },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-4 md:px-8 py-3 md:py-4 flex items-center gap-3 md:gap-4 font-cinzel tracking-[0.1em] md:tracking-widest text-xs md:text-sm transition-all border-b-2 md:border-b-0 md:border-l-2 relative whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-gold border-gold bg-gold/5' 
                  : 'text-neutral-500 border-transparent hover:text-neutral-300 hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} className="md:w-[18px] md:h-[18px]" />
              {tab.label}
              {(tab.id === 'sessions' ? isDirty.sessions : tab.id === 'players' ? isDirty.players : isDirty.aventura) && (
                <div className="absolute right-2 top-2 md:right-4 md:top-1/2 md:-translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              )}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 custom-scrollbar relative overscroll-contain">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'sessions' && (
              <div className="space-y-12 pb-20">
                <div className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md p-4 md:p-6 border-b border-gold/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
                  <div>
                    <h2 className="text-lg md:text-xl font-cinzel text-gold uppercase tracking-tighter">Estrutura das Crônicas</h2>
                    <p className="text-[10px] md:text-sm text-neutral-500 italic">Organize suas sessões e capítulos narrativos</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={addSession} className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-sm flex items-center gap-2 border border-gold/30 text-gold font-bold text-sm transition-colors">
                      <Plus size={16}/> Nova Sessão
                    </button>
                    <button 
                      onClick={saveSessions} 
                      disabled={saving || !isDirty.sessions}
                      className="bg-gold text-ink px-6 py-2 rounded-sm flex items-center gap-2 font-bold hover:bg-yellow-500 transition-all shadow-lg disabled:opacity-30"
                    >
                      {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18}/>}
                      {saving ? 'Salvando...' : 'Salvar Jornada'}
                    </button>
                  </div>
                </div>

                <div className="p-4 md:p-10 space-y-6 md:space-y-8">
                  {sessions.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-neutral-800 rounded">
                      <p className="text-neutral-500 font-cinzel">Nenhuma sessão registrada. Comece criando uma!</p>
                    </div>
                  )}

                  {[...sessions].sort((a: Session, b: Session) => {
                    const dateA = a.session_date ? new Date(a.session_date).getTime() : 0;
                    const dateB = b.session_date ? new Date(b.session_date).getTime() : 0;
                    return dateB - dateA;
                  }).map((session: Session) => (
                    <div key={session.id} className="bg-ink/60 border border-gold/10 rounded-sm overflow-hidden shadow-2xl">
                      {/* Session Header */}
                      <div 
                        className="bg-ink p-4 border-b border-gold/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-neutral-900 transition-colors"
                        onClick={(e: React.MouseEvent) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          toggleSession(session.id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              toggleSession(session.id);
                            }}
                            className="text-gold/60 p-1 hover:text-gold transition-colors"
                          >
                            {expandedSessions.includes(session.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                          <div className="flex flex-col">
                            <h4 className="text-gold font-cinzel text-xl flex items-center gap-2">
                               {session.title}
                               {session.is_published && <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-green-500/20">Publicado</span>}
                            </h4>
                            <span className="text-neutral-500 text-sm italic">{session.date_str} {session.session_date ? `— ${new Date(session.session_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}` : ''}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap ml-11 md:ml-0">
                           <button onClick={() => togglePublish(session)} className={`px-4 py-2 rounded-sm text-xs uppercase font-bold border transition-colors ${session.is_published ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white' : 'bg-green-600/20 text-green-500 border-green-600/30 hover:bg-green-600/30'}`}>
                             {session.is_published ? 'Despublicar' : 'Publicar'}
                           </button>
                           <button onClick={() => handleOpenEditSession(session)} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-sm text-xs font-bold uppercase transition-colors">Editar</button>
                           <button onClick={() => deleteSession(session.id)} className="p-2 text-red-900 hover:text-red-500 transition-colors bg-red-900/10 rounded-sm">
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </div>

                      {/* Chapters Accordion / List */}
                      <AnimatePresence>
                        {expandedSessions.includes(session.id) && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-black/20"
                          >
                            <div className="p-4">
                               <div className="flex justify-between items-center mb-4">
                                 <h5 className="font-bold text-[10px] text-gold/40 uppercase tracking-widest">Capítulos ({session.chapters?.length || 0})</h5>
                                 <button onClick={() => addChapter(session.id)} className="text-[10px] bg-gold/10 hover:bg-gold/20 text-gold px-3 py-1 rounded-sm border border-gold/20 transition-all font-bold flex items-center gap-1">
                                   <Plus size={12}/> CAPÍTULO
                                 </button>
                               </div>
                               <div className="space-y-2">
                                 {session.chapters?.sort((a: Chapter, b: Chapter) => a.order_index - b.order_index).map(chapter => (
                                   <div key={chapter.id} className="flex justify-between items-center bg-neutral-900/50 p-3 rounded border border-neutral-800 hover:border-gold/20 transition-colors">
                                     <div className="flex items-center gap-3">
                                        <div className="flex flex-col gap-1 items-center bg-ink p-1 rounded">
                                          <button onClick={() => moveChapter(session.id, chapter.id, 'up')} className="text-neutral-600 hover:text-gold"><ChevronUp size={14}/></button>
                                          <button onClick={() => moveChapter(session.id, chapter.id, 'down')} className="text-neutral-600 hover:text-gold"><ChevronDown size={14}/></button>
                                        </div>
                                        <span className="text-parchment font-cinzel">Capítulo {chapter.order_index} — {chapter.title}</span>
                                        {chapter.image_url && <ImageIcon size={14} className="text-gold/40"/>}
                                     </div>
                                     <div className="flex gap-2">
                                        <button onClick={() => handleOpenEditChapter(chapter, session.id)} className="text-xs text-gold/60 hover:text-gold uppercase font-bold px-3 py-1 bg-gold/5 rounded">Editar</button>
                                        <button onClick={() => deleteChapter(session.id, chapter.id)} className="text-red-900 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'players' && (
              <div className="space-y-10 pb-20">
                <div className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md p-4 md:p-6 border-b border-gold/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
                  <div>
                    <h2 className="text-lg md:text-xl font-cinzel text-gold uppercase tracking-tighter">O Grupo de Aventureiros</h2>
                    <p className="text-[10px] md:text-sm text-neutral-500 italic">Gerencie os personagens que fazem parte desta jornada</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={addPlayer} className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-sm flex items-center gap-2 border border-gold/30 text-gold font-bold text-sm transition-colors">
                      <Plus size={16}/> Novo Jogador
                    </button>
                    <button 
                      onClick={savePlayers} 
                      disabled={saving || !isDirty.players}
                      className="bg-gold text-ink px-6 py-2 rounded-sm flex items-center gap-2 font-bold hover:bg-yellow-500 transition-all shadow-lg disabled:opacity-30"
                    >
                      {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18}/>}
                      {saving ? 'Salvando...' : 'Salvar Grupo'}
                    </button>
                  </div>
                </div>

                <div className="p-4 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {players.map((p) => {
                    const systemLabel = (chronicle as any).systems?.advancement_label || 'Nível';
                    return (
                      <div key={p.id} className="bg-ink p-6 border border-gold/10 rounded-sm group hover:border-gold/30 transition-all shadow-xl relative">
                        <button 
                          onClick={() => deletePlayer(p.id)}
                          className="absolute top-4 right-4 p-2 text-neutral-800 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>

                        <div className="flex flex-col gap-6 md:gap-8">
                          <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="flex flex-col items-center w-full sm:w-28 shrink-0 text-center">
                              <div className="relative group/avatar">
                                <div className="w-24 h-24 rounded-full border-2 border-gold/20 overflow-hidden bg-neutral-800 shadow-inner">
                                  {p.face_url ? (
                                    <img 
                                      src={`${getStorageUrl(p.face_url)}?t=${playersTimestamp}`} 
                                      key={`${p.face_url}-${playersTimestamp}`}
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center"><Users className="text-neutral-700" size={32} /></div>
                                  )}
                                </div>
                                <label className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 cursor-pointer transition-opacity rounded-full p-2 text-center">
                                  <input type="file" className="hidden" accept="image/*" onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setPlayerUploadError(null);
                                    if (file.size > 5 * 1024 * 1024) {
                                      setPlayerUploadError({
                                        playerId: p.id,
                                        type: 'face',
                                        message: 'O arquivo é muito grande. O limite máximo permitido é de 5MB.'
                                      });
                                      return;
                                    }
                                    try {
                                      const path = await handlePlayerFileUpload(file, p, 'face');
                                      updatePlayer(p.id, { face_url: path });
                                      setPlayersTimestamp(Date.now());
                                      setIsDirty(prev => ({ ...prev, players: true }));
                                    } catch (err: any) {
                                      console.error('Erro no upload do rosto:', err);
                                      const rawErrorMsg = err?.message || err?.error_description || JSON.stringify(err);
                                      setPlayerUploadError({
                                        playerId: p.id,
                                        type: 'face',
                                        message: `Erro ao enviar foto do Rosto. Detalhes técnicos: ${rawErrorMsg}`
                                      });
                                    }
                                  }}/>
                                  <Upload size={16} className="text-gold mb-1" />
                                  <span className="text-[8px] text-white font-bold uppercase tracking-tight leading-none">Upload Face</span>
                                  <span className="text-[7px] text-gold/60 mt-0.5 font-bold">200x200px</span>
                                </label>
                              </div>
                              <p className="text-[9px] text-neutral-400 mt-2 text-center font-sans leading-tight">
                                Rec: 200x200px (1:1)<br />Máx: 5MB
                              </p>
                              {playerUploadError?.playerId === p.id && playerUploadError.type === 'face' && (
                                <div className="text-[9px] text-red-500 font-bold bg-red-950/20 border border-red-900/50 p-1.5 rounded mt-1.5 max-w-[120px] overflow-auto font-mono text-center leading-tight">
                                  {playerUploadError.message}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 space-y-4 w-full">
                              <div>
                                <label className="text-[10px] uppercase text-neutral-600 font-bold block mb-1 tracking-widest">Nome do Personagem</label>
                                <input 
                                  value={p.char_name} 
                                  onChange={(e) => {
                                    updatePlayer(p.id, { char_name: e.target.value });
                                    setIsDirty({ ...isDirty, players: true });
                                  }}
                                  placeholder="Nome do Herói" 
                                  className="block w-full bg-transparent font-cinzel text-2xl text-gold outline-none border-b border-neutral-800 focus:border-gold pb-1 transition-all" 
                                />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase text-neutral-600 font-bold block mb-1 tracking-widest">Jogador Real</label>
                                <input 
                                  value={p.real_name} 
                                  onChange={(e) => {
                                    updatePlayer(p.id, { real_name: e.target.value });
                                    setIsDirty({ ...isDirty, players: true });
                                  }}
                                  placeholder="Responsável" 
                                  className="block w-full bg-transparent text-lg text-neutral-300 outline-none italic border-b border-neutral-800 focus:border-gold/30 pb-1 transition-all" 
                                />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase text-neutral-600 font-bold block mb-1 tracking-widest">Arquivo do Rosto</label>
                                <input 
                                  value={p.face_url || ''} 
                                  onChange={(e) => {
                                    updatePlayer(p.id, { face_url: e.target.value });
                                    setIsDirty({ ...isDirty, players: true });
                                  }}
                                  placeholder="Ex: pic_plr_face.jpg" 
                                  className="block w-full bg-transparent text-xs text-neutral-400 outline-none border-b border-neutral-800 focus:border-gold/30 pb-1 transition-all font-mono" 
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row gap-8">
                            <div className="space-y-2 w-full md:w-28 shrink-0 flex flex-col items-center md:items-start">
                              <label className="text-[10px] uppercase text-gold/40 font-bold block tracking-widest">Corpo Inteiro</label>
                              <div className="w-full md:w-28 aspect-[2/3] bg-neutral-900 border border-neutral-800 rounded-sm relative group/body overflow-hidden shadow-lg">
                                {p.body_url ? (
                                  <img 
                                    src={`${getStorageUrl(p.body_url)}?t=${playersTimestamp}`} 
                                    key={`${p.body_url}-${playersTimestamp}`} 
                                    className="w-full h-full object-cover" 
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center opacity-20"><UserCheck size={32}/></div>
                                )}
                                <label className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center opacity-0 group-hover/body:opacity-100 cursor-pointer transition-opacity p-2 text-center">
                                  <input type="file" className="hidden" accept="image/*" onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setPlayerUploadError(null);
                                    if (file.size > 5 * 1024 * 1024) {
                                      setPlayerUploadError({
                                        playerId: p.id,
                                        type: 'body',
                                        message: 'O arquivo é muito grande. O limite máximo permitido é de 5MB.'
                                      });
                                      return;
                                    }
                                    try {
                                      const path = await handlePlayerFileUpload(file, p, 'body');
                                      updatePlayer(p.id, { body_url: path });
                                      setPlayersTimestamp(Date.now());
                                      setIsDirty(prev => ({ ...prev, players: true }));
                                    } catch (err: any) {
                                      console.error('Erro no upload do corpo:', err);
                                      const rawErrorMsg = err?.message || err?.error_description || JSON.stringify(err);
                                      setPlayerUploadError({
                                        playerId: p.id,
                                        type: 'body',
                                        message: `Erro ao enviar foto do Corpo. Detalhes técnicos: ${rawErrorMsg}`
                                      });
                                    }
                                  }}/>
                                  <Upload size={20} className="text-gold mb-1" />
                                  <span className="text-[10px] text-white font-bold uppercase tracking-tight leading-none">Upload Corpo</span>
                                  <span className="text-[8px] text-gold/60 mt-0.5 font-bold">Portrait 2:3</span>
                                </label>
                              </div>
                              <input 
                                value={p.body_url || ''} 
                                onChange={(e) => {
                                  updatePlayer(p.id, { body_url: e.target.value });
                                  setIsDirty({ ...isDirty, players: true });
                                }}
                                placeholder="Ex: pic_plr_body.jpg" 
                                className="w-full md:w-28 bg-neutral-900/50 border border-neutral-700/50 focus:border-gold outline-none px-2 py-1 text-neutral-300 text-[10px] rounded font-mono mt-1"
                              />
                              <p className="text-[9px] text-neutral-400 mt-2 text-center md:text-left font-sans leading-tight">
                                Rec: 400x600px (2:3)<br />Máx: 5MB
                              </p>
                              {playerUploadError?.playerId === p.id && playerUploadError.type === 'body' && (
                                <div className="text-[9px] text-red-500 font-bold bg-red-950/20 border border-red-900/50 p-2 rounded mt-1.5 max-w-[130px] overflow-auto font-mono leading-tight">
                                  {playerUploadError.message}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 flex flex-col gap-4 w-full">
                              <div className="w-full">
                                <label className="text-[10px] uppercase text-neutral-600 font-bold block mb-1 tracking-widest">Raça</label>
                                <input 
                                  value={p.race || ''} 
                                  onChange={(e) => {
                                    updatePlayer(p.id, { race: e.target.value });
                                    setIsDirty({ ...isDirty, players: true });
                                  }}
                                  placeholder="Ex: Humano..." 
                                  className="w-full bg-neutral-800/30 border-b border-neutral-700/50 focus:border-gold outline-none px-2 py-1 text-neutral-200 text-sm"
                                />
                              </div>
                              <div className="w-full">
                                <label className="text-[10px] uppercase text-neutral-600 font-bold block mb-1 tracking-widest">Classe</label>
                                <input 
                                  value={p.class || ''} 
                                  onChange={(e) => {
                                    updatePlayer(p.id, { class: e.target.value });
                                    setIsDirty({ ...isDirty, players: true });
                                  }}
                                  placeholder="Ex: Guerreiro..." 
                                  className="w-full bg-neutral-800/30 border-b border-neutral-700/50 focus:border-gold outline-none px-2 py-1 text-neutral-200 text-sm"
                                />
                              </div>
                              <div className="w-full">
                                <label className="text-[10px] uppercase text-neutral-600 font-bold block mb-1 tracking-widest">{systemLabel}</label>
                                <input 
                                  value={p.level_points || ''} 
                                  onChange={(e) => {
                                    updatePlayer(p.id, { level_points: e.target.value });
                                    setIsDirty({ ...isDirty, players: true });
                                  }}
                                  placeholder={systemLabel === 'Pontos' ? '150' : '5'} 
                                  className="w-full bg-neutral-800/30 border-b border-neutral-700/50 focus:border-gold outline-none px-2 py-1 text-neutral-200 text-sm"
                                />
                              </div>
                              <div className="mt-2">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-gold cursor-pointer hover:text-yellow-400">
                                  <input 
                                    type="checkbox" 
                                    checked={p.is_active} 
                                    onChange={(e) => {
                                      updatePlayer(p.id, { is_active: e.target.checked });
                                      setIsDirty({ ...isDirty, players: true });
                                    }}
                                    className="accent-gold w-4 h-4" 
                                  /> PERSONAGEM ATIVO
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] uppercase text-neutral-600 font-bold block mb-1 tracking-widest">Descrição</label>
                            <textarea 
                              value={p.description || ''} 
                              onChange={(e) => {
                                updatePlayer(p.id, { description: e.target.value });
                                setIsDirty({ ...isDirty, players: true });
                              }}
                              placeholder="Breve história..." 
                              className="w-full bg-black/30 text-sm text-neutral-400 outline-none border border-neutral-800 p-4 rounded focus:border-gold/20 resize-none font-serif leading-relaxed" 
                              rows={3} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'aventura' && (
              <div className="space-y-8 pb-20">
                <div className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md p-6 border-b border-gold/10 flex justify-between items-center shadow-xl">
                  <div>
                    <h2 className="text-xl font-cinzel text-gold uppercase tracking-tighter">Metadados da Crônica</h2>
                    <p className="text-sm text-neutral-500 italic">Configurações globais e link de acesso</p>
                  </div>
                  <button 
                    onClick={saveAventura} 
                    disabled={saving || !isDirty.aventura}
                    className="bg-gold text-ink px-6 py-2 rounded-sm flex items-center gap-2 font-bold hover:bg-yellow-500 transition-all shadow-lg disabled:opacity-30"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18}/>}
                    {saving ? 'Salvando...' : 'Salvar Aventura'}
                  </button>
                </div>

                <div className="p-10 flex flex-col items-center">
                  <div className="max-w-2xl w-full bg-ink p-10 border border-gold/10 rounded-sm space-y-10 shadow-2xl">
                    <div>
                      <h3 className="font-cinzel text-gold text-xl mb-6 flex items-center gap-3">
                        <MessageSquare size={20} /> Identidade da Campanha
                      </h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest text-gold/60 font-bold">Título Principal</label>
                          <input 
                            value={chronicle.title} 
                            onChange={(e) => {
                              setChronicle({...chronicle, title: e.target.value});
                              setIsDirty({ ...isDirty, aventura: true });
                            }}
                            className="w-full bg-neutral-800/50 border border-neutral-700 p-4 rounded-sm outline-none focus:ring-1 focus:ring-gold text-lg font-cinzel text-gold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest text-gold/60 font-bold">Mestre da Mesa</label>
                          <input 
                            value={chronicle.master_name}
                            onChange={(e) => {
                              setChronicle({...chronicle, master_name: e.target.value});
                              setIsDirty({ ...isDirty, aventura: true });
                            }}
                            className="w-full bg-neutral-800/50 border border-neutral-700 p-4 rounded-sm outline-none focus:ring-1 focus:ring-gold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest text-gold/60 font-bold">Sistema de RPG</label>
                          <select 
                            value={chronicle.system_id || ''}
                            onChange={(e) => {
                              setChronicle({...chronicle, system_id: e.target.value});
                              setIsDirty({ ...isDirty, aventura: true });
                            }}
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
                              onChange={(e) => {
                                setChronicle({...chronicle, slug: e.target.value});
                                setIsDirty({ ...isDirty, aventura: true });
                              }}
                              className="flex-1 bg-transparent outline-none text-gold font-bold"
                            />
                            <button 
                              onClick={() => navigate(`/adventure/${chronicle.slug}`)}
                              className="p-2 hover:bg-gold/10 rounded-full transition-colors text-gold"
                            >
                              <ImageIcon size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals e Prompt IA */}
      <AnimatePresence>
        {editingSession && (
          <SessionModal 
            key="session-modal"
            session={editingSession} 
            onSave={async (updated) => {
              if (!(await checkSession())) return;
              setSaving(true);
              const { error } = await supabase.from('sessions').update({
                title: updated.title,
                date_str: updated.date_str,
                session_date: updated.session_date
              }).eq('id', updated.id);
              
              if (!error) {
                setSessions(sessions.map(s => s.id === updated.id ? { ...updated, chapters: s.chapters } : s));
                setEditingSession(null);
              }
              setSaving(false);
            }} 
            onClose={() => setEditingSession(null)} 
          />
        )}
        {editingChapter && (
           <ChapterModal 
             key="chapter-modal"
             chapter={editingChapter.chapter}
             chronicleId={id || ''}
             onSave={async (updated) => {
               if (!(await checkSession())) return;
               setSaving(true);
               
               const session = sessions.find((s: Session) => s.id === editingChapter.sessionId);
               if (session && session.chapters) {
                 const otherChapters = session.chapters
                   .filter((c: Chapter) => c.id !== updated.id)
                   .sort((a: Chapter, b: Chapter) => a.order_index - b.order_index);
                 
                 const targetIndex = Math.max(0, Math.min(updated.order_index - 1, otherChapters.length));
                 otherChapters.splice(targetIndex, 0, updated);
                 
                 const finalChapters = otherChapters.map((c: Chapter, i: number) => ({
                   ...c,
                   order_index: i + 1
                 }));
                 
                 const { error } = await supabase.from('chapters').upsert(
                   finalChapters.map((ch: Chapter) => ({
                     id: ch.id,
                     session_id: ch.session_id,
                     title: ch.title,
                     content: ch.content,
                     image_url: ch.image_url,
                     order_index: ch.order_index
                   }))
                 );
                 
                 if (!error) {
                   setSessions(sessions.map((s: Session) => s.id === editingChapter.sessionId ? { ...s, chapters: finalChapters } : s));
                   setEditingChapter(null);
                   showToast('Capítulo salvo e ordenado!');
                 } else {
                   handleAuthOrTechnicalError(error, 'Falha ao salvar capítulo');
                 }
               }
               setSaving(false);
             }}
             onClose={() => setEditingChapter(null)}
             onGeneratePrompt={handleGeneratePrompt}
             onUploadImage={async (file, cap) => await handleChapterFileUpload(file, cap, editingChapter.sessionId)}
           />
        )}
        {showPromptModal && (
          <div key="prompt-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPromptModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-ink border border-gold/30 p-8 rounded shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-cinzel text-gold text-lg flex items-center gap-2">
                  <Wand2 size={20} /> Prompt IA Mágico
                </h3>
                <button onClick={() => setShowPromptModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {isGeneratingPrompt ? (
                <div className="flex flex-col items-center py-12 gap-4">
                  <Loader2 className="animate-spin text-gold" size={48} />
                  <p className="text-gold/60 font-cinzel animate-pulse">{promptStatusText}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {errorAI && (
                    <div className="bg-red-900/20 border border-red-900/50 p-4 rounded text-red-200 text-xs flex items-start gap-3">
                      <XCircle className="shrink-0 mt-0.5" size={16} />
                      <p>{errorAI}</p>
                    </div>
                  )}

                  {generatedPrompt && (
                    <div className="bg-black/40 border border-gold/10 p-6 rounded text-parchment italic font-serif leading-relaxed text-lg min-h-[150px] relative group">
                      {generatedPrompt}
                      <button 
                        onClick={copyToClipboard}
                        className="absolute bottom-4 right-4 bg-gold/10 hover:bg-gold text-gold hover:text-ink p-2 rounded transition-all"
                      >
                        {copySuccess ? <Check size={20} /> : <Copy size={20} />}
                      </button>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <button 
                      onClick={() => setShowPromptModal(false)}
                      className="bg-gold text-ink px-8 py-2 font-bold hover:bg-yellow-500 transition-colors rounded-sm"
                    >
                      CONCLUÍDO
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notificação Medieval Premium */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[120] flex items-center gap-3 px-5 py-4 rounded shadow-2xl border ${
              toast.type === 'error'
                ? 'bg-red-950/95 text-red-200 border-red-800'
                : 'bg-neutral-900/95 text-gold border-gold/30'
            }`}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {toast.type === 'error' ? (
              <XCircle className="text-red-500 shrink-0" size={20} />
            ) : (
              <CheckCircle2 className="text-gold shrink-0" size={20} />
            )}
            <span className="font-cinzel text-xs tracking-wider font-semibold">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-neutral-500 hover:text-white transition-colors ml-2"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
