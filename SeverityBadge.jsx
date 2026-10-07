import styles from '@/components/SeverityBadge.module.css';

export default function SeverityBadge({ severity }) {
  let label = 'Low';
  let className = styles.low;

  if (severity >= 9) {
    label = 'Critical';
    className = styles.critical;
  } else if (severity >= 7) {
    label = 'High';
    className = styles.high;
  } else if (severity >= 4) {
    label = 'Medium';
    className = styles.medium;
  }

  return (
    <span className={`${styles.badge} ${className}`}>
      <span className={styles.dot}></span>
      {label} ({severity})
    </span>
  );
}
