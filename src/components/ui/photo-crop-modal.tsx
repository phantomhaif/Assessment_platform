"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"

// Portrait 3:4 frame to match the platform's participant photo requirement.
const ASPECT_W = 3
const ASPECT_H = 4
const FRAME_W = 270
const FRAME_H = (FRAME_W * ASPECT_H) / ASPECT_W
const OUTPUT_W = 900
const OUTPUT_H = (OUTPUT_W * ASPECT_H) / ASPECT_W

interface PhotoCropModalProps {
  file: File | null
  onCancel: () => void
  onCropped: (file: File) => void
}

export function PhotoCropModal({ file, onCancel, onCropped }: PhotoCropModalProps) {
  const { locale } = useI18n()
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragState = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!file) {
      setImageSrc(null)
      setNatural(null)
      return
    }
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setZoom(1)
    setPos({ x: 0, y: 0 })
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Scale that makes the image fully cover the crop frame at zoom = 1.
  const baseScale = natural
    ? Math.max(FRAME_W / natural.w, FRAME_H / natural.h)
    : 1
  const dispW = natural ? natural.w * baseScale * zoom : FRAME_W
  const dispH = natural ? natural.h * baseScale * zoom : FRAME_H

  const clampPos = useCallback(
    (x: number, y: number) => {
      const minX = FRAME_W - dispW
      const minY = FRAME_H - dispH
      return {
        x: Math.min(0, Math.max(minX, x)),
        y: Math.min(0, Math.max(minY, y)),
      }
    },
    [dispW, dispH]
  )

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget
    const w = el.naturalWidth
    const h = el.naturalHeight
    setNatural({ w, h })
    const scale = Math.max(FRAME_W / w, FRAME_H / h)
    setPos({
      x: (FRAME_W - w * scale) / 2,
      y: (FRAME_H - h * scale) / 2,
    })
  }

  useEffect(() => {
    setPos((prev) => clampPos(prev.x, prev.y))
  }, [zoom, clampPos])

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragState.current = { startX: e.clientX, startY: e.clientY, baseX: pos.x, baseY: pos.y }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    setPos(clampPos(dragState.current.baseX + dx, dragState.current.baseY + dy))
  }

  const onPointerUp = () => {
    dragState.current = null
  }

  const handleConfirm = async () => {
    if (!imgRef.current || !natural || !file) return
    setIsProcessing(true)
    try {
      const canvas = document.createElement("canvas")
      canvas.width = OUTPUT_W
      canvas.height = OUTPUT_H
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("no canvas context")

      // Map the visible frame back to natural image pixels.
      const naturalPerDisp = natural.w / dispW
      const sx = -pos.x * naturalPerDisp
      const sy = -pos.y * naturalPerDisp
      const sw = FRAME_W * naturalPerDisp
      const sh = FRAME_H * naturalPerDisp

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, OUTPUT_W, OUTPUT_H)
      ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, OUTPUT_W, OUTPUT_H)

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
      )
      if (!blob) throw new Error("crop failed")

      const baseName = file.name.replace(/\.[^.]+$/, "") || "photo"
      const cropped = new File([blob], `${baseName}.jpg`, { type: "image/jpeg" })
      onCropped(cropped)
    } catch (error) {
      console.error("Error cropping photo:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file || !imageSrc) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="modal-panel w-full max-w-md mx-4 rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-bold mb-1">
          {locale === "ru" ? "Кадрирование фотографии" : "Crop photo"}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {locale === "ru"
            ? "Перетащите фото и используйте ползунок масштаба. Формат 3×4."
            : "Drag the photo and use the zoom slider. 3×4 format."}
        </p>

        <div
          className="relative mx-auto overflow-hidden rounded-xl border border-white/15 bg-black/40 touch-none select-none"
          style={{ width: FRAME_W, height: FRAME_H }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt=""
            draggable={false}
            onLoad={handleImageLoad}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: dispW,
              height: dispH,
              maxWidth: "none",
              cursor: "grab",
            }}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-gray-400">{locale === "ru" ? "Масштаб" : "Zoom"}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-[#C41E3A]"
          />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            {locale === "ru" ? "Отмена" : "Cancel"}
          </Button>
          <Button onClick={handleConfirm} isLoading={isProcessing}>
            {locale === "ru" ? "Сохранить фото" : "Save photo"}
          </Button>
        </div>
      </div>
    </div>
  )
}
