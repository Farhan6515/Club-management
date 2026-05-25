import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  UserMinus,
  Settings,
  Tag,
  Calendar,
  MessageSquare,
  Newspaper,
  Plus,
  Send,
  X,
  ImagePlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ActivityCard from '../components/ActivityCard';
import ClubChat from '../components/ClubChat';
import { showPointsToast } from '../utils/pointsToast';
import { getAvatarUrl } from '../utils/mediaUrl';

const ClubDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab] = useState('activity');
  const [showPostForm, setShowPostForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postForm, setPostForm] = useState({ type: 'announcement', title: '', content: '', eventDate: '', eventLocation: '' });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [clubRes, actRes] = await Promise.all([
        api.get(`/clubs/${id}`),
        api.get(`/activities/club/${id}`),
      ]);
      setClub(clubRes.data.club);
      setActivities(actRes.data.activities);
    } catch (err) {
      toast.error('Failed to load club');
    } finally {
      setLoading(false);
    }
  };

  const isMember = club?.members?.some(m => m._id === user?._id || m === user?._id);
  const isAdmin  = club?.admin?._id === user?._id || club?.admin === user?._id;
  const myPosition = club?.positions?.find(p => (p.user?._id || p.user) === user?._id);
  const hasPosition = !!myPosition && !isAdmin;
  const canPost = isAdmin || hasPosition;

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + mediaFiles.length > 5) {
      toast.error('Max 5 files per post');
      return;
    }
    setMediaFiles(prev => [...prev, ...files]);
    const previews = files.map(f => ({ url: URL.createObjectURL(f), type: f.type.startsWith('video/') ? 'video' : 'image' }));
    setMediaPreviews(prev => [...prev, ...previews]);
  };

  const removeMedia = (i) => {
    URL.revokeObjectURL(mediaPreviews[i].url);
    setMediaFiles(prev => prev.filter((_, idx) => idx !== i));
    setMediaPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('type', postForm.type);
      formData.append('title', postForm.title);
      formData.append('content', postForm.content);
      if (postForm.type === 'event') {
        formData.append('eventDate', postForm.eventDate);
        formData.append('eventLocation', postForm.eventLocation);
      }
      mediaFiles.forEach(f => formData.append('media', f));

      const { data } = await api.post(`/activities/club/${id}`, formData, {
        headers: { 'Content-Type': undefined },
      });
      setActivities(prev => [data.activity, ...prev]);
      setPostForm({ type: 'announcement', title: '', content: '', eventDate: '', eventLocation: '' });
      mediaPreviews.forEach(p => URL.revokeObjectURL(p.url));
      setMediaFiles([]);
      setMediaPreviews([]);
      setShowPostForm(false);
      toast.success('Posted!');
      showPointsToast(data.pointsInfo);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally { setPosting(false); }
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.post(`/clubs/${id}/join`);
      toast.success('Joined!');
      showPointsToast({ ...data.pointsInfo, action: 'JOIN_CLUB' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this club?')) return;
    setActionLoading(true);
    try {
      await api.post(`/clubs/${id}/leave`);
      toast.success('Left club');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivityDelete = (activityId) => {
    setActivities((prev) => prev.filter((a) => a._id !== activityId));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-lg font-semibold">Club not found</h2>
        <Link to="/clubs" className="btn-primary mt-4">
          Browse clubs
        </Link>
      </div>
    );
  }

  /* ── Chat mode: full-height, no sidebar, no page scroll ── */
  if (tab === 'chat' && isMember) {
    return (
      <div className="-mx-4 -mt-6 -mb-6 flex flex-col sm:-mx-6 lg:-mx-8"
           style={{ height: 'calc(100vh - 3.75rem)' }}>
        {/* Compact top bar */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-700 bg-slate-900 px-4 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <MessageSquare size={16} />
          </div>
          <span className="flex-1 truncate text-sm font-bold text-white">{club.name}</span>
          <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-800 p-0.5">
            <button
              onClick={() => setTab('activity')}
              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              <Newspaper size={13} /> Activity
            </button>
            <button
              className="flex items-center gap-1.5 rounded bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-400"
            >
              <MessageSquare size={13} /> Chat
            </button>
          </div>
        </div>

        {/* Chat fills the rest */}
        <div className="min-h-0 flex-1 px-4 py-3 sm:px-6 lg:px-8">
          <ClubChat clubId={id} />
        </div>
      </div>
    );
  }

  /* ── Normal mode: club header + activity + sidebar ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card overflow-hidden">
        <div className="relative h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 sm:h-48">
          {club.coverImage && (
            <img src={club.coverImage} alt="cover" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="badge bg-indigo-500/20 text-indigo-400">
                  {club.category}
                </span>
                <span className="badge bg-slate-700 text-slate-300">
                  <Tag size={10} className="mr-1" />
                  {club.department}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {club.name}
              </h1>
              <p className="mt-2 text-slate-400">{club.description}</p>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Users size={14} />
                  <strong className="text-white">{club.members?.length || 0}</strong> members
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  Created{' '}
                  {new Date(club.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <span>Admin: <strong className="text-white">{club.admin?.name}</strong></span>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              {isAdmin ? (
                <Link to={`/admin/clubs/${club._id}`} className="btn-primary">
                  <Settings size={16} /> Manage
                </Link>
              ) : isMember ? (
                <button onClick={handleLeave} disabled={actionLoading} className="btn-secondary">
                  <UserMinus size={16} /> Leave
                </button>
              ) : (
                <button onClick={handleJoin} disabled={actionLoading} className="btn-primary">
                  <UserPlus size={16} /> Join
                </button>
              )}
            </div>
          </div>

          {club.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {club.tags.map((tag) => (
                <span key={tag} className="badge bg-slate-700 text-slate-400">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab switcher — members only */}
      {isMember && (
        <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1 w-fit">
          {[
            { key: 'activity', label: 'Activity', icon: <Newspaper size={15} /> },
            { key: 'chat',     label: 'Chat',     icon: <MessageSquare size={15} /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                tab === t.key ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activities */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Activity</h2>
              {hasPosition && (
                <p className="text-xs text-indigo-400 mt-0.5">{myPosition.title} · can post</p>
              )}
            </div>
            {canPost && !isAdmin && (
              <button onClick={() => setShowPostForm(v => !v)} className="btn-primary">
                {showPostForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Post</>}
              </button>
            )}
          </div>

          {/* Post form for positioned members */}
          {showPostForm && hasPosition && (
            <form onSubmit={handlePost} className="card mb-4 space-y-3 p-5">
              <div className="flex gap-2">
                {['announcement', 'event', 'post'].map(t => (
                  <button key={t} type="button"
                    onClick={() => setPostForm(f => ({ ...f, type: t }))}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${postForm.type === t ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <input type="text" required placeholder="Title" value={postForm.title}
                onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))} className="input-field" />
              <textarea required rows={3} placeholder="What's the update?" value={postForm.content}
                onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))} className="input-field resize-none" />
              {postForm.type === 'event' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input type="datetime-local" required value={postForm.eventDate}
                    onChange={e => setPostForm(f => ({ ...f, eventDate: e.target.value }))} className="input-field" />
                  <input type="text" placeholder="Location" value={postForm.eventLocation}
                    onChange={e => setPostForm(f => ({ ...f, eventLocation: e.target.value }))} className="input-field" />
                </div>
              )}
              {/* Media previews */}
              {mediaPreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {mediaPreviews.map((p, i) => (
                    <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-600">
                      {p.type === 'video'
                        ? <video src={p.url} className="h-full w-full object-cover" />
                        : <img src={p.url} className="h-full w-full object-cover" />
                      }
                      <button type="button" onClick={() => removeMedia(i)}
                        className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500 transition">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-600 transition">
                  <ImagePlus size={15} />
                  {mediaFiles.length > 0 ? `${mediaFiles.length} file${mediaFiles.length > 1 ? 's' : ''} selected` : 'Add Photos/Videos'}
                  <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaChange} />
                </label>
                <span className="text-xs text-slate-500">Max 5 files · 50 MB each</span>
                <button type="submit" disabled={posting} className="btn-primary ml-auto">
                  <Send size={14} /> {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </form>
          )}

          {activities.length === 0 ? (
            <div className="card p-10 text-center text-slate-500">No posts yet from this club</div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <ActivityCard key={activity._id} activity={activity} onDelete={handleActivityDelete} />
              ))}
            </div>
          )}
        </div>

        {/* Members sidebar */}
        <aside>
          <div className="card p-5">
            <h2 className="mb-4 text-base font-bold text-white">
              Members ({club.members?.length || 0})
            </h2>
            <div className="space-y-2">
              {club.members?.slice(0, 10).map((m) => {
                const pos = club.positions?.find(p => (p.user?._id || p.user) === m._id);
                return (
                  <div key={m._id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-700/50">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 font-semibold text-indigo-400 overflow-hidden">
                      {m.avatar
                        ? <img src={getAvatarUrl(m.avatar)} alt={m.name} className="h-full w-full object-cover" />
                        : m.name?.charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="min-w-0">
                      <Link to={`/users/${m._id}`} className="text-sm font-semibold text-white hover:text-amber-400 transition">
                        {m.name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {m._id === club.admin?._id && (
                          <span className="badge bg-amber-500/20 text-amber-400">Admin</span>
                        )}
                        {pos && (
                          <span className="badge bg-indigo-500/20 text-indigo-300">{pos.title}</span>
                        )}
                        {!pos && m._id !== club.admin?._id && (
                          <p className="text-xs text-slate-500">{m.department}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {club.members?.length > 10 && (
                <p className="pt-2 text-center text-xs text-slate-500">
                  + {club.members.length - 10} more members
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ClubDetails;
