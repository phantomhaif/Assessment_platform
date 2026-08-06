"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"

const MAX_STAGE_W = 560
const MAX_STAGE_H = 460
const MIN_CROP_SIZE = 48
const OUTPUT_MAX_SIDE = 1200

type CropRect = {
  x: number
  y: number
  w: number
  h: number
}

type DragMode =
  | "move"
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw"

type DragState = {
  mode: DragMode
  startX: number
  startY: number
  startCrop: CropRect
}

interface PhotoCropModalProps {
  file: File | null
  onCancel: () => void
  onCropped: (file: File) => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function normalizeCrop(rect: CropRect, stageW: number, stageH: number): CropRect {
  const w = clamp(rect.w, MIN_CROP_SIZE, stageW)
  const h = clamp(rect.h, MIN_CROP_SIZE, stageH)
  return {
    x: clamp(rect.x, 0, stageW - w),
    y: clamp(rect.y, 0, stageH - h),
    w,
    h,
  }
}

function resizeCrop(mode: DragMode, startCrop: CropRect, dx: number, dy: number, stageW: number, stageH: number) {
  let left = startCrop.x
  let top = startCrop.y
  let right = startCrop.x + startCrop.w
  let bottom = startCrop.y + startCrop.h

  if (mode.includes("w")) left = clamp(left + dx, 0, right - MIN_CROP_SIZE)
  if (mode.includes("e")) right = clamp(right + dx, left + MIN_CROP_SIZE, stageW)
  if (mode.includes("n")) top = clamp(top + dy, 0, bottom - MIN_CROP_SIZE)
  if (mode.includes("s")) bottom = clamp(bottom + dy, top + MIN_CROP_SIZE, stageH)

  return {
    x: left,
    y: top,
    w: right - left,
    h: bottom - top,
  }
}

export function PhotoCropModal({ file, onCancel, onCropped }: PhotoCropModalProps) {
  const { locale } = useI18n()
  const imgRef = useRef<HTMLImageElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef<DragState | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [stage, setStage] = useState({ w: 360, h: 480 })
  const [crop, setCrop] = useState<CropRect>({ x: 45, y: 60, w: 270, h: 360 })
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!file) {
      setImageSrc(null)
      setNatural(null)
      return
    }

    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setNatural(null)
    setCrop({ x: 45, y: 60, w: 270, h: 360 })
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    const naturalW = img.naturalWidth
    const naturalH = img.naturalHeight
    const scale = Math.min(MAX_STAGE_W / naturalW, MAX_STAGE_H / naturalH, 1)
    const stageW = Math.max(260, Math.round(naturalW * scale))
    const stageH = Math.max(260, Math.round(naturalH * scale))
    const defaultCropW = Math.round(stageW * 0.72)
    const defaultCropH = Math.round(stageH * 0.72)

    setNatural({ w: naturalW, h: naturalH })
    setStage({ w: stageW, h: stageH })
    setCrop(normalizeCrop({
      x: Math.round((stageW - defaultCropW) / 2),
      y: Math.round((stageH - defaultCropH) / 2),
      w: defaultCropW,
      h: defaultCropH,
    }, stageW, stageH))
  }

  const beginDrag = (mode: DragMode) => (event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
    dragState.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: crop,
    }
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragState.current) return

    const { mode, startX, startY, startCrop } = dragState.current
    const dx = event.clientX - startX
    const dy = event.clientY - startY

    if (mode === "move") {
      setCrop(normalizeCrop({
        ...startCrop,
        x: startCrop.x + dx,
        y: startCrop.y + dy,
      }, stage.w, stage.h))
      return
    }

    setCrop(resizeCrop(mode, startCrop, dx, dy, stage.w, stage.h))
  }

  const endDrag = () => {
    dragState.current = null
  }

  const handleConfirm = async () => {
    if (!imgRef.current || !natural || !file) return
    setIsProcessing(true)

    try {
      const scaleX = natural.w / stage.w
      const scaleY = natural.h / stage.h
      const sx = Math.round(crop.x * scaleX)
      const sy = Math.round(crop.y * scaleY)
      const sw = Math.round(crop.w * scaleX)
      const sh = Math.round(crop.h * scaleY)
      const outputScale = Math.min(OUTPUT_MAX_SIDE / Math.max(sw, sh), 1)
      const outputW = Math.max(1, Math.round(sw * outputScale))
      const outputH = Math.max(1, Math.round(sh * outputScale))
      const canvas = document.createElement("canvas")
      canvas.width = outputW
      canvas.height = outputH
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("no canvas context")

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, outputW, outputH)
      ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, outputW, outputH)

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((nextBlob) => resolve(nextBlob), "image/jpeg", 0.92)
      )
      if (!blob) throw new Error("crop failed")

      const baseName = file.name.replace(/\.[^.]+$/, "") || "photo"
      onCropped(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }))
    } catch (error) {
      console.error("Error cropping photo:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file || !imageSrc) return null

  const overlayStyle = {
    left: crop.x,
    top: crop.y,
    width: crop.w,
    height: crop.h,
  }

  const handles: { mode: DragMode; className: string; label: string }[] = [
    { mode: "nw", className: "-left-2 -top-2 cursor-nwse-resize", label: "top left" },
    { mode: "n", className: "left-1/2 -top-2 -translate-x-1/2 cursor-ns-resize", label: "top" },
    { mode: "ne", className: "-right-2 -top-2 cursor-nesw-resize", label: "top right" },
    { mode: "e", className: "-right-2 top-1/2 -translate-y-1/2 cursor-ew-resize", label: "right" },
    { mode: "se", className: "-bottom-2 -right-2 cursor-nwse-resize", label: "bottom right" },
    { mode: "s", className: "left-1/2 -bottom-2 -translate-x-1/2 cursor-ns-resize", label: "bottom" },
    { mode: "sw", className: "-bottom-2 -left-2 cursor-nesw-resize", label: "bottom left" },
    { mode: "w", className: "-left-2 top-1/2 -translate-y-1/2 cursor-ew-resize", label: "left" },
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="modal-panel max-h-[96vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl p-5 shadow-xl sm:rounded-2xl sm:p-6">
        <h3 className="mb-1 text-lg font-bold">
          {locale === "ru" ? "Кадрирование фотографии" : "Crop photo"}
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          {locale === "ru"
            ? "Выделите область фото: двигайте рамку или тяните любой угол/грань."
            : "Select the photo area: move the frame or drag any corner/edge."}
        </p>

        <div className="flex justify-center overflow-auto rounded-xl bg-black/40 p-3">
          <div
            ref={stageRef}
            className="relative shrink-0 touch-none select-none overflow-hidden"
            style={{ width: stage.w, height: stage.h }}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt=""
              draggable={false}
              onLoad={handleImageLoad}
              className="absolute inset-0 h-full w-full object-fill"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/45" />
            <div
              className="absolute z-10 cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
              style={overlayStyle}
              onPointerDown={beginDrag("move")}
            >
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <span key={index} className="border border-white/35" />
                ))}
              </div>
              {handles.map((handle) => (
                <button
                  key={handle.mode}
                  type="button"
                  aria-label={`Resize crop ${handle.label}`}
                  className={`absolute z-20 h-4 w-4 rounded-full border-2 border-white bg-[#C41E3A] shadow ${handle.className}`}
                  onPointerDown={beginDrag(handle.mode)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>
            {locale === "ru" ? "Размер области" : "Crop size"}: {Math.round(crop.w)}×{Math.round(crop.h)}
          </span>
          <span>
            {locale === "ru" ? "Файл будет сохранен как JPG" : "The file will be saved as JPG"}
          </span>
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
