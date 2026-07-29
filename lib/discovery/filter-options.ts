import {
  RELATIONSHIP_ALIGNMENT_KEYS,
  RELATIONSHIP_ALIGNMENT_LABELS,
} from '@/lib/compatibility/types';
import type { DiscoveryFeedCardModel } from '@/lib/discovery/presentation';
import {
  DRINKING_OPTIONS,
  FAITH_IDENTITY_OPTIONS,
  FAITH_IMPORTANCE_OPTIONS,
  HAS_CHILDREN_OPTIONS,
  PETS_OPTIONS,
  RELATIONSHIP_GOAL_OPTIONS,
  SMOKING_OPTIONS,
  WANTS_CHILDREN_OPTIONS,
  type StructuredOption,
} from '@/lib/profile/structured-options';

export type DiscoveryFilterOption = {
  value: string;
  label: string;
};

function copyOptions(
  options: ReadonlyArray<StructuredOption>
): DiscoveryFilterOption[] {
  return options.map(({ value, label }) => ({ value, label }));
}

/**
 * Complete categorical filter catalogs.
 *
 * These options intentionally come from the same canonical profile catalogs
 * used when members answer the corresponding questions. They must not shrink
 * to only the values represented by the profiles currently loaded in the feed.
 */
export const DISCOVERY_CATEGORICAL_FILTER_OPTIONS = {
  alignment: RELATIONSHIP_ALIGNMENT_KEYS.map((key) => ({
    value: RELATIONSHIP_ALIGNMENT_LABELS[key],
    label: RELATIONSHIP_ALIGNMENT_LABELS[key],
  })),
  relationshipGoals: copyOptions(RELATIONSHIP_GOAL_OPTIONS),
  faithIdentity: copyOptions(FAITH_IDENTITY_OPTIONS),
  faithImportance: copyOptions(FAITH_IMPORTANCE_OPTIONS),
  hasChildren: copyOptions(HAS_CHILDREN_OPTIONS),
  wantsChildren: copyOptions(WANTS_CHILDREN_OPTIONS),
  smoking: copyOptions(SMOKING_OPTIONS),
  drinking: copyOptions(DRINKING_OPTIONS),
  pets: copyOptions(PETS_OPTIONS),
} as const;

/**
 * Things I Enjoy is intentionally free-form, so its meaningful filter choices
 * are the distinct hobbies actually entered by currently eligible profiles.
 */
export function discoveryThingsIEnjoyOptions(
  profiles: DiscoveryFeedCardModel[]
): DiscoveryFilterOption[] {
  const byNormalizedLabel = new Map<string, string>();

  for (const profile of profiles) {
    for (const raw of profile.filterData?.thingsIEnjoy ?? []) {
      const label = raw.trim();
      if (!label) continue;
      const key = label.toLocaleLowerCase();
      if (!byNormalizedLabel.has(key)) byNormalizedLabel.set(key, label);
    }
  }

  return [...byNormalizedLabel.values()]
    .sort((a, b) => a.localeCompare(b))
    .map((label) => ({ value: label, label }));
}
