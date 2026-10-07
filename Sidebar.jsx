import styles from '@/components/Sidebar.module.css';

export default function Sidebar({ criticalCount, filterStatus, onFilterChange }) {
  return (
    <div className={styles.sidebar}>
      <div>
        <div className={styles.logo}>SURAAKSHA</div>
        <div className={styles.logoSub}>Alert Dashboard</div>
      </div>

      <div>
        <div className={styles.navSection}>
          <div className={styles.navLabel}>Navigation</div>
          <div className={styles.navItem + ' ' + styles.active}>Alerts</div>
          <div className={styles.navItem}>My Reviews</div>
          <div className={styles.navItem}>Reports</div>
          <div className={styles.navItem}>Settings</div>
        </div>
      </div>

      <div>
        <div className={styles.navSection}>
          <div className={styles.navLabel}>Filters</div>
          <div
            className={`${styles.navItem} ${filterStatus === 'all' ? styles.active : ''}`}
            onClick={() => onFilterChange('all')}
            role="button"
            tabIndex={0}
          >
            All Alerts
          </div>
          <div
            className={`${styles.navItem} ${filterStatus === 'open' ? styles.active : ''}`}
            onClick={() => onFilterChange('open')}
            role="button"
            tabIndex={0}
          >
            Open
          </div>
          <div
            className={`${styles.navItem} ${filterStatus === 'reviewed' ? styles.active : ''}`}
            onClick={() => onFilterChange('reviewed')}
            role="button"
            tabIndex={0}
          >
            Reviewed
          </div>
        </div>

        <div className={styles.navStat}>
          <div className={styles.navStatLabel}>Critical Open</div>
          <div className={styles.navStatValue}>{criticalCount}</div>
        </div>
      </div>
    </div>
  );
}
