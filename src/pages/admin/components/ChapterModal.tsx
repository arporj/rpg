import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Wand2, Upload, Image as ImageIcon } from 'lucide-react';
import { Chapter } from '../../../types';
import { getStorageUrl } from '../../../lib/supabase';

interface Props {
  chapter: Chapter;
  chronicleId: string;
  onSave: (chapter: Chapter) => void;
  onClose: () => void;
  onGeneratePrompt: (chapter: Chapter) => void;
  onUploadImage: (file: File, chapter: Chapter) => Promise<string>;
}

export function ChapterModal({ chapter: initialChapter, chronicleId, onSave, onClose, onGeneratePrompt, onUploadImage }: Props) {
  const [chapter, setChapter] = useState<Chapter>(initialChapter);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await onUploadImage(file, chapter);
      setChapter(prev => ({ ...prev, image_url: path }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

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
        className="relative w-full max-w-4xl bg-ink border border-gold/30 p-6 md:p-8 rounded shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
      >
        <div className="flex justify-between items-center mb-6 border-b border-gold/10 pb-4">
          <h3 className="font-cinzel text-gold text-xl uppercase tracking-widest">
            {initialChapter.title === 'Novo Capítulo' ? 'Criar Capítulo' : 'Editar Capítulo'}
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] text-gold/60 font-bold uppercase tracking-widest block mb-2">Título do Capítulo</label>
              <input 
                value={chapter.title}
                onChange={(e) => setChapter({ ...chapter, title: e.target.value })}
                placeholder="Nome do Capítulo"
                className="w-full bg-neutral-900/50 text-parchment font-cinzel text-xl border border-neutral-700 focus:border-gold outline-none p-4 rounded transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-gold/60 font-bold uppercase tracking-widest block">Ilustração do Capítulo</label>
              <div className="aspect-video w-full bg-neutral-900 rounded border border-neutral-700 flex items-center justify-center overflow-hidden relative group/img shadow-2xl">
                {uploading ? (
                  <span className="text-gold animate-pulse text-sm">Enviando imagem...</span>
                ) : chapter.image_url ? (
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
                
                {!uploading && (
                  <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    <Upload className="text-gold mb-2" size={32} />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Fazer Upload</span>
                    <p className="text-[10px] text-gold/60 mt-1">AR 16:9 (1920x1080px)</p>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] text-gold/60 font-bold uppercase tracking-widest block">Narrativa do Capítulo</label>
              <button 
                onClick={() => onGeneratePrompt(chapter)}
                title="Gerar Arte com IA"
                className="flex items-center gap-1 text-[9px] uppercase font-bold text-gold/80 hover:text-gold transition-colors bg-gold/10 hover:bg-gold/20 px-3 py-1.5 rounded border border-gold/30"
              >
                <Wand2 size={12} /> Gerar Arte (IA)
              </button>
            </div>
            <textarea 
              value={chapter.content}
              placeholder="Conte a história aqui..."
              onChange={(e) => setChapter({ ...chapter, content: e.target.value })}
              className="w-full h-full flex-1 bg-ink border border-neutral-700/50 p-6 rounded text-parchment/90 text-[15px] focus:border-gold outline-none leading-relaxed resize-none font-merriweather shadow-inner min-h-[300px]"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gold/10 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2 text-neutral-400 hover:text-white font-bold text-sm tracking-widest uppercase transition-colors">Cancelar</button>
          <button 
            onClick={() => onSave(chapter)}
            className="bg-gold text-ink px-8 py-2 font-bold hover:bg-yellow-500 transition-colors rounded-sm flex items-center gap-2"
          >
            <Save size={18} /> CONFIRMAR
          </button>
        </div>
      </motion.div>
    </div>
  );
}
