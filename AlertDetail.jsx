import { useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import SeverityBadge from '@/components/SeverityBadge';
import { formatTime } from '@/lib/utils';
import styles from '@/components/AlertDetail.module.css';
import { 
  ShieldAlert, 
  ExternalLink, 
  Clock, 
  Users, 
  MapPin, 
  FileCheck, 
  AlertTriangle,
  Send,
  Printer,
  History,
  Info
} from 'lucide-react';

export default function AlertDetail({
  alert,
  onUpdateDecision,
  onUpdateNotes,
  onSubmit,
  submitted
}) {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!alert) {
    return (
      <div className={styles.detailPane}>
        <div className={styles.detailEmpty}>
          <ShieldAlert size={48} className={styles.emptyShield} />
          <h3>No Threat Selected</h3>
          <p>Choose an alert from the left feed to inspect evidence, telemetry, and lodge officer determination.</p>
        </div>
      </div>
    );
  }

  const handleCopyLink = () => {
    if (alert.evidence?.postLink) {
      navigator.clipboard.writeText(alert.evidence.postLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className={styles.detailPane}>
      {/* Top Header */}
      <div className={styles.detailHeader}>
        <div className={styles.detailTitleRow}>
          <div className={styles.accountIdentity}>
            <div className={styles.detailAccountName}>
              {alert.account.startsWith('@') ? alert.account : `@${alert.account}`}
            </div>
            <div className={styles.subIdentity}>
              <span className={styles.platformBadge}>{alert.platform}</span>
              <StatusBadge status={alert.status} />
              <span className={styles.caseIdBadge}>Case #{alert.id}</span>
            </div>
          </div>

          <div className={styles.headerRightActions}>
            <button 
              className={styles.toolBtn} 
              onClick={handlePrintDossier} 
              title="Print Threat Briefing"
            >
              <Printer size={15} />
              <span>Print Brief</span>
            </button>
            <div className={styles.severityCard}>
              <span className={styles.detailScoreLabel}>Threat Index</span>
              <div className={styles.detailScoreBadge}>
                <span className={styles.scoreVal}>{alert.severity}</span>
                <span className={styles.scoreMax}>/10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Meta Grid */}
        <div className={styles.detailMetaGrid}>
          <div className={styles.metaCell}>
            <div className={styles.metaCellLabel}>Category</div>
            <div className={styles.metaCellValue}>{alert.type}</div>
          </div>
          <div className={styles.metaCell}>
            <div className={styles.metaCellLabel}>Flagged Time</div>
            <div className={styles.metaCellValue}>
              <Clock size={13} style={{ marginRight: 4, display: 'inline' }} />
              {formatTime(alert.flaggedAt)}
            </div>
          </div>
          <div className={styles.metaCell}>
            <div className={styles.metaCellLabel}>User Reports</div>
            <div className={styles.metaCellValue}>
              <Users size={13} style={{ marginRight: 4, display: 'inline' }} />
              {alert.reportedBy}
            </div>
          </div>
          <div className={styles.metaCell}>
            <div className={styles.metaCellLabel}>Account Age</div>
            <div className={styles.metaCellValue}>Est. {alert.accountProfile?.created || 'Unknown'}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.detailContent}>
        {/* Detection Rationale */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <AlertTriangle size={16} className={styles.sectionIconWarning} />
            <h4 className={styles.sectionTitle}>Detection Rationale & Threat Vector</h4>
          </div>
          <div className={styles.reasonBox}>
            <div className={styles.reasonTitle}>Heuristic Rule & AI Behavioral Match</div>
            <div className={styles.reasonText}>{alert.reason}</div>
          </div>
        </div>

        {/* Evidence Vault */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <FileCheck size={16} className={styles.sectionIcon} />
            <h4 className={styles.sectionTitle}>Corroborating Evidence</h4>
          </div>

          <div className={styles.evidenceGrid}>
            <div className={styles.evidenceRow}>
              <span className={styles.evidenceLabel}>Direct URL:</span>
              <div className={styles.evidenceContentRow}>
                <a 
                  href={alert.evidence?.postLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.evidenceLink}
                >
                  {alert.evidence?.postLink}
                  <ExternalLink size={13} style={{ marginLeft: 6 }} />
                </a>
                <button className={styles.copyBtn} onClick={handleCopyLink}>
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className={styles.evidenceRow}>
              <span className={styles.evidenceLabel}>Extracted Post Payload:</span>
              <div className={styles.payloadBox}>
                <code>"{alert.evidence?.content}"</code>
              </div>
            </div>

            <div className={styles.evidenceRow}>
              <span className={styles.evidenceLabel}>Timestamp Recorded:</span>
              <div className={styles.timestampVal}>
                {alert.evidence?.timestamp 
                  ? new Date(alert.evidence.timestamp).toUTCString() 
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Target Profile Dossier */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <Info size={16} className={styles.sectionIcon} />
            <h4 className={styles.sectionTitle}>Target Account Intelligence</h4>
          </div>

          <div className={styles.profileGrid}>
            <div className={styles.profileStat}>
              <span className={styles.profileStatLabel}>Handle</span>
              <span className={styles.profileStatValue}>
                {alert.accountProfile?.username ? `@${alert.accountProfile.username}` : alert.account}
              </span>
            </div>
            <div className={styles.profileStat}>
              <span className={styles.profileStatLabel}>Network Reach</span>
              <span className={styles.profileStatValue}>{alert.accountProfile?.followers || '0'} followers</span>
            </div>
            <div className={styles.profileStat}>
              <span className={styles.profileStatLabel}>Created</span>
              <span className={styles.profileStatValue}>{alert.accountProfile?.created || 'Unknown'}</span>
            </div>
            <div className={styles.profileStat}>
              <span className={styles.profileStatLabel}>Geo Location</span>
              <span className={styles.profileStatValue}>
                <MapPin size={13} style={{ marginRight: 4, display: 'inline' }} />
                {alert.accountProfile?.location || 'Undisclosed'}
              </span>
            </div>
          </div>
        </div>

        {/* Existing Review Info if already reviewed */}
        {alert.status !== 'open' && (
          <div className={styles.reviewedNotice}>
            <History size={16} />
            <div>
              <strong>Case logged as {alert.status.toUpperCase()}</strong>
              {alert.reviewedBy && <span> by {alert.reviewedBy}</span>}
              {alert.reviewedAt && <span> on {new Date(alert.reviewedAt).toLocaleString()}</span>}
            </div>
          </div>
        )}

        {/* Officer Action Form */}
        <div className={styles.decisionSection}>
          <div className={styles.sectionHeader}>
            <ShieldAlert size={16} className={styles.sectionIcon} />
            <h4 className={styles.sectionTitle}>Officer Disposition & Enforcement Action</h4>
          </div>

          <div className={styles.decisionButtonsGrid}>
            <button
              type="button"
              className={`${styles.decisionBtn} ${alert.decision === 'confirm' ? styles.btnConfirm : ''}`}
              onClick={() => onUpdateDecision('confirm')}
            >
              <span className={styles.decisionRadio}></span>
              Confirm Threat
            </button>

            <button
              type="button"
              className={`${styles.decisionBtn} ${alert.decision === 'escalate' ? styles.btnEscalate : ''}`}
              onClick={() => onUpdateDecision('escalate')}
            >
              <span className={styles.decisionRadio}></span>
              Escalate to Law Enforcement
            </button>

            <button
              type="button"
              className={`${styles.decisionBtn} ${alert.decision === 'investigate' ? styles.btnInvestigate : ''}`}
              onClick={() => onUpdateDecision('investigate')}
            >
              <span className={styles.decisionRadio}></span>
              Further Forensic Probe
            </button>

            <button
              type="button"
              className={`${styles.decisionBtn} ${alert.decision === 'dismiss' ? styles.btnDismiss : ''}`}
              onClick={() => onUpdateDecision('dismiss')}
            >
              <span className={styles.decisionRadio}></span>
              Dismiss / False Positive
            </button>
          </div>

          <div className={styles.notesContainer}>
            <label className={styles.notesLabel}>Officer Incident Log / Justification</label>
            <textarea
              className={styles.notesTextarea}
              placeholder="Record investigative steps, domain whois findings, C2 addresses, or rationale before submitting..."
              value={alert.notes || ''}
              onChange={(e) => onUpdateNotes(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={styles.submitBtn}
            disabled={!alert.decision || submitted}
            onClick={() => onSubmit(alert.id)}
          >
            {submitted ? (
              <>
                <FileCheck size={16} />
                <span>Verdict Logged to Database</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Submit Official Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
