export const MINIMUM_ADULT_AGE = 18;
export const MAXIMUM_PROFILE_AGE = 120;

export type DateOnly = {
  year: number;
  month: number;
  day: number;
};

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function parseIsoDateOnly(value: string): DateOnly | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    return null;
  }

  return { year, month, day };
}

function utcDateOnly(date: Date): DateOnly {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function compareDateOnly(left: DateOnly, right: DateOnly): number {
  if (left.year !== right.year) return left.year - right.year;
  if (left.month !== right.month) return left.month - right.month;
  return left.day - right.day;
}

function anniversaryInYear(birthDate: DateOnly, year: number): DateOnly {
  return {
    year,
    month: birthDate.month,
    // Treat February 28 as the birthday in non-leap years for a February 29 DOB.
    day: Math.min(birthDate.day, daysInMonth(year, birthDate.month)),
  };
}

export function deriveAgeFromDateOfBirth(
  dateOfBirth: string,
  asOf: Date = new Date()
): number | null {
  const birthDate = parseIsoDateOnly(dateOfBirth);
  if (!birthDate || Number.isNaN(asOf.getTime())) return null;

  const today = utcDateOnly(asOf);
  if (compareDateOnly(birthDate, today) > 0) return null;

  let age = today.year - birthDate.year;
  if (compareDateOnly(today, anniversaryInYear(birthDate, today.year)) < 0) {
    age -= 1;
  }
  return age;
}

export type AdultDateOfBirthValidation =
  | { ok: true; age: number; value: string }
  | { ok: false; code: 'required' | 'invalid' | 'underage' | 'implausible'; message: string };

export function validateAdultDateOfBirth(
  value: string,
  asOf: Date = new Date()
): AdultDateOfBirthValidation {
  const normalized = value.trim();
  if (!normalized) {
    return { ok: false, code: 'required', message: 'Date of birth is required.' };
  }

  const age = deriveAgeFromDateOfBirth(normalized, asOf);
  if (age == null) {
    return { ok: false, code: 'invalid', message: 'Enter a valid date of birth.' };
  }
  if (age < MINIMUM_ADULT_AGE) {
    return { ok: false, code: 'underage', message: 'Forge is only available to adults 18 and older.' };
  }
  if (age > MAXIMUM_PROFILE_AGE) {
    return { ok: false, code: 'implausible', message: 'Enter a valid date of birth.' };
  }

  return { ok: true, age, value: normalized };
}

export function latestEligibleAdultBirthDate(asOf: Date = new Date()): string {
  const today = utcDateOnly(asOf);
  const cutoff = anniversaryInYear(today, today.year - MINIMUM_ADULT_AGE);
  return `${String(cutoff.year).padStart(4, '0')}-${String(cutoff.month).padStart(2, '0')}-${String(cutoff.day).padStart(2, '0')}`;
}
