import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Settings, Trash2, BarChart2, Star, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'EEE', 'OTHER'];
const CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Literary',
  'Social',
  'Academic',
  'Other',
];

const LEVEL_COLOR = {
  Beginner:        'text-slate-400',
  'Active Member': 'text-green-400',
  'Pro Member':    'text-blue-400',
  'Elite Member':  'text-purple-400',
  Legend:          'text-amber-400',
};

const AnalyticsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/gamification/admin/analytics')
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-indigo-400" />
    </div>
  );
  if (!data) return <div className="card p-10 text-center text-slate-500">Could not load analytics</div>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Users',      value: data.stats.totalUsers,      icon: <Users size={18} className="text-indigo-400" /> },
          { label: 'Total Clubs',      value: data.stats.totalClubs,      icon: <Trophy size={18} className="text-amber-400" /> },
          { label: 'Total Activities', value: data.stats.totalActivities, icon: <BarChart2 size={18} className="text-emerald-400" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700">{icon}</div>
            <div>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top users */}
      <div className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
          <Star size={15} className="text-amber-400" /> Top Users by Points
        </h3>
        <div className="space-y-2">
          {data.topUsers.map((u, i) => (
            <div key={u.user?._id || i} className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
              <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-500">#{i + 1}</span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-400 overflow-hidden">
                {u.user?.avatar
                  ? <img src={u.user.avatar} alt={u.user.name} className="h-full w-full object-cover" />
                  : u.user?.name?.charAt(0).toUpperCase()
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{u.user?.name}</p>
                <p className={`text-xs ${LEVEL_COLOR[u.level] || 'text-slate-400'}`}>{u.level}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-amber-400">{u.points.toLocaleString()}</p>
                <p className="text-xs text-slate-500">{u.badges} badges</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top clubs by activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-white">Most Active Clubs</h3>
          <div className="space-y-2">
            {data.topClubs.map((c, i) => (
              <div key={c._id || i} className="flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
                <span className="text-sm font-medium text-white truncate">{c.name}</span>
                <span className="shrink-0 text-sm font-bold text-indigo-400">{c.count} posts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-white">Engagement by Department</h3>
          <div className="space-y-2">
            {data.deptEngagement.map((d, i) => (
              <div key={d._id || i} className="flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
                <span className="text-sm font-medium text-white">{d._id || 'Unknown'}</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{d.totalPoints.toLocaleString()} pts</p>
                  <p className="text-xs text-slate-500">{d.count} users</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { user } = useAuth();
  const [adminTab, setAdminTab] = useState('clubs');
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    department: user?.department || 'CSE',
    category: 'Technical',
    tags: '',
  });

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/clubs/admin/my-clubs');
      setClubs(data.clubs);
    } catch {
      toast.error('Failed to load admin clubs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        department: form.department,
        category: form.category,
        tags: form.tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      };
      await api.post('/clubs', payload);
      toast.success('Club created!');
      setForm({
        name: '',
        description: '',
        department: user?.department || 'CSE',
        category: 'Technical',
        tags: '',
      });
      setShowForm(false);
      loadClubs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create club');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/clubs/${id}`);
      toast.success('Club deleted');
      loadClubs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="mt-1 text-slate-400">Manage your clubs and view analytics</p>
        </div>
        <div className="flex items-center gap-3">
          {adminTab === 'clubs' && (
            user?.departmentId ? (
              <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                <Plus size={16} /> {showForm ? 'Cancel' : 'New Club'}
              </button>
            ) : (
              <Link to="/profile" className="btn-secondary">Add Department ID first</Link>
            )
          )}
        </div>
      </header>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1 w-fit">
        {[
          { key: 'clubs',     label: 'My Clubs',  icon: <Settings size={14} /> },
          { key: 'analytics', label: 'Analytics', icon: <BarChart2 size={14} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setAdminTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${adminTab === t.key ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {adminTab === 'analytics' && <AnalyticsTab />}

      {adminTab === 'clubs' && <>


      {!user?.departmentId && (
        <div className="card border-2 border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <h3 className="font-semibold text-white">Department ID required</h3>
          <p className="mt-1 text-sm text-slate-400">
            You need a valid Department ID to create or manage clubs.{' '}
            <Link to="/profile" className="font-semibold text-amber-400 hover:text-amber-300">Add yours on the profile page.</Link>
          </p>
        </div>
      )}

      {/* Create form */}
      {showForm && user?.departmentId && (
        <form onSubmit={handleCreate} className="card space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Create new club</h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field" placeholder="e.g. Photography Society" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
            <textarea required rows={3} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field resize-none" placeholder="What's this club about?" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input-field">
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Tags</label>
            <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="input-field" placeholder="photography, art, creative (comma separated)" />
          </div>

          <button type="submit" disabled={creating} className="btn-primary w-full sm:w-auto">
            {creating ? 'Creating…' : 'Create Club'}
          </button>
        </form>
      )}

      {/* Clubs list */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-white">Clubs you administer</h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />
          </div>
        ) : clubs.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">You haven't created any clubs yet</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {clubs.map((club) => (
              <div key={club._id} className="card p-5">
                <h3 className="font-bold text-white">{club.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{club.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="badge bg-slate-700 text-slate-300">{club.department}</span>
                  <span className="badge bg-indigo-500/20 text-indigo-400">{club.category}</span>
                  <span className="badge bg-emerald-500/20 text-emerald-400">
                    <Users size={10} className="mr-1" />{club.members?.length || 0}
                  </span>
                </div>
                <div className="mt-4 flex gap-2 border-t border-slate-700 pt-4">
                  <Link to={`/admin/clubs/${club._id}`} className="btn-secondary flex-1 text-center">
                    <Settings size={14} /> Manage
                  </Link>
                  <button onClick={() => handleDelete(club._id, club.name)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-slate-500 hover:border-red-500/50 hover:text-red-400 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>}
    </div>
  );
};

export default AdminPanel;
