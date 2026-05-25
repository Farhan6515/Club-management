import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Calendar, MapPin, Megaphone, FileText, Trash2, MessageCircle, Send } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { showPointsToast } from '../utils/pointsToast';
import { getAvatarUrl } from '../utils/mediaUrl';

const typeConfig = {
  post:         { icon: FileText,  label: 'Post',         badge: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300' },
  event:        { icon: Calendar,  label: 'Event',        badge: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' },
  announcement: { icon: Megaphone, label: 'Announcement', badge: 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatTime = (date) =>
  new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const ActivityCard = ({ activity, onDelete, showClubName = false }) => {
  const { user } = useAuth();
  const config = typeConfig[activity.type] || typeConfig.post;
  const Icon = config.icon;

  const [likes, setLikes] = useState(activity.likes?.length || 0);
  const [liked, setLiked] = useState(
    activity.likes?.some((id) => id === user?._id || id?._id === user?._id) || false
  );
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(activity.comments || []);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    try {
      const { data } = await api.post(`/activities/${activity._id}/like`);
      setLikes(data.likes);
      setLiked(data.liked);
    } catch {
      toast.error('Failed to update like');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this activity?')) return;
    try {
      await api.delete(`/activities/${activity._id}`);
      toast.success('Activity deleted');
      if (onDelete) onDelete(activity._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/activities/${activity._id}/comments`, { content: newComment.trim() });
      setComments((prev) => [...prev, data.comment]);
      setNewComment('');
      showPointsToast(data.pointsInfo);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/activities/${activity._id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const canDelete = user && (activity.author?._id === user._id || activity.author === user._id);

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-600 border border-indigo-100 overflow-hidden dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30">
              {activity.author?.avatar
                ? <img src={getAvatarUrl(activity.author.avatar)} alt={activity.author.name} className="h-full w-full object-cover" />
                : activity.author?.name?.charAt(0).toUpperCase() || '?'
              }
            </div>
            <div>
              <Link to={`/users/${activity.author?._id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition dark:text-white dark:hover:text-amber-400">
                {activity.author?.name || 'Unknown'}
              </Link>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                {showClubName && activity.club?.name && (
                  <>
                    <Link to={`/clubs/${activity.club._id || activity.club}`} className="font-medium text-amber-500 hover:underline dark:text-amber-400">
                      {activity.club.name}
                    </Link>
                    {' · '}
                  </>
                )}
                {formatDate(activity.createdAt)}
              </p>
            </div>
          </div>
          <span className={`badge flex items-center gap-1 ${config.badge}`}>
            <Icon size={11} /> {config.label}
          </span>
        </div>

        {/* Content */}
        <div className="mt-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{activity.title}</h3>
          <p className="mt-1.5 whitespace-pre-line text-sm text-gray-600 dark:text-slate-300">{activity.content}</p>

          {/* Media */}
          {activity.media?.length > 0 && (
            <div className={`mt-3 grid gap-1.5 rounded-xl overflow-hidden ${
              activity.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}>
              {activity.media.map((m, i) => (
                m.type === 'video'
                  ? <video key={i} src={m.url} controls className="w-full max-h-72 rounded-lg bg-black object-contain" />
                  : <img key={i} src={m.url} alt="" onClick={() => window.open(m.url, '_blank')}
                      className={`w-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition ${
                        activity.media.length === 1 ? 'max-h-80' : 'h-40'
                      } ${activity.media.length === 3 && i === 0 ? 'col-span-2' : ''}`}
                    />
              ))}
            </div>
          )}

          {/* Event details */}
          {activity.type === 'event' && activity.eventDate && (
            <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm dark:border-indigo-500/30 dark:bg-indigo-500/10">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Calendar size={14} />
                <span className="font-semibold">{formatDate(activity.eventDate)}</span>
              </div>
              {activity.eventLocation && (
                <div className="mt-1 flex items-center gap-2 text-gray-500 dark:text-slate-400">
                  <MapPin size={14} />
                  <span>{activity.eventLocation}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-slate-700">
          <div className="flex items-center gap-1">
            <button onClick={handleLike}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                liked
                  ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}>
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              {likes}
            </button>
            <button onClick={() => setShowComments(v => !v)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                showComments
                  ? 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}>
              <MessageCircle size={16} />
              {comments.length > 0 && comments.length}
            </button>
          </div>

          {canDelete && (
            <button onClick={handleDelete}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-300 hover:bg-red-50 hover:text-red-500 transition dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3 dark:border-slate-700 dark:bg-slate-800/50">
          {comments.length === 0 && (
            <p className="text-center text-xs text-gray-400 dark:text-slate-500 py-1">No comments yet. Be the first!</p>
          )}

          {comments.map((comment) => {
            const isOwn = user && (comment.author?._id === user._id || comment.author === user._id);
            return (
              <div key={comment._id} className="flex items-start gap-2.5 group">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                  {comment.author?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="rounded-xl bg-white px-3 py-2 shadow-sm border border-gray-100 dark:bg-slate-700 dark:border-slate-600">
                    <p className="text-xs font-semibold text-gray-700 dark:text-slate-200">{comment.author?.name || 'Unknown'}</p>
                    <p className="mt-0.5 text-sm text-gray-600 break-words dark:text-slate-300">{comment.content}</p>
                  </div>
                  <p className="mt-0.5 pl-1 text-xs text-gray-400 dark:text-slate-500">{formatTime(comment.createdAt)}</p>
                </div>
                {isOwn && (
                  <button onClick={() => handleDeleteComment(comment._id)}
                    className="mt-1 shrink-0 rounded p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}

          {/* New comment input */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-500"
            />
            <button type="submit" disabled={submitting || !newComment.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white transition hover:bg-indigo-600 disabled:opacity-40">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </article>
  );
};

export default ActivityCard;
