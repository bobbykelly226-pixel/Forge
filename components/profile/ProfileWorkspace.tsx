'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronDown,
  Compass,
  HeartHandshake,
  Mic,
  Music2,
  Sparkles,
  Star,
  TextQuote,
  UserRound,
  Video,
  MapPin,
  type LucideIcon,
} from 'lucide-react';

import { saveProfileSection } from '@/app/actions/profile';
import LocationPicker, {
  type LocationPickerValue,
} from '@/components/profile/LocationPicker';
import ProfilePhotoManager from '@/components/profile/ProfilePhotoManager';
import {
  DrinkingFields,
  PetsFields,
  SmokingFields,
} from '@/components/profile/LifestyleCompatibilityFields';
import {
  ChoiceChips,
  MultiChoiceChips,
} from '@/components/profile/StructuredChoices';
import type { ManagedProfilePhoto } from '@/lib/profile-photo';
import { resolveUnifiedAbout } from '@/lib/profile/unified-about';
import {
  CHILDREN_COUNT_OPTIONS,
  EDUCATION_OPTIONS,
  FAITH_IDENTITY_OPTIONS,
  FAITH_IMPORTANCE_OPTIONS,
  HAS_CHILDREN_OPTIONS,
  OPEN_TO_PARTNER_WITH_CHILDREN_OPTIONS,
  RELATIONSHIP_GOAL_OPTIONS,
  RELOCATION_OPTIONS,
  SERVICE_BACKGROUND_OPTIONS,
  WANTS_CHILDREN_OPTIONS,
} from '@/lib/profile/structured-options';
import {
  PROFILE_SECTIONS,
  checklistItemToSectionId,
  isProfileSectionId,
  summarizeProfileSection,
  type ProfileSectionId,
} from '@/lib/profile/sections';
import {
  calculateProfileCompletionPercent,
  getProfileCompletionSections,
  type ProfileCompletionSectionId,
} from '@/lib/profile-completion';
import type { Profile } from '@/lib/types/profile';
import {
  CORE_VALUES_OPTIONS,
  THINGS_I_ENJOY_OPTIONS,
} from '@/lib/types/profile-answers';

type PrivateLocationSeed = {
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  location_place_id: string | null;
  location_provider: string | null;
};

export type ProfileWorkspaceProps = {
  initialProfile: Profile;
  privateDetails: PrivateLocationSeed | null;
  coreValues: string[];
  hasRelationshipAlignment: boolean;
  hasImportantAlignmentFactors: boolean;
  initialPhotos: ManagedProfilePhoto[];
  initialSection?: string | null;
  onPrimaryPhotoChange?: (url: string | null) => void;
  onCompletionPercentChange?: (percent: number) => void;
};

const inputClassName =
  'w-full px-5 py-3.5 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/20 text-base';

const SECTION_ICONS: Partial<Record<ProfileSectionId, LucideIcon>> = {
  photo: Camera,
  basics: UserRound,
  location: MapPin,
  about: TextQuote,
  relationship: Compass,
  children: HeartHandshake,
  faith: Sparkles,
  enjoy: HeartHandshake,
  music: Music2,
  factors: Star,
  voice: Mic,
  video: Video,
};

function buildInitialLocation(
  profile: Profile,
  privateDetails?: PrivateLocationSeed | null
): LocationPickerValue {
  const city = profile.location_city ?? '';
  const region = profile.location_region ?? '';
  const label =
    city && region ? `${city}, ${region}` : profile.location ?? city ?? '';
  return {
    city,
    region,
    country: profile.location_country ?? (city || region ? 'US' : ''),
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

type SectionStatus = 'idle' | 'editing' | 'saving' | 'saved' | 'error';

export default function ProfileWorkspace({
  initialProfile,
  privateDetails,
  coreValues: initialCoreValues,
  hasRelationshipAlignment,
  hasImportantAlignmentFactors,
  initialPhotos,
  initialSection,
  onPrimaryPhotoChange,
  onCompletionPercentChange,
}: ProfileWorkspaceProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [coreValues, setCoreValues] = useState<string[]>(initialCoreValues);
  const [photos, setPhotos] = useState<ManagedProfilePhoto[]>(initialPhotos);
  const [openSection, setOpenSection] = useState<ProfileSectionId | null>(() =>
    isProfileSectionId(initialSection) ? initialSection : null
  );
  const [sectionStatus, setSectionStatus] = useState<Record<string, SectionStatus>>({});
  const [sectionMessage, setSectionMessage] = useState<Record<string, string>>({});
  const sectionRefs = useRef<Partial<Record<ProfileSectionId, HTMLElement | null>>>({});

  const photoCount = photos.length;
  const completionSections = getProfileCompletionSections({
    profile,
    photoCount,
    hasRelationshipAlignment:
      hasRelationshipAlignment || Boolean(profile.relationship_goal),
    hasImportantAlignmentFactors:
      hasImportantAlignmentFactors || coreValues.length > 0,
  });
  const completionPercent = calculateProfileCompletionPercent(completionSections);
  const showCompletionUi = completionPercent < 100;

  useEffect(() => {
    onCompletionPercentChange?.(completionPercent);
  }, [completionPercent, onCompletionPercentChange]);

  useEffect(() => {
    if (!openSection) return;
    const node = sectionRefs.current[openSection];
    node?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [openSection]);

  const setStatus = (id: ProfileSectionId, status: SectionStatus, message = '') => {
    setSectionStatus((current) => ({ ...current, [id]: status }));
    setSectionMessage((current) => ({ ...current, [id]: message }));
  };

  const openForEdit = (id: ProfileSectionId) => {
    const definition = PROFILE_SECTIONS.find((section) => section.id === id);
    if (!definition || definition.comingSoon || !definition.editable) return;
    setOpenSection(id);
    setStatus(id, 'editing');
  };

  const openFromChecklist = (checklistId: ProfileCompletionSectionId) => {
    const target = checklistItemToSectionId(checklistId, profile, { coreValues });
    openForEdit(target);
  };

  const cancelEdit = (id: ProfileSectionId) => {
    if (sectionStatus[id] === 'saving') return;
    setOpenSection(null);
    setStatus(id, 'idle');
  };

  const handleSectionSave = async (
    id: ProfileSectionId,
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (sectionStatus[id] === 'saving') return;
    setStatus(id, 'saving');

    try {
      const formData = new FormData(event.currentTarget);
      const result = await saveProfileSection(id, formData);
      if (!result.success) {
        setStatus(id, 'error', result.message);
        return;
      }

      if (result.profile) {
        setProfile((current) => ({ ...current, ...result.profile } as Profile));
      }
      if (result.profilePhotoUrl !== undefined) {
        setProfile((current) => ({
          ...current,
          profile_photo_url: result.profilePhotoUrl ?? current.profile_photo_url,
        }));
      }
      if (result.coreValues) {
        setCoreValues(result.coreValues);
      }

      setStatus(id, 'saved', result.message || 'Saved.');
      setOpenSection(null);
    } catch {
      setStatus(id, 'error', 'Could not save this section. Please try again.');
    }
  };

  const unmapped =
    profile.unmapped_legacy_fields &&
    typeof profile.unmapped_legacy_fields === 'object' &&
    !Array.isArray(profile.unmapped_legacy_fields)
      ? (profile.unmapped_legacy_fields as Record<string, string>)
      : {};
  const unmappedEntries = Object.entries(unmapped).filter(
    ([, value]) => typeof value === 'string' && value.trim().length > 0
  );

  return (
    <div className="space-y-5">
      {unmappedEntries.length > 0 ? (
        <div
          className="rounded-[1.5rem] border border-[#0B2D5C]/15 bg-[#EEF2F7] px-5 py-4 text-sm text-[#444444]"
          role="status"
        >
          <p className="font-semibold text-[#0B2D5C] mb-1">Some earlier answers need a quick review</p>
          <p className="mb-2">
            These values could not be matched to the new choices. Open the related section when you
            are ready.
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

      {showCompletionUi ? (
        <section
          className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6 shadow-[0_12px_40px_rgba(11,45,92,0.05)]"
          aria-labelledby="completion-checklist-title"
          data-testid="profile-completion-checklist"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="completion-checklist-title"
                className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Profile checklist
              </h2>
              <p className="mt-1 text-sm text-[#5A6575]">
                {completionPercent}% complete — informational only. Discovery is not gated.
              </p>
            </div>
            <Link
              href="/profile/preview"
              className="text-sm font-semibold text-[#0B2D5C] underline-offset-2 hover:underline"
            >
              View My Profile
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {completionSections.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openFromChecklist(item.id)}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left text-sm text-[#0B2D5C] transition hover:bg-[#EEF2F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      item.complete
                        ? 'bg-[#0B2D5C] text-white'
                        : 'border border-[#0B2D5C]/20 bg-white text-[#8A93A0]'
                    }`}
                    aria-hidden="true"
                  >
                    {item.complete ? '✓' : ''}
                  </span>
                  <span className={item.complete ? '' : 'text-[#5A6575]'}>{item.label}</span>
                  {!item.complete ? (
                    <span className="ml-auto text-xs font-semibold uppercase tracking-[0.12em] text-[#D62828]">
                      Open
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="editable-sections-title" className="space-y-3">
        <div>
          <h2
            id="editable-sections-title"
            className="text-xl tracking-[-0.01em] text-[#0B2D5C] lg:text-2xl"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Profile sections
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5A6575]">
            Review what you have shared. Edit one section at a time — nothing is required.
          </p>
        </div>

        {PROFILE_SECTIONS.map((section) => {
          const Icon = SECTION_ICONS[section.id] ?? UserRound;
          const isOpen = openSection === section.id;
          const status = sectionStatus[section.id] ?? 'idle';
          const summary = summarizeProfileSection(section.id, profile, {
            coreValues,
            photoCount,
          });

          return (
            <article
              key={section.id}
              id={`section-${section.id}`}
              ref={(node) => {
                sectionRefs.current[section.id] = node;
              }}
              className="rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white/90 shadow-[0_8px_28px_rgba(11,45,92,0.04)]"
            >
              <div className="flex items-start gap-3.5 px-4 py-4 sm:px-5">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2F7] text-[#0B2D5C]">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-[#0B2D5C]">{section.title}</h3>
                    {section.comingSoon ? (
                      <span className="rounded-full border border-[#0B2D5C]/12 bg-[#EEF2F7] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5A6575]">
                        Coming Soon
                      </span>
                    ) : null}
                    {status === 'saved' ? (
                      <span className="text-xs font-semibold text-green-700">Saved</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[#5A6575]">{section.description}</p>
                  {!isOpen ? (
                    <p className="mt-2 text-sm leading-relaxed text-[#0B2D5C]/90 line-clamp-3">
                      {summary}
                    </p>
                  ) : null}
                </div>
                {section.editable && !section.comingSoon ? (
                  <button
                    type="button"
                    onClick={() => (isOpen ? cancelEdit(section.id) : openForEdit(section.id))}
                    className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-[#0B2D5C]/15 bg-white px-3.5 py-2 text-sm font-semibold text-[#0B2D5C] transition hover:bg-[#EEF2F7]"
                    aria-expanded={isOpen}
                  >
                    {isOpen ? 'Close' : 'Edit'}
                    <ChevronDown
                      className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                ) : null}
              </div>

              {isOpen ? (
                <div className="border-t border-[#0B2D5C]/08 px-4 py-5 sm:px-5">
                  <SectionEditor
                    sectionId={section.id}
                    profile={profile}
                    privateDetails={privateDetails}
                    coreValues={coreValues}
                    photos={photos}
                    status={status}
                    message={sectionMessage[section.id] ?? ''}
                    onCancel={() => cancelEdit(section.id)}
                    onSubmit={(event) => void handleSectionSave(section.id, event)}
                    onPhotosChange={({ photos: nextPhotos, primaryPhotoUrl }) => {
                      setPhotos(nextPhotos);
                      setProfile((current) => ({
                        ...current,
                        profile_photo_url: primaryPhotoUrl,
                      }));
                      onPrimaryPhotoChange?.(primaryPhotoUrl);
                    }}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}

function SectionEditor({
  sectionId,
  profile,
  privateDetails,
  coreValues,
  photos,
  status,
  message,
  onCancel,
  onSubmit,
  onPhotosChange,
}: {
  sectionId: ProfileSectionId;
  profile: Profile;
  privateDetails: PrivateLocationSeed | null;
  coreValues: string[];
  photos: ManagedProfilePhoto[];
  status: SectionStatus;
  message: string;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onPhotosChange: (next: {
    photos: ManagedProfilePhoto[];
    primaryPhotoUrl: string | null;
  }) => void;
}) {
  const saving = status === 'saving';

  if (sectionId === 'photo') {
    return (
      <div className="space-y-4">
        <ProfilePhotoManager
          initialPhotos={photos}
          disabled={saving}
          onChange={onPhotosChange}
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-[#0B2D5C]/20 bg-white px-5 py-3 text-sm font-semibold text-[#0B2D5C]"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {sectionId === 'basics' ? (
        <>
          <label className="block text-sm font-medium text-[#0B2D5C]">
            Full name
            <input
              name="full_name"
              required
              defaultValue={profile.full_name ?? ''}
              className={`${inputClassName} mt-2`}
              disabled={saving}
            />
          </label>
          <label className="block text-sm font-medium text-[#0B2D5C]">
            Age
            <input
              name="age"
              type="number"
              min={18}
              max={120}
              defaultValue={profile.age ?? ''}
              className={`${inputClassName} mt-2`}
              disabled={saving}
            />
          </label>
        </>
      ) : null}

      {sectionId === 'location' ? (
        <LocationPicker initial={buildInitialLocation(profile, privateDetails)} />
      ) : null}

      {sectionId === 'about' ? (
        <label className="block text-sm font-medium text-[#0B2D5C]">
          About
          <textarea
            name="short_bio"
            rows={6}
            defaultValue={resolveUnifiedAbout(profile.short_bio, profile.more_about) ?? ''}
            className={`${inputClassName} mt-2 resize-y`}
            disabled={saving}
            placeholder="Share who you are in your own words."
          />
        </label>
      ) : null}

      {sectionId === 'relationship' ? (
        <RelationshipFields defaultValue={profile.relationship_goal ?? ''} disabled={saving} />
      ) : null}

      {sectionId === 'children' ? (
        <ChildrenFields profile={profile} disabled={saving} />
      ) : null}

      {sectionId === 'faith' ? <FaithFields profile={profile} disabled={saving} /> : null}

      {sectionId === 'smoking' ? <SmokingFields profile={profile} disabled={saving} /> : null}
      {sectionId === 'drinking' ? <DrinkingFields profile={profile} disabled={saving} /> : null}
      {sectionId === 'education' ? (
        <SingleChoiceFields
          name="education"
          legend="Education"
          options={EDUCATION_OPTIONS}
          defaultValue={profile.education ?? ''}
          disabled={saving}
        />
      ) : null}
      {sectionId === 'pets' ? <PetsFields profile={profile} disabled={saving} /> : null}
      {sectionId === 'relocation' ? (
        <SingleChoiceFields
          name="relocation"
          legend="Relocation openness"
          options={RELOCATION_OPTIONS}
          defaultValue={profile.relocation ?? ''}
          disabled={saving}
        />
      ) : null}

      {sectionId === 'career' ? (
        <label className="block text-sm font-medium text-[#0B2D5C]">
          What kind of work do you do?
          <input
            name="career"
            maxLength={120}
            defaultValue={profile.career ?? ''}
            className={`${inputClassName} mt-2`}
            disabled={saving}
          />
        </label>
      ) : null}

      {sectionId === 'service' ? (
        <ServiceFields
          defaultValues={profile.service_backgrounds ?? []}
          disabled={saving}
        />
      ) : null}

      {sectionId === 'enjoy' ? (
        <fieldset className="space-y-3" disabled={saving}>
          <legend className="text-sm font-medium text-[#0B2D5C]">Things I Enjoy</legend>
          {THINGS_I_ENJOY_OPTIONS.map((label) => (
            <label key={label} className="flex items-center gap-3 text-[#222222]">
              <input
                type="checkbox"
                name="things_i_enjoy"
                value={label}
                defaultChecked={profile.things_i_enjoy?.includes(label) ?? false}
                className="h-5 w-5 rounded border-[#0B2D5C]/30"
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      ) : null}

      {sectionId === 'music' ? (
        <>
          <label className="block text-sm font-medium text-[#0B2D5C]">
            Favorite artists
            <textarea
              name="favorite_music_artists"
              rows={3}
              defaultValue={(profile.favorite_music_artists ?? []).join('\n')}
              placeholder="One artist per line"
              className={`${inputClassName} mt-2 resize-y`}
              disabled={saving}
            />
          </label>
          <label className="block text-sm font-medium text-[#0B2D5C]">
            Favorite songs
            <textarea
              name="favorite_music_songs"
              rows={3}
              defaultValue={(profile.favorite_music_songs ?? []).join('\n')}
              placeholder="One song per line"
              className={`${inputClassName} mt-2 resize-y`}
              disabled={saving}
            />
          </label>
        </>
      ) : null}

      {sectionId === 'factors' ? (
        <fieldset className="space-y-3" disabled={saving}>
          <legend className="text-sm font-medium text-[#0B2D5C]">
            Important Alignment Factors
          </legend>
          <p className="text-xs text-[#888888]">Optional — choose what matters most.</p>
          {CORE_VALUES_OPTIONS.map((label) => (
            <label key={label} className="flex items-center gap-3 text-[#222222]">
              <input
                type="checkbox"
                name="core_values"
                value={label}
                defaultChecked={coreValues.includes(label)}
                className="h-5 w-5 rounded border-[#0B2D5C]/30"
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      ) : null}

      {status === 'error' && message ? (
        <p className="text-sm text-red-600" role="alert">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-2xl border border-[#0B2D5C]/20 bg-white px-5 py-3 text-sm font-semibold text-[#0B2D5C] disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-[#0B2D5C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2540] disabled:bg-gray-400"
        >
          {saving ? 'Saving…' : 'Save section'}
        </button>
      </div>
    </form>
  );
}

function SingleChoiceFields({
  name,
  legend,
  options,
  defaultValue,
  disabled,
}: {
  name: string;
  legend: string;
  options: readonly { value: string; label: string }[];
  defaultValue: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <ChoiceChips
      name={name}
      legend={legend}
      options={options}
      value={value}
      onChange={setValue}
      disabled={disabled}
    />
  );
}

function RelationshipFields({
  defaultValue,
  disabled,
}: {
  defaultValue: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <ChoiceChips
      name="relationship_goal"
      legend="Relationship goal"
      options={RELATIONSHIP_GOAL_OPTIONS}
      value={value}
      onChange={setValue}
      disabled={disabled}
    />
  );
}

function ChildrenFields({
  profile,
  disabled,
}: {
  profile: Profile;
  disabled?: boolean;
}) {
  const [hasChildren, setHasChildren] = useState(profile.has_children ?? '');
  const [childrenCount, setChildrenCount] = useState(profile.children_count ?? '');
  const [wantsChildren, setWantsChildren] = useState(profile.children ?? '');
  const [openToPartner, setOpenToPartner] = useState(
    profile.open_to_partner_with_children ?? ''
  );

  return (
    <div className="space-y-5">
      <ChoiceChips
        name="has_children"
        legend="Do you have children?"
        options={HAS_CHILDREN_OPTIONS}
        value={hasChildren}
        onChange={(next) => {
          setHasChildren(next);
          if (next !== 'yes') setChildrenCount('');
        }}
        disabled={disabled}
      />
      {hasChildren === 'yes' ? (
        <ChoiceChips
          name="children_count"
          legend="How many children?"
          options={CHILDREN_COUNT_OPTIONS}
          value={childrenCount}
          onChange={setChildrenCount}
          disabled={disabled}
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
        disabled={disabled}
      />
      <ChoiceChips
        name="open_to_partner_with_children"
        legend="Open to a partner who has children?"
        options={OPEN_TO_PARTNER_WITH_CHILDREN_OPTIONS}
        value={openToPartner}
        onChange={setOpenToPartner}
        disabled={disabled}
      />
    </div>
  );
}

function FaithFields({
  profile,
  disabled,
}: {
  profile: Profile;
  disabled?: boolean;
}) {
  const [identity, setIdentity] = useState(profile.faith_identity ?? '');
  const [importance, setImportance] = useState(profile.faith_importance ?? '');
  const [tradition, setTradition] = useState(profile.faith_tradition ?? '');
  const [other, setOther] = useState(profile.faith_other ?? '');
  const showTradition = [
    'christian',
    'catholic',
    'protestant',
    'jewish',
    'muslim',
    'hindu',
    'buddhist',
    'other',
  ].includes(identity);

  return (
    <div className="space-y-5">
      <ChoiceChips
        name="faith_identity"
        legend="Faith or religious identity"
        options={FAITH_IDENTITY_OPTIONS}
        value={identity}
        onChange={(next) => {
          setIdentity(next);
          if (next !== 'other') setOther('');
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
            setTradition('');
          }
        }}
        disabled={disabled}
      />
      {identity === 'other' ? (
        <label className="block text-sm font-medium text-[#0B2D5C]">
          Short description
          <input
            name="faith_other"
            maxLength={120}
            value={other}
            onChange={(event) => setOther(event.target.value)}
            className={`${inputClassName} mt-2`}
            disabled={disabled}
          />
        </label>
      ) : (
        <input type="hidden" name="faith_other" value="" />
      )}
      {showTradition ? (
        <label className="block text-sm font-medium text-[#0B2D5C]">
          Denomination or tradition
          <input
            name="faith_tradition"
            maxLength={120}
            value={tradition}
            onChange={(event) => setTradition(event.target.value)}
            className={`${inputClassName} mt-2`}
            disabled={disabled}
          />
        </label>
      ) : (
        <input type="hidden" name="faith_tradition" value="" />
      )}
      <ChoiceChips
        name="faith_importance"
        legend="How important is faith in daily life and relationships?"
        options={FAITH_IMPORTANCE_OPTIONS}
        value={importance}
        onChange={setImportance}
        disabled={disabled}
      />
    </div>
  );
}

function ServiceFields({
  defaultValues,
  disabled,
}: {
  defaultValues: string[];
  disabled?: boolean;
}) {
  const [values, setValues] = useState<string[]>(defaultValues);
  return (
    <MultiChoiceChips
      name="service_backgrounds"
      legend="Service background"
      options={SERVICE_BACKGROUND_OPTIONS}
      values={values}
      onChange={setValues}
      disabled={disabled}
    />
  );
}
