export const mockAlerts = [
  {
    id: 1,
    account: "@crypto_rewards_777",
    platform: "Twitter / X",
    type: "Impersonation & Scam",
    severity: 9,
    status: "open",
    flaggedAt: "2024-10-07T14:32:00Z",
    reportedBy: "3 users",
    evidence: {
      postLink: "https://twitter.com/crypto_rewards_777/status/1234567890",
      content: "Congratulations! You won 2 ETH! Claim here: bit.ly/xyz123",
      timestamp: "2024-10-07T14:25:00Z"
    },
    reason: "Account impersonates @CryptoRewards (verified). Uses similar handle, posts identical scam content promising free cryptocurrency with shortened links.",
    accountProfile: {
      username: "crypto_rewards_777",
      followers: "12.5K",
      created: "2024-09-15",
      location: "User reported as Singapore"
    },
    decision: null,
    notes: ""
  },
  {
    id: 2,
    account: "@suport_paypal_help",
    platform: "Twitter / X",
    type: "Phishing Impersonation",
    severity: 8,
    status: "open",
    flaggedAt: "2024-10-07T13:15:00Z",
    reportedBy: "5 users",
    evidence: {
      postLink: "https://twitter.com/suport_paypal_help/status/9876543210",
      content: "PayPal security alert: verify your account immediately paypalveryify.net",
      timestamp: "2024-10-07T13:10:00Z"
    },
    reason: "Account mimics official PayPal support (@AskPayPal). Uses typo variation in handle, posts phishing links in official account style.",
    accountProfile: {
      username: "suport_paypal_help",
      followers: "8.2K",
      created: "2024-08-20",
      location: "User reported as Malaysia"
    },
    decision: null,
    notes: ""
  },
  {
    id: 3,
    account: "@harassment_bot_2024",
    platform: "Instagram",
    type: "Coordinated Harassment",
    severity: 7,
    status: "open",
    flaggedAt: "2024-10-07T11:48:00Z",
    reportedBy: "12 users",
    evidence: {
      postLink: "https://instagram.com/p/DB12345678",
      content: "Targeting specific user with repeated threats across multiple posts in 2-hour window",
      timestamp: "2024-10-07T11:30:00Z"
    },
    reason: "Account posts identical harassment content on rapid schedule (6 posts in 2 hours). Targets same individual with threats and doxxing attempts.",
    accountProfile: {
      username: "harassment_bot_2024",
      followers: "324",
      created: "2024-10-05",
      location: "Not publicly disclosed"
    },
    decision: null,
    notes: ""
  },
  {
    id: 4,
    account: "@malware_link_bot",
    platform: "Telegram / Discord",
    type: "Malware Distribution",
    severity: 9,
    status: "reviewed",
    flaggedAt: "2024-10-06T22:14:00Z",
    reportedBy: "8 users",
    evidence: {
      postLink: "https://t.me/malware_link_bot/4444",
      content: "Free Xbox Game Pass! Download now: suspiciousdownload.ru/pass",
      timestamp: "2024-10-06T22:05:00Z"
    },
    reason: "Account distributes known malware payload. Domain resolves to C2 infrastructure. 47 user reports of credential theft after clicking link.",
    accountProfile: {
      username: "malware_link_bot",
      followers: "2.1K",
      created: "2024-09-01",
      location: "User reported as Russia"
    },
    decision: "escalate",
    notes: "Escalated to law enforcement liaison. Domain registered to proxy service. Monitor for migration to backup accounts.",
    reviewedAt: "2024-10-06T22:45:00Z",
    reviewedBy: "Officer Sarah Jenkins"
  },
  {
    id: 5,
    account: "@fake_news_politics",
    platform: "Facebook",
    type: "Misinformation Campaign",
    severity: 6,
    status: "open",
    flaggedAt: "2024-10-07T09:22:00Z",
    reportedBy: "4 users",
    evidence: {
      postLink: "https://facebook.com/story.php?story_fbid=3333333333",
      content: "Breaking: Fake election results being spread. Original from unreliable source.",
      timestamp: "2024-10-07T09:15:00Z"
    },
    reason: "Account spreads election misinformation. Part of coordinated network (7 related accounts detected). Content contradicts official sources.",
    accountProfile: {
      username: "fake_news_politics",
      followers: "5.8K",
      created: "2024-10-01",
      location: "User reported as Unknown"
    },
    decision: null,
    notes: ""
  },
  {
    id: 6,
    account: "@bank_security_alert_uk",
    platform: "Twitter / X",
    type: "Credential Harvesting",
    severity: 10,
    status: "open",
    flaggedAt: "2024-10-07T15:10:00Z",
    reportedBy: "19 users",
    evidence: {
      postLink: "https://twitter.com/bank_security_alert_uk/status/11223344",
      content: "URGENT: Suspicious activity logged on your UK Barclays/HSBC account. Re-authenticate: secure-auth-gateway.online",
      timestamp: "2024-10-07T15:05:00Z"
    },
    reason: "Direct targeted credential harvesting campaign cloning mobile banking OTP portals. Active reverse-proxy stealing 2FA tokens.",
    accountProfile: {
      username: "bank_security_alert_uk",
      followers: "15.9K",
      created: "2024-10-02",
      location: "Reported IP: Eastern Europe"
    },
    decision: null,
    notes: ""
  }
];

// Shared in-memory store across endpoints during dev server runtime
export let alertsStore = [...mockAlerts];

export function getAlerts() {
  return alertsStore;
}

export function updateAlert(id, patch) {
  const alertId = parseInt(id);
  alertsStore = alertsStore.map(a => (a.id === alertId ? { ...a, ...patch } : a));
  return alertsStore.find(a => a.id === alertId);
}

export function addAlert(newAlert) {
  const alertWithId = {
    ...newAlert,
    id: Date.now(),
    flaggedAt: new Date().toISOString(),
    status: 'open',
    decision: null,
    notes: ''
  };
  alertsStore = [alertWithId, ...alertsStore];
  return alertWithId;
}

export function resetAlerts() {
  alertsStore = [...mockAlerts];
  return alertsStore;
}
