import { getSeverityClass, getSeverityLabel } from '@/lib/utils';
import styles from '@/components/SeverityBadge.module.css';

export default function SeverityBadge({ severity }) {
  const className = getSeverityClass(severity);
  const label = getSeverityLabel(severity);

  return (
    <span className={`${styles.badge} ${styles[className]}`}>
      {label}
    </span>
  );
}
