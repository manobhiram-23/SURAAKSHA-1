import SeverityBadge from '@/components/SeverityBadge';
import StatusBadge from '@/components/StatusBadge';
import { formatTime } from '@/lib/utils';
import styles from '@/components/AlertsList.module.css';
import { AlertCircle, ShieldQuestion } from 'lucide-react';

export default function AlertsList({ alerts, selectedId, onSelect }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <ShieldQuestion size={36} className={styles.emptyIcon} />
        <div className={styles.emptyTitle}>No matching cases found</div>
        <div className={styles.emptyDesc}>Try adjusting your filter or search query.</div>
      </div>
    );
  }

  return (
    <div className={styles.alertsList}>
      {alerts.map(alert => {
        const isSelected = selectedId === alert.id;
        return (
          <div
            key={alert.id}
            className={`${styles.alertItem} ${isSelected ? styles.selected : ''}`}
            onClick={() => onSelect(alert.id)}
            role="button"
            tabIndex={0}
          >
            <div className={styles.alertHeader}>
              <div className={styles.alertAccount}>
                {alert.account.startsWith('@') ? alert.account : `@${alert.account}`}
              </div>
              <SeverityBadge severity={alert.severity} />
            </div>

            <div className={styles.subMetaRow}>
              <span className={styles.platformBadge}>{alert.platform || 'Social Web'}</span>
              <StatusBadge status={alert.status} />
            </div>

            <div className={styles.alertType}>{alert.type}</div>

            <div className={styles.alertPreview}>
              "{alert.evidence?.content?.length > 70 
                ? `${alert.evidence.content.substring(0, 70)}...` 
                : alert.evidence?.content}"
            </div>

            <div className={styles.alertFooter}>
              <span className={styles.alertTime}>{formatTime(alert.flaggedAt)}</span>
              <span className={styles.reportedBadge}>{alert.reportedBy}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
