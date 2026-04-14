import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Plus, X, Trash2, Edit2, CheckCircle2, Loader2, ArrowLeft, Search, Scroll } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Subscriber {
  id: string;
  email: string;
  subscribe_all: boolean;
  created_at: string;
  subscriptions?: string[]; // Array of chronicle IDs
}

interface ChronicleSimple {
  id: string;
  title: string;
}

export default function NewsletterManager() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [chronicles, setChronicles] = useState<ChronicleSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [subscribeAllInput, setSubscribeAllInput] = useState(false);
  const [selectedChronicles, setSelectedChronicles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscribers();
  }, []);

  async function fetchSubscribers() {
    setLoading(true);
    
    // Fetch all chronicles for the labels and selection
    const { data: chrData } = await supabase.from('chronicles').select('id, title');
    if (chrData) setChronicles(chrData);

    // Fetch subscribers
    const { data: subData } = await supabase
      .from('newsletter_subscribers')
      .select('*, newsletter_chronicle_subscriptions(chronicle_id)')
      .order('created_at', { ascending: false });

    if (subData) {
      setSubscribers(subData.map((s: any) => ({
        ...s,
        subscriptions: s.newsletter_chronicle_subscriptions?.map((link: any) => link.chronicle_id) || []
      })));
    }
    setLoading(false);
  }

  const handleOpenModal = (sub: Subscriber | null = null) => {
    if (sub) {
      setEditingSubscriber(sub);
      setEmailInput(sub.email);
      setSubscribeAllInput(sub.subscribe_all);
      setSelectedChronicles(sub.subscriptions || []);
    } else {
      setEditingSubscriber(null);
      setEmailInput('');
      setSubscribeAllInput(false);
      setSelectedChronicles([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      email: emailInput,
      subscribe_all: subscribeAllInput,
    };

    let subId = editingSubscriber?.id;

    if (editingSubscriber) {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update(payload)
        .eq('id', editingSubscriber.id);
    } else {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .insert([payload])
        .select()
        .single();
      
      if (data) subId = data.id;
    }

    if (subId) {
      // Manage specific subscriptions
      // 1. Clear existing links
      await supabase.from('newsletter_chronicle_subscriptions').delete().eq('subscriber_id', subId);
      
      // 2. Add new links if not subscribe_all
      if (!subscribeAllInput && selectedChronicles.length > 0) {
        const links = selectedChronicles.map(chrId => ({
          subscriber_id: subId,
          chronicle_id: chrId
        }));
        await supabase.from('newsletter_chronicle_subscriptions').insert(links);
      }
      
      await fetchSubscribers();
      setIsModalOpen(false);
    }
    
    setSaving(false);
  };

  const handleToggleChronicle = (id: string) => {
    setSelectedChronicles(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este inscrito?')) return;

    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (!error) {
      setSubscribers(subscribers.filter(s => s.id !== id));
    }
  };

  const filteredSubscribers = subscribers.filter(s => 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <header className="bg-ink border-b border-gold/20 p-6 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="text-gold/60 hover:text-gold p-2 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-4">
            <Mail className="w-8 h-8 text-gold" />
            <h1 className="text-2xl font-cinzel tracking-widest uppercase">Gerenciar Newsletter</h1>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-gold text-ink font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-yellow-500 transition-all shadow-lg hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Novo Inscrito
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        {/* Search Bar */}
        <div className="mb-8 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
          <input 
            type="text"
            placeholder="Buscar e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-ink border border-neutral-800 rounded-lg py-3 pl-12 pr-4 text-parchment outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
           <div className="bg-ink p-6 rounded-lg border border-gold/10">
              <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Total de Inscritos</p>
              <p className="text-3xl font-cinzel text-gold">{subscribers.length}</p>
           </div>
        </div>

        {/* Table */}
        <div className="bg-ink border border-gold/10 rounded-lg overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gold/10 bg-gold/5">
                <th className="p-4 text-xs uppercase tracking-wider text-gold font-bold">E-mail</th>
                <th className="p-4 text-xs uppercase tracking-wider text-gold font-bold text-center">Inscrição Total</th>
                <th className="p-4 text-xs uppercase tracking-wider text-gold font-bold text-center">Cadastrado em</th>
                <th className="p-4 text-xs uppercase tracking-wider text-gold font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscribers.map((sub) => (
                <tr key={sub.id} className="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors group">
                  <td className="p-4 font-serif text-parchment/90">{sub.email}</td>
                  <td className="p-4 text-center">
                    {sub.subscribe_all ? (
                      <span className="flex items-center justify-center gap-1 text-green-500 text-[10px] uppercase font-bold">
                        <CheckCircle2 size={14} /> Todas
                      </span>
                    ) : (
                      <div className="flex flex-wrap justify-center gap-1">
                        {sub.subscriptions && sub.subscriptions.length > 0 ? (
                          sub.subscriptions.map(chrId => {
                            const chr = chronicles.find(c => c.id === chrId);
                            return chr ? (
                              <span key={chrId} className="bg-gold/10 text-gold text-[9px] px-2 py-0.5 rounded border border-gold/20 whitespace-nowrap">
                                {chr.title}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className="text-neutral-600 text-[10px] uppercase font-bold">—</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center text-neutral-500 text-xs">
                    {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(sub)}
                        className="p-2 text-neutral-400 hover:text-gold transition-colors hover:bg-gold/10 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(sub.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSubscribers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-neutral-500 italic">
                    Nenhum inscrito encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Add/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <div className="relative w-full max-w-md bg-ink border border-gold/30 rounded-lg p-8 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-cinzel text-gold mb-6 uppercase tracking-widest">
                {editingSubscriber ? 'Editar Inscrito' : 'Novo Inscrito'}
              </h2>

              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase text-neutral-600 font-bold block mb-2 tracking-widest">E-mail</label>
                  <input 
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="heroi@tomo.com.br"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded py-3 px-4 text-parchment focus:border-gold outline-none transition-colors font-serif"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSubscribeAllInput(!subscribeAllInput)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${subscribeAllInput ? 'bg-gold' : 'bg-neutral-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${subscribeAllInput ? 'left-5' : 'left-1'}`} />
                  </button>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-neutral-300">Inscrever em tudo</span>
                    <p className="text-[10px] text-neutral-500 italic">Recebe avisos de todas as crônicas do Tomo.</p>
                  </div>
                </div>

                {!subscribeAllInput && (
                  <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg">
                    <label className="text-[10px] uppercase text-neutral-600 font-bold block mb-3 tracking-widest">Aventuras Específicas</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {chronicles.map(chr => (
                        <label key={chr.id} className="flex items-center gap-3 cursor-pointer group">
                          <button
                            type="button"
                            onClick={() => handleToggleChronicle(chr.id)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedChronicles.includes(chr.id) ? 'bg-gold border-gold' : 'border-neutral-700 bg-ink group-hover:border-gold/50'}`}
                          >
                            {selectedChronicles.includes(chr.id) && <CheckCircle2 size={12} className="text-ink" />}
                          </button>
                          <span className="text-xs text-parchment/70 group-hover:text-parchment transition-colors font-serif">{chr.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 rounded font-cinzel font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-gold text-ink font-bold rounded hover:bg-yellow-500 font-cinzel text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
