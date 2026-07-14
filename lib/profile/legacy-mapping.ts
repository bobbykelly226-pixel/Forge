/**
 * Translate legacy free-text / display-label profile values into structured slugs.
 * Unmapped originals are preserved — never replaced with an inaccurate selection.
 */

import {
  CHILDREN_COUNT_VALUES,
  DRINKING_VALUES,
  EDUCATION_VALUES,
  FAITH_IDENTITY_VALUES,
  FAITH_IMPORTANCE_VALUES,
  HAS_CHILDREN_VALUES,
  OPEN_TO_PARTNER_WITH_CHILDREN_VALUES,
  PETS_VALUES,
  PREFER_NOT_TO_SAY,
  RELATIONSHIP_GOAL_VALUES,
  RELOCATION_VALUES,
  SERVICE_BACKGROUND_VALUES,
  SMOKING_VALUES,
  WANTS_CHILDREN_VALUES,
  type ChildrenCountValue,
  type DrinkingValue,
  type EducationValue,
  type FaithIdentityValue,
  type FaithImportanceValue,
  type HasChildrenValue,
  type OpenToPartnerWithChildrenValue,
  type PetsValue,
  type RelationshipGoalValue,
  type RelocationValue,
  type ServiceBackgroundValue,
  type SmokingValue,
  type WantsChildrenValue,
  normalizeServiceBackgroundSelection,
} from './structured-options';

export type LegacyMapResult<T extends string> =
  | { mapped: T; unmapped: null }
  | { mapped: null; unmapped: string };

function normalizeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function mapFromAliases<T extends string>(
  raw: string | null | undefined,
  allowed: readonly T[],
  aliases: Record<string, T>
): LegacyMapResult<T> {
  if (raw == null) {
    return { mapped: null, unmapped: null as unknown as string };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { mapped: null, unmapped: null as unknown as string };
  }

  const key = normalizeKey(trimmed);
  if ((allowed as readonly string[]).includes(key)) {
    return { mapped: key as T, unmapped: null };
  }
  if (aliases[key]) {
    return { mapped: aliases[key], unmapped: null };
  }
  return { mapped: null, unmapped: trimmed };
}

/** Empty / whitespace → unanswered (not unmapped). */
export function mapOptionalLegacy<T extends string>(
  raw: string | null | undefined,
  mapper: (value: string) => LegacyMapResult<T>
): LegacyMapResult<T> | { mapped: null; unmapped: null } {
  if (raw == null || !raw.trim()) {
    return { mapped: null, unmapped: null };
  }
  return mapper(raw);
}

export function mapLegacyRelationshipGoal(
  raw: string | null | undefined
): LegacyMapResult<RelationshipGoalValue> | { mapped: null; unmapped: null } {
  return mapOptionalLegacy(raw, (value) =>
    mapFromAliases(value, RELATIONSHIP_GOAL_VALUES, {
      marriage: 'marriage',
      marriage_minded: 'marriage',
      serious_relationship: 'serious_relationship',
      long_term_relationship: 'serious_relationship',
      intentional_dating: 'intentional_dating',
      open_to_serious_dating: 'intentional_dating',
      getting_to_know_someone: 'getting_to_know_someone',
      not_sure_yet_but_intentional: 'getting_to_know_someone',
    })
  );
}

export function mapLegacyHasChildren(
  raw: string | null | undefined
): LegacyMapResult<HasChildrenValue> | { mapped: null; unmapped: null } {
  return mapOptionalLegacy(raw, (value) =>
    mapFromAliases(value, HAS_CHILDREN_VALUES, {
      yes: 'yes',
      y: 'yes',
      true: 'yes',
      no: 'no',
      n: 'no',
      false: 'no',
      prefer_not_to_say: PREFER_NOT_TO_SAY,
      prefer_not: PREFER_NOT_TO_SAY,
    })
  );
}

export function mapLegacyChildrenCount(
  raw: string | null | undefined
): LegacyMapResult<ChildrenCountValue> | { mapped: null; unmapped: null } {
  return mapOptionalLegacy(raw, (value) =>
    mapFromAliases(value, CHILDREN_COUNT_VALUES, {
      '1': '1',
      one: '1',
      '2': '2',
      two: '2',
      '3': '3',
      three: '3',
      '4': '4_plus',
      '4_plus': '4_plus',
      four: '4_plus',
      '4+': '4_plus',
      prefer_not_to_say: PREFER_NOT_TO_SAY,
    })
  );
}

export function mapLegacyWantsChildren(
  raw: string | null | undefined
): LegacyMapResult<WantsChildrenValue> | { mapped: null; unmapped: null } {
  return mapOptionalLegacy(raw, (value) =>
    mapFromAliases(value, WANTS_CHILDREN_VALUES, {
      yes: 'yes',
      no: 'no',
      open: 'open',
      open_to_it: 'open',
      open_to_children: 'open',
      unsure: 'unsure',
      maybe: 'open',
      prefer_not_to_say: PREFER_NOT_TO_SAY,
    })
  );
}

export function mapLegacyOpenToPartnerWithChildren(
  raw: string | null | undefined
): LegacyMapResult<OpenToPartnerWithChildrenValue> | { mapped: null; unmapped: null } {
  return mapOptionalLegacy(raw, (value) =>
    mapFromAliases(value, OPEN_TO_PARTNER_WITH_CHILDREN_VALUES, {
      yes: 'yes',
      no: 'no',
      open: 'open',
      open_to_it: 'open',
      prefer_not_to_say: PREFER_NOT_TO_SAY,
    })
  );
}

export function mapLegacyFaithIdentity(
  raw: string | null | undefined
): LegacyMapResult<FaithIdentityValue> | { mapped: null; unmapped: null } {
  return mapOptionalLegacy(raw, (value) =>
    mapFromAliases(value, FAITH_IDENTITY_VALUES, {
      christian: 'christian',
      catholic: 'catholic',
      protestant: 'protestant',
      jewish: 'jewish',
      muslim: 'muslim',
      hindu: 'hindu',
      buddhist: 'buddhist',
      spiritual: 'spiritual',
      agnostic: 'agnostic',
      atheist: 'atheist',
      other: 'other',
      prefer_not_to_say: PREFER_NOT_TO_SAY,
    })
  );
}

export function mapLegacyFaithImportance(
  raw: string | null | undefined
): LegacyMapResult<FaithImportanceValue> | { mapped: null; unmapped: null } {
  return mapOptionalLegacy(raw, (value) =>
    mapFromAliases(value, FAITH_IMPORTANCE_VALUES, {
      very_important: 'very_important',
      important: 'important',
      somewhat_important: 'somewhat_important',
      not_important: 'not_important',
      prefer_not_to_say: PREFER_NOT_TO_SAY,
    })
  );
}

export function mapLegacySmoking(
  raw: string | null | undefined
): LegacyMapResult<SmokingValue> | { mapped: null; unmapped: null } {
  return mapOptionalLegacy(raw, (value) =>
    mapFromAliases(value, SMOKING_VALUES, {
      never: 'never',
      no: 'never',
      none: 'never',
      occasionally: 'occasionally',
      sometimes: 'occasionally',
      regularly: 'regularly',
      yes: 'regularly',
      trying_to_quit: 'trying_to_quit',
      quitting: 'trying_to_quit',
      prefer_not_to_say: PREFER_NOT_TO_SAY,
    })
  );
}

/**
 * "Yes" alone is intentionally unmapped — it is too vague for drinking frequency.
 */
export function mapLegacyDrinking(
  raw: string | null | undefined
): LegacyMapResult<DrinkingValue> | { mapped: null; unmapped: null } {
  return mapOptionalLegacy(raw, (value) => {
    const key = normalizeKey(value);
    if (key === 'yes') {
      return { mapped: null, unmapped: value.trim() };
    }
    return mapFromAliases(value, DRINKING_VALUES, {
      never: 'never',
      no: 'never',
      none: 'never',
      occasionally: 'occasionally',
      sometimes: 'occasionally',
      socially: 'socially',
      social: 'socially',
      regularly: 'regularly',
      in_recovery: 'in_recovery',
      recovery: 'in_recovery',
      prefer_not_to_say: PREFER_NOT_TO_SAY,
    });
  });
}

/**
 * Ambiguous labels like "College" are preserved as unmapped rather than guessed.
 */
export function mapLegacyEducation(
  raw: string | null | undefined
): LegacyMapResult<EducationValue> | { mapped: null; unmapped: null } {
  return mapOptionalLegacy(raw, (value) => {
    const key = normalizeKey(value);
    if (key === 'college' || key === 'university') {
      return { mapped: null, unmapped: value.trim() };
    }
    return mapFromAliases(value, EDUCATION_VALUES, {
      high_school: 'high_school',
      hs: 'high_school',
      trade_vocational: 'trade_vocational',
      trade: 'trade_vocational',
      vocational: 'trade_vocational',
      some_college: 'some_college',
      associate: 'associate',
      associates: 'associate',
      associate_degree: 'associate',
      bachelors: 'bachelors',
      bachelor: 'bachelors',
      bachelors_degree: 'bachelors',
      graduate_professional: 'graduate_professional',
      graduate: 'graduate_professional',
      masters: 'graduate_professional',
      phd: 'graduate_professional',
      other: 'other',
      prefer_not_to_say: PREFER_NOT_TO_SAY,
    });
  });
}

export function mapLegacyPets(
  raw: string | null | undefined
): LegacyMapResult<PetsValue> | { mapped: null; unmapped: null } {
  return mapOptionalLegacy(raw, (value) =>
    mapFromAliases(value, PETS_VALUES, {
      no_pets: 'no_pets',
      no: 'no_pets',
      none: 'no_pets',
      dog: 'dog',
      dogs: 'dog',
      cat: 'cat',
      cats: 'cat',
      multiple_pets: 'multiple_pets',
      multiple: 'multiple_pets',
      other: 'other',
      prefer_not_to_say: PREFER_NOT_TO_SAY,
    })
  );
}

export function mapLegacyRelocation(
  raw: string | null | undefined
): LegacyMapResult<RelocationValue> | { mapped: null; unmapped: null } {
  return mapOptionalLegacy(raw, (value) =>
    mapFromAliases(value, RELOCATION_VALUES, {
      not_open: 'not_open',
      no: 'not_open',
      not_open_to_relocating: 'not_open',
      possibly: 'possibly',
      maybe: 'possibly',
      open: 'open',
      yes: 'open',
      open_to_relocating: 'open',
      prefer_not_to_say: PREFER_NOT_TO_SAY,
    })
  );
}

const SERVICE_TOKEN_ALIASES: Record<string, ServiceBackgroundValue> = {
  military: 'military',
  army: 'military',
  navy: 'military',
  veteran: 'military',
  law_enforcement: 'law_enforcement',
  police: 'law_enforcement',
  officer: 'law_enforcement',
  fire_ems: 'fire_ems',
  fire: 'fire_ems',
  ems: 'fire_ems',
  emt: 'fire_ems',
  paramedic: 'fire_ems',
  healthcare: 'healthcare',
  nurse: 'healthcare',
  nursing: 'healthcare',
  doctor: 'healthcare',
  medical: 'healthcare',
  education: 'education',
  teacher: 'education',
  community_service: 'community_service',
  volunteer: 'community_service',
  other: 'other',
  none: 'none',
  prefer_not_to_say: PREFER_NOT_TO_SAY,
};

export function mapLegacyServiceBackground(
  raw: string | null | undefined
): {
  mapped: ServiceBackgroundValue[];
  unmapped: string | null;
} {
  if (raw == null || !raw.trim()) {
    return { mapped: [], unmapped: null };
  }

  const tokens = raw
    .split(/[,;/|]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const mapped: ServiceBackgroundValue[] = [];
  const leftover: string[] = [];

  for (const token of tokens) {
    const key = normalizeKey(token);
    if ((SERVICE_BACKGROUND_VALUES as readonly string[]).includes(key)) {
      mapped.push(key as ServiceBackgroundValue);
      continue;
    }
    const alias = SERVICE_TOKEN_ALIASES[key];
    if (alias) {
      mapped.push(alias);
      continue;
    }
    leftover.push(token);
  }

  return {
    mapped: normalizeServiceBackgroundSelection(mapped),
    unmapped: leftover.length > 0 ? leftover.join(', ') : null,
  };
}

export type UnmappedLegacyFields = Record<string, string>;

export function mergeUnmappedField(
  existing: UnmappedLegacyFields | null | undefined,
  field: string,
  unmapped: string | null
): UnmappedLegacyFields {
  const next: UnmappedLegacyFields = { ...(existing ?? {}) };
  if (unmapped) {
    next[field] = unmapped;
  } else {
    delete next[field];
  }
  return next;
}
