import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import api from '../api/axios';
import ClubCard from '../components/ClubCard';

const DEPARTMENTS = ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'EEE', 'OTHER'];
const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Literary', 'Social', 'Academic', 'Other'];

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { fetchClubs(); }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, department, category]);

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (department) params.department = department;
      if (category) params.category = category;
      const { data } = await api.get('/clubs', { params });
      setClubs(data.clubs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => { setSearch(''); setDepartment(''); setCategory(''); };
  const hasFilters = search || department || category;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Discover Clubs</h1>
        <p className="mt-1 text-slate-400">Find communities that match your interests</p>
      </header>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, description, or tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="input-field sm:w-44">
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field sm:w-44">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white transition">
              <X size={16} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />
        </div>
      ) : clubs.length === 0 ? (
        <div className="card p-10 text-center">
          <h3 className="text-base font-semibold text-white">No clubs found</h3>
          <p className="mt-1 text-sm text-slate-400">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-400">
            Showing <strong className="text-white">{clubs.length}</strong>{' '}
            {clubs.length === 1 ? 'club' : 'clubs'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => <ClubCard key={club._id} club={club} />)}
          </div>
        </>
      )}
    </div>
  );
};

export default Clubs;
