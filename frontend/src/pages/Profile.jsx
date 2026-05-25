import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit, Save, X, Mail, Building, Shield,
  UserCheck, UserX, MessageSquare, Users, UserPlus, Camera,
  Star, Trophy, Flame, Zap, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ClubCard from '../components/ClubCard';
import { getAvatarUrl } from '../utils/mediaUrl';

const DEPARTMENTS = ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'EEE', 'OTHER'];

/* ── Profile tab ─────────────────────────────────────────────────────────── */
const ProfileTab = ({ user, updateUser, clubs }) => {
  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({
    name:       user?.name || '',
    department: user?.department || 'CSE',
    bio:        user?.bio || '',
    interests:  (user?.interests || []).join(', '),
  });
  const [deptIdInput, setDeptIdInput]   = useState('');
  const [verifying, setVerifying]       = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user);
      toast.success('Photo updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', {
        name:       form.name,
        department: form.department,
        bio:        form.bio,
        interests:  form.interests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean),
      });
      updateUser(data.user);
      toast.success('Profile updated');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handleVerifyDeptId = async () => {
    if (!deptIdInput) return;
    setVerifying(true);
    try {
      const { data } = await api.post('/auth/verify-dept', { departmentId: deptIdInput });
      updateUser(data.user);
      toast.success('Admin access granted!');
      setDeptIdInput('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid Department ID');
    } finally { setVerifying(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Profile card */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              {/* Clickable avatar */}
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16"
                title="Change photo"
              >
                {user?.avatar ? (
                  <img src={getAvatarUrl(user.avatar)} alt={user.name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white sm:text-2xl">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
                  {uploadingPhoto
                    ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <Camera size={14} className="text-white sm:hidden" />
                  }
                  <Camera size={18} className="hidden text-white sm:block" />
                </div>
              </button>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-white sm:text-xl">{user?.name}</h2>
                <p className="flex items-center gap-1 text-xs text-slate-400 sm:text-sm">
                  <Mail size={12} className="shrink-0" /> <span className="truncate">{user?.email}</span>
                </p>
                {user?.role === 'admin' && (
                  <span className="badge mt-1 bg-amber-500/20 text-amber-400">
                    <Shield size={10} className="mr-1" /> Admin
                  </span>
                )}
              </div>
            </div>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-secondary shrink-0 !px-2.5 !py-1.5 sm:!px-3 sm:!py-2">
                <Edit size={14} /> <span className="hidden sm:inline">Edit</span>
              </button>
            ) : (
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => { setEditing(false); setForm({ name: user.name, department: user.department, bio: user.bio || '', interests: (user.interests || []).join(', ') }); }} className="btn-secondary !px-2 !py-1.5">
                  <X size={14} />
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary !px-2.5 !py-1.5 text-xs sm:text-sm">
                  <Save size={14} /> <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span><span className="sm:hidden">{saving ? '…' : 'Save'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {[
              { label: 'Full name', key: 'name', type: 'text' },
              { label: 'Bio', key: 'bio', type: 'textarea' },
              { label: 'Interests', key: 'interests', type: 'text', placeholder: 'coding, music, debate (comma separated)' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
                {editing ? (
                  type === 'textarea' ? (
                    <textarea rows={3} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="input-field resize-none" placeholder={placeholder} />
                  ) : (
                    <input type="text" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="input-field" placeholder={placeholder} />
                  )
                ) : key === 'interests' ? (
                  <div className="flex flex-wrap gap-1.5">
                    {user?.interests?.length ? user.interests.map(i => (
                      <span key={i} className="badge bg-indigo-500/20 text-indigo-400">{i}</span>
                    )) : <span className="italic text-slate-500">No interests added</span>}
                  </div>
                ) : (
                  <p className="text-slate-300">{user?.[key] || <span className="italic text-slate-500">Not set</span>}</p>
                )}
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                <Building size={14} className="mr-1 inline" /> Department
              </label>
              {editing ? (
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input-field">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <p className="text-slate-300">{user?.department}</p>
              )}
            </div>
          </div>
        </div>

        {user?.role !== 'admin' && (
          <div className="card border-2 border-dashed border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 shrink-0 text-amber-400" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-white">Become a Department Admin</h3>
                <p className="mt-1 text-sm text-slate-400">Enter your Department Admin ID to unlock club creation.</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input type="text" placeholder="e.g. CSE-2024-ADMIN" value={deptIdInput}
                    onChange={e => setDeptIdInput(e.target.value)} className="input-field flex-1" />
                  <button onClick={handleVerifyDeptId} disabled={verifying || !deptIdInput} className="btn-primary w-full sm:w-auto">
                    {verifying ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Joined clubs sidebar */}
      <aside>
        <div className="card p-5">
          <h2 className="mb-4 text-base font-bold text-white">My Clubs ({clubs.length})</h2>
          {clubs.length === 0 ? (
            <p className="text-sm text-slate-500">
              No clubs yet.{' '}
              <Link to="/clubs" className="font-semibold text-amber-400 hover:text-amber-300">Discover clubs</Link>
            </p>
          ) : (
            <div className="space-y-3">{clubs.map(c => <ClubCard key={c._id} club={c} />)}</div>
          )}
        </div>
      </aside>
    </div>
  );
};

/* ── Friends tab ─────────────────────────────────────────────────────────── */
const FriendsTab = () => {
  const [friends, setFriends]   = useState([]);
  const [requests, setRequests] = useState([]);
  const [convs, setConvs]       = useState([]);
  const [acting, setActing]     = useState(null);
  const [innerTab, setInnerTab] = useState('friends');

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
      toast.success(action === 'accept' ? 'Friend added!' : action === 'reject' ? 'Rejected' : 'Removed');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(null); }
  };

  const unread = (uid) => convs.find(c => c.other?._id === uid)?.unread || 0;

  const innerTabs = [
    { key: 'friends',  label: `Friends (${friends.length})` },
    { key: 'requests', label: `Requests${requests.length ? ` (${requests.length})` : ''}` },
    { key: 'messages', label: 'Messages' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1">
        {innerTabs.map(t => (
          <button key={t.key} onClick={() => setInnerTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-4 sm:text-sm ${innerTab === t.key ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Friends */}
      {innerTab === 'friends' && (
        <div className="space-y-2">
          {friends.length === 0 && (
            <div className="card p-10 text-center text-slate-500">No friends yet. Visit a member's profile to add them.</div>
          )}
          {friends.map(f => (
            <div key={f._id} className="card flex items-center gap-3 p-4">
              <Link to={`/users/${f._id}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-lg font-bold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition overflow-hidden">
                {f.avatar ? <img src={getAvatarUrl(f.avatar)} alt={f.name} className="h-full w-full object-cover" /> : f.name?.charAt(0).toUpperCase()}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/users/${f._id}`} className="text-sm font-semibold text-white hover:text-amber-400 transition">{f.name}</Link>
                <p className="text-xs text-slate-500">{f.department}</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/dm/${f._id}`}
                  className="relative flex items-center gap-1.5 rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/30 transition">
                  <MessageSquare size={13} /> <span className="hidden sm:inline">Chat</span>
                  {unread(f._id) > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{unread(f._id)}</span>
                  )}
                </Link>
                <button onClick={() => act('remove', f._id)} disabled={acting === f._id}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-500 hover:text-red-400 transition">
                  <UserX size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requests */}
      {innerTab === 'requests' && (
        <div className="space-y-2">
          {requests.length === 0 && (
            <div className="card p-10 text-center text-slate-500">No pending friend requests.</div>
          )}
          {requests.map(r => (
            <div key={r._id} className="card flex items-center gap-3 p-4">
              <Link to={`/users/${r.from._id}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-lg font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition overflow-hidden">
                {r.from.avatar ? <img src={getAvatarUrl(r.from.avatar)} alt={r.from.name} className="h-full w-full object-cover" /> : r.from.name?.charAt(0).toUpperCase()}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/users/${r.from._id}`} className="text-sm font-semibold text-white hover:text-amber-400 transition">{r.from.name}</Link>
                <p className="text-xs text-slate-500">{r.from.department}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => act('accept', r.from._id)} disabled={acting === r.from._id}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition">
                  <UserCheck size={13} /> <span className="hidden sm:inline">Accept</span>
                </button>
                <button onClick={() => act('reject', r.from._id)} disabled={acting === r.from._id}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-500 hover:text-red-400 transition">
                  <UserX size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      {innerTab === 'messages' && (
        <div className="space-y-2">
          {convs.length === 0 && (
            <div className="card p-10 text-center text-slate-500">No conversations yet.</div>
          )}
          {convs.map(c => (
            <Link key={c._id} to={`/dm/${c.other?._id}`}
              className="card flex items-center gap-3 p-4 transition hover:border-indigo-500/50">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-lg font-bold text-indigo-400 border border-indigo-500/30 overflow-hidden">
                {c.other?.avatar ? <img src={getAvatarUrl(c.other.avatar)} alt={c.other.name} className="h-full w-full object-cover" /> : c.other?.name?.charAt(0).toUpperCase()}
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

/* ── Gamification tab ────────────────────────────────────────────────────── */
const BADGE_META = {
  early_bird:       { icon: '🐦', label: 'Early Bird',       desc: 'Among first 10 members of a club' },
  top_contributor:  { icon: '✍️', label: 'Top Contributor',  desc: 'Posted 10+ activities'            },
  event_master:     { icon: '🎉', label: 'Event Master',      desc: 'Created 5+ events'               },
  comment_king:     { icon: '💬', label: 'Comment King',      desc: 'Posted 50+ comments'             },
  streak_hero:      { icon: '🔥', label: 'Streak Hero',       desc: '7-day login streak'              },
  streak_legend:    { icon: '⚡', label: 'Streak Legend',     desc: '30-day login streak'             },
  social_butterfly: { icon: '🦋', label: 'Social Butterfly', desc: 'Joined 5+ clubs'                 },
  popular:          { icon: '❤️', label: 'Popular',           desc: 'Received 50+ likes'              },
};

const LEVEL_COLOR = {
  Beginner:        { text: 'text-slate-400',  bar: 'bg-slate-400'  },
  'Active Member': { text: 'text-green-400',  bar: 'bg-green-400'  },
  'Pro Member':    { text: 'text-blue-400',   bar: 'bg-blue-400'   },
  'Elite Member':  { text: 'text-purple-400', bar: 'bg-purple-400' },
  Legend:          { text: 'text-amber-400',  bar: 'bg-amber-400'  },
};

const GamificationTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/gamification/my-stats')
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-amber-400" />
    </div>
  );

  if (!data) return <div className="card p-10 text-center text-slate-500">Could not load stats</div>;

  const { stats, level } = data;
  const levelMeta = LEVEL_COLOR[level?.current?.name] || LEVEL_COLOR.Beginner;
  const allBadgeKeys = Object.keys(BADGE_META);

  return (
    <div className="space-y-6">
      {/* Points & Level */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { icon: <Star size={18} className="text-amber-400" />, value: stats.points.toLocaleString(), label: 'Total Points', bg: 'bg-amber-500/10' },
          { icon: <Flame size={18} className="text-orange-400" />, value: `${stats.streak}d`, label: 'Current Streak', bg: 'bg-orange-500/10' },
          { icon: <Zap size={18} className="text-purple-400" />, value: stats.longestStreak + 'd', label: 'Best Streak', bg: 'bg-purple-500/10' },
          { icon: <Trophy size={18} className="text-indigo-400" />, value: stats.badges.length, label: 'Badges Earned', bg: 'bg-indigo-500/10' },
        ].map(({ icon, value, label, bg }) => (
          <div key={label} className={`card p-3 flex items-center gap-3 sm:p-4 sm:gap-4 ${bg}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800">{icon}</div>
            <div>
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Level progress */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Current Level</p>
            <p className={`text-xl font-bold ${levelMeta.text}`}>{level.current.name}</p>
          </div>
          {level.next && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Next: <span className="font-semibold text-white">{level.next.name}</span></p>
              <p className="text-xs text-slate-500">{level.next.min - stats.points} pts away</p>
            </div>
          )}
        </div>
        <div className="h-3 w-full rounded-full bg-slate-700">
          <div
            className={`h-3 rounded-full transition-all ${levelMeta.bar}`}
            style={{ width: `${level.progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-right text-xs text-slate-500">{level.progress}%</p>
      </div>

      {/* Stats breakdown */}
      <div className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
          <TrendingUp size={15} className="text-indigo-400" /> Activity Stats
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'Posts Created',   value: stats.stats.postsCreated   },
            { label: 'Events Created',  value: stats.stats.eventsCreated  },
            { label: 'Comments Posted', value: stats.stats.commentsPosted },
            { label: 'Likes Received',  value: stats.stats.likesReceived  },
            { label: 'Clubs Joined',    value: stats.stats.clubsJoined    },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="card p-5">
        <h3 className="mb-4 text-sm font-bold text-white">Badges</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {allBadgeKeys.map(key => {
            const earned = stats.badges.includes(key);
            const meta = BADGE_META[key];
            return (
              <div
                key={key}
                title={meta.desc}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                  earned
                    ? 'border-indigo-500/50 bg-indigo-500/10'
                    : 'border-slate-700 bg-slate-800/30 opacity-40 grayscale'
                }`}
              >
                <span className="text-2xl">{meta.icon}</span>
                <span className="text-xs font-semibold text-white leading-tight">{meta.label}</span>
                {earned && <span className="text-[10px] text-emerald-400">Earned</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ── Page ────────────────────────────────────────────────────────────────── */
const Profile = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab]   = useState('profile');
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    api.get('/users/my-clubs').then(({ data }) => setClubs(data.clubs)).catch(() => {});
  }, []);

  const pageTabs = [
    { key: 'profile', label: 'Profile',   mLabel: 'Profile',   icon: null                  },
    { key: 'stats',   label: 'Stats',     mLabel: 'Stats',     icon: <Star size={14} />    },
    { key: 'friends', label: 'Friends & DMs', mLabel: 'Friends', icon: <UserPlus size={14} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">My Profile</h1>
        <div className="flex w-full gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1 sm:w-fit">
          {pageTabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition sm:flex-none sm:gap-2 sm:px-4 sm:text-sm ${tab === t.key ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
              {t.icon}<span className="sm:hidden">{t.mLabel}</span><span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'profile' && <ProfileTab user={user} updateUser={updateUser} clubs={clubs} />}
      {tab === 'stats'   && <GamificationTab />}
      {tab === 'friends' && <FriendsTab />}
    </div>
  );
};

export default Profile;
