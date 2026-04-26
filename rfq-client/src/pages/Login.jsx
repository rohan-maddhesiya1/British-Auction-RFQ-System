import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  LogIn,
  PackageCheck,
  RadioTower,
  ShieldCheck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../utils/formatters';
import ErrorState from '../components/ErrorState';

const featureCards = [
  {
    icon: RadioTower,
    title: 'Live rank stream',
    text: 'Socket-powered L1 updates without refreshing the workspace.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    icon: Clock3,
    title: 'Smart close windows',
    text: 'Skew-corrected countdowns, extensions, and hard close visibility.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: ShieldCheck,
    title: 'Role aware access',
    text: 'Buyer and supplier workflows stay cleanly separated.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
];

const metrics = [
  { label: 'Auction states', value: 'Live', icon: Zap, color: 'text-teal-600 bg-teal-50' },
  { label: 'Close control', value: 'X + Y', icon: Clock3, color: 'text-indigo-600 bg-indigo-50' },
  { label: 'Bid view', value: 'Ranked', icon: BarChart3, color: 'text-emerald-600 bg-emerald-50' },
];

const roleOptions = [
  { value: 'buyer', label: 'Buyer', icon: BarChart3, desc: 'Create & manage RFQs' },
  { value: 'supplier', label: 'Supplier', icon: Activity, desc: 'Submit competitive bids' },
];

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => {
    setError('');
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
      navigate(location.state?.from?.pathname ?? '/auctions', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/40">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-8">

        {/* ── Left panel ─────────────────────────────── */}
        <section className="hidden py-10 lg:flex lg:flex-col lg:justify-between">

          {/* Brand */}
          <div>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-teal-100 bg-white px-4 py-2.5 shadow-sm">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-action text-white shadow-sm shadow-teal-200">
                <PackageCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold text-slate-800">British Auction RFQ</span>
            </div>

            {/* Hero copy */}
            <div className="mt-14 max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-600">
                Procurement command center
              </p>
              <h1 className="mt-4 text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                Run freight auctions with real-time clarity.
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-500">
                Create RFQs, receive supplier bids, track L1 positions, and monitor extension events — all from one focused dashboard.
              </p>
            </div>

            {/* Metric chips */}
            <div className="mt-10 flex flex-wrap gap-3">
              {metrics.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm">
                    <span className={`grid h-7 w-7 place-items-center rounded-lg text-sm font-bold ${m.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{m.value}</p>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{m.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid gap-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-teal-100 hover:shadow">
                  <div className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${feature.bg} ${feature.color}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{feature.title}</p>
                    <p className="mt-0.5 text-sm leading-6 text-slate-500">{feature.text}</p>
                  </div>
                </div>
              );
            })}

            {/* Trust line */}
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Role-based JWT authentication · WebSocket live updates · British Auction close-window rules
            </div>
          </div>
        </section>

        {/* ── Right panel / form ──────────────────────── */}
        <main className="grid place-items-center py-10">
          <div className="w-full max-w-[440px]">

            {/* Mobile brand badge */}
            <div className="mb-8 flex justify-center lg:hidden">
              <div className="inline-flex items-center gap-2.5 rounded-2xl border border-teal-100 bg-white px-4 py-2.5 shadow-sm">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-action text-white">
                  <PackageCheck className="h-4 w-4" />
                </span>
                <span className="text-sm font-bold text-slate-800">British Auction RFQ</span>
              </div>
            </div>

            <form
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60"
              onSubmit={submit}
            >
              {/* Form header */}
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-action text-white shadow-sm shadow-teal-200">
                  {mode === 'login' ? <LockKeyhole className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {mode === 'login' ? 'Welcome back' : 'Create account'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {mode === 'login'
                      ? 'Sign in to manage live auctions'
                      : 'Join the RFQ auction workspace'}
                  </p>
                </div>
              </div>

              {/* Mode toggle */}
              <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1">
                <button
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  type="button"
                  onClick={() => setMode('login')}
                >
                  Sign in
                </button>
                <button
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  type="button"
                  onClick={() => setMode('register')}
                >
                  Sign up
                </button>
              </div>

              {error && <div className="mb-4"><ErrorState message={error} /></div>}

              <div className="grid gap-4">
                {mode === 'register' && (
                  <label>
                    <span className="field-label">Full name</span>
                    <input
                      className="input h-11"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="Alex Morgan"
                      required
                    />
                  </label>
                )}

                <label>
                  <span className="field-label">Work email</span>
                  <input
                    className="input h-11"
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="name@company.com"
                    required
                  />
                </label>

                <label>
                  <span className="field-label">Password</span>
                  <input
                    className="input h-11"
                    type="password"
                    minLength="6"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </label>

                {mode === 'register' && (
                  <div>
                    <span className="field-label">Account role</span>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {roleOptions.map((role) => {
                        const Icon = role.icon;
                        const selected = form.role === role.value;
                        return (
                          <button
                            key={role.value}
                            className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all duration-150 ${
                              selected
                                ? 'border-teal-300 bg-teal-50 ring-1 ring-teal-300'
                                : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40'
                            }`}
                            type="button"
                            onClick={() => update('role', role.value)}
                          >
                            <Icon className={`h-4 w-4 ${selected ? 'text-teal-600' : 'text-slate-400'}`} />
                            <span className={`text-sm font-semibold ${selected ? 'text-teal-700' : 'text-slate-700'}`}>
                              {role.label}
                            </span>
                            <span className="text-[11px] text-slate-400">{role.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button className="btn btn-primary mt-6 w-full" type="submit" disabled={submitting}>
                {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <p className="mt-5 text-center text-xs leading-5 text-slate-400">
                Access is role-based and protected with your session token.
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
