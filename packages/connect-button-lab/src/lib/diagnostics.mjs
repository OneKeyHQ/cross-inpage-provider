export function diagnoseFailure(result) {
  const summary = `${result?.summary || ''} ${result?.runner?.stderrTail || ''}`;
  if (/timed out|ERR_TIMED_OUT|navigation/i.test(summary)) {
    return { code: 'navigation_timeout', retryable: true };
  }
  if (/cookie|consent/i.test(summary)) {
    return { code: 'consent_blocker', retryable: false };
  }
  if (/No deterministic connect trigger|target not found/i.test(summary)) {
    return { code: 'connect_trigger_missing', retryable: false };
  }
  if (result?.trigger?.clicked && (result?.inspection?.walletCandidates?.length || 0) === 0) {
    return { code: 'wallet_modal_missing', retryable: false };
  }
  if (result?.inspection?.blocked || result?.status === 'blocked') {
    return { code: 'site_blocked', retryable: true };
  }
  const failedAssertion = result?.scriptedAssertions?.find(
    (assertion) => assertion.required && !assertion.passed,
  );
  const assertionCodes = {
    wallet_ids_unique: 'duplicate_injection',
    mutation_stable: 'duplicate_injection',
    reload_stable: 'adapter_not_applied_after_reload',
    provider_route: 'provider_route_mismatch',
    replacement_visible: 'adapter_not_applied',
    joint_brand_text: 'adapter_text_mismatch',
    joint_brand_icon: 'adapter_icon_mismatch',
  };
  if (failedAssertion) {
    return {
      code: assertionCodes[failedAssertion.id] || 'scripted_assertion_failed',
      retryable: false,
      assertion: failedAssertion,
    };
  }
  return { code: 'unknown', retryable: false };
}
