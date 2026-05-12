import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Star, Flame, Crown } from 'lucide-react';
import api from '../api/axios';

const DEPARTMENTS = ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'EEE', 'OTHER'];

const BADGE_META = {
  early_bird:       { icon: '🐦', label: 'Early Bird'       },
  top_contributor:  { icon: '✍️', label: 'Top Contributor'  },
  event_master:     { icon: '🎉', label: 'Event Master'      },
  comment_king:     { icon: '💬', label: 'Comment King'      },
  streak_hero:      { icon: '🔥', label: 'Streak Hero'       },
  streak_legend:    { icon: '⚡', label: 'Streak Legend'     },
  social_butterfly: { icon: '🦋', label: 'Social Butterfly' },
  popular:          { icon: '❤️', label: 'Popular'           },
};

const LEVEL_COLOR = {
  Beginner:      'text-slate-400',
  'Active Member': 'text-green-400',
  'Pro Member':    'text-blue-400',
  'Elite Member':  'text-purple-400',
  Legend:          'text-amber-400',
};

const RankIcon = ({ rank }) => {
  if (rank === 1) return <Crown size={18} className="text-amber-400" />;
  if (rank === 2) return <Medal size={16} className="text-slate-300" />;
  if (rank === 3) return <Medal size={16} className="text-amber-600" />;
  return <span className="w-5 text-center text-xs font-bold text-slate-500">#{rank}</span>;
};

const Leaderboard = () => {
  const [tab, setTab] = useState('global');
  const [dept, setDept] = useState('CSE');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, dept]);

  const load = async () => {
    setLoading(true);
    try {
      let url = '/gamification/leaderboard?type=global';
      if (tab === 'department') url = `/gamification/leaderboard?type=department&id=${dept}`;
      const { data } = await api.get(url);
      setEntries(data.leaderboard);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
          <Trophy size={20} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-sm text-slate-400">Top members by engagement points</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1">
          {['global', 'department'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                tab === t ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'department' && (
          <select
            value={dept}
            onChange={e => setDept(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
          >
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-amber-400" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No data yet</div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {entries.map((e, i) => (
              <div
                key={e.user?._id || i}
                className={`flex items-center gap-2 px-3 py-3 transition hover:bg-slate-700/30 sm:gap-4 sm:px-5 sm:py-4 ${
                  i === 0 ? 'bg-amber-500/5' : ''
                }`}
              >
                {/* Rank */}
                <div className="flex w-8 shrink-0 items-center justify-center">
                  <RankIcon rank={e.rank} />
                </div>

                {/* Avatar */}
                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 font-bold text-indigo-400 overflow-hidden sm:flex">
                  {e.user?.avatar
                    ? <img src={e.user.avatar} alt={e.user.name} className="h-full w-full object-cover" />
                    : e.user?.name?.charAt(0).toUpperCase()
                  }
                </div>

                {/* Name + level + badges */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/users/${e.user?._id}`}
                      className="truncate text-sm font-semibold text-white hover:text-amber-400 transition"
                    >
                      {e.user?.name}
                    </Link>
                    <span className={`text-xs font-medium ${LEVEL_COLOR[e.level] || 'text-slate-400'}`}>
                      {e.level}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    <span>{e.user?.department}</span>
                    {e.streak > 0 && (
                      <span className="flex items-center gap-0.5 text-orange-400">
                        <Flame size={11} /> {e.streak}d
                      </span>
                    )}
                    <span className="flex gap-0.5">
                      {(e.badges || []).slice(0, 3).map(b => (
                        <span key={b} title={BADGE_META[b]?.label}>{BADGE_META[b]?.icon}</span>
                      ))}
                    </span>
                  </div>
                </div>

                {/* Points */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 font-bold text-amber-400">
                    <Star size={14} />
                    {e.points.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
