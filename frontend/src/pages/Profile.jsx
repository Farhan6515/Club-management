import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit2, Save, X, Mail, Building, Shield,
  UserCheck, UserX, MessageSquare, UserPlus, Camera,
  MapPin, Hash, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../utils/mediaUrl';
import ClubCard from '../components/ClubCard';

const DEPARTMENTS = ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'EEE', 'OTHER'];

/* ── Avatar + Cover upload helpers ─────────────────────────────────────────── */
const AvatarRing = ({ user, onUpload, uploading }) => {
  const ref = useRef(null);
  return (
    <div className="relative">
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onUpload} />
      <button
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="group relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 sm:h-28 sm:w-28"
        title="Change photo"
      >
        {user?.avatar ? (
          <img src={getAvatarUrl(user.avatar)} alt={user.name} className="h-full w-full rounded-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
          {uploading
            ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : <Camera size={20} className="text-white" />
          }
        </div>
      </button>
    </div>
  );
};

/* ── Profile Tab ────────────────────────────────────────────────────────────── */
const ProfileTab = ({ user, updateUser, clubs }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deptIdInput, setDeptIdInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    department: user?.department || 'CSE',
    bio: user?.bio || '',
    interests: (user?.interests || []).join(', '),
  });

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await api.post('/users/avatar', fd, { headers: { 'Content-Type': undefined } });
      updateUser(data.user);
      toast.success('Photo updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploadingPhoto(false); e.target.value = ''; }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', {
        name: form.name,
        department: form.department,
        bio: form.bio,
        interests: form.interests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean),
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
    <div className="space-y-6">
      {/* Profile hero card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 sm:h-40" />

        {/* Avatar + actions row */}
        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="-mt-12 sm:-mt-14">
              <AvatarRing user={user} onUpload={handlePhotoChange} uploading={uploadingPhoto} />
            </div>
            <div className="flex gap-2 pb-1">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="btn-secondary">
                  <Edit2 size={15} /> Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={() => { setEditing(false); setForm({ name: user.name, department: user.department, bio: user.bio || '', interests: (user.interests || []).join(', ') }); }} className="btn-secondary !px-3">
                    <X size={15} />
                  </button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary">
                    <Save size={15} /> {saving ? 'Saving…' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name + meta */}
          <div className="mt-3">
            {editing ? (
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input-field mb-2 text-xl font-bold"
              />
            ) : (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{user?.name}</h1>
            )}

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Mail size={13} /> {user?.email}</span>
              <span className="flex items-center gap-1"><Building size={13} /> {user?.department}</span>
              {user?.role === 'admin' && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                  <Shield size={11} /> Dept Admin
                </span>
              )}
            </div>

            {/* Bio */}
            <div className="mt-4">
              {editing ? (
                <textarea
                  rows={3}
                  placeholder="Write a short bio…"
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  className="input-field resize-none"
                />
              ) : (
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  {user?.bio || <span className="italic text-gray-400 dark:text-slate-500">No bio yet</span>}
                </p>
              )}
            </div>

            {/* Interests */}
            <div className="mt-4">
              {editing ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    <Hash size={11} className="mr-1 inline" /> Interests (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="coding, music, debate…"
                    value={form.interests}
                    onChange={e => setForm(f => ({ ...f, interests: e.target.value }))}
                    className="input-field"
                  />
                </div>
              ) : user?.interests?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {user.interests.map(i => (
                    <span key={i} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                      #{i}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Department selector when editing */}
            {editing && (
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="input-field"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Clubs Joined', value: clubs.length },
          { label: 'Department', value: user?.department },
          { label: 'Role', value: user?.role === 'admin' ? 'Dept Admin' : 'Member' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Clubs + Admin upgrade row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Joined clubs */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            My Clubs ({clubs.length})
          </h2>
          {clubs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400 dark:border-slate-700 dark:text-slate-500">
              No clubs yet.{' '}
              <Link to="/clubs" className="font-semibold text-indigo-500 hover:underline">Discover clubs</Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {clubs.map(c => <ClubCard key={c._id} club={c} />)}
            </div>
          )}
        </div>

        {/* Dept admin upgrade */}
        {user?.role !== 'admin' && (
          <aside>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
                  <Shield size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Become Dept Admin</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Enter your Department Admin ID to unlock club creation.</p>
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      placeholder="e.g. CSE-2024-ADMIN"
                      value={deptIdInput}
                      onChange={e => setDeptIdInput(e.target.value)}
                      className="input-field"
                    />
                    <button
                      onClick={handleVerifyDeptId}
                      disabled={verifying || !deptIdInput}
                      className="btn-primary w-full"
                    >
                      {verifying ? 'Verifying…' : <><Check size={14} /> Verify</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

/* ── Friends Tab ────────────────────────────────────────────────────────────── */
const FriendsTab = () => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [convs, setConvs] = useState([]);
  const [acting, setActing] = useState(null);
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
    { key: 'requests', label: `Requests${requests.length ? ` · ${requests.length}` : ''}` },
    { key: 'messages', label: 'Messages' },
  ];

  const Avatar = ({ person, color = 'indigo' }) => (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-${color}-100 text-lg font-bold text-${color}-600 dark:bg-${color}-500/20 dark:text-${color}-400 overflow-hidden border border-${color}-200 dark:border-${color}-500/30`}>
      {person?.avatar
        ? <img src={getAvatarUrl(person.avatar)} alt={person.name} className="h-full w-full object-cover" />
        : person?.name?.charAt(0).toUpperCase()
      }
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Inner tab bar */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
        {innerTabs.map(t => (
          <button key={t.key} onClick={() => setInnerTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-4 sm:text-sm ${
              innerTab === t.key
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
                : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Friends */}
      {innerTab === 'friends' && (
        <div className="space-y-2">
          {friends.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400 dark:border-slate-700 dark:text-slate-500">
              No friends yet. Visit a member's profile to add them.
            </div>
          )}
          {friends.map(f => (
            <div key={f._id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <Link to={`/users/${f._id}`}><Avatar person={f} /></Link>
              <div className="flex-1 min-w-0">
                <Link to={`/users/${f._id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-amber-400 transition">{f.name}</Link>
                <p className="text-xs text-gray-500 dark:text-slate-500">{f.department}</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/dm/${f._id}`}
                  className="relative flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition dark:bg-indigo-500/20 dark:text-indigo-400 dark:hover:bg-indigo-500/30">
                  <MessageSquare size={13} /> <span className="hidden sm:inline">Chat</span>
                  {unread(f._id) > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{unread(f._id)}</span>
                  )}
                </Link>
                <button onClick={() => act('remove', f._id)} disabled={acting === f._id}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-400 hover:border-red-200 hover:text-red-500 transition dark:border-slate-700 dark:text-slate-500 dark:hover:text-red-400">
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
            <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400 dark:border-slate-700 dark:text-slate-500">
              No pending friend requests.
            </div>
          )}
          {requests.map(r => (
            <div key={r._id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <Link to={`/users/${r.from._id}`}><Avatar person={r.from} color="amber" /></Link>
              <div className="flex-1 min-w-0">
                <Link to={`/users/${r.from._id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-amber-400 transition">{r.from.name}</Link>
                <p className="text-xs text-gray-500 dark:text-slate-500">{r.from.department}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => act('accept', r.from._id)} disabled={acting === r.from._id}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30">
                  <UserCheck size={13} /> <span className="hidden sm:inline">Accept</span>
                </button>
                <button onClick={() => act('reject', r.from._id)} disabled={acting === r.from._id}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-400 hover:border-red-200 hover:text-red-500 transition dark:border-slate-700 dark:text-slate-500 dark:hover:text-red-400">
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
            <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400 dark:border-slate-700 dark:text-slate-500">
              No conversations yet.
            </div>
          )}
          {convs.map(c => (
            <Link key={c._id} to={`/dm/${c.other?._id}`}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500/50">
              <div className="relative">
                <Avatar person={c.other} />
                {c.unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{c.unread}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.other?.name}</p>
                <p className="truncate text-xs text-gray-400 dark:text-slate-500">{c.lastMessage?.content || 'No messages yet'}</p>
              </div>
              <MessageSquare size={15} className="shrink-0 text-indigo-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Page ───────────────────────────────────────────────────────────────────── */
const Profile = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    api.get('/users/my-clubs').then(({ data }) => setClubs(data.clubs)).catch(() => {});
  }, []);

  const tabs = [
    { key: 'profile', label: 'Profile',       icon: null },
    { key: 'friends', label: 'Friends & DMs', icon: <UserPlus size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">My Profile</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">Manage your account and connections</p>
        </div>
        <div className="flex w-full gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-slate-700 dark:bg-slate-800/50 sm:w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-5 sm:text-sm ${
                tab === t.key
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white'
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'profile' && <ProfileTab user={user} updateUser={updateUser} clubs={clubs} />}
      {tab === 'friends' && <FriendsTab />}
    </div>
  );
};

export default Profile;
