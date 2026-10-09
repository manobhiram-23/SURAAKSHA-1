import { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import AlertsList from '@/components/AlertsList';
import AlertDetail from '@/components/AlertDetail';
import AIChatbot from '@/components/AIChatbot';
import styles from '@/components/Dashboard.module.css';
import { 
  Search, 
  SlidersHorizontal, 
  RotateCcw, 
  Download, 
  Plus, 
  X, 
  ShieldCheck, 
  BarChart, 
  Activity, 
  AlertOctagon,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

const SAVED_ALERTS_KEY = 'suraaksha.savedAlerts';

function loadSavedAlerts() {
  const savedAlerts = window.localStorage.getItem(SAVED_ALERTS_KEY);
  if (!savedAlerts) return [];

  const parsedAlerts = JSON.parse(savedAlerts);
  if (
    !Array.isArray(parsedAlerts) ||
    parsedAlerts.some(alert =>
      !alert ||
      (typeof alert.id !== 'string' && typeof alert.id !== 'number') ||
      typeof alert.account !== 'string' ||
      typeof alert.status !== 'string'
    )
  ) {
    throw new Error('Saved case data is invalid.');
  }

  return parsedAlerts;
}

function mergeSavedAlerts(serverAlerts, savedAlerts) {
  const savedById = new Map(savedAlerts.map(alert => [alert.id, alert]));
  const serverIds = new Set(serverAlerts.map(alert => alert.id));
  const savedOnly = savedAlerts.filter(alert => !serverIds.has(alert.id));

  return [
    ...savedOnly,
    ...serverAlerts.map(alert => savedById.get(alert.id) || alert),
  ];
}

export default function Dashboard({ currentUser, onSignOut }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertsLoaded, setAlertsLoaded] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'reviews' | 'analytics' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [minSeverityFilter, setMinSeverityFilter] = useState('all');
  const [toast, setToast] = useState(null);

  // Modal for flagging new account / threat
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState('');
  const [newPlatform, setNewPlatform] = useState('Twitter / X');
  const [newType, setNewType] = useState('Impersonation & Scam');
  const [newSeverity, setNewSeverity] = useState(8);
  const [newReason, setNewReason] = useState('');
  const [newEvidenceContent, setNewEvidenceContent] = useState('');
  const [newEvidenceLink, setNewEvidenceLink] = useState('');

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // Merge API data with browser-persisted cases and reports.
  const fetchAlerts = useCallback(async () => {
    let savedAlerts = [];
    try {
      savedAlerts = loadSavedAlerts();
    } catch (storageError) {
      console.error('Failed to load saved cases:', storageError);
      showToast('Saved cases could not be loaded from this browser.');
    }

    try {
      const res = await fetch('/api/alerts');
      if (!res.ok) {
        throw new Error(`Alert request failed with status ${res.status}.`);
      }

      const serverAlerts = await res.json();
      if (!Array.isArray(serverAlerts)) {
        throw new Error('Alert service returned invalid case data.');
      }
      const mergedAlerts = mergeSavedAlerts(serverAlerts, savedAlerts);
      setAlerts(mergedAlerts);
      if (mergedAlerts.length > 0 && !selectedAlertId) {
        setSelectedAlertId(mergedAlerts[0].id);
      }
    } catch (fetchError) {
      console.error('Failed to fetch alerts:', fetchError);
      setAlerts(savedAlerts);
      if (savedAlerts.length > 0) {
        showToast('Showing cases saved in this browser; the alert service is unavailable.');
      } else {
        showToast('Unable to load cases from the alert service.');
      }
    } finally {
      setAlertsLoaded(true);
      setLoading(false);
    }
  }, [selectedAlertId, showToast]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (!alertsLoaded) return;

    try {
      window.localStorage.setItem(SAVED_ALERTS_KEY, JSON.stringify(alerts));
    } catch (storageError) {
      console.error('Failed to save cases in this browser:', storageError);
      showToast('Unable to save cases in this browser. Check available storage.');
    }
  }, [alerts, alertsLoaded, showToast]);

  // Derived filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Tab check: Active Threat Feed shows open alerts awaiting officer triage
      if (activeTab === 'alerts' && alert.status !== 'open') {
        return false;
      }

      // Case Reviews tab shows resolved/escalated/investigating cases
      if (activeTab === 'reviews' && alert.status === 'open') {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all' && alert.status !== filterStatus) {
        return false;
      }

      // Severity filter
      if (minSeverityFilter !== 'all') {
        if (alert.severity < parseInt(minSeverityFilter)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAcc = alert.account?.toLowerCase().includes(q);
        const matchesType = alert.type?.toLowerCase().includes(q);
        const matchesPlatform = alert.platform?.toLowerCase().includes(q);
        const matchesReason = alert.reason?.toLowerCase().includes(q);
        const matchesContent = alert.evidence?.content?.toLowerCase().includes(q);
        if (!matchesAcc && !matchesType && !matchesPlatform && !matchesReason && !matchesContent) {
          return false;
        }
      }

      return true;
    });
  }, [alerts, activeTab, filterStatus, minSeverityFilter, searchQuery]);

  // Ensure an alert is selected if available
  useEffect(() => {
    if (filteredAlerts.length > 0) {
      const stillExists = filteredAlerts.some(a => a.id === selectedAlertId);
      if (!stillExists) {
        setSelectedAlertId(filteredAlerts[0].id);
      }
    } else {
      setSelectedAlertId(null);
    }
  }, [filteredAlerts, selectedAlertId]);

  const selectedAlert = alerts.find(a => a.id === selectedAlertId);

  // Counts
  const openCount = alerts.filter(a => a.status === 'open').length;
  const criticalCount = alerts.filter(a => a.severity >= 8 && a.status === 'open').length;
  const reviewedCount = alerts.filter(a => a.status !== 'open').length;

  // Decision state updates
  const handleUpdateDecision = useCallback((decision) => {
    setAlerts(prev =>
      prev.map(a => (a.id === selectedAlertId ? { ...a, decision } : a))
    );
  }, [selectedAlertId]);

  const handleUpdateNotes = useCallback((notes) => {
    setAlerts(prev =>
      prev.map(a => (a.id === selectedAlertId ? { ...a, notes } : a))
    );
  }, [selectedAlertId]);

  // Submit report via API
  const handleSubmit = useCallback(async (alertId) => {
    const current = alerts.find(a => a.id === alertId);
    if (!current) return;

    try {
      setSubmitted(true);
      const officerIdentifier = currentUser
        ? `${currentUser.name} (${currentUser.badge || currentUser.role})`
        : 'Cyber-Officer #8820';

      const res = await fetch(`/api/alerts/${alertId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: current.decision,
          notes: current.notes,
          officerId: officerIdentifier
        })
      });

      if (res.ok) {
        const result = await res.json();
        setAlerts(prev =>
          prev.map(a => (a.id === alertId ? result.alert : a))
        );
        showToast(`Case #${alertId} verdict (${current.decision.toUpperCase()}) saved & filed.`);
      } else {
        showToast('Error recording verdict.');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while lodging report.');
    } finally {
      setTimeout(() => setSubmitted(false), 1500);
    }
  }, [alerts]);

  // Create new threat case via API
  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newAccount.trim()) return;

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: newAccount.startsWith('@') ? newAccount : `@${newAccount}`,
          platform: newPlatform,
          type: newType,
          severity: newSeverity,
          reason: newReason || 'Manually flagged suspicious account during SOC patrol.',
          evidence: {
            postLink: newEvidenceLink || 'https://threat-intel.internal/case',
            content: newEvidenceContent || 'Direct impersonation or automated phishing behaviour detected.',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (res.ok) {
        const created = await res.json();
        setAlerts(prev => [created, ...prev]);
        setSelectedAlertId(created.id);
        setIsModalOpen(false);
        // Reset form
        setNewAccount('');
        setNewReason('');
        setNewEvidenceContent('');
        setNewEvidenceLink('');
        showToast(`New case for ${created.account} successfully flagged.`);
      }
    } catch (err) {
      console.error(err);
      showToast('Error creating new alert case.');
    }
  };

  // Export alerts as JSON/CSV
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(alerts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `suraaksha-threat-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported alert registry as JSON.');
  };

  return (
    <div className={styles.dashboard}>
      <Sidebar
        criticalCount={criticalCount}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewCaseModal={() => setIsModalOpen(true)}
        totalAlerts={openCount}
        reviewedCount={reviewedCount}
      />

      <div className={styles.mainContent}>
        {/* Top Control Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitle}>
              {activeTab === 'alerts' && 'Threat Intelligence Feed'}
              {activeTab === 'reviews' && 'Reviewed Case Dossiers'}
              {activeTab === 'analytics' && 'SOC Analytics & Threat Overview'}
              {activeTab === 'settings' && 'SOC Configuration'}
            </div>
            <div className={styles.headerSub}>
              SURAAKSHA Real-time Threat Triage & Enforcement Center
            </div>
          </div>

          <div className={styles.headerControls}>
            <div className={styles.searchWrapper}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchBox}
                placeholder="Search handles, reasons, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className={styles.clearSearchBtn} 
                  onClick={() => setSearchQuery('')}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className={styles.selectWrapper}>
              <SlidersHorizontal size={13} className={styles.filterIcon} />
              <select
                className={styles.severitySelect}
                value={minSeverityFilter}
                onChange={(e) => setMinSeverityFilter(e.target.value)}
              >
                <option value="all">Severity: All</option>
                <option value="9">Critical (9+)</option>
                <option value="7">High (7+)</option>
                <option value="5">Medium (5+)</option>
              </select>
            </div>

            <button 
              className={styles.iconBtn} 
              onClick={handleExportData} 
              title="Export Threat Records"
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            <button 
              className={styles.primaryActionBtn}
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={14} />
              <span>Flag Account</span>
            </button>

            {/* User badge + sign out */}
            {currentUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '4px', paddingLeft: '12px', borderLeft: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{currentUser.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{currentUser.badge} · {currentUser.role}</div>
                </div>
                <button
                  onClick={onSignOut}
                  title="Sign Out"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '7px 12px', background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px',
                    color: '#fca5a5', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.16)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                >
                  ⏻ Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* View Switcher based on Active Tab */}
        {activeTab === 'alerts' || activeTab === 'reviews' ? (
          <div className={styles.contentArea}>
            <AlertsList
              alerts={filteredAlerts}
              selectedId={selectedAlertId}
              onSelect={setSelectedAlertId}
            />
            <AlertDetail
              alert={selectedAlert}
              onUpdateDecision={handleUpdateDecision}
              onUpdateNotes={handleUpdateNotes}
              onSubmit={handleSubmit}
              submitted={submitted}
            />
          </div>
        ) : activeTab === 'analytics' ? (
          <div className={styles.analyticsPane}>
            <div className={styles.analyticsGrid}>
              <div className={styles.analyticCard}>
                <div className={styles.analyticCardTitle}>
                  <AlertOctagon size={16} className={styles.iconRed} />
                  <span>Critical Escalations</span>
                </div>
                <div className={styles.analyticValue}>{criticalCount}</div>
                <div className={styles.analyticSub}>High threat score &gt;= 8 requiring prompt LEA contact</div>
              </div>

              <div className={styles.analyticCard}>
                <div className={styles.analyticCardTitle}>
                  <CheckCircle size={16} className={styles.iconGreen} />
                  <span>Total Reviewed Cases</span>
                </div>
                <div className={styles.analyticValue}>{reviewedCount}</div>
                <div className={styles.analyticSub}>Closed or dispositioned by SOC cybersecurity officers</div>
              </div>

              <div className={styles.analyticCard}>
                <div className={styles.analyticCardTitle}>
                  <Activity size={16} className={styles.iconBlue} />
                  <span>Threat Ingestion Rate</span>
                </div>
                <div className={styles.analyticValue}>+24 / hr</div>
                <div className={styles.analyticSub}>Active social crawler streams ingested</div>
              </div>

              <div className={styles.analyticCard}>
                <div className={styles.analyticCardTitle}>
                  <ShieldCheck size={16} className={styles.iconCyan} />
                  <span>False Positive Ratio</span>
                </div>
                <div className={styles.analyticValue}>4.2%</div>
                <div className={styles.analyticSub}>Dismissal frequency across AI heuristics</div>
              </div>
            </div>

            <div className={styles.analyticsSection}>
              <h3>Threat Distribution Breakdown</h3>
              <div className={styles.threatBars}>
                {['Impersonation & Scam', 'Phishing Impersonation', 'Malware Distribution', 'Coordinated Harassment', 'Credential Harvesting'].map((type, i) => {
                  const count = alerts.filter(a => a.type.toLowerCase().includes(type.toLowerCase().substring(0, 8))).length;
                  const pct = alerts.length ? Math.round((count / alerts.length) * 100) : 20;
                  return (
                    <div key={type} className={styles.threatBarRow}>
                      <span className={styles.threatBarLabel}>{type}</span>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: `${Math.max(pct, 12)}%` }}></div>
                      </div>
                      <span className={styles.threatBarVal}>{count} cases</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.settingsPane}>
            <div className={styles.settingsCard}>
              <h3>SOC Patrol & Crawler Configuration</h3>
              <p>Configure automated threat scrapers, notification channels, and webhook endpoints.</p>

              <div className={styles.settingGroup}>
                <label>Telegram / Discord SOC Webhook</label>
                <input type="text" defaultValue="https://internal-soc.suraaksha.gov/webhooks/alerts" className={styles.settingInput} />
              </div>

              <div className={styles.settingGroup}>
                <label>Default Officer Identifier</label>
                <input type="text" defaultValue="Officer #8820 (Cyber Surveillance Wing)" className={styles.settingInput} />
              </div>

              <div className={styles.settingGroup}>
                <label>Auto-Escalate Critical Threats (Severity &gt;= 9)</label>
                <select className={styles.settingInput} defaultValue="enabled">
                  <option value="enabled">Enabled (Notify LEA Dispatch automatically)</option>
                  <option value="disabled">Disabled (Manual verification required)</option>
                </select>
              </div>

              <button className={styles.saveSettingsBtn} onClick={() => showToast('Configuration saved successfully.')}>
                Save Configuration
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Flag New Account Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <AlertOctagon size={18} className={styles.modalIcon} />
                <span>Flag New Suspicious Account</span>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className={styles.modalForm}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Account Handle / Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="@threat_user_handle"
                  className={styles.formInput}
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                />
              </div>

              <div className={styles.formGrid2}>
                <div>
                  <label className={styles.formLabel}>Platform</label>
                  <select 
                    className={styles.formInput} 
                    value={newPlatform} 
                    onChange={(e) => setNewPlatform(e.target.value)}
                  >
                    <option value="Twitter / X">Twitter / X</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Telegram / Discord">Telegram / Discord</option>
                    <option value="Facebook">Facebook</option>
                    <option value="YouTube">YouTube</option>
                  </select>
                </div>

                <div>
                  <label className={styles.formLabel}>Threat Category</label>
                  <select 
                    className={styles.formInput} 
                    value={newType} 
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="Impersonation & Scam">Impersonation & Scam</option>
                    <option value="Phishing Impersonation">Phishing Impersonation</option>
                    <option value="Malware Distribution">Malware Distribution</option>
                    <option value="Credential Harvesting">Credential Harvesting</option>
                    <option value="Coordinated Harassment">Coordinated Harassment</option>
                    <option value="Misinformation Campaign">Misinformation Campaign</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Severity Score (1 to 10): <strong>{newSeverity}</strong></label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  className={styles.formRange}
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(parseInt(e.target.value))}
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Flagging Reason / Threat Vector</label>
                <input
                  type="text"
                  placeholder="e.g. Impersonating central banking support with fraudulent domain"
                  className={styles.formInput}
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Post URL / Evidence Link</label>
                <input
                  type="text"
                  placeholder="https://x.com/handle/status/..."
                  className={styles.formInput}
                  value={newEvidenceLink}
                  onChange={(e) => setNewEvidenceLink(e.target.value)}
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Extracted Post Payload / Evidence Text</label>
                <textarea
                  rows="3"
                  placeholder="Paste suspected tweet/post text here..."
                  className={styles.formTextarea}
                  value={newEvidenceContent}
                  onChange={(e) => setNewEvidenceContent(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn} 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitCaseBtn}>
                  Log Case to Threat Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={styles.toast}>
          <CheckCircle size={16} className={styles.toastIcon} />
          <span>{toast}</span>
        </div>
      )}

      {/* AI Threat Copilot Chatbot */}
      <AIChatbot currentAlertId={selectedAlertId} />
    </div>
  );
}
