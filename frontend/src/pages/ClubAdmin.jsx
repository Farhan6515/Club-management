import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Send,
  UserMinus,
  Users,
  Edit3,
  Save,
  X,
  Award,
  ImagePlus,
  Camera,
} from 'lucide-react';

const POSITIONS = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Event Coordinator', 'Media Head', 'Technical Lead'];
import toast from 'react-hot-toast';
import api from '../api/axios';
import ActivityCard from '../components/ActivityCard';
import { showPointsToast } from '../utils/pointsToast';
import { getAvatarUrl } from '../utils/mediaUrl';

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

const ClubAdmin = () => {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingClub, setEditingClub] = useState(false);
  const [savingClub, setSavingClub] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Activity form
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [activityForm, setActivityForm] = useState({
    type: 'announcement',
    title: '',
    content: '',
    eventDate: '',
    eventLocation: '',
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef(null);

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
      setEditForm({
        name: clubRes.data.club.name,
        description: clubRes.data.club.description,
        department: clubRes.data.club.department,
        category: clubRes.data.club.category,
        tags: (clubRes.data.club.tags || []).join(', '),
      });
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClub = async () => {
    setSavingClub(true);
    try {
      const payload = {
        ...editForm,
        tags: editForm.tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      };
      const { data } = await api.put(`/clubs/${id}`, payload);
      setClub(data.club);
      toast.success('Club updated');
      setEditingClub(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSavingClub(false);
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('cover', file);
      const { data } = await api.post(`/clubs/${id}/cover`, formData, {
        headers: { 'Content-Type': undefined },
      });
      setClub(c => ({ ...c, coverImage: data.coverImage }));
      toast.success('Cover photo updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

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

  const handlePostActivity = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('type', activityForm.type);
      formData.append('title', activityForm.title);
      formData.append('content', activityForm.content);
      if (activityForm.type === 'event') {
        formData.append('eventDate', activityForm.eventDate);
        formData.append('eventLocation', activityForm.eventLocation);
      }
      mediaFiles.forEach(f => formData.append('media', f));

      const { data } = await api.post(`/activities/club/${id}`, formData, {
        headers: { 'Content-Type': undefined },
      });
      setActivities([data.activity, ...activities]);
      toast.success('Posted!');
      showPointsToast(data.pointsInfo);
      setActivityForm({ type: 'announcement', title: '', content: '', eventDate: '', eventLocation: '' });
      mediaPreviews.forEach(p => URL.revokeObjectURL(p.url));
      setMediaFiles([]);
      setMediaPreviews([]);
      setShowActivityForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    if (!confirm(`Remove ${userName} from the club?`)) return;
    try {
      await api.delete(`/clubs/${id}/members/${userId}`);
      toast.success('Member removed');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  const getPosition = (userId) =>
    club?.positions?.find(p => (p.user?._id || p.user) === userId)?.title || '';

  const handlePositionChange = async (userId, title) => {
    try {
      if (title) {
        const { data } = await api.put(`/clubs/${id}/positions/${userId}`, { title });
        setClub(c => ({ ...c, positions: data.positions }));
        toast.success('Position assigned');
      } else {
        const { data } = await api.delete(`/clubs/${id}/positions/${userId}`);
        setClub(c => ({ ...c, positions: data.positions }));
        toast.success('Position removed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
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
    return <div className="card p-10 text-center">Club not found</div>;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white transition"
      >
        <ArrowLeft size={16} /> Back to admin
      </Link>

      {/* Club details */}
      <div className="card overflow-hidden">
        {/* Cover photo */}
        <div className="relative h-36 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 sm:h-48">
          {club.coverImage && (
            <img src={club.coverImage} alt="cover" className="h-full w-full object-cover" />
          )}
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            {uploadingCover
              ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <Camera size={15} />
            }
            {uploadingCover ? 'Uploading…' : 'Change Cover'}
          </button>
        </div>

        <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {editingClub ? (
              <div className="space-y-3">
                <input type="text" value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-field text-lg font-bold" />
                <textarea rows={3} value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="input-field resize-none" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="input-field">
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="input-field">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <input type="text" placeholder="Tags (comma separated)" value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  className="input-field" />
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-white sm:text-2xl">{club.name}</h1>
                <p className="mt-2 text-slate-400">{club.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="badge bg-slate-700 text-slate-300">{club.department}</span>
                  <span className="badge bg-indigo-500/20 text-indigo-400">{club.category}</span>
                  <span className="badge bg-emerald-500/20 text-emerald-400">
                    <Users size={10} className="mr-1" />{club.members?.length || 0} members
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-shrink-0 gap-2">
            {editingClub ? (
              <>
                <button
                  onClick={() => setEditingClub(false)}
                  className="btn-secondary"
                >
                  <X size={14} />
                </button>
                <button
                  onClick={handleSaveClub}
                  disabled={savingClub}
                  className="btn-primary"
                >
                  <Save size={14} /> {savingClub ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingClub(true)}
                className="btn-secondary"
              >
                <Edit3 size={14} /> Edit Details
              </button>
            )}
          </div>
        </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activities */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Activity</h2>
            <button
              onClick={() => setShowActivityForm(!showActivityForm)}
              className="btn-primary"
            >
              <Plus size={16} /> {showActivityForm ? 'Cancel' : 'Post'}
            </button>
          </div>

          {/* Post form */}
          {showActivityForm && (
            <form
              onSubmit={handlePostActivity}
              className="card mb-4 space-y-3 p-5"
            >
              <div className="flex gap-2">
                {['announcement', 'event', 'post'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActivityForm({ ...activityForm, type: t })}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
                      activityForm.type === t
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <input
                type="text"
                required
                placeholder="Title"
                value={activityForm.title}
                onChange={(e) =>
                  setActivityForm({ ...activityForm, title: e.target.value })
                }
                className="input-field"
              />

              <textarea
                required
                rows={4}
                placeholder="What's the news?"
                value={activityForm.content}
                onChange={(e) =>
                  setActivityForm({ ...activityForm, content: e.target.value })
                }
                className="input-field resize-none"
              />

              {activityForm.type === 'event' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="datetime-local"
                    required
                    value={activityForm.eventDate}
                    onChange={(e) =>
                      setActivityForm({
                        ...activityForm,
                        eventDate: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={activityForm.eventLocation}
                    onChange={(e) =>
                      setActivityForm({
                        ...activityForm,
                        eventLocation: e.target.value,
                      })
                    }
                    className="input-field"
                  />
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
                  <Send size={14} /> {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          )}

          {activities.length === 0 ? (
            <div className="card p-10 text-center text-slate-500">No activities yet. Post the first one!</div>
          ) : (
            <div className="space-y-4">
              {activities.map((a) => (
                <ActivityCard
                  key={a._id}
                  activity={a}
                  onDelete={handleActivityDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Members management */}
        <aside>
          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
              <Users size={16} className="text-indigo-400" />
              Members ({club.members?.length || 0})
            </h2>
            <div className="space-y-3">
              {club.members?.map((m) => {
                const isClubAdmin = m._id === club.admin?._id;
                const currentPos = getPosition(m._id);
                return (
                  <div key={m._id} className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-400 overflow-hidden">
                          {m.avatar
                            ? <img src={getAvatarUrl(m.avatar)} alt={m.name} className="h-full w-full object-cover" />
                            : m.name?.charAt(0).toUpperCase()
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{m.name}</p>
                          <p className="truncate text-xs text-slate-500">{m.department}</p>
                        </div>
                      </div>
                      {!isClubAdmin && (
                        <button
                          onClick={() => handleRemoveMember(m._id, m.name)}
                          className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
                          title="Remove member"
                        >
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>

                    {/* Position row */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <Award size={13} className="shrink-0 text-amber-400" />
                      {isClubAdmin ? (
                        <span className="text-xs font-semibold text-amber-400">Club Admin</span>
                      ) : (
                        <select
                          value={currentPos}
                          onChange={e => handlePositionChange(m._id, e.target.value)}
                          className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="">No position</option>
                          {POSITIONS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ClubAdmin;
