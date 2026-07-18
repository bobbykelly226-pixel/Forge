'use client';

import { useState } from 'react';

import {
  ChoiceChips,
  MultiChoiceChips,
} from '@/components/profile/StructuredChoices';
import {
  DRINKING_PARTNER_PREFERENCE_OPTIONS,
  PET_TYPE_OPTIONS,
  PETS_PARTNER_PREFERENCE_OPTIONS,
  SMOKING_PARTNER_PREFERENCE_OPTIONS,
  SMOKING_PRODUCT_OPTIONS,
  derivePetsTypesFromLegacyIdentity,
  normalizePetsIdentity,
  smokingUsesProducts,
} from '@/lib/profile/lifestyle-compatibility';
import { DRINKING_OPTIONS, PETS_OPTIONS, SMOKING_OPTIONS } from '@/lib/profile/structured-options';
import type { Profile } from '@/lib/types/profile';

const OPENNESS_EXCLUSIVE = ['open_to_any', 'not_sure'];

export function PetsFields({
  profile,
  disabled,
}: {
  profile: Profile;
  disabled?: boolean;
}) {
  const [pets, setPets] = useState<string>(normalizePetsIdentity(profile.pets));
  const [petTypes, setPetTypes] = useState<string[]>(
    derivePetsTypesFromLegacyIdentity(profile.pets, profile.pets_types)
  );
  const [partnerPrefs, setPartnerPrefs] = useState<string[]>(
    profile.pets_partner_preferences ?? []
  );
  const [allergyConstraint, setAllergyConstraint] = useState(
    profile.pets_allergy_constraint ? 'yes' : ''
  );
  const [allergyTypes, setAllergyTypes] = useState<string[]>(
    profile.pets_allergy_types ?? []
  );

  const showPetTypes = pets === 'yes';
  const showPartnerPrefs = pets !== '';
  const showAllergyTypes = showPartnerPrefs && allergyConstraint === 'yes';

  return (
    <div className="space-y-5">
      <ChoiceChips
        name="pets"
        legend="Do you currently have pets?"
        options={PETS_OPTIONS}
        value={pets}
        onChange={(next) => {
          setPets(next);
          if (next !== 'yes') setPetTypes([]);
        }}
        disabled={disabled}
      />

      {showPetTypes ? (
        <MultiChoiceChips
          name="pets_types"
          legend="Tell us more about your pets."
          hint="Select all that apply."
          optionalNote="Optional — select all that apply, or leave unanswered."
          options={PET_TYPE_OPTIONS}
          values={petTypes}
          onChange={setPetTypes}
          exclusiveValues={[]}
          disabled={disabled}
        />
      ) : (
        <input type="hidden" name="pets_types" value="" />
      )}

      {showPartnerPrefs ? (
        <>
          <MultiChoiceChips
            name="pets_partner_preferences"
            legend="What are you comfortable with in a long-term partner?"
            hint="Select all that feel comfortable for you."
            optionalNote="Optional — your own pets do not determine this answer."
            options={PETS_PARTNER_PREFERENCE_OPTIONS}
            values={partnerPrefs}
            onChange={setPartnerPrefs}
            exclusiveValues={OPENNESS_EXCLUSIVE}
            disabled={disabled}
          />

          <ChoiceChips
            name="pets_allergy_constraint"
            legend="Pet allergies affect what I can live with"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            value={allergyConstraint}
            onChange={(next) => {
              setAllergyConstraint(next);
              if (next !== 'yes') setAllergyTypes([]);
            }}
            optionalNote="Optional — this is a living constraint, not just a preference."
            disabled={disabled}
          />

          {showAllergyTypes ? (
            <MultiChoiceChips
              name="pets_allergy_types"
              legend="Which animals affect your allergies?"
              hint="Select all that apply."
              optionalNote="Optional — select all that apply, or leave unanswered."
              options={PET_TYPE_OPTIONS}
              values={allergyTypes}
              onChange={setAllergyTypes}
              exclusiveValues={[]}
              disabled={disabled}
            />
          ) : (
            <input type="hidden" name="pets_allergy_types" value="" />
          )}
        </>
      ) : (
        <>
          <input type="hidden" name="pets_partner_preferences" value="" />
          <input type="hidden" name="pets_allergy_constraint" value="" />
          <input type="hidden" name="pets_allergy_types" value="" />
        </>
      )}
    </div>
  );
}

export function SmokingFields({
  profile,
  disabled,
}: {
  profile: Profile;
  disabled?: boolean;
}) {
  const [smoking, setSmoking] = useState(profile.smoking ?? '');
  const [products, setProducts] = useState<string[]>(profile.smoking_product_types ?? []);
  const [productOther, setProductOther] = useState(profile.smoking_product_other ?? '');
  const [partnerPrefs, setPartnerPrefs] = useState<string[]>(
    profile.smoking_partner_preferences ?? []
  );

  const showProducts = smokingUsesProducts(smoking);
  const showOtherText = showProducts && products.includes('other');
  const showPartnerPrefs = smoking !== '';

  return (
    <div className="space-y-5">
      <ChoiceChips
        name="smoking"
        legend="Do you smoke or use smoking-related products?"
        options={SMOKING_OPTIONS}
        value={smoking}
        onChange={(next) => {
          setSmoking(next);
          if (!smokingUsesProducts(next)) {
            setProducts([]);
            setProductOther('');
          }
        }}
        disabled={disabled}
      />

      {showProducts ? (
        <>
          <MultiChoiceChips
            name="smoking_product_types"
            legend="What do you use?"
            hint="Select all that apply."
            optionalNote="Optional — select all that apply, or leave unanswered."
            options={SMOKING_PRODUCT_OPTIONS}
            values={products}
            onChange={(next) => {
              setProducts(next);
              if (!next.includes('other')) setProductOther('');
            }}
            exclusiveValues={[]}
            disabled={disabled}
          />
          {showOtherText ? (
            <label className="block text-sm font-medium text-[#0B2D5C]">
              Tell us more (optional)
              <input
                name="smoking_product_other"
                maxLength={80}
                value={productOther}
                onChange={(event) => setProductOther(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/20 bg-white px-4 py-3 text-sm text-[#0B2D5C] outline-none transition focus:border-[#0B2D5C]"
                disabled={disabled}
                placeholder="Optional short detail"
              />
            </label>
          ) : (
            <input type="hidden" name="smoking_product_other" value="" />
          )}
        </>
      ) : (
        <>
          <input type="hidden" name="smoking_product_types" value="" />
          <input type="hidden" name="smoking_product_other" value="" />
        </>
      )}

      {showPartnerPrefs ? (
        <MultiChoiceChips
          name="smoking_partner_preferences"
          legend="What are you comfortable with in a long-term partner?"
          hint="Select all that feel comfortable for you. Your own habits do not determine your answer here."
          optionalNote="Optional — different products stay distinct."
          options={SMOKING_PARTNER_PREFERENCE_OPTIONS}
          values={partnerPrefs}
          onChange={setPartnerPrefs}
          exclusiveValues={OPENNESS_EXCLUSIVE}
          disabled={disabled}
        />
      ) : (
        <input type="hidden" name="smoking_partner_preferences" value="" />
      )}
    </div>
  );
}

export function DrinkingFields({
  profile,
  disabled,
}: {
  profile: Profile;
  disabled?: boolean;
}) {
  const initialDrinking =
    profile.drinking === 'occasionally' ? 'rarely' : (profile.drinking ?? '');
  const [drinking, setDrinking] = useState(initialDrinking);
  const [partnerPrefs, setPartnerPrefs] = useState<string[]>(
    profile.drinking_partner_preferences ?? []
  );
  const showPartnerPrefs = drinking !== '';

  return (
    <div className="space-y-5">
      <ChoiceChips
        name="drinking"
        legend="How would you describe your relationship with alcohol?"
        options={DRINKING_OPTIONS}
        value={drinking}
        onChange={setDrinking}
        disabled={disabled}
      />

      {showPartnerPrefs ? (
        <MultiChoiceChips
          name="drinking_partner_preferences"
          legend="What are you comfortable with in a long-term partner?"
          hint="Select all that feel comfortable for you."
          optionalNote="Optional — your own drinking does not determine this answer."
          options={DRINKING_PARTNER_PREFERENCE_OPTIONS}
          values={partnerPrefs}
          onChange={setPartnerPrefs}
          exclusiveValues={OPENNESS_EXCLUSIVE}
          disabled={disabled}
        />
      ) : (
        <input type="hidden" name="drinking_partner_preferences" value="" />
      )}
    </div>
  );
}
