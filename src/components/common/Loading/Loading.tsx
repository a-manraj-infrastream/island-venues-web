import styles from './Loading.module.css';

interface Props {
  label: string;
}

export function Loading({ label }: Props) {
  return (
    <p className={styles.loading} role="status">
      {label}
    </p>
  );
}
