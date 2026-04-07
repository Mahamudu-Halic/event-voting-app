'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface ImageUploadProps {
  value: File | string | null | undefined
  onChange: (file: File | null) => void
  error?: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function ImageUpload({ value, onChange, error }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(
    typeof value === 'string' ? value : null
  )
  const [fileError, setFileError] = useState<string>('')

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setFileError('')

      if (rejectedFiles.length > 0) {
        const rejectError = rejectedFiles[0].errors[0]?.message || 'File rejected'
        setFileError(rejectError)
        return
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        
        if (file.size > MAX_FILE_SIZE) {
          setFileError('Image must be less than 5MB')
          return
        }

        onChange(file)
        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)
      }
    },
    [onChange]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  })

  const handleRemove = () => {
    onChange(null)
    setPreview(null)
    setFileError('')
  }

  const displayError = error || fileError

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative w-full aspect-video max-h-[300px] rounded-lg overflow-hidden border-2 border-purple-accent">
          <Image
            src={preview}
            alt="Event preview"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-error/80 hover:bg-error"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'relative w-full aspect-video max-h-[300px] rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer',
            'flex flex-col items-center justify-center gap-3 p-6',
            isDragActive && !isDragReject && 'border-gold-primary bg-gold-primary/10',
            isDragReject && 'border-error bg-error/10',
            !isDragActive && !isDragReject && 'border-purple-accent bg-purple-surface/50 hover:bg-purple-accent/20 hover:border-gold-primary'
          )}
        >
          <input {...getInputProps()} />
          
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
            isDragActive ? 'bg-gold-primary/20' : 'bg-purple-accent/20'
          )}>
            {isDragReject ? (
              <AlertCircle className="h-8 w-8 text-error" />
            ) : (
              <Upload className={cn(
                'h-8 w-8 transition-colors',
                isDragActive ? 'text-gold-primary' : 'text-purple-accent'
              )} />
            )}
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-text-primary">
              {isDragActive && !isDragReject
                ? 'Drop the image here'
                : isDragReject
                ? 'Invalid file type or size'
                : 'Drag & drop an image here'}
            </p>
            <p className="text-xs text-text-secondary">
              or click to browse
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <ImageIcon className="h-4 w-4" />
            <span>JPG, PNG, WebP up to 5MB</span>
          </div>
        </div>
      )}

      {displayError && (
        <p className="text-sm text-error flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {displayError}
        </p>
      )}
    </div>
  )
}
