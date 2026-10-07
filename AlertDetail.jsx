import StatusBadge from '@/components/StatusBadge';
import SeverityBadge from '@/components/SeverityBadge';
import { formatTime } from '@/lib/utils';
import styles from '@/components/AlertDetail.module.css';

export default function AlertDetail({
  alert,
  onUpdateDecision,
  onUpdateNotes,
  onSubmit,
  submitted
}) {
  if (!alert) {
    return (
      <div className={styles.detailPane}>
        <div className={styles.detailEmpty}>Select an alert to review</div>
      </div>
    );
  }

  return (
    <div className={styles.detailPane}>
      <div className={styles.detailHeader}>
        <div className={styles.detailTitleRow}>
          <div>
            <div className={styles.detailAccountName}>{alert.account}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {alert.platform} • <StatusBadge status={alert.status} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.detailScoreLabel}>Severity Score</div>
            <div className={styles.detailScore}>{alert.severity}/10</div>
          </div>
        </div>
        <div className={styles.detailMeta}>
          <div className={styles.detailMetaItem}>
            <div className={styles.detailMetaLabel}>Type</div>
            <div className={styles.detailMetaValue}>{alert.type}</div>
          </div>
          <div className={styles.detailMetaItem}>
            <div className={styles.detailMetaLabel}>Flagged</div>
            <div className={styles.detailMetaValue}>{formatTime(alert.flaggedAt)}</div>
          </div>
          <div className={styles.detailMetaItem}>
            <div className={styles.detailMetaLabel}>Reports</div>
            <div className={styles.detailMetaValue}>{alert.reportedBy}</div>
          </div>
          <div className={styles.detailMetaItem}>
            <div className={styles.detailMetaLabel}>Username Created</div>
            <div className={styles.detailMetaValue}>{alert.accountProfile.created}</div>
          </div>
        </div>
      </div>

      <div className={styles.detailContent}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Flagging Reason</div>
          <div className={styles.reasonBox}>
            <div className={styles.reasonTitle}>Why This Account Was Flagged</div>
            <div className={styles.reasonText}>{alert.reason}</div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Evidence</div>
          <div className={styles.evidenceItem}>
            <div className={styles.evidenceLabel}>Post Link</div>
            <div className={styles.evidenceContent}>
              <a href={alert.evidence.postLink} className={styles.evidenceLink} target="_blank" rel="noopener">
                {alert.evidence.postLink}
              </a>
            </div>
          </div>
          <div className={styles.evidenceItem}>
            <div className={styles.evidenceLabel}>Post Content</div>
            <div className={styles.evidenceContent}>"{alert.evidence.content}"</div>
          </div>
          <div className={styles.evidenceItem}>
            <div className={styles.evidenceLabel}>Timestamp</div>
            <div className={styles.evidenceContent}>
              {new Date(alert.evidence.timestamp).toLocaleString()}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Account Profile</div>
          <div className={styles.evidenceItem}>
            <div className={styles.evidenceLabel}>Username</div>
            <div className={styles.evidenceContent}>{alert.accountProfile.username}</div>
          </div>
          <div className={styles.evidenceItem}>
            <div className={styles.evidenceLabel}>Followers</div>
            <div className={styles.evidenceContent}>{alert.accountProfile.followers}</div>
          </div>
          <div className={styles.evidenceItem}>
            <div className={styles.evidenceLabel}>Account Created</div>
            <div className={styles.evidenceContent}>{alert.accountProfile.created}</div>
          </div>
          <div className={styles.evidenceItem}>
            <div className={styles.evidenceLabel}>Location</div>
            <div className={styles.evidenceContent + ' ' + styles.locationText}>
              {alert.accountProfile.location}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Officer Review & Decision</div>
          <div className={styles.actionSection}>
            <div className={styles.actionTitle}>Assessment</div>
            <div className={styles.decisionOptions}>
              <button
                className={`${styles.decisionBtn} ${alert.decision === 'confirm' ? styles.selected : ''}`}
                onClick={() => onUpdateDecision('confirm')}
              >
                Confirm Threat
              </button>
              <button
                className={`${styles.decisionBtn} ${alert.decision === 'escalate' ? styles.selected : ''}`}
                onClick={() => onUpdateDecision('escalate')}
              >
                Escalate
              </button>
              <button
                className={`${styles.decisionBtn} ${alert.decision === 'investigate' ? styles.selected : ''}`}
                onClick={() => onUpdateDecision('investigate')}
              >
                Needs Investigation
              </button>
              <button
                className={`${styles.decisionBtn} ${alert.decision === 'dismiss' ? styles.selected : ''}`}
                onClick={() => onUpdateDecision('dismiss')}
              >
                Dismiss
              </button>
            </div>
            <textarea
              className={styles.notesTextarea}
              placeholder="Record your analysis, findings, or context for this decision..."
              value={alert.notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
            />
            <button
              className={styles.submitBtn}
              disabled={!alert.decision || submitted}
              onClick={() => onSubmit(alert.id)}
            >
              {submitted ? '✓ Report Submitted' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
