import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Image, FileSpreadsheet, File, Loader2 } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  selectedFile: File | null
  disabled?: boolean
  isUploading?: boolean
}

const FILE_ICONS: Record<string, typeof FileText> = {
  'application/pdf': FileText,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'application/vnd.ms-excel': FileSpreadsheet,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
  'image/jpeg': Image,
  'image/png': Image,
  'image/gif': Image,
  'image/webp': Image,
  'image/svg+xml': Image,
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'text/plain',
  'text/csv',
]

const MAX_SIZE = 50 * 1024 * 1024 // 50MB

export function FileUpload({ onFileSelect, onFileRemove, selectedFile, disabled, isUploading }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): boolean => {
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('File type not allowed. Please upload PDF, Word, Excel, or image files.')
      return false
    }

    if (file.size > MAX_SIZE) {
      setError('File size exceeds 50MB limit.')
      return false
    }

    return true
  }, [])

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      onFileSelect(file)
    }
  }, [validateFile, onFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [disabled, handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (selectedFile) {
    const Icon = FILE_ICONS[selectedFile.type] || File
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
          <p className="text-xs text-gray-500">{formatSize(selectedFile.size)}</p>
        </div>
        {isUploading ? (
          <Loader2 size={16} className="animate-spin text-violet-500" />
        ) : (
          <button
            type="button"
            onClick={onFileRemove}
            disabled={disabled}
            className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={16} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : isDragOver
              ? 'border-violet-400 bg-violet-50'
              : 'border-gray-300 hover:border-violet-400 hover:bg-gray-50'
        }`}
      >
        <Upload size={24} className={`mb-2 ${isDragOver ? 'text-violet-500' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-600 text-center">
          <span className="font-medium text-violet-600">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Images (max 50MB)</p>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
      />
    </div>
  )
}
