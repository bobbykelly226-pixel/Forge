import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CONFIRMATION_COPY,
  authResultPath,
  classifyConfirmationProviderError,
  isSuccessfulConfirmationOutcome,
  parseConfirmationOutcome,
  presentationForOutcome,
} from '../auth/confirmation';

describe('confirmation outcome classification', () => {
  it('maps successful confirmation with established session copy', () => {
    const copy = presentationForOutcome('session_ready');
    assert.equal(copy.title, 'Email confirmed');
    assert.match(copy.message, /confirmed/i);
    assert.equal(copy.primaryHref, '/onboarding');
    assert.equal(copy.title.includes('Confirmation needed'), false);
  });

  it('maps successful confirmation without immediate session to calm sign-in', () => {
    const copy = CONFIRMATION_COPY.confirmed_needs_signin;
    assert.equal(copy.title, 'Email confirmed');
    assert.match(copy.message, /sign in/i);
    assert.equal(copy.primaryHref, '/login');
    assert.equal(copy.title, 'Email confirmed');
    assert.doesNotMatch(copy.message, /invalid or has expired/i);
    assert.doesNotMatch(copy.title, /confirmation needed/i);
  });

  it('maps already-consumed confirmation links without Confirmation needed', () => {
    const outcome = classifyConfirmationProviderError(
      'Email link is invalid or has expired'
    );
    assert.equal(outcome, 'already_confirmed');
    const copy = presentationForOutcome(outcome);
    assert.equal(
      copy.message,
      'Your email has already been confirmed. Sign in to continue.'
    );
    assert.doesNotMatch(copy.title, /confirmation needed/i);
    assert.equal(isSuccessfulConfirmationOutcome(outcome), true);
  });

  it('maps otp_expired / flow_state to already_confirmed', () => {
    assert.equal(classifyConfirmationProviderError('otp_expired'), 'already_confirmed');
    assert.equal(
      classifyConfirmationProviderError('flow_state_expired'),
      'already_confirmed'
    );
    assert.equal(
      classifyConfirmationProviderError('Token has expired or is invalid'),
      'already_confirmed'
    );
  });

  it('maps genuinely invalid links to expired guidance', () => {
    const outcome = classifyConfirmationProviderError('access_denied');
    assert.equal(outcome, 'invalid_or_expired');
    const copy = presentationForOutcome(outcome);
    assert.equal(copy.title, 'Confirmation needed');
    assert.match(copy.message, /invalid or has expired/i);
    assert.equal(copy.offerResend, true);
  });

  it('maps empty / unknown provider errors to invalid_or_expired', () => {
    assert.equal(classifyConfirmationProviderError(''), 'invalid_or_expired');
    assert.equal(classifyConfirmationProviderError(null), 'invalid_or_expired');
    assert.equal(classifyConfirmationProviderError('something weird'), 'invalid_or_expired');
  });

  it('never uses Confirmation needed for successful confirmation outcomes', () => {
    for (const outcome of [
      'session_ready',
      'confirmed_needs_signin',
      'already_confirmed',
    ] as const) {
      assert.equal(isSuccessfulConfirmationOutcome(outcome), true);
      assert.doesNotMatch(CONFIRMATION_COPY[outcome].title, /confirmation needed/i);
      assert.doesNotMatch(
        CONFIRMATION_COPY[outcome].message,
        /confirmation link is invalid or has expired/i
      );
    }
  });

  it('builds auth result paths from outcomes', () => {
    assert.equal(authResultPath('confirmed_needs_signin'), '/auth/result?outcome=confirmed_needs_signin');
    assert.equal(authResultPath('already_confirmed'), '/auth/result?outcome=already_confirmed');
    assert.equal(authResultPath('invalid_or_expired'), '/auth/result?outcome=invalid_or_expired');
  });

  it('parses outcome query values safely', () => {
    assert.equal(parseConfirmationOutcome('already_confirmed'), 'already_confirmed');
    assert.equal(parseConfirmationOutcome('nope'), null);
    assert.equal(parseConfirmationOutcome(undefined), null);
  });
});

describe('confirmation callback contracts', () => {
  it('documents outcome A: session ready redirects into onboarding', () => {
    const result = {
      success: true as const,
      outcome: 'session_ready' as const,
      redirectTo: '/onboarding',
    };
    assert.equal(result.success, true);
    assert.equal(result.outcome, 'session_ready');
    assert.equal(result.redirectTo, '/onboarding');
    assert.doesNotMatch(CONFIRMATION_COPY.session_ready.title, /confirmation needed/i);
  });

  it('documents outcome B: confirmed without session uses calm Email confirmed copy', () => {
    const result = {
      success: false as const,
      outcome: 'confirmed_needs_signin' as const,
      message: CONFIRMATION_COPY.confirmed_needs_signin.message,
    };
    assert.equal(result.outcome, 'confirmed_needs_signin');
    assert.equal(result.message, 'Your email is confirmed. Sign in to continue into Forge.');
    assert.doesNotMatch(result.message, /invalid or has expired/i);
  });

  it('documents outcome C: already-consumed link copy', () => {
    const result = {
      success: false as const,
      outcome: 'already_confirmed' as const,
      message: CONFIRMATION_COPY.already_confirmed.message,
    };
    assert.equal(
      result.message,
      'Your email has already been confirmed. Sign in to continue.'
    );
  });

  it('documents outcome D: genuinely expired link keeps resend guidance', () => {
    const result = {
      success: false as const,
      outcome: 'invalid_or_expired' as const,
      message: CONFIRMATION_COPY.invalid_or_expired.message,
    };
    assert.equal(result.outcome, 'invalid_or_expired');
    assert.equal(CONFIRMATION_COPY.invalid_or_expired.title, 'Confirmation needed');
    assert.match(result.message, /Request a new confirmation email/i);
  });
});
