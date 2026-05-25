import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Calendar, MapPin, Megaphone, FileText, Trash2, MessageCircle, Send } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { showPointsToast } from '../utils/pointsToast';
import { getAvatarUrl } from '../utils/mediaUrl';

const typeConfig = {
  post:         { icon: FileText,  label: 'Post',         badge: 'bg-slate-700 text-slate-300' },
  event:        { icon: Calendar,  label: 'Event',        badge: 'bg-indigo-500/20 text-indigo-400' },
  announcement: { icon: Megaphone, label: 'Announcement', badge: 'bg-amber-500/20 text-amber-400' },
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
      const { data } = await api.post(`/activities/${activity._id}/comments`, {
        content: newComment.trim(),
      });
      setComments((prev) => [...prev, data.comment]);
      setNewComment('');
      showPointsToast(data.pointsInfo);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/activities/${activity._id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const canDelete =
    user && (activity.author?._id === user._id || activity.author === user._id);

  return (
    <article className="card overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 font-bold text-indigo-400 border border-indigo-500/30 overflow-hidden">
            {activity.author?.avatar
              ? <img src={getAvatarUrl(activity.author.avatar)} alt={activity.author.name} className="h-full w-full object-cover" />
              : activity.author?.name?.charAt(0).toUpperCase() || '?'
            }
          </div>
          <div>
            <Link to={`/users/${activity.author?._id}`} className="text-sm font-semibold text-white hover:text-amber-400 transition">
              {activity.author?.name || 'Unknown'}
            </Link>
            <p className="text-xs text-slate-400">
              {showClubName && activity.club?.name && (
                <>
                  <Link
                    to={`/clubs/${activity.club._id || activity.club}`}
                    className="font-medium text-amber-400 hover:underline"
                  >
                    {activity.club.name}
                  </Link>
                  {' · '}
                </>
              )}
              {formatDate(activity.createdAt)}
            </p>
          </div>
        </div>
        <span className={`badge ${config.badge} flex items-center gap-1`}>
          <Icon size={12} /> {config.label}
        </span>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-bold text-white">{activity.title}</h3>
        <p className="mt-2 whitespace-pre-line text-sm text-slate-400">{activity.content}</p>

        {activity.media?.length > 0 && (
          <div className={`mt-3 grid gap-1.5 rounded-xl overflow-hidden ${
            activity.media.length === 1 ? 'grid-cols-1' :
            activity.media.length === 2 ? 'grid-cols-2' :
            'grid-cols-2'
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

        {activity.type === 'event' && activity.eventDate && (
          <div className="mt-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm">
            <div className="flex items-center gap-2 text-indigo-400">
              <Calendar size={14} />
              <span className="font-semibold">{formatDate(activity.eventDate)}</span>
            </div>
            {activity.eventLocation && (
              <div className="mt-1 flex items-center gap-2 text-slate-400">
                <MapPin size={14} />
                <span>{activity.eventLocation}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-3">
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium transition ${
              liked ? 'text-rose-400 hover:bg-rose-500/10' : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            {likes}
          </button>

          <button
            onClick={() => setShowComments((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium transition ${
              showComments ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            <MessageCircle size={16} />
            {comments.length > 0 && comments.length}
          </button>
        </div>

        {canDelete && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-3 border-t border-slate-700 pt-3 space-y-3">
          {comments.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-2">No comments yet. Be the first!</p>
          )}

          {comments.map((comment) => {
            const isOwn =
              user && (comment.author?._id === user._id || comment.author === user._id);
            return (
              <div key={comment._id} className="flex items-start gap-2.5 group">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                  {comment.author?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="rounded-xl bg-slate-700/60 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-300">
                      {comment.author?.name || 'Unknown'}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-300 break-words">{comment.content}</p>
                  </div>
                  <p className="mt-0.5 pl-1 text-xs text-slate-500">{formatTime(comment.createdAt)}</p>
                </div>
                {isOwn && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="mt-1 shrink-0 rounded p-1 text-slate-600 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}

          {/* New comment input */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400 border border-indigo-500/30">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 rounded-full border border-slate-600 bg-slate-700 px-4 py-1.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white transition hover:bg-indigo-600 disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </article>
  );
};

export default ActivityCard;
