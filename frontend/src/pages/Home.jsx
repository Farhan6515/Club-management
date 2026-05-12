import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Bell, UserCheck, UserX, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ActivityCard from '../components/ActivityCard';
import ClubCard from '../components/ClubCard';

const NotificationsPanel = () => {
  const [requests, setRequests] = useState([]);
  const [unreadDMs, setUnreadDMs] = useState([]);
  const [acting, setActing] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [rRes, dRes] = await Promise.all([
        api.get('/friends/requests'),
        api.get('/dm'),
      ]);
      setRequests(rRes.data.requests);
      setUnreadDMs(dRes.data.conversations.filter(c => c.unread > 0));
    } catch {}
  };

  const act = async (action, userId) => {
    setActing(userId);
    try {
      if (action === 'accept') await api.post(`/friends/accept/${userId}`);
      if (action === 'reject') await api.post(`/friends/reject/${userId}`);
      toast.success(action === 'accept' ? 'Friend added!' : 'Rejected');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setActing(null); }
  };

  const total = requests.length + unreadDMs.length;
  if (total === 0) return null;

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Bell size={16} className="text-amber-400" />
        <h2 className="text-base font-bold text-white">Notifications</h2>
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{total}</span>
      </div>

      <div className="space-y-2">
        {requests.map(r => (
          <div key={r._id} className="flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 p-2.5">
            <Link to={`/users/${r.from._id}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400 hover:bg-amber-500/30 transition">
              {r.from.name?.charAt(0).toUpperCase()}
            </Link>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-white">{r.from.name}</p>
              <p className="text-[11px] text-slate-500">sent a friend request</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => act('accept', r.from._id)} disabled={acting === r.from._id}
                className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/30 transition">
                <UserCheck size={11} /> Accept
              </button>
              <button onClick={() => act('reject', r.from._id)} disabled={acting === r.from._id}
                className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-500 hover:text-red-400 transition">
                <UserX size={11} />
              </button>
            </div>
          </div>
        ))}

        {unreadDMs.map(c => (
          <Link key={c._id} to={`/dm/${c.other?._id}`}
            className="flex items-center gap-2 rounded-lg bg-indigo-500/5 border border-indigo-500/20 p-2.5 transition hover:bg-indigo-500/10">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
              {c.other?.name?.charAt(0).toUpperCase()}
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">{c.unread}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-white">{c.other?.name}</p>
              <p className="truncate text-[11px] text-slate-500">{c.lastMessage?.content || 'New message'}</p>
            </div>
            <MessageSquare size={13} className="shrink-0 text-indigo-400" />
          </Link>
        ))}
      </div>
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feedRes, recRes] = await Promise.all([
          api.get('/activities/feed'),
          api.get('/clubs/recommended'),
        ]);
        setFeed(feedRes.data.activities);
        setRecommended(recRes.data.clubs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleActivityDelete = (id) => {
    setFeed((prev) => prev.filter((a) => a._id !== id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-2xl border border-slate-700 bg-gradient-to-br from-indigo-600/30 via-slate-800 to-purple-700/30 p-6 shadow-lg sm:p-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Hello, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-2 text-slate-400">
          Here's what's happening in your clubs today
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Activity Feed</h2>
            <Link to="/clubs" className="text-sm font-medium text-amber-400 hover:text-amber-300">
              Browse all clubs
            </Link>
          </div>

          {feed.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-700">
                <Sparkles size={24} className="text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Your feed is empty</h3>
              <p className="mt-1 text-sm text-slate-400">
                Join clubs to see their latest activities here
              </p>
              <Link to="/clubs" className="btn-primary mt-4 inline-flex">
                Discover clubs <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {feed.map((activity) => (
                <ActivityCard
                  key={activity._id}
                  activity={activity}
                  onDelete={handleActivityDelete}
                  showClubName
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <NotificationsPanel />
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              <h2 className="text-base font-bold text-white">Recommended for you</h2>
            </div>

            {recommended.length === 0 ? (
              <p className="text-sm text-slate-400">
                No recommendations yet. Update your interests to discover clubs.
              </p>
            ) : (
              <div className="space-y-3">
                {recommended.slice(0, 4).map((club) => (
                  <Link
                    key={club._id}
                    to={`/clubs/${club._id}`}
                    className="block rounded-lg border border-slate-700 p-3 transition hover:border-indigo-500/50 hover:bg-slate-700"
                  >
                    <p className="font-semibold text-white">{club.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{club.description}</p>
                    <div className="mt-2 flex gap-1.5">
                      <span className="badge bg-slate-700 text-slate-300">{club.department}</span>
                      <span className="badge bg-indigo-500/20 text-indigo-400">{club.category}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/clubs"
            className="card flex items-center justify-between p-5 transition hover:bg-slate-700"
          >
            <div>
              <p className="font-semibold text-white">Explore all clubs</p>
              <p className="text-sm text-slate-400">Search by name, category, or department</p>
            </div>
            <ArrowRight size={20} className="text-slate-500" />
          </Link>
        </aside>
      </div>

      {recommended.length > 0 && (
        <section className="lg:hidden">
          <h2 className="mb-4 text-xl font-bold text-white">More clubs you might like</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {recommended.slice(4).map((club) => (
              <ClubCard key={club._id} club={club} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
