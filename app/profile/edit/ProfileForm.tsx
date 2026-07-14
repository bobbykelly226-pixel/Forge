'use client';

import { saveProfile } from '@/app/actions/profile';
import Header from '@/components/Header';
import LocationPicker, {
  type LocationPickerValue,
} from '@/components/profile/LocationPicker';
import {
  ChoiceChips,
  MultiChoiceChips,
} from '@/components/profile/StructuredChoices';
import {
  createUniqueProfilePhotoPath,
  isAllowedProfilePhotoType,
  PROFILE_PHOTO_BUCKET,
  validateProfilePhoto,
} from '@/lib/profile-photo';
import {
  CHILDREN_COUNT_OPTIONS,
  EDUCATION_OPTIONS,
  FAITH_IDENTITY_OPTIONS,
  FAITH_IMPORTANCE_OPTIONS,
  HAS_CHILDREN_OPTIONS,
  OPEN_TO_PARTNER_WITH_CHILDREN_OPTIONS,
  PETS_OPTIONS,
  RELATIONSHIP_GOAL_OPTIONS,
  RELOCATION_OPTIONS,
  SERVICE_BACKGROUND_OPTIONS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  WANTS_CHILDREN_OPTIONS,
} from '@/lib/profile/structured-options';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types/profile';
import { THINGS_I_ENJOY_OPTIONS } from '@/lib/types/profile-answers';
import Link from 'next/link';
import { useState } from 'react';

type PrivateLocationSeed = {
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  location_place_id: string | null;
  location_provider: string | null;
};

type ProfileFormProps = {
  profile: Profile | null;
  privateDetails?: PrivateLocationSeed | null;
};

const inputClassName =
  'w-full px-6 py-4 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/20 text-lg';

const labelClassName = 'block text-sm font-medium text-[#0B2D5C] mb-2';

const sectionClassName =
  'space-y-5 border-t border-[#0B2D5C]/10 pt-8 first:border-t-0 first:pt-0';

function getInitials(name: string | null | undefined): string {
  if (!name) return 'F';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'F';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

function buildInitialLocation(
  profile: Profile | null,
  privateDetails?: PrivateLocationSeed | null
): LocationPickerValue {
  const city = profile?.location_city ?? '';
  const region = profile?.location_region ?? '';
  const label =
    city && region ? `${city}, ${region}` : profile?.location ?? city ?? '';
  return {
    city,
    region,
    country: profile?.location_country ?? (city || region ? 'US' : ''),
    postalCode: privateDetails?.postal_code ?? '',
    latitude:
      privateDetails?.latitude != null ? String(privateDetails.latitude) : '',
    longitude:
      privateDetails?.longitude != null ? String(privateDetails.longitude) : '',
    placeId: privateDetails?.location_place_id ?? '',
    provider: privateDetails?.location_provider ?? '',
    label,
  };
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-bold text-[#0B2D5C]">{title}</h2>
      <p className="mt-2 text-sm text-[#666666] leading-relaxed">{description}</p>
    </div>
  );
}

export default function ProfileForm({ profile, privateDetails }: ProfileFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    profile?.profile_photo_url ?? null
  );
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);

  const [relationshipGoal, setRelationshipGoal] = useState(
    profile?.relationship_goal ?? ''
  );
  const [hasChildren, setHasChildren] = useState(profile?.has_children ?? '');
  const [childrenCount, setChildrenCount] = useState(profile?.children_count ?? '');
  const [wantsChildren, setWantsChildren] = useState(profile?.children ?? '');
  const [openToPartnerChildren, setOpenToPartnerChildren] = useState(
    profile?.open_to_partner_with_children ?? ''
  );
  const [faithIdentity, setFaithIdentity] = useState(profile?.faith_identity ?? '');
  const [faithTradition, setFaithTradition] = useState(profile?.faith_tradition ?? '');
  const [faithOther, setFaithOther] = useState(profile?.faith_other ?? '');
  const [faithImportance, setFaithImportance] = useState(
    profile?.faith_importance ?? ''
  );
  const [smoking, setSmoking] = useState(profile?.smoking ?? '');
  const [drinking, setDrinking] = useState(profile?.drinking ?? '');
  const [education, setEducation] = useState(profile?.education ?? '');
  const [pets, setPets] = useState(profile?.pets ?? '');
  const [relocation, setRelocation] = useState(profile?.relocation ?? '');
  const [serviceBackgrounds, setServiceBackgrounds] = useState<string[]>(
    profile?.service_backgrounds ?? []
  );

  const unmapped = (profile?.unmapped_legacy_fields ?? {}) as Record<string, string>;
  const unmappedEntries = Object.entries(unmapped).filter(
    ([, value]) => typeof value === 'string' && value.trim().length > 0
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'loading') return;

    setStatus('loading');
    setMessage('');

    let succeeded = false;

    try {
      const formData = new FormData(event.currentTarget);

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

        const filePath = createUniqueProfilePhotoPath(user.id, selectedPhotoFile.type);
        const { error: uploadError } = await supabase.storage
          .from(PROFILE_PHOTO_BUCKET)
          .upload(filePath, selectedPhotoFile, {
            upsert: false,
            contentType: selectedPhotoFile.type,
            cacheControl: '3600',
          });

        if (uploadError) {
          throw new Error('Could not upload your profile photo. Please try again.');
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(filePath);

        formData.set('profile_photo_url', publicUrl);
        formData.set('profile_photo_storage_path', filePath);
      }

      const result = await saveProfile(formData);

      if (!result.success) {
        throw new Error(result.message);
      }

      if (result.profilePhotoUrl) {
        setPhotoPreview(result.profilePhotoUrl);
      }

      setSelectedPhotoFile(null);
      setMessage(result.message);
      succeeded = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.';
      setMessage(errorMessage);
    } finally {
      setStatus(succeeded ? 'success' : 'error');
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
  const showChildrenCount = hasChildren === 'yes';
  const showFaithTradition = [
    'christian',
    'catholic',
    'protestant',
    'jewish',
    'muslim',
    'hindu',
    'buddhist',
    'other',
  ].includes(faithIdentity);
  const showFaithOther = faithIdentity === 'other';

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
            Share what you are comfortable sharing. Every field is optional except your name —
            unanswered answers stay unanswered.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 bg-white border border-[#0B2D5C]/10 rounded-3xl p-7 sm:p-10 shadow-sm"
        >
          {unmappedEntries.length > 0 ? (
            <div
              className="rounded-2xl border border-[#0B2D5C]/15 bg-[#F8F6F2] px-5 py-4 text-sm text-[#444444]"
              role="status"
            >
              <p className="font-semibold text-[#0B2D5C] mb-2">
                Some earlier answers need a quick review
              </p>
              <p className="mb-3">
                These saved values could not be matched to the new choices. Your original answers
                were preserved — pick a new option when you are ready.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {unmappedEntries.map(([field, value]) => (
                  <li key={field}>
                    <span className="font-medium capitalize">{field.replaceAll('_', ' ')}</span>: “
                    {value}”
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <section className={sectionClassName}>
            <SectionTitle
              eyebrow="Basics"
              title="Who you are"
              description="A clear name and photo help people recognize you. Everything else can wait."
            />

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
              <p className="text-sm text-[#666666]">JPG, PNG, WEBP, or GIF. Max 5 MB.</p>
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

            <LocationPicker initial={buildInitialLocation(profile, privateDetails)} />
          </section>

          <section className={sectionClassName}>
            <SectionTitle
              eyebrow="Relationship"
              title="What you are looking for"
              description="Use the same Forge relationship goals you see in onboarding."
            />
            <ChoiceChips
              name="relationship_goal"
              legend="Relationship goal"
              options={RELATIONSHIP_GOAL_OPTIONS}
              value={relationshipGoal}
              onChange={setRelationshipGoal}
            />
          </section>

          <section className={sectionClassName}>
            <SectionTitle
              eyebrow="Family"
              title="Children"
              description="Answer only what feels right. Follow-up questions appear when they apply."
            />
            <ChoiceChips
              name="has_children"
              legend="Do you have children?"
              options={HAS_CHILDREN_OPTIONS}
              value={hasChildren}
              onChange={(next) => {
                setHasChildren(next);
                if (next !== 'yes') setChildrenCount('');
              }}
            />
            {showChildrenCount ? (
              <ChoiceChips
                name="children_count"
                legend="How many children?"
                options={CHILDREN_COUNT_OPTIONS}
                value={childrenCount}
                onChange={setChildrenCount}
              />
            ) : (
              <input type="hidden" name="children_count" value="" />
            )}
            <ChoiceChips
              name="children"
              legend="Do you want children?"
              options={WANTS_CHILDREN_OPTIONS}
              value={wantsChildren}
              onChange={setWantsChildren}
            />
            <ChoiceChips
              name="open_to_partner_with_children"
              legend="Are you open to a partner who has children?"
              options={OPEN_TO_PARTNER_WITH_CHILDREN_OPTIONS}
              value={openToPartnerChildren}
              onChange={setOpenToPartnerChildren}
            />
          </section>

          <section className={sectionClassName}>
            <SectionTitle
              eyebrow="Faith"
              title="Faith and religion"
              description="Identity and importance stay separate. Tradition is optional and never assumed."
            />
            <ChoiceChips
              name="faith_identity"
              legend="Faith or religious identity"
              options={FAITH_IDENTITY_OPTIONS}
              value={faithIdentity}
              onChange={(next) => {
                setFaithIdentity(next);
                if (next !== 'other') setFaithOther('');
                if (
                  ![
                    'christian',
                    'catholic',
                    'protestant',
                    'jewish',
                    'muslim',
                    'hindu',
                    'buddhist',
                    'other',
                  ].includes(next)
                ) {
                  setFaithTradition('');
                }
              }}
            />
            {showFaithOther ? (
              <div>
                <label htmlFor="faith_other" className={labelClassName}>
                  Short description
                </label>
                <input
                  id="faith_other"
                  name="faith_other"
                  type="text"
                  maxLength={120}
                  value={faithOther}
                  onChange={(event) => setFaithOther(event.target.value)}
                  placeholder="Optional"
                  className={inputClassName}
                />
              </div>
            ) : (
              <input type="hidden" name="faith_other" value="" />
            )}
            {showFaithTradition ? (
              <div>
                <label htmlFor="faith_tradition" className={labelClassName}>
                  Denomination or tradition
                </label>
                <input
                  id="faith_tradition"
                  name="faith_tradition"
                  type="text"
                  maxLength={120}
                  value={faithTradition}
                  onChange={(event) => setFaithTradition(event.target.value)}
                  placeholder="Optional"
                  className={inputClassName}
                />
              </div>
            ) : (
              <input type="hidden" name="faith_tradition" value="" />
            )}
            <ChoiceChips
              name="faith_importance"
              legend="How important is faith in daily life and relationships?"
              options={FAITH_IMPORTANCE_OPTIONS}
              value={faithImportance}
              onChange={setFaithImportance}
            />
          </section>

          <section className={sectionClassName}>
            <SectionTitle
              eyebrow="Lifestyle"
              title="Everyday details"
              description="Consistent choices help Discovery stay clear without forcing a complete form."
            />
            <ChoiceChips
              name="smoking"
              legend="Smoking"
              options={SMOKING_OPTIONS}
              value={smoking}
              onChange={setSmoking}
            />
            <ChoiceChips
              name="drinking"
              legend="Drinking"
              options={DRINKING_OPTIONS}
              value={drinking}
              onChange={setDrinking}
            />
            <ChoiceChips
              name="education"
              legend="Education"
              options={EDUCATION_OPTIONS}
              value={education}
              onChange={setEducation}
            />
            <ChoiceChips
              name="pets"
              legend="Pets"
              options={PETS_OPTIONS}
              value={pets}
              onChange={setPets}
            />
            <ChoiceChips
              name="relocation"
              legend="Relocation openness"
              options={RELOCATION_OPTIONS}
              value={relocation}
              onChange={setRelocation}
            />
            <div>
              <label htmlFor="career" className={labelClassName}>
                Career
              </label>
              <p className="text-sm text-[#666666] mb-2">What kind of work do you do?</p>
              <input
                id="career"
                name="career"
                type="text"
                maxLength={120}
                defaultValue={profile?.career ?? ''}
                placeholder="Optional free text"
                className={inputClassName}
              />
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionTitle
              eyebrow="Service"
              title="Service background"
              description="Select any that apply. This is never inferred from career."
            />
            <MultiChoiceChips
              name="service_backgrounds"
              legend="Service background"
              options={SERVICE_BACKGROUND_OPTIONS}
              values={serviceBackgrounds}
              onChange={setServiceBackgrounds}
            />
          </section>

          <section className={sectionClassName}>
            <SectionTitle
              eyebrow="About"
              title="Your story"
              description="Write in your own words. Voice and Video introductions remain Coming Soon."
            />
            <div>
              <label htmlFor="short_bio" className={labelClassName}>
                About
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
            <div className="rounded-2xl border border-dashed border-[#0B2D5C]/20 bg-[#F8F6F2] px-5 py-4 text-sm text-[#666666]">
              Voice Introduction and Video Introduction remain Coming Soon and are not part of
              profile completion.
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionTitle
              eyebrow="Interests"
              title="Things I enjoy and music"
              description="These stay as flexible lists — unchanged from the current Forge profile."
            />
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
          </section>

          {status === 'success' && (
            <p
              className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-2xl px-4 py-3"
              role="status"
            >
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
          <Link
            href="/app"
            className="text-[#0B2D5C] hover:text-[#D62828] font-medium transition py-2"
          >
            ← Back to App
          </Link>
        </div>
      </main>
    </div>
  );
}
