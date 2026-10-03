/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional, public (bundled) URL the "Sign in" button navigates to. A
   * same-origin path (e.g. /signin) or an https URL. Unset: reload the page and
   * let the edge start sign-in.
   */
  readonly VITE_SIGN_IN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
