'use client';

import { saveProfile } from '@/app/actions/profile';
import Header from '@/components/Header';
import {
  getProfilePhotoPath,
  isAllowedProfilePhotoType,
  PROFILE_PHOTO_BUCKET,
  validateProfilePhoto,
} from '@/lib/profile-photo';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types/profile';
import { THINGS_I_ENJOY_OPTIONS } from '@/lib/types/profile-answers';
import Link from 'next/link';
import { useState } from 'react';

type ProfileFormProps = {
  profile: Profile | null;
};

const inputClassName =
  'w-full px-6 py-4 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/20 text-lg';

const labelClassName = 'block text-sm font-medium text-[#0B2D5C] mb-2';

function getInitials(name: string | null | undefined): string {
  if (!name) {
    return 'F';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'F';
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(profile?.profile_photo_url ?? null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    let succeeded = false;

    try {
      const formData = new FormData(event.currentTarget);
      let uploadedPhotoUrl: string | null = null;

      if (selectedPhotoFile) {
        const validationError = validateProfilePhoto(selectedPhotoFile);
        if (validationError) {
          throw new Error(validationError);
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('You must be signed in to upload a profile photo.');
        }

        if (!isAllowedProfilePhotoType(selectedPhotoFile.type)) {
          throw new Error('Please upload a JPG, PNG, WEBP, or GIF image.');
        }

        const filePath = getProfilePhotoPath(user.id, selectedPhotoFile.type);
        const { error: uploadError } = await supabase.storage
          .from(PROFILE_PHOTO_BUCKET)
          .upload(filePath, selectedPhotoFile, {
            upsert: true,
            contentType: selectedPhotoFile.type,
          });

        if (uploadError) {
          throw new Error(`Could not upload your profile photo: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(filePath);

        uploadedPhotoUrl = publicUrl;
        formData.set('profile_photo_url', publicUrl);
        formData.set('profile_photo_storage_path', filePath);
      }

      const result = await saveProfile(formData);

      if (!result.success) {
        if (uploadedPhotoUrl) {
          throw new Error(
            `Your photo was uploaded, but we could not save your profile: ${result.message}`
          );
        }
        throw new Error(result.message);
      }

      setSelectedPhotoFile(null);
      setMessage(result.message);
      succeeded = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      setMessage(errorMessage);
    } finally {
      setStatus(succeeded ? 'success' : 'error');
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateProfilePhoto(file);
    if (validationError) {
      setStatus('error');
      setMessage(validationError);
      event.target.value = '';
      return;
    }

    setSelectedPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setStatus('idle');
    setMessage('');
  };

  const initials = getInitials(profile?.full_name);

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <main className="pt-16 pb-20 max-w-2xl mx-auto px-5 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-wide text-[#D62828] font-semibold mb-4">
            Your Profile
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0B2D5C] mb-4">
            {profile ? 'Update Your Profile' : 'Create Your Profile'}
          </h1>
          <p className="text-lg text-[#444444] leading-relaxed">
            Share the basics that help Forge understand who you are and what you are looking for.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-[#0B2D5C]/10 rounded-3xl p-7 sm:p-10 shadow-sm">
          <div className="text-center">
            <label htmlFor="profile_photo" className={labelClassName}>
              Profile photo
            </label>

            <div className="flex flex-col items-center gap-4 mb-2">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile photo preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#F8F6F2] shadow-md"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-[#0B2D5C]/10 border-4 border-[#F8F6F2] shadow-md flex items-center justify-center">
                  <span className="text-3xl font-bold text-[#0B2D5C]">{initials}</span>
                </div>
              )}

              <input
                id="profile_photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhotoChange}
                className="block w-full max-w-sm text-sm text-[#444444] file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:bg-[#0B2D5C] file:text-white file:font-semibold hover:file:bg-[#0A2540]"
              />
            </div>

            <p className="text-sm text-[#666666]">
              JPG, PNG, WEBP, or GIF. Max 5 MB.
            </p>
          </div>

          <div>
            <label htmlFor="full_name" className={labelClassName}>
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              defaultValue={profile?.full_name ?? ''}
              required
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="age" className={labelClassName}>
              Age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min={18}
              max={120}
              defaultValue={profile?.age ?? ''}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="location" className={labelClassName}>
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              defaultValue={profile?.location ?? ''}
              placeholder="City, State"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="relationship_goal" className={labelClassName}>
              Relationship goal
            </label>
            <select
              id="relationship_goal"
              name="relationship_goal"
              defaultValue={profile?.relationship_goal ?? ''}
              className={inputClassName}
            >
              <option value="">Select one</option>
              <option value="Marriage">Marriage</option>
              <option value="Serious relationship">Serious relationship</option>
              <option value="Intentional dating">Intentional dating</option>
              <option value="Getting to know someone">Getting to know someone</option>
            </select>
          </div>

          <div>
            <label htmlFor="faith_importance" className={labelClassName}>
              Faith importance
            </label>
            <select
              id="faith_importance"
              name="faith_importance"
              defaultValue={profile?.faith_importance ?? ''}
              className={inputClassName}
            >
              <option value="">Select one</option>
              <option value="Very important">Very important</option>
              <option value="Important">Important</option>
              <option value="Somewhat important">Somewhat important</option>
              <option value="Not important">Not important</option>
            </select>
          </div>

          <div>
            <label htmlFor="service_background" className={labelClassName}>
              Service background
            </label>
            <input
              id="service_background"
              name="service_background"
              type="text"
              defaultValue={profile?.service_background ?? ''}
              placeholder="Military, first responder, healthcare, volunteer, etc."
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="short_bio" className={labelClassName}>
              Short bio
            </label>
            <textarea
              id="short_bio"
              name="short_bio"
              rows={4}
              defaultValue={profile?.short_bio ?? ''}
              placeholder="A few sentences about you and what matters to you."
              className={`${inputClassName} resize-y min-h-[120px]`}
            />
          </div>

          <div>
            <label htmlFor="more_about" className={labelClassName}>
              More about
            </label>
            <textarea
              id="more_about"
              name="more_about"
              rows={4}
              defaultValue={profile?.more_about ?? ''}
              placeholder="Share more about yourself."
              className={`${inputClassName} resize-y min-h-[120px]`}
            />
          </div>

          <div>
            <label htmlFor="children" className={labelClassName}>
              Children
            </label>
            <input
              id="children"
              name="children"
              type="text"
              defaultValue={profile?.children ?? ''}
              placeholder="Wants children"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="has_children" className={labelClassName}>
              Has children
            </label>
            <input
              id="has_children"
              name="has_children"
              type="text"
              defaultValue={profile?.has_children ?? ''}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="education" className={labelClassName}>
              Education
            </label>
            <input
              id="education"
              name="education"
              type="text"
              defaultValue={profile?.education ?? ''}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="pets" className={labelClassName}>
              Pets
            </label>
            <input
              id="pets"
              name="pets"
              type="text"
              defaultValue={profile?.pets ?? ''}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="smoking" className={labelClassName}>
              Smoking
            </label>
            <input
              id="smoking"
              name="smoking"
              type="text"
              defaultValue={profile?.smoking ?? ''}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="drinking" className={labelClassName}>
              Drinking
            </label>
            <input
              id="drinking"
              name="drinking"
              type="text"
              defaultValue={profile?.drinking ?? ''}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="career" className={labelClassName}>
              Career
            </label>
            <input
              id="career"
              name="career"
              type="text"
              defaultValue={profile?.career ?? ''}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="relocation" className={labelClassName}>
              Relocation
            </label>
            <input
              id="relocation"
              name="relocation"
              type="text"
              defaultValue={profile?.relocation ?? ''}
              className={inputClassName}
            />
          </div>

          <fieldset>
            <legend className={labelClassName}>Things I Enjoy</legend>
            <div className="space-y-3">
              {THINGS_I_ENJOY_OPTIONS.map((label) => (
                <label key={label} className="flex items-center gap-3 text-[#222222]">
                  <input
                    type="checkbox"
                    name="things_i_enjoy"
                    value={label}
                    defaultChecked={profile?.things_i_enjoy?.includes(label) ?? false}
                    className="h-5 w-5 rounded border-[#0B2D5C]/30 text-[#0B2D5C] focus:ring-[#0B2D5C]/20"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="favorite_music_artists" className={labelClassName}>
              Favorite music artists
            </label>
            <textarea
              id="favorite_music_artists"
              name="favorite_music_artists"
              rows={4}
              defaultValue={(profile?.favorite_music_artists ?? []).join('\n')}
              placeholder="One artist per line"
              className={`${inputClassName} resize-y min-h-[120px]`}
            />
          </div>

          <div>
            <label htmlFor="favorite_music_songs" className={labelClassName}>
              Favorite music songs
            </label>
            <textarea
              id="favorite_music_songs"
              name="favorite_music_songs"
              rows={4}
              defaultValue={(profile?.favorite_music_songs ?? []).join('\n')}
              placeholder="One song per line"
              className={`${inputClassName} resize-y min-h-[120px]`}
            />
          </div>

          {status === 'success' && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-2xl px-4 py-3" role="status">
              {message}
            </p>
          )}

          {status === 'error' && (
            <p className="text-sm text-red-600" role="alert">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-[#D62828] hover:bg-[#A61F1F] disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-lg transition"
          >
            {status === 'loading' ? 'Saving...' : profile ? 'Save profile' : 'Create profile'}
          </button>
        </form>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          {profile?.full_name && (
            <Link
              href="/profile/preview"
              className="inline-block bg-[#0B2D5C] hover:bg-[#0A2540] text-white px-6 py-3 rounded-2xl font-semibold transition"
            >
              Preview Profile
            </Link>
          )}
          <Link href="/app" className="text-[#0B2D5C] hover:text-[#D62828] font-medium transition py-2">
            ← Back to App
          </Link>
        </div>
      </main>
    </div>
  );
}
