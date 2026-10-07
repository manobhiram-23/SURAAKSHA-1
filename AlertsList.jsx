import SeverityBadge from '@/components/SeverityBadge';
import { formatTime } from '@/lib/utils';
import styles from '@/components/AlertsList.module.css';

export default function AlertsList({ alerts, selectedId, onSelect }) {
  return (
    <div className={styles.alertsList}>
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`${styles.alertItem} ${selectedId === alert.id ? styles.selected : ''}`}
          onClick={() => onSelect(alert.id)}
          role="button"
          tabIndex={0}
        >
          <div className={styles.alertHeader}>
            <div className={styles.alertAccount}>@{alert.account.substring(1)}</div>
            <SeverityBadge severity={alert.severity} />
          </div>
          <div className={styles.alertType}>{alert.type}</div>
          <div className={styles.alertPreview}>
            {alert.evidence.content.substring(0, 60)}...
          </div>
          <div className={styles.alertTime}>
            {formatTime(alert.flaggedAt)} • {alert.reportedBy}
          </div>
        </div>
      ))}
    </div>
  );
}
