/**
 * SURAAKSHA E2E Tests — API Layer
 * Tests the alerts REST API directly (no browser needed for these).
 */
const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:3000';

test.describe('API: GET /api/alerts', () => {
  test('should return 200 and an array of alerts', async ({ request }) => {
    const res = await request.get(`${BASE}/api/alerts`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test('each alert has required fields', async ({ request }) => {
    const res = await request.get(`${BASE}/api/alerts`);
    const alerts = await res.json();
    for (const alert of alerts) {
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('account');
      expect(alert).toHaveProperty('platform');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('status');
      expect(typeof alert.account).toBe('string');
      expect(typeof alert.severity).toBe('number');
    }
  });

  test('severity filter works (severity >= 9)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/alerts?severity=9`);
    expect(res.status()).toBe(200);
    const alerts = await res.json();
    for (const alert of alerts) {
      expect(alert.severity).toBeGreaterThanOrEqual(9);
    }
  });

  test('status filter works (status=open)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/alerts?status=open`);
    expect(res.status()).toBe(200);
    const alerts = await res.json();
    for (const alert of alerts) {
      expect(alert.status).toBe('open');
    }
  });

  test('search filter works', async ({ request }) => {
    const res = await request.get(`${BASE}/api/alerts?search=crypto`);
    expect(res.status()).toBe(200);
    const alerts = await res.json();
    expect(alerts.length).toBeGreaterThan(0);
    for (const alert of alerts) {
      const combined = `${alert.account} ${alert.type} ${alert.reason} ${alert.platform}`.toLowerCase();
      expect(combined).toContain('crypto');
    }
  });
});

test.describe('API: POST /api/alerts', () => {
  test('should create a new alert with valid payload', async ({ request }) => {
    const payload = {
      account: '@e2e_test_account',
      platform: 'Twitter / X',
      type: 'Phishing Impersonation',
      severity: 7,
      reason: 'E2E test: phishing account detected',
    };

    const res = await request.post(`${BASE}/api/alerts`, { data: payload });
    expect(res.status()).toBe(201);
    const created = await res.json();
    expect(created.account).toBe('@e2e_test_account');
    expect(created.severity).toBe(7);
    expect(created.status).toBe('open');
    expect(created).toHaveProperty('id');
  });

  test('should return 400 when account is missing', async ({ request }) => {
    const res = await request.post(`${BASE}/api/alerts`, {
      data: { type: 'Malware Distribution' },
    });
    expect(res.status()).toBe(400);
  });

  test('should return 400 when type is missing', async ({ request }) => {
    const res = await request.post(`${BASE}/api/alerts`, {
      data: { account: '@some_account' },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('API: GET /api/alerts/[id]', () => {
  test('should fetch a specific alert by id', async ({ request }) => {
    // Get all alerts first, then pick one
    const listRes = await request.get(`${BASE}/api/alerts`);
    const alerts = await listRes.json();
    expect(alerts.length).toBeGreaterThan(0);

    const targetId = alerts[0].id;
    const res = await request.get(`${BASE}/api/alerts/${targetId}`);
    expect(res.status()).toBe(200);
    const alert = await res.json();
    expect(alert.id).toBe(targetId);
  });

  test('should return 404 for non-existent alert', async ({ request }) => {
    const res = await request.get(`${BASE}/api/alerts/999999999`);
    expect(res.status()).toBe(404);
  });
});

test.describe('API: PATCH /api/alerts/[id]', () => {
  test('should update alert decision and status', async ({ request }) => {
    // Get an open alert
    const listRes = await request.get(`${BASE}/api/alerts?status=open`);
    const openAlerts = await listRes.json();
    
    if (openAlerts.length === 0) {
      test.skip();
      return;
    }

    const targetId = openAlerts[0].id;
    const res = await request.patch(`${BASE}/api/alerts/${targetId}`, {
      data: { decision: 'investigate', status: 'investigating', notes: 'E2E test investigation' },
    });
    expect(res.status()).toBe(200);
    const updated = await res.json();
    expect(updated.decision).toBe('investigate');
  });
});

test.describe('API: POST /api/alerts/[id]/report', () => {
  test('should submit a report verdict', async ({ request }) => {
    // Create a fresh alert to report on
    const createRes = await request.post(`${BASE}/api/alerts`, {
      data: {
        account: '@e2e_report_test',
        type: 'Credential Harvesting',
        severity: 8,
        reason: 'E2E test credential harvesting',
      },
    });
    const created = await createRes.json();

    const res = await request.post(`${BASE}/api/alerts/${created.id}/report`, {
      data: {
        decision: 'confirm',
        notes: 'E2E test: confirmed threat',
        officerId: 'E2E Test Officer',
      },
    });
    expect(res.status()).toBe(200);
    const result = await res.json();
    expect(result.success).toBe(true);
    expect(result.alert).toBeDefined();
    expect(result.alert.decision).toBe('confirm');
    expect(result.alert.status).not.toBe('open');
  });

  test('should return 400 when decision is missing', async ({ request }) => {
    const createRes = await request.post(`${BASE}/api/alerts`, {
      data: {
        account: '@e2e_no_decision',
        type: 'Malware Distribution',
        severity: 5,
        reason: 'E2E test',
      },
    });
    const created = await createRes.json();

    const res = await request.post(`${BASE}/api/alerts/${created.id}/report`, {
      data: { notes: 'no decision provided' },
    });
    expect(res.status()).toBe(400);
  });

  test('should return 405 for non-POST methods', async ({ request }) => {
    const res = await request.get(`${BASE}/api/alerts/1/report`);
    expect(res.status()).toBe(405);
  });
});

test.describe('API: Method validation', () => {
  test('DELETE /api/alerts should return 405', async ({ request }) => {
    const res = await request.delete(`${BASE}/api/alerts`);
    expect(res.status()).toBe(405);
  });

  test('PUT /api/alerts/1 should return 405', async ({ request }) => {
    const res = await request.put(`${BASE}/api/alerts/1`, {
      data: { account: 'test' },
    });
    expect(res.status()).toBe(405);
  });
});
