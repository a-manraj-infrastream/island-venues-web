import { Button } from '@/components/common/Button';
import { Notice } from '@/components/common/Notice';
import { SignInRequired } from '@/components/common/SignInRequired';
import { errorMessage, isUnauthorized } from '@/errorMessage';
import { strings } from '@/strings';

interface Props {
  error: unknown;
  onRetry?: () => void;
}

/** Renders a failed call: the sign-in state for 401, an alert otherwise. */
export function ErrorState({ error, onRetry }: Props) {
  if (isUnauthorized(error)) return <SignInRequired />;
  return (
    <Notice
      tone="error"
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            {strings.errors.retry}
          </Button>
        )
      }
    >
      <p>{errorMessage(error)}</p>
    </Notice>
  );
}
