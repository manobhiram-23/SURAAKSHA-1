'use client';

import { useState, useCallback } from 'react';
import { mockAlerts } from '@/lib/mockData';
import Sidebar from '@/components/Sidebar';
import AlertsList from '@/components/AlertsList';
import AlertDetail from '@/components/AlertDetail';
import styles from '@/components/Dashboard.module.css';

export default function Dashboard() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState(null);

  const filteredAlerts =
    filterStatus === 'all'
      ? alerts
      : alerts.filter(a => a.status === filterStatus);

  const selectedAlert = alerts.find(a => a.id === selectedAlertId);

  const criticalCount = alerts.filter(
    a => a.severity >= 8 && a.status === 'open'
  ).length;

  const handleUpdateDecision = useCallback(
    decision => {
      setAlerts(prev =>
        prev.map(a =>
          a.id === selectedAlertId ? { ...a, decision } : a
        )
      );
    },
    [selectedAlertId]
  );

  const handleUpdateNotes = useCallback(
    notes => {
      setAlerts(prev =>
        prev.map(a =>
          a.id === selectedAlertId ? { ...a, notes } : a
        )
      );
    },
    [selectedAlertId]
  );

  const handleSubmit = useCallback(
    alertId => {
      setAlerts(prev =>
        prev.map(a =>
          a.id === alertId ? { ...a, status: 'reviewed' } : a
        )
      );
      setSubmitted(true);
      setToast('Report submitted successfully. Case marked as reviewed.');
      setTimeout(() => {
        setSubmitted(false);
        setToast(null);
      }, 2000);
    },
    []
  );

  return (
    <div className={styles.dashboard}>
      <Sidebar
        criticalCount={criticalCount}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>Threat Alerts</div>
          <div className={styles.headerControls}>
            <input
              type="text"
              className={styles.searchBox}
              placeholder="Search accounts..."
            />
            <button className={styles.filterBtn}>Advanced</button>
          </div>
        </div>

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
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
