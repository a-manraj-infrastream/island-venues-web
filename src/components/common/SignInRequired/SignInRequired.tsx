import { useCallback } from 'react';
import { signInUrl } from '@/auth';
import { Button } from '@/components/common/Button';
import { Notice } from '@/components/common/Notice';
import { strings } from '@/strings';

/**
 * Shown when the API answers 401. The edge handles the actual sign-in, so the
 * button just navigates somewhere the edge intercepts.
 */
export function SignInRequired() {
  const handleSignIn = useCallback(() => {
    window.location.assign(signInUrl());
  }, []);

  return (
    <Notice
      tone="info"
      title={strings.auth.signInRequired}
      action={<Button onClick={handleSignIn}>{strings.auth.signIn}</Button>}
    >
      <p>{strings.auth.signInExplanation}</p>
    </Notice>
  );
}
