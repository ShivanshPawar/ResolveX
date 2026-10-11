import { useState, useRef } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { Spinner } from '../ui/index'
import { issuesApi } from '../../api/index'
import { getErr } from '../../utils/helpers'
import { toast } from 'react-toastify'

const MAX = 5,
  MB = 5
const TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/* Pre-upload local-preview (CreateIssue wizard) */
export function ImagePreviewUploader({ files, onChange }) {
  const ref = useRef()
  const add = (newFiles) => {
    const valid = Array.from(newFiles).filter((f) => {
      if (!TYPES.includes(f.type)) {
        toast.error(`${f.name}: unsupported type`)
        return false
      }
      if (f.size > MB * 1024 * 1024) {
        toast.error(`${f.name}: exceeds ${MB}MB`)
        return false
      }
      return true
    })
    onChange([...files, ...valid].slice(0, MAX))
  }
  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-primary-800/40 hover:bg-primary-50/20 transition-colors cursor-pointer"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          add(e.dataTransfer.files)
        }}
      >
        <ImageIcon className="mx-auto h-7 w-7 text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-primary-800">Click to upload</span> or drag & drop
        </p>
        <p className="text-xs text-slate-400 mt-1">
          JPEG · PNG · WebP — max {MB}MB each, up to {MAX} photos
        </p>
        <input
          ref={ref}
          type="file"
          accept={TYPES.join(',')}
          multiple
          className="hidden"
          onChange={(e) => add(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {files.map((f, i) => (
            <div
              key={i}
              className="relative group rounded-lg overflow-hidden aspect-square border border-slate-200"
            >
              <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
              >
                <X className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* Post-upload manager on existing issue */
export function IssueImageManager({ issue, canEdit, onUpdate }) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const ref = useRef()

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const fd = new FormData()
    files.forEach((f) => fd.append('images', f))
    setUploading(true)
    try {
      const res = await issuesApi.uploadImages(issue._id, fd)
      toast.success(`${res.data.data.length} image(s) uploaded`)
      onUpdate()
    } catch (err) {
      toast.error(getErr(err))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (fileId) => {
    setDeleting(fileId)
    try {
      await issuesApi.deleteImage(issue._id, fileId)
      toast.success('Photo removed')
      onUpdate()
    } catch (err) {
      toast.error(getErr(err))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-3">
      {issue.images?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {issue.images.map((img) => (
            <div
              key={img.fileId}
              className="relative group rounded-xl overflow-hidden aspect-video border border-slate-100"
            >
              <a href={img.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={img.thumbnailUrl || img.url}
                  alt=""
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </a>
              {canEdit && (
                <button
                  className="absolute top-1.5 right-1.5 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  onClick={() => handleDelete(img.fileId)}
                  disabled={deleting === img.fileId}
                >
                  {deleting === img.fileId ? <Spinner size="sm" /> : <X className="h-3 w-3" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {canEdit && issue.images?.length < MAX && (
        <>
          <button
            type="button"
            className="btn-secondary btn btn-sm"
            onClick={() => ref.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Spinner size="sm" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? 'Uploading…' : 'Add Photos'}
          </button>
          <input
            ref={ref}
            type="file"
            accept={TYPES.join(',')}
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </>
      )}
    </div>
  )
}
