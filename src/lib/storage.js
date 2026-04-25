'use client'
import { createClient } from './supabase/client'
 
const VIDEOS = process.env.NEXT_PUBLIC_STORAGE_BUCKET_VIDEOS || 'novara-videos'
const IMAGES = process.env.NEXT_PUBLIC_STORAGE_BUCKET_IMAGES || 'novara-images'
 
export const uploadProductImage = async (file, vendorId) => {
  const supabase = createClient()
  const path     = `${vendorId}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from(IMAGES).upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from(IMAGES).getPublicUrl(path)
  return data.publicUrl
}
 
export const uploadVideo = async (file, vendorId, onProgress) => {
  const supabase = createClient()
  const path     = `${vendorId}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from(VIDEOS).upload(path, file, {
    onUploadProgress: (p) => onProgress?.(Math.round((p.loaded / p.total) * 100)),
  })
  if (error) throw error
  const { data } = supabase.storage.from(VIDEOS).getPublicUrl(path)
  return data.publicUrl
}
