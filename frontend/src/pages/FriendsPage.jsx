import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, UserX, MessageSquare, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const FriendsPage = () => {
  const [friends, setFriends]     = useState([]);
  const [requests, setRequests]   = useState([]);
  const [convs, setConvs]         = useState([]);
  const [tab, setTab]             = useState('friends');
  const [acting, setActing]       = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [fRes, rRes, cRes] = await Promise.all([
      api.get('/friends'),
      api.get('/friends/requests'),
      api.get('/dm'),
    ]);
    setFriends(fRes.data.friends);
    setRequests(rRes.data.requests);
    setConvs(cRes.data.conversations);
  };

  const act = async (action, userId) => {
    setActing(userId);
    try {
      if (action === 'accept') await api.post(`/friends/accept/${userId}`);
      if (action === 'reject') await api.post(`/friends/reject/${userId}`);
      if (action === 'remove') await api.delete(`/friends/${userId}`);
      toast.success(action === 'accept' ? 'Friend added!' : action === 'reject' ? 'Request rejected' : 'Friend removed');
      await load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(null); }
  };

  const unread = (userId) => convs.find(c => c.other?._id === userId)?.unread || 0;

  const tabs = [
    { key: 'friends',  label: `Friends (${friends.length})` },
    { key: 'requests', label: `Requests (${requests.length})` },
    { key: 'messages', label: 'Messages' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-extrabold text-white">Friends & Messages</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${tab === t.key ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Friends */}
      {tab === 'friends' && (
        <div className="space-y-2">
          {friends.length === 0 && (
            <div className="card p-10 text-center text-slate-500">
              No friends yet. Visit a user's profile to add them.
            </div>
          )}
          {friends.map(f => (
            <div key={f._id} className="card flex items-center gap-3 p-4">
              <Link to={`/users/${f._id}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-lg font-bold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition">
                {f.name?.charAt(0).toUpperCase()}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/users/${f._id}`} className="text-sm font-semibold text-white hover:text-amber-400 transition">{f.name}</Link>
                <p className="text-xs text-slate-500">{f.department}</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/dm/${f._id}`}
                  className="relative flex items-center gap-1.5 rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-400 transition hover:bg-indigo-500/30">
                  <MessageSquare size={13} /> Chat
                  {unread(f._id) > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                      {unread(f._id)}
                    </span>
                  )}
                </Link>
                <button onClick={() => act('remove', f._id)} disabled={acting === f._id}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-red-500/50 hover:text-red-400">
                  <UserX size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friend Requests */}
      {tab === 'requests' && (
        <div className="space-y-2">
          {requests.length === 0 && (
            <div className="card p-10 text-center text-slate-500">No pending friend requests.</div>
          )}
          {requests.map(r => (
            <div key={r._id} className="card flex items-center gap-3 p-4">
              <Link to={`/users/${r.from._id}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-lg font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition">
                {r.from.name?.charAt(0).toUpperCase()}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/users/${r.from._id}`} className="text-sm font-semibold text-white hover:text-amber-400 transition">{r.from.name}</Link>
                <p className="text-xs text-slate-500">{r.from.department}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => act('accept', r.from._id)} disabled={acting === r.from._id}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/30">
                  <UserCheck size={13} /> Accept
                </button>
                <button onClick={() => act('reject', r.from._id)} disabled={acting === r.from._id}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:text-red-400">
                  <UserX size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages (DM list) */}
      {tab === 'messages' && (
        <div className="space-y-2">
          {convs.length === 0 && (
            <div className="card p-10 text-center text-slate-500">No conversations yet. Add friends to start chatting.</div>
          )}
          {convs.map(c => (
            <Link key={c._id} to={`/dm/${c.other?._id}`}
              className="card flex items-center gap-3 p-4 transition hover:border-indigo-500/50">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-lg font-bold text-indigo-400 border border-indigo-500/30">
                {c.other?.name?.charAt(0).toUpperCase()}
                {c.unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{c.unread}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{c.other?.name}</p>
                <p className="truncate text-xs text-slate-500">{c.lastMessage?.content || 'No messages yet'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
