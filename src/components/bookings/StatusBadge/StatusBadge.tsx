import type { BookingStatus } from '@/api';
import { strings } from '@/strings';
import styles from './StatusBadge.module.css';

interface Props {
  status: BookingStatus;
}

const TONE: Record<BookingStatus, string | undefined> = {
  PENDING: styles.pending,
  APPROVED: styles.approved,
  PAID: styles.approved,
  REJECTED: styles.rejected,
  CANCELLED: styles.cancelled,
};

export function StatusBadge({ status }: Props) {
  return <span className={`${styles.badge} ${TONE[status] ?? ''}`}>{strings.myBookings.statuses[status]}</span>;
}
