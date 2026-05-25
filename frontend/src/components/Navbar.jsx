import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Search, User, LogOut, Shield, Users,
  Bell, UserCheck, UserX, MessageSquare, Newspaper, Sun, Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getAvatarUrl } from '../utils/mediaUrl';

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const NotificationDropdown = ({ onClose }) => {
  const [requests, setRequests] = useState([]);
  const [unreadDMs, setUnreadDMs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [acting, setActing] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    load();
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const load = async () => {
    try {
      const [rRes, dRes, aRes] = await Promise.all([
        api.get('/friends/requests'),
        api.get('/dm'),
        api.get('/activities/feed'),
      ]);
      setRequests(rRes.data.requests);
      setUnreadDMs(dRes.data.conversations.filter(c => c.unread > 0));
      setPosts((aRes.data.activities || []).slice(0, 5));
    } catch {}
  };

  const act = async (action, userId) => {
    setActing(userId);
    try {
      if (action === 'accept') await api.post(`/friends/accept/${userId}`);
      if (action === 'reject') await api.post(`/friends/reject/${userId}`);
      toast.success(action === 'accept' ? 'Friend added!' : 'Rejected');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(null); }
  };

  const hasAny = requests.length > 0 || unreadDMs.length > 0 || posts.length > 0;

  return (
    <div ref={ref}
      className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-50 overflow-hidden">
      <div className="border-b border-slate-700 px-4 py-3">
        <span className="font-bold text-white">Notifications</span>
      </div>

      <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-800">
        {!hasAny && (
          <p className="py-10 text-center text-sm text-slate-500">You're all caught up!</p>
        )}

        {/* Friend Requests */}
        {requests.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Friend Requests
            </p>
            {requests.map(r => (
              <div key={r._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition">
                <Link to={`/users/${r.from._id}`} onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-400 overflow-hidden">
                  {r.from.avatar ? <img src={getAvatarUrl(r.from.avatar)} alt={r.from.name} className="h-full w-full object-cover" /> : r.from.name?.charAt(0).toUpperCase()}
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{r.from.name}</p>
                  <p className="text-xs text-slate-500">sent you a friend request</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => act('accept', r.from._id)} disabled={acting === r.from._id}
                    className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition">
                    <UserCheck size={12} /> Accept
                  </button>
                  <button onClick={() => act('reject', r.from._id)} disabled={acting === r.from._id}
                    className="rounded-lg border border-slate-700 p-1 text-slate-500 hover:text-red-400 transition">
                    <UserX size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unread Messages */}
        {unreadDMs.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Unread Messages
            </p>
            {unreadDMs.map(c => (
              <Link key={c._id} to={`/dm/${c.other?._id}`} onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-400 overflow-hidden">
                  {c.other?.avatar ? <img src={getAvatarUrl(c.other.avatar)} alt={c.other.name} className="h-full w-full object-cover" /> : c.other?.name?.charAt(0).toUpperCase()}
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">{c.unread}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{c.other?.name}</p>
                  <p className="truncate text-xs text-slate-500">{c.lastMessage?.content || 'New message'}</p>
                </div>
                <MessageSquare size={14} className="shrink-0 text-indigo-400" />
              </Link>
            ))}
          </div>
        )}

        {/* Recent Club Posts */}
        {posts.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Recent Club Posts
            </p>
            {posts.map(a => (
              <Link key={a._id} to={`/clubs/${a.club?._id || a.club}`} onClick={onClose}
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-800 transition">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-indigo-400">
                  <Newspaper size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{a.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {a.club?.name || 'Club'} · {timeAgo(a.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const LEVEL_COLOR = {
  Beginner:        'text-slate-400',
  'Active Member': 'text-green-400',
  'Pro Member':    'text-blue-400',
  'Elite Member':  'text-purple-400',
  Legend:          'text-amber-400',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [levelName, setLevelName] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchCount();
    api.get('/gamification/my-stats')
      .then(({ data }) => setLevelName(data.level?.current?.name || ''))
      .catch(() => {});
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchCount = async () => {
    try {
      const [rRes, dRes] = await Promise.all([
        api.get('/friends/requests'),
        api.get('/dm'),
      ]);
      const unreadDMs = dRes.data.conversations.filter(c => c.unread > 0).length;
      setNotifCount(rRes.data.requests.length + unreadDMs);
    } catch {}
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm ${
      isActive
        ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-md shadow-sm dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow">
            <Users size={20} />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
            Club<span className="text-amber-400">Hub</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-evenly md:flex">
          <NavLink to="/home" className={navLinkClass}><Home size={16} /> Home</NavLink>
          <NavLink to="/clubs" className={navLinkClass}><Search size={16} /> Discover</NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navLinkClass}><Shield size={16} /> Admin</NavLink>
          )}
          <NavLink to="/profile" className={navLinkClass}><User size={16} /> Profile</NavLink>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {user?.department}
              {levelName && <span className={`ml-1.5 font-medium ${LEVEL_COLOR[levelName] || 'text-slate-400'}`}>· {levelName}</span>}
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 font-bold text-indigo-400 border border-indigo-500/30 overflow-hidden">
            {user?.avatar
              ? <img src={getAvatarUrl(user.avatar)} alt={user.name} className="h-full w-full object-cover" />
              : user?.name?.charAt(0).toUpperCase()
            }
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotif(v => !v)}
              className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition"
              title="Notifications"
            >
              <Bell size={18} />
              {notifCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
            {showNotif && <NotificationDropdown onClose={() => setShowNotif(false)} />}
          </div>

          <button onClick={handleLogout}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-red-500 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-red-400"
            title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="flex w-full items-center border-t border-gray-200 md:hidden dark:border-slate-700">
        {[
          { to: '/home',    icon: <Home size={20} />,   label: 'Home'    },
          { to: '/clubs',   icon: <Search size={20} />, label: 'Clubs'   },
          ...(user?.role === 'admin' ? [{ to: '/admin', icon: <Shield size={20} />, label: 'Admin' }] : []),
          { to: '/profile', icon: <User size={20} />,   label: 'Profile' },
        ].map(({ to, icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white'
              }`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

export default Navbar;
