import { Link } from 'react-router-dom';
import { Users, Tag } from 'lucide-react';

const categoryColors = {
  Technical: 'bg-indigo-500/20 text-indigo-400',
  Cultural:  'bg-pink-500/20 text-pink-400',
  Sports:    'bg-orange-500/20 text-orange-400',
  Literary:  'bg-purple-500/20 text-purple-400',
  Social:    'bg-emerald-500/20 text-emerald-400',
  Academic:  'bg-amber-500/20 text-amber-400',
  Other:     'bg-slate-700 text-slate-300',
};

const ClubCard = ({ club }) => {
  const memberCount = club.members?.length || club.memberCount || 0;

  return (
    <Link
      to={`/clubs/${club._id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-md transition hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-black/30"
    >
      {/* Cover */}
      <div className="relative h-28 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        {club.coverImage && (
          <img src={club.coverImage} alt={club.name} className="h-full w-full object-cover" />
        )}
        <div className="absolute right-3 top-3">
          <span className={`badge ${categoryColors[club.category] || categoryColors.Other}`}>
            {club.category}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-bold text-white group-hover:text-amber-400 transition">
          {club.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-400">{club.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="badge bg-slate-700 text-slate-300">
            <Tag size={10} className="mr-1" />
            {club.department}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Users size={12} /> {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ClubCard;
