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
}: ProfilePhotoCropDialogProps) {
  const baseCrop = useMemo(
    () => centeredCropRect(image.width, image.height, PROFILE_PHOTO_CROP_ASPECT),
    [image.height, image.width]
  );
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

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

  const onPointerDown = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: React.PointerEvent) => {
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

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await processCroppedProfilePhoto({
        source: image.bitmap,
        crop,
        fileName,
      });
      onConfirm(result.file);
    } catch (err) {
      setError(calmProfilePhotoError(err));
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#0B2D5C]/45 px-3 pb-3 pt-10 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-crop-title"
      data-testid="profile-photo-crop-dialog"
    >
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[1.75rem] bg-[#F8F6F2] shadow-[0_24px_60px_rgba(11,45,92,0.28)]">
        <div className="border-b border-[#0B2D5C]/08 px-5 py-4">
          <h2
            id="photo-crop-title"
            className="text-lg text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Position your photo
          </h2>
          <p className="mt-1 text-sm text-[#5A6575]">
            Drag to reposition. Zoom to frame the moment. We’ll resize it before uploading.
          </p>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div
            ref={frameRef}
            className="relative mx-auto aspect-[3/4] w-full max-w-[18rem] touch-none overflow-hidden rounded-[1.5rem] bg-[#0B2D5C]/10"
            style={previewBackground}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="img"
            aria-label="Crop preview"
          />

          <label className="block text-sm font-medium text-[#0B2D5C]">
            Zoom
            <input
              type="range"
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

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#0B2D5C]/08 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-2xl border border-[#0B2D5C]/20 bg-white px-5 py-3 text-sm font-semibold text-[#0B2D5C] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy}
            className="rounded-2xl bg-[#D62828] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A61F1F] disabled:bg-gray-400"
          >
            {busy ? 'Preparing…' : 'Confirm photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
