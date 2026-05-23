import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, MapPin, CheckCircle, Locate, Camera, Upload, X, ImageIcon, AlertCircle, Loader2, RotateCcw, ZoomIn } from 'lucide-react'
import { issuesApi } from '../api/index'
import { LocationPicker } from '../components/issues/IssueMap'
import { ErrorAlert, Spinner, StatusBadge } from '../components/ui/index'
import { CATEGORIES, getErr, cn, notify } from '../utils/helpers'

const TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILES = 5
const MAX_MB = 10

const hasCoordinates = (latitude, longitude) => Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
const formatCoordinates = (latitude, longitude) => `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`

async function reverseGeocode(latitude, longitude) {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    if (data?.address) {
        const parts = [
            data.address.road,
            data.address.suburb || data.address.neighbourhood,
            data.address.city || data.address.town || data.address.village,
            data.address.state,
        ].filter(Boolean)
        return parts.slice(0, 3).join(', ') || data.display_name?.split(',').slice(0, 2).join(',').trim()
    }
    return data?.display_name?.split(',').slice(0, 3).join(',').trim()
}

/* ── Camera Modal with front/rear toggle ───────────────────── */
function CameraModal({ onCapture, onClose }) {
    const videoRef = useRef()
    const canvasRef = useRef()
    const streamRef = useRef()
    const [ready, setReady] = useState(false)
    const [error, setError] = useState('')
    const [facing, setFacing] = useState('environment') // 'environment' | 'user'
    const [capturing, setCapturing] = useState(false)

    const startCamera = useCallback(async (facingMode) => {
        // Stop any existing stream first
        streamRef.current?.getTracks().forEach(t => t.stop())
        setReady(false)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 960 } },
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.onloadedmetadata = () => { videoRef.current.play(); setReady(true) }
            }
        } catch {
            setError('Camera access denied. Please allow camera permissions and try again.')
        }
    }, [])

    useEffect(() => { startCamera(facing) }, [])

    const toggleFacing = () => {
        const next = facing === 'environment' ? 'user' : 'environment'
        setFacing(next)
        startCamera(next)
    }

    const stop = () => streamRef.current?.getTracks().forEach(t => t.stop())

    const capture = async () => {
        const v = videoRef.current, c = canvasRef.current
        if (!v || !c || !ready) return
        setCapturing(true)
        c.width = v.videoWidth; c.height = v.videoHeight
        c.getContext('2d').drawImage(v, 0, 0)
        c.toBlob(blob => {
            if (!blob) { setCapturing(false); return }
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
            stop()
            setCapturing(false)
            onCapture(file)
        }, 'image/jpeg', 0.92)
    }

    const close = () => { stop(); onClose() }

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/80 z-10">
                <span className="text-white font-semibold text-sm flex items-center gap-2">
                    <Camera className="h-4 w-4" /> Capture Photo
                </span>
                <button onClick={close} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
                    <X className="h-5 w-5" />
                </button>
            </div>

            {error ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                    <p className="text-white/70 text-sm mb-4">{error}</p>
                    <button onClick={close} className="btn btn-sm bg-white/10 text-white hover:bg-white/20">Close</button>
                </div>
            ) : (
                <>
                    {/* Video feed */}
                    <div className="relative flex-1 bg-black overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                        {!ready && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                                <Loader2 className="h-10 w-10 text-white/50 animate-spin" />
                            </div>
                        )}
                        {/* Viewfinder */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-3/4 max-w-xs aspect-square relative">
                                <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/70 rounded-tl-lg" />
                                <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/70 rounded-tr-lg" />
                                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/70 rounded-bl-lg" />
                                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/70 rounded-br-lg" />
                            </div>
                        </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Controls */}
                    <div className="flex items-center justify-between px-8 py-6 bg-black">
                        <button onClick={close} className="text-white/60 hover:text-white text-sm font-medium w-14 text-left">Cancel</button>
                        {/* Shutter */}
                        <button
                            onClick={capture}
                            disabled={!ready || capturing}
                            className="h-16 w-16 rounded-full bg-white border-4 border-white/30 flex items-center justify-center shadow-xl active:scale-95 transition-transform disabled:opacity-50"
                        >
                            {capturing
                                ? <Loader2 className="h-6 w-6 text-slate-700 animate-spin" />
                                : <div className="h-12 w-12 rounded-full bg-white border-4 border-slate-300" />
                            }
                        </button>
                        {/* Flip camera */}
                        <button onClick={toggleFacing} className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors w-14 flex justify-end">
                            <RotateCcw className="h-6 w-6" />
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

/* ── Photo Uploader with drag-drop + camera ─────────────────── */
function PhotoUploader({ files, onChange }) {
    const [dragging, setDragging] = useState(false)
    const [showCamera, setShowCamera] = useState(false)
    const [lightbox, setLightbox] = useState(null)
    const inputRef = useRef()

    const addFiles = useCallback((incoming) => {
        const valid = Array.from(incoming).filter(f => {
            if (!TYPES.includes(f.type)) { notify.error(`${f.name}: unsupported format`); return false }
            if (f.size > MAX_MB * 1024 * 1024) { notify.error(`${f.name}: exceeds ${MAX_MB}MB`); return false }
            return true
        })
        onChange([...files, ...valid].slice(0, MAX_FILES))
    }, [files, onChange])

    const onDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }

    const handleCapture = (file) => {
        setShowCamera(false)
        addFiles([file])
        notify.success('Photo captured!')
    }

    const hasCamera = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

    return (
        <>
            <div className="space-y-3">
                {/* Drop zone */}
                <div
                    className={cn(
                        'border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer',
                        dragging ? 'border-primary-800 bg-primary-50 scale-[1.01]' : 'border-slate-200 hover:border-primary-800/50 hover:bg-primary-50/20 '
                    )}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                >
                    <div className={cn('mx-auto mb-3 h-12 w-12 rounded-xl flex items-center justify-center', dragging ? 'bg-primary-100 ' : 'bg-slate-100 ')}>
                        <Upload className={cn('h-6 w-6', dragging ? 'text-primary-800' : 'text-slate-400')} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 ">
                        {dragging ? 'Drop photos here...' : 'Drag & drop photos here'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">or click to browse · JPEG, PNG, WebP · max {MAX_MB}MB · up to {MAX_FILES} photos</p>
                    <input ref={inputRef} type="file" accept={TYPES.join(',')} multiple className="hidden" onChange={e => addFiles(e.target.files)} />
                </div>

                {/* Camera button */}
                {hasCamera && (
                    <button type="button" onClick={() => setShowCamera(true)}
                        className="w-full flex items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-600 hover:border-primary-800/50 hover:text-primary-800 hover:bg-primary-50/20 transition-all">
                        <Camera className="h-4 w-4" /> Take Photo with Camera
                    </button>
                )}

                {/* Preview grid */}
                {files.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {files.map((f, i) => (
                            <div key={i} className="relative group rounded-xl overflow-hidden aspect-square border-2 border-slate-100 ">
                                <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-start justify-between p-1">
                                    <button type="button"
                                        className="h-5 w-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={e => { e.stopPropagation(); setLightbox(URL.createObjectURL(f)) }}>
                                        <ZoomIn className="h-3 w-3" />
                                    </button>
                                    <button type="button"
                                        className="h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={e => { e.stopPropagation(); onChange(files.filter((_, j) => j !== i)) }}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                                {i === 0 && <div className="absolute bottom-1 left-1 bg-primary-800 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">COVER</div>}
                            </div>
                        ))}
                        {files.length < MAX_FILES && (
                            <button type="button" onClick={() => inputRef.current?.click()}
                                className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-primary-800/40 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-primary-800 transition-colors">
                                <ImageIcon className="h-5 w-5" /><span className="text-[9px] font-bold">ADD</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {showCamera && <CameraModal onCapture={handleCapture} onClose={() => setShowCamera(false)} />}

            {/* Lightbox */}
            {lightbox && (
                <div className="fixed inset-0 z-[9998] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
                    <img src={lightbox} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
                    <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10">
                        <X className="h-6 w-6" />
                    </button>
                </div>
            )}
        </>
    )
}

/* ── Location section with geolocation ─────────────────────── */
function LocationSection({ form, setForm }) {
    const [geoLoading, setGeoLoading] = useState(false)
    const [geoError, setGeoError] = useState('')
    const [pinLoading, setPinLoading] = useState(false)
    const s = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const setCoordinates = async (latitude, longitude, { showSuccess = false } = {}) => {
        setForm(f => ({
            ...f,
            latitude,
            longitude,
            location: formatCoordinates(latitude, longitude),
        }))

        try {
            const derivedLocation = await reverseGeocode(latitude, longitude)
            if (derivedLocation) {
                setForm(f => ({
                    ...f,
                    location: derivedLocation,
                }))
            }
        } catch {
            // Coordinate fallback is already stored above, so the issue still has a derived location.
        }

        if (showSuccess) notify.success('Location detected!')
    }

    const detectLocation = () => {
        if (!navigator.geolocation) { setGeoError('Geolocation not supported'); return }
        setGeoLoading(true); setGeoError('')
        navigator.geolocation.getCurrentPosition(
            async pos => {
                const { latitude, longitude } = pos.coords
                await setCoordinates(latitude, longitude, { showSuccess: true })
                setGeoLoading(false)
            },
            err => {
                setGeoLoading(false)
                const m = { 1: 'Permission denied', 2: 'Location unavailable', 3: 'Request timed out' }
                setGeoError(m[err.code] || 'Could not get location')
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        )
    }

    const handleMapSelect = async (lat, lng) => {
        setPinLoading(true)
        setGeoError('')
        await setCoordinates(lat, lng)
        setPinLoading(false)
    }

    return (
        <div className="space-y-4">
            <h2 className="font-display font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-800 " /> Location & Photos
            </h2>

            {/* Address + detect button */}
            <div className="field">
                <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0">Address / Location <span className="text-red-500">*</span></label>
                    <button type="button" onClick={detectLocation} disabled={geoLoading}
                        className={cn('flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 transition-all',
                            geoLoading ? 'text-slate-400 bg-slate-100 ' : 'text-primary-800 bg-primary-50 hover:bg-primary-100 ')}>
                        {geoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Locate className="h-3.5 w-3.5" />}
                        {geoLoading ? 'Detecting...' : 'Use My Location'}
                    </button>
                </div>
                <input className="input" placeholder="e.g. Main Road, Ward 7, near bus stand"
                    value={form.location} onChange={e => s('location', e.target.value)} maxLength={200} />
                {geoError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{geoError}</p>}
            </div>

            {/* Pinned coordinates */}
            {hasCoordinates(form.latitude, form.longitude) && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs text-emerald-700 font-medium flex-1 font-mono">
                        {formatCoordinates(form.latitude, form.longitude)}
                    </span>
                    <button type="button" className="text-xs text-slate-400 hover:text-red-500 font-medium"
                        onClick={() => { s('latitude', null); s('longitude', null) }}>Remove</button>
                </div>
            )}

            {/* Map picker */}
            <div className="field">
                <label className="label">Pin on Map <span className="text-slate-400 text-xs font-normal">(click to place pin)</span></label>
                <LocationPicker latitude={form.latitude} longitude={form.longitude}
                    onSelect={handleMapSelect} />
                {pinLoading && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Deriving location from pinned coordinates...</p>}
            </div>

            {/* Photos */}
            <div className="field">
                <label className="label">Photos <span className="text-slate-400 text-xs font-normal">(up to {MAX_FILES}, max {MAX_MB}MB each)</span></label>
                <PhotoUploader files={form.files} onChange={files => setForm(f => ({ ...f, files }))} />
            </div>
        </div>
    )
}

/* ── Review section ─────────────────────────────────────────── */
function ReviewSection({ form }) {
    const rows = [
        { k: 'Title', v: form.title },
        { k: 'Category', v: form.category },
        { k: 'Location', v: form.location },
        { k: 'Coordinates', v: hasCoordinates(form.latitude, form.longitude) ? formatCoordinates(form.latitude, form.longitude) : 'Not pinned' },
        { k: 'Photos', v: form.files?.length ? `${form.files.length} photo(s)` : 'None' },
    ]
    return (
        <div className="space-y-5">
            <h2 className="font-display font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary-800 " /> Review & Submit
            </h2>
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
                {rows.map(({ k, v }, i) => (
                    <div key={k} className={`flex gap-4 px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-slate-50 ' : 'bg-white '}`}>
                        <span className="font-semibold text-slate-500 w-28 flex-shrink-0">{k}</span>
                        <span className={cn('flex-1', !v || v === 'Not pinned' || v === 'None' ? 'text-slate-400 italic' : 'text-slate-800 ')}>{v || '—'}</span>
                    </div>
                ))}
            </div>
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 ">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</p>
                </div>
                <div className="px-4 py-3 bg-white ">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{form.description}</p>
                </div>
            </div>
            {form.files?.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Photos ({form.files.length})</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {form.files.map((f, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 ">
                                <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                                {i === 0 && <div className="absolute bottom-1 left-1 bg-primary-800 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">COVER</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="rounded-2xl bg-primary-50 border border-primary-100 p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-800 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary-900 ">Ready to submit</p>
                    <div className="mt-1"><StatusBadge status="new" /></div>
                </div>
                <p className="text-xs text-primary-700 hidden sm:block">Authorities will be notified automatically</p>
            </div>
        </div>
    )
}

/* ── Vertical step indicator ────────────────────────────────── */
const STEPS = [
    { label: 'Issue Details', icon: FileText, desc: 'Title, category, description' },
    { label: 'Location', icon: MapPin, desc: 'Address, map pin, photos' },
    { label: 'Review', icon: CheckCircle, desc: 'Confirm and submit' },
]

/* ── Main page ──────────────────────────────────────────────── */
export default function CreateIssue() {
    const nav = useNavigate()
    const [step, setStep] = useState(0)
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState('')
    const [form, setForm] = useState({ title: '', description: '', category: '', location: '', latitude: null, longitude: null, files: [] })

    const validate = () => {
        setErr('')
        if (step === 0) {
            if (form.title.trim().length < 5) { setErr('Title must be at least 5 characters'); return false }
            if (!form.category) { setErr('Please select a category'); return false }
            if (form.description.trim().length < 10) { setErr('Description must be at least 10 characters'); return false }
        }
        if (step === 1) {
            if (!hasCoordinates(form.latitude, form.longitude)) { setErr('Please pin the issue on the map or use your current location'); return false }
            if (form.location.trim().length < 2) { setErr('Please wait for the location to derive from the pinned coordinates'); return false }
        }
        return true
    }

    const next = () => { if (validate()) setStep(p => p + 1) }
    const back = () => { setErr(''); setStep(p => p - 1) }

    const submit = async () => {
        setBusy(true); setErr('')
        try {
            const body = {
                title: form.title,
                description: form.description,
                category: form.category,
                location: form.location,
                latitude: Number(form.latitude),
                longitude: Number(form.longitude),
            }
            const res = await issuesApi.create(body)
            const id = res.data.data._id
            if (form.files.length) {
                const fd = new FormData()
                form.files.forEach(f => fd.append('images', f))
                await issuesApi.uploadImages(id, fd).catch(() => null)
            }
            notify.success('Issue reported successfully!')
            nav(`/issues/${id}`)
        } catch (e) { setErr(getErr(e)); setBusy(false) }
    }

    const TIPS = [
        ['Be specific', 'Include the exact street name, landmark, or ward number so authorities can locate it.'],
        ['Add photos', 'Issues with photos are resolved 3x faster. Capture clear, well-lit images.'],
        ['Describe severity', 'Mention if it\'s a safety hazard, how long it has existed, or if it worsens.'],
        ['Pin on map', 'Drop a pin on the map for precise GPS coordinates — much faster than addresses alone.'],
    ]

    return (
        <div className="max-w-4xl mx-auto page-wrap">
            {/* Page header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary-800 mb-3 shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                </div>
                <h1 className="page-title">Report a Civic Issue</h1>
                <p className="page-sub">Document problems clearly so authorities can act faster</p>
            </div>

            <div className="flex gap-5 items-start">
                {/* Vertical step indicator */}
                <div className="hidden sm:flex flex-col gap-0 flex-shrink-0 pt-7">
                    {STEPS.map((st, i) => (
                        <div key={st.label} className="flex flex-col items-center">
                            <button type="button"
                                onClick={() => i < step && setStep(i)}
                                className={cn(
                                    'h-9 w-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all',
                                    i < step ? 'bg-primary-800 border-primary-800 text-white cursor-pointer hover:opacity-90' :
                                        i === step ? 'border-primary-800 text-primary-800 bg-primary-50 ' :
                                            'border-slate-200 text-slate-400 bg-white cursor-default'
                                )}>
                                {i < step ? '✓' : <st.icon className="h-4 w-4" />}
                            </button>
                            {/* Step label */}
                            <div className={cn('text-center mt-1 mb-1', i === step ? 'opacity-100' : 'opacity-50')}>
                                <p className={cn('text-[10px] font-bold whitespace-nowrap', i === step ? 'text-primary-800 ' : 'text-slate-500 ')}>{st.label}</p>
                            </div>
                            {/* Connector line */}
                            {i < STEPS.length - 1 && (
                                <div className={cn('w-0.5 h-8 rounded-full', i < step ? 'bg-primary-800' : 'bg-slate-200 ')} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form card */}
                <div className="flex-1 min-w-0 card p-5 sm:p-7 shadow-sm">
                    {/* Mobile step bar */}
                    <div className="flex items-center mb-5 sm:hidden">
                        {STEPS.map((st, i) => (
                            <div key={st.label} className="flex items-center flex-1">
                                <div className={cn('h-7 w-7 rounded-full flex items-center justify-center border-2 text-[10px] font-bold',
                                    i < step ? 'bg-primary-800 border-primary-800 text-white' : i === step ? 'border-primary-800 text-primary-800 bg-primary-50 ' : 'border-slate-200 text-slate-400')}>
                                    {i < step ? '✓' : i + 1}
                                </div>
                                {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 mx-1', i < step ? 'bg-primary-800' : 'bg-slate-200 ')} />}
                            </div>
                        ))}
                    </div>

                    {err && <div className="mb-4"><ErrorAlert message={err} /></div>}

                    {step === 0 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary-800 " /> Issue Details
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Describe the problem clearly and specifically</p>
                            </div>
                            <div className="field">
                                <label className="label">Title <span className="text-red-500">*</span></label>
                                <input className="input" placeholder="e.g. Deep pothole on Main Road near City Hospital"
                                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={140} />
                                <div className="flex justify-between mt-1">
                                    <span className="text-xs text-slate-400 ">Be specific — include street or landmark</span>
                                    <span className="text-xs text-slate-400 ">{form.title.length}/140</span>
                                </div>
                            </div>
                            <div className="field">
                                <label className="label">Category <span className="text-red-500">*</span></label>
                                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                    <option value="">Select issue type...</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <label className="label">Description <span className="text-red-500">*</span></label>
                                <textarea className="input resize-none" rows={6}
                                    placeholder={'Describe the issue in detail:\n• What is the exact problem?\n• How long has it existed?\n• Any safety risks?\n• Has it been reported before?'}
                                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={2000} />
                                <div className="flex justify-between mt-1">
                                    <span className="text-xs text-slate-400 ">More detail = faster resolution</span>
                                    <span className="text-xs text-slate-400 ">{form.description.length}/2000</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1 && <LocationSection form={form} setForm={setForm} />}
                    {step === 2 && <ReviewSection form={form} />}

                    <div className="flex justify-between mt-7 pt-5 border-t border-slate-100 ">
                        <button className="btn-ghost btn" onClick={back} disabled={step === 0}>← Back</button>
                        {step < 2
                            ? <button className="btn-primary btn px-6" onClick={next}>Continue →</button>
                            : <button className="btn-primary btn px-8" onClick={submit} disabled={busy}>
                                {busy ? <><Spinner size="sm" /> Submitting...</> : 'Submit Issue'}
                            </button>
                        }
                    </div>
                </div>

                {/* Tips panel */}
                <aside className="hidden lg:flex flex-col gap-3 w-52 flex-shrink-0 pt-7">
                    <div className="card p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                            Tips for a good report
                        </p>
                        <div className="space-y-3">
                            {TIPS.map(([title, body]) => (
                                <div key={title} className="flex items-start gap-2">
                                    <span className="h-4 w-4 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center flex-shrink-0 text-[8px] font-bold mt-0.5">✓</span>
                                    <div>
                                        <p className="text-[11px] font-semibold text-slate-700 ">{title}</p>
                                        <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-4 bg-primary-50 border-primary-100 ">
                        <p className="text-xs font-bold text-primary-800 uppercase tracking-wide mb-2">Step {step + 1} of 3</p>
                        <p className="text-xs text-primary-700 leading-relaxed">
                            {step === 0 && 'Describe the issue clearly. Good titles and descriptions lead to faster resolutions.'}
                            {step === 1 && 'Help authorities find the problem. A pinned location is much more accurate than an address alone.'}
                            {step === 2 && "You're almost done! Review your report before submitting."}
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    )
}
