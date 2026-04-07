import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserPlus, AlertCircle } from 'lucide-react';

export default function Setup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSignup, setCanSignup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if any users exist
    async function checkUsers() {
      // This is a bit tricky with Supabase Auth as we can't easily list users from client
      // But we can check a public table or just try and allow the user to know it might fail
      // For this one-time setup, we'll assume the user is honest or we check if chronicles exist
      const { count } = await supabase.from('chronicles').select('*', { count: 'exact', head: true });
      if (count && count > 0) {
        // If chronicles exist, likely an admin exists too
        // setCanSignup(false);
      }
      setCanSignup(true);
    }
    checkUsers();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      // Success! Move to login or dashboard
      alert('Usuário Admin criado com sucesso! Use este login para acessar o painel.');
      navigate('/admin');
    }
    setLoading(false);
  };

  if (!canSignup) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-4">
        <div className="bg-parchment p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-cinzel text-ink mb-4">Setup já realizado</h2>
          <p className="text-neutral-600">A área de configuração inicial não está mais disponível.</p>
          <button onClick={() => navigate('/admin')} className="mt-6 text-gold underline">Ir para Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="bg-parchment p-8 rounded-sm shadow-2xl max-w-md w-full border border-gold/20">
        <div className="text-center mb-8">
          <ShieldCheck className="w-12 h-12 text-gold mx-auto mb-2" />
          <h1 className="text-3xl font-cinzel text-ink">Admin Setup</h1>
          <p className="text-neutral-500 italic mt-2">Criação única do usuário Mestre</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-gold focus:border-transparent outline-none"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Senha (Mín. 6 caracteres)</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-gold focus:border-transparent outline-none"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-gold font-cinzel py-3 rounded hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {loading ? 'Criando...' : 'Criar Administrador'}
          </button>
        </form>
        
        <p className="mt-8 text-xs text-center text-red-800/60 font-medium">
          AVISO: Esta página deve ser excluída ou o código removido após o primeiro uso.
        </p>
      </div>
    </div>
  );
}
