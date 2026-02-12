import { useState, useRef, useCallback } from 'react'
import imageCompression from 'browser-image-compression'
import { useTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  shopId: string
}

export function ImageUpload({ value, onChange, shopId }: ImageUploadProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<'idle' | 'compressing' | 'uploading'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  const deleteOldImage = useCallback(async (url: string) => {
    try {
      const path = url.split('/menu-images/')[1]
      if (path) await supabase.storage.from('menu-images').remove([path])
    } catch {}
  }, [])

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return

    try {
      setStatus('compressing')
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: 'image/webp',
      })

      setStatus('uploading')
      const fileName = `${shopId}/${crypto.randomUUID()}.webp`

      const { error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, compressed, { contentType: 'image/webp', upsert: false })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('menu-images').getPublicUrl(fileName)

      if (value) await deleteOldImage(value)
      onChange(publicUrl)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setStatus('idle')
    }
  }, [shopId, value, onChange, deleteOldImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleRemove = useCallback(async () => {
    if (value) await deleteOldImage(value)
    onChange(null)
  }, [value, onChange, deleteOldImage])

  const isLoading = status !== 'idle'
  const statusText = status === 'compressing' ? t('image.compressing') : status === 'uploading' ? t('image.uploading') : ''

  if (value) {
    return (
      <div className="relative inline-block">
        <img src={value} alt="" className="w-32 h-32 rounded-lg object-cover border border-gray-200" />
        <div className="flex gap-1 mt-2">
          <button type="button" onClick={() => inputRef.current?.click()} className="text-xs text-primary-600 hover:underline">
            {t('image.change')}
          </button>
          <span className="text-gray-300">|</span>
          <button type="button" onClick={handleRemove} className="text-xs text-red-500 hover:underline">
            {t('image.remove')}
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => !isLoading && inputRef.current?.click()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
    >
      {isLoading ? (
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="text-sm">{statusText}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
          <span className="text-sm">{t('image.dragDrop')}</span>
          <span className="text-xs text-gray-400">{t('image.maxSize')}</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  )
}
