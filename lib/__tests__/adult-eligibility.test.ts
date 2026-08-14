import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  deriveAgeFromDateOfBirth,
  latestEligibleAdultBirthDate,
  parseIsoDateOnly,
  validateAdultDateOfBirth,
} from '../age';

const AS_OF = new Date('2026-08-14T12:00:00.000Z');

describe('adult eligibility', () => {
  it('accepts someone on their exact eighteenth birthday', () => {
    assert.deepEqual(validateAdultDateOfBirth('2008-08-14', AS_OF), {
      ok: true,
      age: 18,
      value: '2008-08-14',
    });
  });

  it('rejects someone one day before their eighteenth birthday', () => {
    const result = validateAdultDateOfBirth('2008-08-15', AS_OF);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, 'underage');
  });

  it('handles February 29 birthdays consistently in non-leap years', () => {
    assert.equal(deriveAgeFromDateOfBirth('2008-02-29', new Date('2026-02-27T12:00:00Z')), 17);
    assert.equal(deriveAgeFromDateOfBirth('2008-02-29', new Date('2026-02-28T12:00:00Z')), 18);
  });

  it('rejects impossible, malformed, future, and implausibly old dates', () => {
    assert.equal(parseIsoDateOnly('2025-02-29'), null);
    assert.equal(validateAdultDateOfBirth('08/14/2008', AS_OF).ok, false);
    assert.equal(validateAdultDateOfBirth('2030-01-01', AS_OF).ok, false);
    assert.equal(validateAdultDateOfBirth('1800-01-01', AS_OF).ok, false);
  });

  it('provides the browser cutoff for the latest eligible birth date', () => {
    assert.equal(latestEligibleAdultBirthDate(AS_OF), '2008-08-14');
  });
});
