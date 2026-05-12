import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Zap, Search, Calendar, Star,
  ArrowRight, CheckCircle, Shield, Globe, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: Search,
    title: 'Discover Clubs',
    description: 'Browse clubs filtered by category, department, or interest. Find your community in seconds.',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-400',
    border: 'hover:border-indigo-500/50',
    top: 'bg-indigo-500',
  },
  {
    icon: Calendar,
    title: 'Track Activities',
    description: 'Stay up-to-date with every event, workshop, and meetup from the clubs you follow.',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    border: 'hover:border-emerald-500/50',
    top: 'bg-emerald-500',
  },
  {
    icon: Users,
    title: 'Connect with Members',
    description: 'Meet like-minded students, collaborate on projects, and grow your network on campus.',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    border: 'hover:border-amber-500/50',
    top: 'bg-amber-500',
  },
  {
    icon: Star,
    title: 'Personalized Feed',
    description: 'Get activity recommendations tailored to your interests so you never miss what matters.',
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
    border: 'hover:border-rose-500/50',
    top: 'bg-rose-500',
  },
  {
    icon: Shield,
    title: 'Club Administration',
    description: 'Club admins get powerful tools to manage members, post activities, and grow their community.',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    border: 'hover:border-purple-500/50',
    top: 'bg-purple-500',
  },
  {
    icon: Globe,
    title: 'All Departments',
    description: 'Clubs span every department — tech, arts, sports, culture, and more — so everyone belongs.',
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-400',
    border: 'hover:border-teal-500/50',
    top: 'bg-teal-500',
  },
];

const steps = [
  { number: '01', title: 'Create your account', desc: 'Sign up with your name and department in under a minute.', color: 'from-indigo-500 to-indigo-700', badge: 'bg-indigo-500/20 text-indigo-300' },
  { number: '02', title: 'Set your interests', desc: "Tell us what you love and we'll surface the best clubs for you.", color: 'from-amber-400 to-amber-600', badge: 'bg-amber-500/20 text-amber-300' },
  { number: '03', title: 'Join & participate', desc: 'Follow clubs, attend events, and become an active member.', color: 'from-emerald-500 to-emerald-700', badge: 'bg-emerald-500/20 text-emerald-300' },
];

const stats = [
  { value: '50+',    label: 'Active Clubs',      color: 'text-indigo-400' },
  { value: '1,200+', label: 'Members',            color: 'text-amber-400'  },
  { value: '300+',   label: 'Activities Hosted',  color: 'text-emerald-400'},
  { value: '15+',    label: 'Departments',         color: 'text-rose-400'   },
];

const benefits = [
  'Personalised club recommendations based on your interests',
  'Real-time activity feed from clubs you follow',
  'Easy one-click join and leave for any club',
  'Dedicated club admin tools for managing members',
  'Mobile-friendly — works great on any device',
  'Search clubs by department, category, or name',
];

const FeatureGrid = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="mt-11 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {features.map(({ icon: Icon, title, description, iconBg, iconColor, border, top }, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={title}
            className={`group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-md transition-all duration-300 sm:hover:-translate-y-1 sm:hover:shadow-2xl sm:hover:shadow-black/40 ${border}`}
          >
            <div className={`h-1.5 w-full ${top}`} />

            {/* Mobile: tappable header */}
            <button
              type="button"
              onClick={() => toggle(i)}
              className="flex w-full items-center gap-4 p-5 text-left sm:hidden"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
                <Icon size={22} />
              </div>
              <span className="flex-1 text-sm font-bold text-white">{title}</span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Mobile: collapsible description */}
            <div
              className={`overflow-hidden px-5 transition-all duration-300 sm:hidden ${
                isOpen ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <p className="text-sm leading-relaxed text-slate-400">{description}</p>
            </div>

            {/* Desktop: always fully visible */}
            <div className="hidden p-6 sm:block">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
                <Icon size={24} />
              </div>
              <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 border-b border-slate-700 bg-slate-900/90 backdrop-blur-md shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow">
              <Users size={20} />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white">
              Club<span className="text-amber-400">Hub</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/home"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
              >
                Go to Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-md transition hover:opacity-90"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[88vh] flex items-center">
        <img
          src="/pictures/pic3.jpg"
          alt="Campus life"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-purple-950/90" />
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-28 text-center sm:py-36">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm font-semibold text-amber-300">
            <Zap size={14} /> Your campus clubs, all in one place
          </div>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Connect.{' '}
            <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
              Discover.
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Belong.
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-400">
            ClubHub is the all-in-one platform for campus clubs. Find clubs that match
            your passion, follow their activities, and become part of a thriving community.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {user ? (
              <Link
                to="/home"
                className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-3.5 font-bold text-slate-900 shadow-xl transition hover:opacity-90"
              >
                Open Dashboard <ArrowRight className="ml-1 inline" size={16} />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-3.5 font-bold text-slate-900 shadow-xl transition hover:opacity-90"
                >
                  Get started — it's free
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl border border-slate-600 bg-slate-800/60 px-8 py-3.5 font-semibold text-slate-300 backdrop-blur transition hover:bg-slate-700 hover:text-white"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-t border-slate-700 bg-slate-900 py-11">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-700 bg-slate-800 p-6 text-center shadow-md">
                <p className={`text-4xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="mt-1.5 text-sm font-medium text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Campus Life Photo Gallery ── */}
      <section className="border-t border-slate-700 bg-slate-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block rounded-full bg-indigo-500/20 px-4 py-1 text-xs font-bold uppercase tracking-widest text-indigo-400">
              Campus Life
            </span>
            <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
              Life at Campus
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              From sports on the field to study sessions in the library — campus life is
              richer when you're part of a club.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:grid-rows-2">
            <div className="group relative col-span-2 overflow-hidden rounded-2xl border border-slate-700 shadow-xl lg:col-span-1 lg:row-span-2">
              <img src="/pictures/students.jpg" alt="Students collaborating" className="h-64 w-full object-cover transition duration-700 group-hover:scale-105 lg:h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-indigo-900/20 to-transparent" />
              <span className="absolute bottom-5 left-5 rounded-full bg-indigo-500/80 px-3 py-1 text-xs font-bold text-white backdrop-blur">Study Groups</span>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-700 shadow-xl">
              <img src="/pictures/basketball.jpg" alt="Basketball club" className="h-56 w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-transparent to-transparent" />
              <span className="absolute bottom-5 left-5 rounded-full bg-emerald-500/80 px-3 py-1 text-xs font-bold text-white backdrop-blur">Sports Clubs</span>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-700 shadow-xl">
              <img src="/pictures/rugby.jpg" alt="Team spirit" className="h-56 w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-950/90 via-transparent to-transparent" />
              <span className="absolute bottom-5 left-5 rounded-full bg-amber-500/80 px-3 py-1 text-xs font-bold text-white backdrop-blur">Team Spirit</span>
            </div>

            <div className="group relative col-span-2 overflow-hidden rounded-2xl border border-slate-700 shadow-xl">
              <img src="/pictures/lecture.jpg" alt="Lecture hall" className="h-56 w-full object-cover object-center transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-transparent to-transparent" />
              <span className="absolute bottom-5 left-5 rounded-full bg-purple-500/80 px-3 py-1 text-xs font-bold text-white backdrop-blur">Academic Clubs</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-slate-700 bg-slate-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="mb-3 inline-block rounded-full bg-amber-500/20 px-4 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
              Features
            </span>
            <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
              Everything you need to stay connected
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              From discovery to participation, ClubHub covers every step of your club journey.
            </p>
          </div>
          <FeatureGrid />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-slate-700 bg-slate-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="mb-3 inline-block rounded-full bg-purple-500/20 px-4 py-1 text-xs font-bold uppercase tracking-widest text-purple-400">
              How it works
            </span>
            <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
              Three steps to belonging
            </h2>
            <p className="mt-4 text-slate-400">
              Join thousands of students already using ClubHub.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.number} className="relative">
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-8 hidden h-0.5 w-full translate-x-10 bg-slate-700 sm:block" />
                )}
                <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 text-center shadow-md">
                  <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-lg font-extrabold text-white shadow-lg`}>
                    {step.number}
                  </div>
                  <h3 className="mb-2 font-bold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why ClubHub ── */}
      <section className="border-t border-slate-700 bg-slate-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl lg:flex">
            <div className="relative hidden lg:block lg:w-1/2">
              <img src="/pictures/campus.jpg" alt="Campus" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-800/60" />
            </div>
            <div className="p-10 sm:p-14 lg:w-1/2">
              <span className="mb-4 inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
                Why ClubHub
              </span>
              <h2 className="text-3xl font-extrabold leading-snug text-white sm:text-4xl">
                Why students love ClubHub
              </h2>
              <p className="mt-4 text-slate-400">
                We built ClubHub to make campus life richer — no more missing events or
                struggling to find clubs that match your vibe.
              </p>
              <ul className="mt-8 space-y-3">
                {benefits.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle size={18} className="mt-0.5 shrink-0 text-amber-400" />
                    <span className="text-sm text-slate-400">{item}</span>
                  </li>
                ))}
              </ul>
              {user ? (
                <Link to="/home" className="mt-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 font-bold text-slate-900 shadow-lg transition hover:opacity-90">
                  Open Dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <Link to="/signup" className="mt-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 font-bold text-slate-900 shadow-lg transition hover:opacity-90">
                  Join for free <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!user && (
        <section className="border-t border-slate-700 bg-slate-900 py-16 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-700 bg-slate-800 p-10 text-center shadow-2xl sm:p-14">
            <span className="mb-4 inline-block rounded-full bg-rose-500/20 px-4 py-1 text-xs font-bold uppercase tracking-widest text-rose-400">
              Get started
            </span>
            <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
              Ready to find your community?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Sign up in seconds and start discovering clubs that match who you are.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-3.5 font-bold text-slate-900 shadow-xl transition hover:opacity-90"
              >
                Create free account <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-slate-600 bg-slate-700 px-8 py-3.5 font-semibold text-slate-300 transition hover:bg-slate-600 hover:text-white"
              >
                Already have an account? Log in
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-slate-700 bg-slate-900 py-8 text-center text-sm">
        <div className="mb-3 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow">
            <Users size={16} />
          </div>
          <span className="text-base font-extrabold tracking-tight text-white">
            Club<span className="text-amber-400">Hub</span>
          </span>
        </div>
        <p className="text-slate-500">© {new Date().getFullYear()} ClubHub. Built for campus communities.</p>
      </footer>

    </div>
  );
};

export default Landing;
