import styles from '@/components/StatusBadge.module.css';

export default function StatusBadge({ status }) {
  const statusMap = {
    open: { class: 'statusOpen', label: 'Open' },
    reviewed: { class: 'statusReviewed', label: 'Reviewed' },
    escalated: { class: 'statusEscalated', label: 'Escalated' }
  };
  
  const s = statusMap[status] || statusMap.open;
  
  return (
    <span className={`${styles.badge} ${styles[s.class]}`}>
      {s.label}
    </span>
  );
}
