import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
  Zap,
  Shield,
  Globe,
  ChevronRight,
} from 'lucide-react'
import { analyticsApi } from '../api/index'
import Logo from '../assets/Logo.avif'

const HOW = [
  {
    n: '01',
    icon: MapPin,
    title: 'Snap & Share',
    desc: 'See a pothole, leak, or broken streetlight? Take a quick picture, tell us where it is, and hit submit. It only takes a minute.',
  },
  {
    n: '02',
    icon: Clock,
    title: 'Stay in the Loop',
    desc: 'We send your report straight to the right city department. You can check back anytime to see exactly what they are doing about it.',
  },
  {
    n: '03',
    icon: CheckCircle,
    title: 'See the Fix',
    desc: 'Get an alert the moment the job is done. Your neighborhood gets a little bit better, and you made it happen!',
  },
]
const FEATS = [
  {
    icon: Zap,
    t: 'Instant Updates',
    d: 'See progress instantly. No waiting or wondering—watch your report move forward step-by-step.',
  },
  {
    icon: Shield,
    t: 'Verified Results',
    d: 'We show you exactly when an issue is completely solved, and who took care of it.',
  },
  {
    icon: Globe,
    t: 'Fully Transparent',
    d: 'Every report is visible to the public. Nothing is hidden behind closed doors.',
  },
  {
    icon: Users,
    t: 'Community Power',
    d: 'Join forces with your community to highlight, follow, and discuss local issues together.',
  },
]

export default function Landing() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    analyticsApi
      .summary()
      .then((r) => setStats(r.data.data))
      .catch(() => null)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative flex min-h-[calc(100svh-3.5rem)] items-center overflow-hidden bg-gradient-to-br from-primary-950 via-primary-800 to-primary-700 text-white sm:block sm:min-h-0">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-24 right-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-0 h-48 w-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-12 text-center sm:px-8 sm:py-28 lg:py-36">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium mb-6">
            <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
            Civic platform for better communities
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight mb-5">
            Your city, <span className="block sm:inline text-blue-300">your voice.</span>
          </h1>
          <p className="text-base sm:text-lg text-blue-100 leading-relaxed mb-8 max-w-xl mx-auto">
            Report potholes, broken lights, drainage problems — and track them publicly until
            resolved. Transparent. Accountable. Community-powered.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/issues/new"
              className="btn btn-lg bg-white text-primary-800 hover:bg-blue-50 font-bold shadow-lg"
            >
              <MapPin className="h-4 w-4" /> Report an Issue
            </Link>
            <Link
              to="/issues"
              className="btn btn-lg border border-white/25 text-white hover:bg-white/10"
            >
              Browse Issues <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {stats && (
            <div className="mt-12 flex flex-wrap justify-center gap-8 sm:gap-12">
              {[
                { l: 'Total Issues', v: stats.totalIssues },
                { l: 'Active Issues', v: stats.openIssues },
                { l: 'Resolved', v: stats.resolvedIssues },
              ].map((s) => (
                <div key={s.l}>
                  <p className="font-display text-3xl font-bold">{s.v?.toLocaleString()}</p>
                  <p className="text-sm text-blue-200 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-24 scroll-mt-20"
      >
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-primary-800 uppercase tracking-widest mb-2">
            Simple Process
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
            How ResolveX Works
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {HOW.map((s) => (
            <div key={s.n} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <s.icon className="h-5 w-5 text-primary-800" />
                </div>
                <span className="font-display text-5xl font-bold text-slate-100 leading-none mt-1">
                  {s.n}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 mb-1.5">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 border-y border-slate-200 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
              Built for accountability
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATS.map((f) => (
              <div key={f.t} className="card p-5 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-lg bg-primary-800 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-display font-bold text-slate-900 text-sm mb-1">{f.t}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="get-started"
        className="max-w-2xl mx-auto px-5 py-20 sm:py-28 text-center scroll-mt-20"
      >
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
          See a problem? Report it now.
        </h2>
        <p className="text-slate-500 mb-8 text-sm sm:text-base">
          Join thousands of citizens making their communities better.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/register" className="btn-primary btn btn-lg">
            Create Free Account <ChevronRight className="h-4 w-4" />
          </Link>
          <Link to="/issues" className="btn-secondary btn btn-lg">
            Explore Issues
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-5xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary-800 flex items-center overflow-auto justify-center">
              <img className="h-full w-full" src={Logo} alt="ResolveX logo" />
            </div>
            <span className="font-display font-bold text-primary-800">ResolveX</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} ResolveX – Public Civic Issue Platform
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link to="/issues" className="hover:text-primary-800">
              Browse
            </Link>
            <Link to="/analytics" className="hover:text-primary-800">
              Analytics
            </Link>
            <Link to="/register" className="hover:text-primary-800">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
