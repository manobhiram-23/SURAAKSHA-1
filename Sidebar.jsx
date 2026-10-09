import styles from '@/components/Sidebar.module.css';
import { 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Settings, 
  Filter, 
  PlusCircle, 
  BarChart3,
  Flame,
  Radio
} from 'lucide-react';

export default function Sidebar({ 
  criticalCount, 
  filterStatus, 
  onFilterChange, 
  activeTab, 
  onTabChange,
  onOpenNewCaseModal,
  totalAlerts,
  reviewedCount
}) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.topBrand}>
        <div className={styles.logoBadge}>
          <img 
            src="/logo.png" 
            alt="SURAAKSHA Logo" 
            className={styles.logoImage} 
          />
          <div>
            <div className={styles.logo}>SURAAKSHA</div>
            <div className={styles.logoSub}>Cyber Defense SOC</div>
          </div>
        </div>
        <div className={styles.liveIndicator}>
          <Radio size={12} className={styles.livePulse} />
          <span>LIVE RADAR</span>
        </div>
      </div>

      <div className={styles.navBlock}>
        <div className={styles.navLabel}>Operations</div>
        <button
          className={`${styles.navItem} ${activeTab === 'alerts' ? styles.active : ''}`}
          onClick={() => onTabChange('alerts')}
        >
          <Flame size={16} />
          <span>Active Threat Feed</span>
          <span className={styles.countBadge}>{totalAlerts}</span>
        </button>

        <button
          className={`${styles.navItem} ${activeTab === 'reviews' ? styles.active : ''}`}
          onClick={() => onTabChange('reviews')}
        >
          <CheckCircle2 size={16} />
          <span>Case Reviews</span>
          <span className={styles.countBadge}>{reviewedCount}</span>
        </button>

        <button
          className={`${styles.navItem} ${activeTab === 'analytics' ? styles.active : ''}`}
          onClick={() => onTabChange('analytics')}
        >
          <BarChart3 size={16} />
          <span>Threat Analytics</span>
        </button>

        <button
          className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => onTabChange('settings')}
        >
          <Settings size={16} />
          <span>SOC Settings</span>
        </button>
      </div>

      <div className={styles.navBlock}>
        <div className={styles.navLabel}>
          <Filter size={12} style={{ marginRight: 4 }} />
          Status Filters
        </div>
        <button
          className={`${styles.filterItem} ${filterStatus === 'all' ? styles.filterActive : ''}`}
          onClick={() => onFilterChange('all')}
        >
          <span>All Cases</span>
        </button>
        <button
          className={`${styles.filterItem} ${filterStatus === 'open' ? styles.filterActive : ''}`}
          onClick={() => onFilterChange('open')}
        >
          <span>Open Investigation</span>
        </button>
        <button
          className={`${styles.filterItem} ${filterStatus === 'reviewed' ? styles.filterActive : ''}`}
          onClick={() => onFilterChange('reviewed')}
        >
          <span>Resolved / Reviewed</span>
        </button>
        <button
          className={`${styles.filterItem} ${filterStatus === 'escalated' ? styles.filterActive : ''}`}
          onClick={() => onFilterChange('escalated')}
        >
          <span>Escalated to LEA</span>
        </button>
      </div>

      <div className={styles.actionBlock}>
        <button className={styles.newAlertBtn} onClick={onOpenNewCaseModal}>
          <PlusCircle size={16} />
          <span>Flag New Account</span>
        </button>
      </div>

      <div className={styles.criticalCard}>
        <div className={styles.criticalCardHeader}>
          <span className={styles.criticalPulse}></span>
          <span>HIGH PRIORITY THREATS</span>
        </div>
        <div className={styles.criticalCount}>{criticalCount}</div>
        <div className={styles.criticalHint}>
          {criticalCount > 0 ? 'Requires immediate action by lead officer' : 'No critical alerts pending'}
        </div>
      </div>
    </aside>
  );
}
