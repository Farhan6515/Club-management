import { Link } from 'react-router-dom';
import { Users, Tag } from 'lucide-react';

const categoryColors = {
  Technical: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  Cultural:  'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400',
  Sports:    'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  Literary:  'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  Social:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  Academic:  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  Other:     'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300',
};

const ClubCard = ({ club }) => {
  const memberCount = club.members?.length || club.memberCount || 0;

  return (
    <Link
      to={`/clubs/${club._id}`}
      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500/50 dark:hover:shadow-black/30"
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
        <h3 className="line-clamp-1 text-base font-bold text-gray-900 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-amber-400">
          {club.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-slate-400">{club.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="badge bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300">
            <Tag size={10} className="mr-1" />
            {club.department}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
            <Users size={12} /> {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ClubCard;
