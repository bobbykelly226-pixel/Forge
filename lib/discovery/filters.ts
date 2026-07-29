import type { DiscoveryFeedCardModel } from '@/lib/discovery/presentation';

export type DiscoveryFilters = {
  minAge: number | null;
  maxAge: number | null;
  locationQuery: string;
  alignment: string[];
  relationshipGoals: string[];
  faithIdentity: string[];
  faithImportance: string[];
  hasChildren: string[];
  wantsChildren: string[];
  smoking: string[];
  drinking: string[];
  pets: string[];
  thingsIEnjoy: string[];
};

export const EMPTY_DISCOVERY_FILTERS: DiscoveryFilters = {
  minAge: null,
  maxAge: null,
  locationQuery: '',
  alignment: [],
  relationshipGoals: [],
  faithIdentity: [],
  faithImportance: [],
  hasChildren: [],
  wantsChildren: [],
  smoking: [],
  drinking: [],
  pets: [],
  thingsIEnjoy: [],
};

function includesAny(selected: string[], candidate: string | string[] | null): boolean {
  if (selected.length === 0) return true;
  const values = Array.isArray(candidate) ? candidate : candidate ? [candidate] : [];
  return selected.some((value) => values.includes(value));
}

const EMPTY_FILTER_DATA: NonNullable<DiscoveryFeedCardModel['filterData']> = {
  relationshipGoals: [],
  faithIdentity: null,
  faithImportance: null,
  children: null,
  hasChildren: null,
  smoking: null,
  drinking: null,
  pets: null,
  thingsIEnjoy: [],
};

export function profileMatchesDiscoveryFilters(
  profile: DiscoveryFeedCardModel,
  filters: DiscoveryFilters
): boolean {
  const filterData = profile.filterData ?? EMPTY_FILTER_DATA;
  if (filters.minAge != null && (profile.age == null || profile.age < filters.minAge)) {
    return false;
  }
  if (filters.maxAge != null && (profile.age == null || profile.age > filters.maxAge)) {
    return false;
  }

  const locationQuery = filters.locationQuery.trim().toLocaleLowerCase();
  if (
    locationQuery &&
    !profile.location?.toLocaleLowerCase().includes(locationQuery)
  ) {
    return false;
  }

  return (
    includesAny(filters.alignment, profile.alignmentLabel) &&
    includesAny(filters.relationshipGoals, filterData.relationshipGoals) &&
    includesAny(filters.faithIdentity, filterData.faithIdentity) &&
    includesAny(filters.faithImportance, filterData.faithImportance) &&
    includesAny(filters.hasChildren, filterData.hasChildren) &&
    includesAny(filters.wantsChildren, filterData.children) &&
    includesAny(filters.smoking, filterData.smoking) &&
    includesAny(filters.drinking, filterData.drinking) &&
    includesAny(filters.pets, filterData.pets) &&
    includesAny(filters.thingsIEnjoy, filterData.thingsIEnjoy)
  );
}

export function countActiveDiscoveryFilters(filters: DiscoveryFilters): number {
  return [
    filters.minAge,
    filters.maxAge,
    filters.locationQuery.trim() || null,
    ...filters.alignment,
    ...filters.relationshipGoals,
    ...filters.faithIdentity,
    ...filters.faithImportance,
    ...filters.hasChildren,
    ...filters.wantsChildren,
    ...filters.smoking,
    ...filters.drinking,
    ...filters.pets,
    ...filters.thingsIEnjoy,
  ].filter((value) => value !== null && value !== '').length;
}

export function discoveryFilterValues(
  profiles: DiscoveryFeedCardModel[],
  key: keyof NonNullable<DiscoveryFeedCardModel['filterData']>
): string[] {
  const values = profiles.flatMap((profile) => {
    const value = (profile.filterData ?? EMPTY_FILTER_DATA)[key];
    return Array.isArray(value) ? value : value ? [value] : [];
  });
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function humanizeDiscoveryFilterValue(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
