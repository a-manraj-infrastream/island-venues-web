import type { ReactNode } from 'react';
import styles from './Notice.module.css';

export type NoticeTone = 'error' | 'success' | 'info';

interface Props {
  tone: NoticeTone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}

/** Inline message. Errors use role="alert" so screen readers announce them. */
export function Notice({ tone, title, children, action }: Props) {
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {children && <div className={styles.body}>{children}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
