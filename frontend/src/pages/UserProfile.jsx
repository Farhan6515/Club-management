import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, UserX, MessageSquare, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../utils/mediaUrl';

const UserProfile = () => {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [relation, setRelation] = useState({ isFriend: false, requestSent: false, requestRecvd: false });
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (id === me?._id) { navigate('/profile', { replace: true }); return; }
    load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/friends/users/${id}`);
      setProfile(data.user);
      setRelation(data.relation);
    } catch { toast.error('User not found'); }
    finally { setLoading(false); }
  };

  const act = async (action) => {
    setActing(true);
    try {
      if (action === 'send')   await api.post(`/friends/request/${id}`);
      if (action === 'accept') await api.post(`/friends/accept/${id}`);
      if (action === 'reject') await api.post(`/friends/reject/${id}`);
      if (action === 'remove') await api.delete(`/friends/${id}`);
      await load();
      toast.success(
        action === 'send'   ? 'Friend request sent' :
        action === 'accept' ? 'Friend request accepted!' :
        action === 'reject' ? 'Request rejected' : 'Friend removed'
      );
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setActing(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-amber-400" />
    </div>
  );
  if (!profile) return <div className="card p-10 text-center text-slate-400">User not found</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Profile card */}
      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end justify-between gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-slate-800 bg-indigo-500/20 text-3xl font-extrabold text-indigo-400 overflow-hidden">
              {profile.avatar
                ? <img src={getAvatarUrl(profile.avatar)} alt={profile.name} className="h-full w-full object-cover" />
                : profile.name?.charAt(0).toUpperCase()
              }
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pb-1">
              {relation.isFriend ? (
                <>
                  <Link to={`/dm/${id}`}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-500/20 px-3 py-2 text-sm font-semibold text-indigo-400 transition hover:bg-indigo-500/30 sm:px-4">
                    <MessageSquare size={15} /> <span className="hidden sm:inline">Message</span>
                  </Link>
                  <button onClick={() => act('remove')} disabled={acting}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-400 transition hover:border-red-500/50 hover:text-red-400 sm:px-4">
                    <UserX size={15} /> <span className="hidden sm:inline">Remove</span>
                  </button>
                </>
              ) : relation.requestRecvd ? (
                <>
                  <button onClick={() => act('accept')} disabled={acting}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/30 sm:px-4">
                    <UserCheck size={15} /> <span className="hidden sm:inline">Accept</span>
                  </button>
                  <button onClick={() => act('reject')} disabled={acting}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-400 transition hover:text-red-400 sm:px-4">
                    <UserX size={15} /> <span className="hidden sm:inline">Reject</span>
                  </button>
                </>
              ) : relation.requestSent ? (
                <button disabled className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed sm:px-4">
                  <Clock size={15} /> <span className="hidden sm:inline">Request Sent</span>
                </button>
              ) : (
                <button onClick={() => act('send')} disabled={acting}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-400/20 px-3 py-2 text-sm font-semibold text-amber-400 transition hover:bg-amber-400/30 sm:px-4">
                  <UserPlus size={15} /> <span className="hidden sm:inline">Add Friend</span>
                </button>
              )}
            </div>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold text-white">{profile.name}</h1>
          <p className="text-sm text-slate-400">{profile.department} · {profile.friendCount} friends</p>
          {profile.bio && <p className="mt-3 text-sm text-slate-400">{profile.bio}</p>}

          {profile.interests?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.interests.map(i => (
                <span key={i} className="rounded-full bg-slate-700 px-3 py-0.5 text-xs text-slate-300">
                  {i}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clubs */}
      {profile.joinedClubs?.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
            <Users size={15} className="text-indigo-400" /> Clubs
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.joinedClubs.map(club => (
              <Link
                key={club._id}
                to={`/clubs/${club._id}`}
                className="rounded-lg border border-slate-700 bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-indigo-500/50 hover:text-white"
              >
                {club.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
