import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Users, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';

const DEPARTMENTS = ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'EEE', 'OTHER'];

const Signup = () => {
  const { signup, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'CSE',
    departmentId: '',
    interests: '',
  });
  const [loading, setLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success('Account created! Welcome to ClubHub');
      navigate('/home');
    } catch {
      toast.error('Google sign-in failed');
    }
  };

  if (user) return <Navigate to="/home" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        department: form.department,
        interests: form.interests
          ? form.interests.split(',').map((i) => i.trim().toLowerCase()).filter(Boolean)
          : [],
      };
      if (form.departmentId) payload.departmentId = form.departmentId;
      await signup(payload);
      toast.success('Account created! Welcome to ClubHub');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
            <Users size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Create account</h1>
          <p className="mt-2 text-slate-400">Join ClubHub and discover your community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl sm:p-8">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Full name</label>
            <input type="text" required placeholder="Your name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
            <input type="email" required placeholder="you@example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
            <input type="password" required minLength={6} placeholder="At least 6 characters" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Department</label>
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="input-field">
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Interests <span className="text-slate-500">(optional)</span>
            </label>
            <input type="text" placeholder="coding, music, debate (comma separated)" value={form.interests}
              onChange={(e) => setForm({ ...form, interests: e.target.value })} className="input-field" />
            <p className="mt-1 text-xs text-slate-500">Helps us recommend clubs you'll love</p>
          </div>

          <button type="button" onClick={() => setShowAdmin(!showAdmin)}
            className="flex w-full items-center justify-between rounded-lg border border-dashed border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:border-slate-500 hover:text-slate-300">
            <span>I have a Department Admin ID</span>
            {showAdmin ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdmin && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Department Admin ID</label>
              <input type="text" placeholder="e.g. CSE-2024-ADMIN" value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="input-field" />
              <p className="mt-1 text-xs text-slate-500">Required to create and manage clubs.</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create account'}
            {!loading && <ArrowRight size={16} />}
          </button>

          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500">or</span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          <GoogleAuthButton onSuccess={handleGoogleSuccess} text="signup_with" />

          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-amber-400 hover:text-amber-300">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
