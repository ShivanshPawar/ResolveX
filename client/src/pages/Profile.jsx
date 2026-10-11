import { useState, useRef } from 'react'
import { Camera, Save, Lock } from 'lucide-react'
import { usersApi } from '../api/index'
import useAuthStore from '../store/authStore'
import { Avatar, ErrorAlert, Spinner } from '../components/ui/index'
import { getErr, fmtDate } from '../utils/helpers'
import { toast } from 'react-toastify'

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
        <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-primary-800" />
        </div>
        <h2 className="font-display font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const avatarRef = useRef()

  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || '',
  })
  const [savingP, setSavingP] = useState(false)
  const [errP, setErrP] = useState('')

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [errPw, setErrPw] = useState('')

  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    setUploadingAvatar(true)
    try {
      const r = await usersApi.uploadAvatar(fd)
      setUser({ ...user, avatarUrl: r.data.data.avatarUrl })
      toast.success('Avatar updated!')
    } catch (e) {
      toast.error(getErr(e))
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setErrP('')
    setSavingP(true)
    try {
      const r = await usersApi.updateMe(profile)
      setUser({ ...user, ...r.data.data })
      toast.success('Profile saved!')
    } catch (e) {
      setErrP(getErr(e))
    } finally {
      setSavingP(false)
    }
  }

  const savePw = async (e) => {
    e.preventDefault()
    setErrPw('')
    if (pw.newPassword !== pw.confirm) {
      setErrPw('New passwords do not match')
      return
    }
    if (pw.newPassword.length < 8) {
      setErrPw('Password must be at least 8 characters')
      return
    }
    setSavingPw(true)
    try {
      await usersApi.changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      })
      toast.success('Password changed!')
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (e) {
      setErrPw(getErr(e))
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto page-wrap">
      <div>
        <h1 className="page-title">Your Profile</h1>
        <p className="page-sub">Manage account details and preferences</p>
      </div>

      {/* Avatar card */}
      <div className="card p-5 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <Avatar src={user?.avatarUrl} name={user?.fullName} size="xl" />
          <button
            onClick={() => avatarRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 h-7 w-7 bg-primary-800 text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors"
          >
            {uploadingAvatar ? <Spinner size="sm" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatar}
          />
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-slate-900 text-lg truncate">{user?.fullName}</p>
          <p className="text-sm text-slate-500 truncate">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary-50 text-primary-800">
              {user?.role}
            </span>
            {user?.createdAt && (
              <span className="text-xs text-slate-400">
                Since {fmtDate(user.createdAt, 'MMM yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Personal info */}
      <Section title="Personal Information" icon={Save}>
        <ErrorAlert message={errP} />
        <form onSubmit={saveProfile} className="space-y-4 mt-3">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Full Name</label>
              <input
                className="input"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label className="label">Phone</label>
              <input
                className="input"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="field">
            <label className="label">Address</label>
            <input
              className="input"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div className="field">
            <label className="label">Bio</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell your community about yourself…"
              maxLength={300}
            />
            <p className="text-xs text-slate-400 text-right mt-1">{profile.bio.length}/300</p>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary btn" disabled={savingP}>
              {savingP ? <Spinner size="sm" /> : <Save className="h-4 w-4" />} Save Changes
            </button>
          </div>
        </form>
      </Section>

      {/* Password */}
      <Section title="Change Password" icon={Lock}>
        <ErrorAlert message={errPw} />
        <form onSubmit={savePw} className="space-y-4 mt-3">
          <div className="field">
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input"
              value={pw.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label">New Password</label>
              <input
                type="password"
                className="input"
                value={pw.newPassword}
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className="input"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary btn" disabled={savingPw}>
              {savingPw ? <Spinner size="sm" /> : <Lock className="h-4 w-4" />} Update Password
            </button>
          </div>
        </form>
      </Section>
    </div>
  )
}
