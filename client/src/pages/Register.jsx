import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Check } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { ErrorAlert, Spinner } from '../components/ui/index'
import { getErr } from '../utils/helpers'
import { toast } from 'react-toastify'
import Logo from '../assets/Logo.svg'


const RULES = [
    { t: 'At least 8 characters', fn: p => p.length >= 8 },
    { t: 'One uppercase letter', fn: p => /[A-Z]/.test(p) },
    { t: 'One number', fn: p => /\d/.test(p) },
]

export default function Register() {
    const [f, setF] = useState({ fullName: '', email: '', password: '' })
    const [show, setShow] = useState(false)
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState('')
    const { register } = useAuthStore()
    const nav = useNavigate()

    const submit = async (e) => {
        e.preventDefault(); setErr('')
        const fail = RULES.find(r => !r.fn(f.password))
        if (fail) { setErr(`Password: ${fail.t}`); return }
        setBusy(true)
        try {
            const u = await register(f)
            toast.success(`Welcome to ResolveX, ${u.fullName.split(' ')[0]}!`)
            nav('/dashboard', { replace: true })
        } catch (e) { setErr(getErr(e)) }
        finally { setBusy(false) }
    }

    return (
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-sm animate-slide-up">
                <div className="text-center mb-7">
                    <div className="inline-flex overflow-auto h-12 w-12 items-center justify-center rounded-xl bg-primary-800 mb-4 shadow-lg">
                        <img className='w-full h-full' src={Logo} alt="Logo" srcset="" />
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Create account</h1>
                    <p className="text-slate-500 mt-1 text-sm">Join the civic platform for your community</p>
                </div>
                <div className="card p-6 sm:p-8 shadow-lg">
                    <form onSubmit={submit} className="space-y-4">
                        <ErrorAlert message={err} />
                        <div className="field">
                            <label className="label">Full Name</label>
                            <input type="text" className="input" placeholder="John Doe"
                                value={f.fullName} onChange={e => setF({ ...f, fullName: e.target.value })} required minLength={2} />
                        </div>
                        <div className="field">
                            <label className="label">Email address</label>
                            <input type="email" className="input" placeholder="johndoe@gmail.com"
                                value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required />
                        </div>
                        <div className="field">
                            <label className="label">Password</label>
                            <div className="relative">
                                <input type={show ? 'text' : 'password'} className="input pr-10" placeholder="Create a strong password"
                                    value={f.password} onChange={e => setF({ ...f, password: e.target.value })} required />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShow(!show)}>
                                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {f.password && (
                                <div className="mt-2 space-y-1">
                                    {RULES.map(r => (
                                        <div key={r.t} className={`flex items-center gap-1.5 text-xs transition-colors ${r.fn(f.password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            <Check className="h-3 w-3" /> {r.t}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button type="submit" className="btn-primary btn w-full btn-lg mt-1" disabled={busy}>
                            {busy ? <Spinner size="sm" /> : 'Create account'}
                        </button>
                    </form>
                    <p className="text-center text-sm text-slate-500 mt-5">
                        Already have an account? <Link to="/login" className="font-semibold text-primary-800 hover:underline">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
