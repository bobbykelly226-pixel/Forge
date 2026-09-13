'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  PROFILE_PHOTO_CROP_ASPECT,
  type CropRect,
  type LoadedProfileImage,
  calmProfilePhotoError,
  centeredCropRect,
  clampCropRect,
  panCropRect,
  processCroppedProfilePhoto,
  zoomCropRect,
} from '@/lib/profile/image-processing';

export type ProfilePhotoCropDialogProps = {
  image: LoadedProfileImage;
  fileName: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
  onChooseFile: (file: File) => void;
  loading?: boolean;
  selectionError?: string | null;
};

/**
 * Lightweight portrait crop / position step before upload.
 * Consistent 3:4 crop for primary and additional photos — matches public layout.
 */
export default function ProfilePhotoCropDialog({
  image,
  fileName,
  onCancel,
  onConfirm,
  onChooseFile,
  loading = false,
  selectionError = null,
}: ProfilePhotoCropDialogProps) {
  const baseCrop = useMemo(
    () => centeredCropRect(image.width, image.height, PROFILE_PHOTO_CROP_ASPECT),
    [image.height, image.width]
  );
  const [zoom, setZoom] = useState(1);
  const [fitEntirePhoto, setFitEntirePhoto] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const chooseRef = useRef<HTMLInputElement>(null);
  const controlsDisabled = busy || loading;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  const crop: CropRect = useMemo(() => {
    const zoomed = zoomCropRect(baseCrop, zoom);
    return clampCropRect(
      panCropRect(zoomed, offset.x, offset.y, image.width, image.height),
      image.width,
      image.height
    );
  }, [baseCrop, image.height, image.width, offset.x, offset.y, zoom]);

  useEffect(() => {
    return () => {
      image.bitmap.close();
      URL.revokeObjectURL(image.objectUrl);
    };
  }, [image]);

  const previewBackground = useMemo(() => {
    const sizePct = (image.width / crop.width) * 100;
    const maxX = Math.max(image.width - crop.width, 1);
    const maxY = Math.max(image.height - crop.height, 1);
    const posX = (crop.x / maxX) * 100;
    const posY = (crop.y / maxY) * 100;
    return {
      backgroundImage: `url(${image.objectUrl})`,
      backgroundSize: `${sizePct}% auto`,
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: 'no-repeat',
    } as const;
  }, [crop.height, crop.width, crop.x, crop.y, image.height, image.objectUrl, image.width]);

  const pointerDistance = () => {
    const points = [...pointers.current.values()];
    return points.length === 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0;
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (fitEntirePhoto || controlsDisabled || pointers.current.size >= 2) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) pinch.current = { distance: pointerDistance(), zoom };
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (fitEntirePhoto || controlsDisabled || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      setZoom(Math.max(1, Math.min(3, pinch.current.zoom * pointerDistance() / Math.max(1, pinch.current.distance))));
      return;
    }
    if (!dragRef.current || !frameRef.current) return;
    const frame = frameRef.current.getBoundingClientRect();
    const dxPx = event.clientX - dragRef.current.x;
    const dyPx = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    const scale = crop.width / Math.max(frame.width, 1);
    setOffset((current) => ({
      x: current.x - dxPx * scale,
      y: current.y - dyPx * scale,
    }));
  };

  const onPointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
    pinch.current = null;
    dragRef.current = [...pointers.current.values()][0] ?? null;
  };

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await processCroppedProfilePhoto({
        source: image.bitmap,
        crop: fitEntirePhoto ? { x: 0, y: 0, width: image.width, height: image.height } : crop,
        fitEntirePhoto,
        fileName,
      });
      onConfirm(result.file);
    } catch (err) {
      setError(calmProfilePhotoError(err));
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        if (!controlsDisabled) onCancel();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-md overflow-hidden rounded-[1.75rem] border-0 bg-white p-0 text-[#0B2D5C] shadow-xl backdrop:bg-[#0B2D5C]/45"
      aria-modal="true"
      aria-labelledby="photo-crop-title"
      data-testid="profile-photo-crop-dialog"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="shrink-0 border-b border-[#0B2D5C]/08 px-5 py-3">
          <h2
            ref={titleRef}
            tabIndex={-1}
            id="photo-crop-title"
            className="text-lg text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Position your photo
          </h2>
          <p className="mt-1 text-sm text-[#5A6575]">
            Fit the whole photo or fill the frame. In Fill mode, drag and pinch to adjust.
          </p>
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
          <div className="grid grid-cols-2 gap-2" aria-label="Photo framing">
            {[{ fit: true, label: 'Fit entire photo' }, { fit: false, label: 'Fill frame' }].map((mode) => (
              <button key={mode.label} type="button" aria-pressed={fitEntirePhoto === mode.fit}
                disabled={controlsDisabled}
                onClick={() => { setFitEntirePhoto(mode.fit); setZoom(1); setOffset({ x: 0, y: 0 }); pointers.current.clear(); pinch.current = null; dragRef.current = null; }}
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold ${fitEntirePhoto === mode.fit ? 'bg-[#0B2D5C] text-white' : 'bg-white text-[#0B2D5C]'}`}>
                {mode.label}
              </button>
            ))}
          </div>
          <div
            ref={frameRef}
            className="relative mx-auto aspect-[3/4] w-full max-w-[min(18rem,33dvh)] touch-none overflow-hidden rounded-[1.5rem] bg-[#0B2D5C]/10"
            style={fitEntirePhoto ? { backgroundImage: `url(${image.objectUrl})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundColor: '#FFFFFF' } : previewBackground}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onLostPointerCapture={onPointerUp}
            role="img"
            aria-label="Crop preview"
          />

          {fitEntirePhoto ? <p className="text-sm text-[#5A6575]">Your whole photo is included. White space fills any gaps.</p> : null}
          <label className="block text-sm font-medium text-[#0B2D5C]">
            Zoom
            <input
              type="range"
              disabled={fitEntirePhoto || controlsDisabled}
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="mt-2 w-full accent-[#0B2D5C]"
              aria-valuemin={1}
              aria-valuemax={3}
              aria-valuenow={Number(zoom.toFixed(2))}
            />
          </label>

          {error || selectionError ? (
            <p className="text-sm text-red-600" role="alert">
              {error || selectionError}
            </p>
          ) : null}
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-[#0B2D5C]/08 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <input
            ref={chooseRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
            className="hidden"
            disabled={controlsDisabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) onChooseFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => chooseRef.current?.click()}
            disabled={controlsDisabled}
            className="col-span-2 min-h-11 rounded-2xl border border-[#0B2D5C]/20 px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? 'Loading photo…' : 'Choose another photo'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={controlsDisabled}
            className="rounded-2xl border border-[#0B2D5C]/20 bg-white px-5 py-3 text-sm font-semibold text-[#0B2D5C] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={controlsDisabled}
            className="rounded-2xl bg-[#0B2D5C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2540] disabled:bg-gray-400"
          >
            {busy ? 'Preparing…' : 'Confirm photo'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
