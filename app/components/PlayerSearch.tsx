'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';

export interface PlayerSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  team: string | null;
  avatar_url: string | null;
  username: string | null;
}

interface PlayerSearchProps {
  placeholder?: string;
  profilePath?: (playerId: string) => string;
  className?: string;
}

export default function PlayerSearch({
  placeholder = 'Search players by name or team...',
  profilePath = (id) => `/profile/${id}`,
  className = '',
}: PlayerSearchProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      const term = searchTerm.trim();

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, team, avatar_url, username')
          .eq('role', 'player')
          .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,team.ilike.%${term}%,username.ilike.%${term}%`)
          .order('first_name')
          .limit(8);

        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error('Player search failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleSelect = (player: PlayerSearchResult) => {
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
    router.push(profilePath(player.id));
  };

  const showDropdown = isOpen && searchTerm.trim().length >= 2;

  return (
    <div className={`relative w-full max-w-xl mx-auto ${className}`} data-testid="player-search">
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder={placeholder}
        data-testid="player-search-input"
        className="w-full bg-[#111] border-2 border-[#28D160]/40 rounded-full py-4 pl-12 pr-4 text-white font-black italic text-xs uppercase tracking-widest placeholder:text-gray-500 focus:outline-none focus:border-[#28D160] focus:shadow-[0_0_20px_rgba(40,209,96,0.25)] transition-colors"
      />

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-2 bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
          data-testid="player-search-results"
        >
          {loading ? (
            <div className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
              No players found
            </div>
          ) : (
            results.map((player) => (
              <button
                key={player.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(player)}
                data-testid={`player-search-result-${player.id}`}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-white/5 shrink-0">
                  {player.avatar_url ? (
                    <img src={player.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <User size={16} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-black italic uppercase text-sm text-white truncate">
                    {player.first_name} {player.last_name}
                  </div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
                    {player.team || 'No team'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}