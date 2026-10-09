import { getAlerts } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/supabase';

// System prompt giving cybersecurity officer persona
const SYSTEM_PROMPT = `You are SURAAKSHA Copilot, an elite AI Cyber Threat Analyst and SOC Intelligence Assistant embedded in the SURAAKSHA Cyber Defense platform.
Your mission is to assist cybersecurity officers, incident response teams, and law enforcement analysts in investigating social media threats, digital disinformation, extremism, coordinated bot activities, cyber harassment, and high-priority digital hazards.

Guidelines:
- Provide sharp, structured, professional, and actionable cybersecurity advice.
- When asked about live threats, utilize the provided threat alerts telemetry data.
- Offer threat severity triage, MITRE ATT&CK / DISARM framework alignment, forensic steps, preservation recommendations, and escalation advice (e.g. reporting to LEA / CERT-In).
- IMPORTANT GUARDRAIL: If the user asks a question that is NOT related to cybersecurity, threat intelligence, online safety, forensics, or the SURAAKSHA dashboard (e.g. sports, movies, celebrities like "who is virat kohli", cooking, general trivia, unrelated homework), you MUST refuse and respond:
"❌ **Invalid Question / Out of Scope**\n\nThis is an invalid question for the SURAAKSHA Cyber Defense Copilot. I only assist with cybersecurity threat monitoring, case triage, LEA escalation, and digital crime investigation. Please ask a cybersecurity or threat-related question."
- Keep responses concise, clear, and styled with bullet points or bold markers where useful.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history = [], currentAlertId = null } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 1. Gather context from live alerts (Supabase or fallback mockData)
    let alertsContext = [];
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('alerts').select('*').limit(15);
        if (data && data.length > 0) {
          alertsContext = data;
        }
      } catch (err) {
        console.warn('Failed to query alerts for chatbot context:', err);
      }
    }

    if (alertsContext.length === 0) {
      alertsContext = getAlerts();
    }

    // Prepare summary telemetry for AI prompt
    const alertsSummary = alertsContext.map(a => ({
      id: a.id,
      account: a.account,
      platform: a.platform,
      type: a.type,
      severity: a.severity,
      status: a.status,
      reason: a.reason,
      contentSnippet: a.evidence?.content ? a.evidence.content.slice(0, 100) : ''
    }));

    const activeAlert = currentAlertId
      ? alertsContext.find(a => String(a.id) === String(currentAlertId))
      : null;

    // Check if an external LLM API key is configured (OpenAI or Gemini)
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        const aiResponse = await callGeminiApi(geminiKey, message, history, alertsSummary, activeAlert);
        return res.status(200).json({ reply: aiResponse, source: 'gemini' });
      } catch (geminiErr) {
        console.error('Gemini API error, falling back to local SOC engine:', geminiErr);
      }
    }

    if (openAiKey) {
      try {
        const aiResponse = await callOpenAiApi(openAiKey, message, history, alertsSummary, activeAlert);
        return res.status(200).json({ reply: aiResponse, source: 'openai' });
      } catch (openAiErr) {
        console.error('OpenAI API error, falling back to local SOC engine:', openAiErr);
      }
    }

    // High quality intelligent built-in Cyber Defense Response Engine (zero setup required)
    const localReply = generateSOCAnalystResponse(message, alertsSummary, activeAlert);
    return res.status(200).json({ reply: localReply, source: 'suraaksha-soc-ai' });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return res.status(500).json({
      error: 'Failed to process AI chat request',
      reply: 'SOC AI Service encountered a temporary processing anomaly. Please retry.'
    });
  }
}

// Built-in rule-based & semantic SOC assistant engine
function generateSOCAnalystResponse(query, alerts, activeAlert) {
  const lower = query.toLowerCase();

  // 1. Critical Threats & Triage
  if (lower.includes('critical') || lower.includes('high priority') || lower.includes('urgent')) {
    const criticals = alerts.filter(a => Number(a.severity) >= 8 && a.status === 'open');
    if (criticals.length === 0) {
      return `🛡️ **Current Triage Status:**\n\nNo active **Critical (Severity 8-10)** threats are pending immediate triage in the database. All high-tier threats have either been contained, escalated to Law Enforcement Agencies (LEA), or resolved.`;
    }

    let response = `🚨 **High-Priority Critical Threats Requiring Urgent Action (${criticals.length} Active):**\n\n`;
    criticals.slice(0, 4).forEach((item, idx) => {
      response += `${idx + 1}. **${item.account}** (${item.platform || 'Social'}) - **Severity ${item.severity}/10**\n`;
      response += `   - **Threat Class:** ${item.type}\n`;
      response += `   - **Indicator:** "${item.reason}"\n`;
      response += `   - **Status:** \`${item.status.toUpperCase()}\`\n\n`;
    });
    response += `💡 *Recommendation:* Select the alert from the feed to inspect network metadata, export the PDF dossier, and execute escalation.`;
    return response;
  }

  // 2. Active / Selected Alert Specific Query
  if (lower.includes('this alert') || lower.includes('this threat') || lower.includes('current alert') || lower.includes('selected')) {
    if (!activeAlert) {
      return `⚠️ No threat alert is currently selected on your dashboard. Please click on any case in the left Threat Feed to load its evidence and dossier.`;
    }

    return `🔍 **Analysis of Current Case: ${activeAlert.account} (Alert #${activeAlert.id})**\n\n` +
      `- **Platform:** ${activeAlert.platform || 'Unknown'}\n` +
      `- **Threat Severity:** **${activeAlert.severity}/10** (${activeAlert.severity >= 8 ? 'CRITICAL' : activeAlert.severity >= 5 ? 'MEDIUM-HIGH' : 'LOW'})\n` +
      `- **Category:** ${activeAlert.type}\n` +
      `- **Reason Flagged:** ${activeAlert.reason}\n` +
      `- **Current State:** \`${activeAlert.status}\`\n\n` +
      `**SOC Assessment:**\n` +
      `Evidence indicates coordinated or malicious dissemination. Recommended triage: verify historical handle activity, preserve cryptographic archive of post content, and update determination to *Escalate to LEA* if public safety is impacted.`;
  }

  // 3. Escalation and LEA guidance
  if (lower.includes('escalate') || lower.includes('lea') || lower.includes('police') || lower.includes('fir') || lower.includes('cert')) {
    return `📋 **Protocol for Escalating Threats to Law Enforcement / CERT-In:**\n\n` +
      `1. **Evidence Locking:** Ensure raw text, post timestamp, account URL, and geolocation hashes are recorded.\n` +
      `2. **Generate Dossier:** Click **"Download / Print Dossier"** in the Alert Detail pane to generate an unalterable incident record.\n` +
      `3. **Set Status:** Change determination to **"Escalate to LEA"** with your officer badge number and tactical notes.\n` +
      `4. **Transmission:** Securely transmit the exported dossier to the Cyber Crime Coordination Center (I4C) or designated nodal officer.`;
  }

  // 4. Summary / Overview
  if (lower.includes('summary') || lower.includes('overview') || lower.includes('stats') || lower.includes('report') || lower.includes('dashboard')) {
    const total = alerts.length;
    const critical = alerts.filter(a => Number(a.severity) >= 8).length;
    const open = alerts.filter(a => a.status === 'open').length;
    const escalated = alerts.filter(a => a.status === 'escalated').length;
    const reviewed = alerts.filter(a => a.status === 'reviewed').length;

    return `📊 **SURAAKSHA SOC Threat Radar Summary:**\n\n` +
      `- **Total Tracked Threat Vectors:** ${total}\n` +
      `- **Open Investigations:** ${open}\n` +
      `- **Critical Severity (8+):** ${critical}\n` +
      `- **Escalated to LEA:** ${escalated}\n` +
      `- **Reviewed / Resolved:** ${reviewed}\n\n` +
      `Cyber defense systems are operating at nominal surveillance capacity.`;
  }

  // 5. Deepfake / Misinformation guidance
  if (lower.includes('deepfake') || lower.includes('synthetic') || lower.includes('ai generated') || lower.includes('fake')) {
    return `🔬 **Synthetic Media & Deepfake Investigation Protocol:**\n\n` +
      `1. **Facial Artifact Inspection:** Inspect border blurring, inconsistent lighting vectors, unnatural blink cadence, and audio-video phoneme mismatch.\n` +
      `2. **Reverse Metadata Analysis:** Check C2PA provenance credentials if embedded, or run reverse visual indexing.\n` +
      `3. **Propagation Velocity:** Flag accounts pushing coordinated copies within short temporal clusters (<5 minutes).\n` +
      `4. **Mitigation:** Tag alert as *Synthetic Media / Disinformation* and initiate platform takedown notice.`;
  }

  // 6. Botnet / Coordinated Inauthentic Behavior
  if (lower.includes('bot') || lower.includes('astroturf') || lower.includes('coordinated') || lower.includes('inauthentic')) {
    return `🤖 **Coordinated Inauthentic Behavior (CIB) Triage:**\n\n` +
      `- **Account Creation Clumping:** Check if user accounts were created within days or hours of each other.\n` +
      `- **Copy-Paste Hashes:** Search exact phrase substrings across multiple accounts to detect synchronized scripts.\n` +
      `- **Temporal Distribution:** Graph posting activity against unnatural 24/7 robotic distributions.\n` +
      `- **Action:** Bulk flag associated handles in SURAAKSHA for cluster-level monitoring.`;
  }

  // 1. "how to flag a account" / "how to flag an account" / "flag new account"
  const isFlagAccountQuery = 
    lower.includes('flag a account') ||
    lower.includes('flag an account') ||
    lower.includes('flag account') ||
    lower.includes('how to flag') ||
    lower.includes('flag new account') ||
    lower.includes('report account') ||
    lower.includes('add threat') ||
    lower.includes('log new case');

  if (isFlagAccountQuery) {
    return `🚩 **Steps to Flag a Suspect Social Media Account in SURAAKSHA:**\n\n` +
      `1. **Click "Flag New Account":** On the left sidebar navigation, click the **"+ Flag New Account"** button.\n` +
      `2. **Enter Account Handle:** Type the suspect username (e.g. \`@fraud_crypto_bot\`).\n` +
      `3. **Select Platform:** Choose the social media network (*Twitter / X, Telegram, Instagram, Facebook, or YouTube*).\n` +
      `4. **Pick Threat Category:** Classify the danger (*Impersonation & Scam, Phishing, Malware, Coordinated Harassment, Misinformation*).\n` +
      `5. **Set Severity Score:** Drag the slider from **1 to 10** based on public hazard level.\n` +
      `6. **Provide Flagging Reason:** Describe the specific threat vector or violation.\n` +
      `7. **Attach Evidence:** Paste the direct post URL and the extracted malicious payload/text.\n` +
      `8. **Save Case:** Click **"Log Case to Threat Database"** — the case will immediately appear in the live triage feed.`;
  }

  // 2. "how to create a new account" / "how to sign up" / "register account"
  const isCreateUserAccountQuery = 
    lower.includes('create a new account') ||
    lower.includes('create an account') ||
    lower.includes('create account') ||
    lower.includes('how to sign up') ||
    lower.includes('register account') ||
    lower.includes('new user registration') ||
    lower.includes('signup');

  if (isCreateUserAccountQuery) {
    return `👤 **Steps to Create an Officer Account in SURAAKSHA:**\n\n` +
      `1. **Go to Auth Screen:** Click **"Sign Out"** at the top right if currently logged in, or open the platform sign-in page.\n` +
      `2. **Switch to Create Account:** Click the **"Create Account"** tab at the top of the login box (or click *"New to SURAAKSHA? Create an Account →"* at the bottom).\n` +
      `3. **Fill Officer Details:**\n` +
      `   - **Full Name:** Enter your official name.\n` +
      `   - **Official Email:** Use your government or department email (e.g. \`officer@suraaksha.gov\`).\n` +
      `   - **Official Mobile:** Provide your verified contact number.\n` +
      `   - **Department / Badge ID:** Enter your SOC badge number (e.g. \`SOC-1044\`).\n` +
      `4. **Set Password:** Choose a secure password (minimum 8 characters with numbers and special symbols).\n` +
      `5. **Accept Policy:** Check the agreement for the SOC demo use policy.\n` +
      `6. **Complete Registration:** Click **"Continue"** — your account is verified and ready for sign-in.`;
  }

  // 3. "what is this website for" / "purpose of this website"
  const isPurposeQuery = 
    lower.includes('what is this website for') ||
    lower.includes('what this website is for') ||
    lower.includes('why this website') ||
    lower.includes('purpose of this website') ||
    lower.includes('what is this site for');

  if (isPurposeQuery) {
    return `• 🔍 **Case Assistance & Triage:** Analyze social media threats, assess threat severity scores (1-10), and evaluate flagged accounts.\n` +
      `• 📂 **Dossier & Evidence Review:** Inspect posts, telemetry, timestamps, and suspicious activity patterns across platforms.\n` +
      `• 🚨 **Critical Alert Feeds:** Instantly surface high-priority hazards requiring immediate officer intervention.\n` +
      `• ⚖️ **Law Enforcement (LEA) Escalation:** Guide standard escalation protocols to LEA and CERT-In, helping generate unalterable case dossiers.\n` +
      `• 🔬 **Digital Forensic Intelligence:** Assist in uncovering Deepfakes, coordinated botnets, and disinformation.`;
  }

  // 2. "explain each one" / "explain in detail" / "explain options" / "options in this website"
  const isExplainOptionsQuery = 
    lower.includes('explain each one') ||
    lower.includes('explain each') ||
    lower.includes('explain all') ||
    lower.includes('explain in detail') ||
    lower.includes('expain in detail') ||
    lower.includes('explain detail') ||
    lower.includes('expain detail') ||
    lower.includes('in detail') ||
    lower.includes('explain more') ||
    lower.includes('expain more') ||
    lower.includes('options') ||
    lower.includes('feature') ||
    lower.includes('features') ||
    lower.includes('what is in this website') ||
    lower.includes('what is on this website') ||
    lower.includes('how to use this website') ||
    lower.includes('navigation') ||
    lower.includes('tabs') ||
    lower.includes('tools available') ||
    lower.includes('menu');

  if (isExplainOptionsQuery) {
    return `1. 📡 **Active Threat Feed (Live Radar)**\n\n` +
      `Real-time social media threat stream (Twitter/X, Telegram, Instagram, YouTube).\n` +
      `Displays Severity Score (1-10), Threat Class, Flagged Reason, and Account Handle.\n\n` +
      `2. 🔍 **Case Dossier & Evidence Viewer**\n\n` +
      `Inspect extracted post payloads, timestamps, platform link, and metadata.\n` +
      `Officer determinations: Mark Reviewed, Escalate to LEA, or Dismiss as False Positive.\n` +
      `Add confidential officer case notes.\n\n` +
      `3. 🖨️ **Dossier Export & Report Generation**\n\n` +
      `"Download / Print Dossier" creates an official court/LEA-ready PDF incident file.\n` +
      `"Export Threat JSON" downloads raw forensic data.\n\n` +
      `4. ➕ **Flag New Account Modal**\n\n` +
      `Manually lodge a new suspect handle, select threat category, assign severity, and upload evidence text.\n\n` +
      `5. 📊 **Threat Analytics & SOC Settings**\n\n` +
      `View platform-wide statistics, threat category breakdowns, and configure webhook/alerting rules.\n\n` +
      `6. 🤖 **SURAAKSHA AI Threat Copilot (Floating Widget)**\n\n` +
      `Real-time AI assistant for instant threat triage, LEA escalation guidance, and forensic advice.`;
  }

  // 3. Identity & Help Queries: "how can you help us/me", "who are you", "who are we", "what can you do"
  const isHelpQuery = 
    lower.includes('how can you help') ||
    lower.includes('how do you help') ||
    lower.includes('what can you do') ||
    lower.includes('help me') ||
    lower.includes('help us') ||
    lower.includes('who are you') ||
    lower.includes('who are we') ||
    lower.includes('what are you') ||
    lower.includes('about you') ||
    lower.includes('your purpose');

  if (isHelpQuery) {
    return `🛡️ **I am SURAAKSHA AI** — your specialized Cyber Threat Intelligence and SOC Copilot!\n\n` +
      `**How I assist you in investigating & managing cases:**\n` +
      `• 🔍 **Case Assistance & Triage:** Analyze social media threats, assess threat severity scores (1-10), and evaluate flagged accounts.\n` +
      `• 📂 **Dossier & Evidence Review:** Inspect posts, telemetry, timestamps, and suspicious activity patterns across platforms.\n` +
      `• 🚨 **Critical Alert Feeds:** Instantly surface high-priority hazards requiring immediate officer intervention.\n` +
      `• ⚖️ **Law Enforcement (LEA) Escalation:** Guide standard escalation protocols to LEA and CERT-In, helping generate unalterable case dossiers.\n` +
      `• 🔬 **Digital Forensic Intelligence:** Assist in uncovering Deepfakes, coordinated botnet manipulation, and targeted disinformation.\n\n` +
      `You can ask me to *"Show critical threats"*, *"Explain each one"*, or *"What is this website for?"*!`;
  }

  // 2. Greetings & Courtesy
  const isGreeting = /^(hi|hello|hey|namaste|vanakkam|greetings|good\s*(morning|afternoon|evening|day)|sup)\b/i.test(query.trim());
  if (isGreeting) {
    return `👋 **Hello Officer! Greetings from SURAAKSHA AI.**\n\n` +
      `I am here to assist you in investigating and resolving cyber threat cases across the platform.\n\n` +
      `**Quick actions you can try:**\n` +
      `- 🚨 *"Show critical threats"* — inspect pending high-severity cases\n` +
      `- 🔍 *"Analyze selected alert"* — evaluate the case open on your screen\n` +
      `- 📋 *"How to escalate to LEA"* — view standard escalation workflow\n` +
      `- 💡 *"How can you help us?"* — discover my case assistance capabilities\n\n` +
      `How may I assist your investigation today?`;
  }

  // Specific handle search or mention (e.g. "@bad_actor" or "account xyz")
  const matchedAlert = alerts.find(a => 
    (a.account && lower.includes(a.account.toLowerCase())) ||
    (a.id && (lower.includes(`case #${a.id}`) || lower.includes(`alert #${a.id}`) || lower.includes(`case ${a.id}`) || lower.includes(`alert ${a.id}`)))
  );
  if (matchedAlert) {
    return `🔍 **Case Dossier: ${matchedAlert.account} (Alert #${matchedAlert.id})**\n\n` +
      `- **Platform:** ${matchedAlert.platform || 'Social'}\n` +
      `- **Severity:** **${matchedAlert.severity}/10**\n` +
      `- **Threat Class:** ${matchedAlert.type}\n` +
      `- **Reason Flagged:** ${matchedAlert.reason}\n` +
      `- **Status:** \`${matchedAlert.status.toUpperCase()}\`\n\n` +
      `💡 Select this case on your dashboard to review extracted evidence and submit an officer determination.`;
  }

  // Broad Cyber Security & SOC Domain Keywords
  const CYBER_SOC_KEYWORDS = [
    'threat', 'threats', 'alert', 'alerts', 'soc', 'cyber', 'security', 'hack', 'hacker',
    'phish', 'phishing', 'scam', 'fraud', 'malware', 'bot', 'botnet', 'deepfake',
    'misinformation', 'disinformation', 'troll', 'harassment', 'dox', 'doxxing',
    'c2pa', 'mitre', 'cert', 'lea', 'police', 'investigation', 'evidence', 'dossier',
    'case', 'cases', 'triage', 'fir', 'i4c', 'cybercrime', 'surveillance', 'telemetry',
    'severity', 'priority', 'impersonat', 'compromise', 'incident', 'escalat',
    'forensic', 'sentiment', 'synthetic', 'account', 'handle', 'post', 'tweet'
  ];

  const isRelevantToCybersecurity = CYBER_SOC_KEYWORDS.some(kw => lower.includes(kw));

  // If the question is outside cybersecurity/SURAAKSHA platform (e.g., cricket, movies, general trivia)
  if (!isRelevantToCybersecurity) {
    return `❌ **Invalid Question / Out of Scope**\n\n` +
      `This is an invalid question for the **SURAAKSHA Cyber Defense Copilot**.\n\n` +
      `I am exclusively designed to assist with:\n` +
      `• **Social media threat monitoring & triage**\n` +
      `• **Case dossier evaluation & evidence verification**\n` +
      `• **Law Enforcement (LEA) escalation protocols**\n` +
      `• **Cyber crime investigation (Deepfakes, Botnets, Scams, Disinformation)**\n\n` +
      `⚠️ *Please ask a question related to cybersecurity, active cases, or SOC threat feeds.*`;
  }

  // General Cyber Threat Assistance fallback within scope
  return `🛡️ **SURAAKSHA Threat Analyst AI:**\n\n` +
    `I have analyzed your cybersecurity query against current SOC intelligence feeds.\n\n` +
    `• **Active Threat Feed:** ${alerts.length} signals monitored.\n` +
    `• **Quick Capabilities:**\n` +
    `  - Ask *"Show critical threats"* to see active high-severity cases.\n` +
    `  - Ask *"Analyze selected alert"* to evaluate the active case.\n` +
    `  - Ask *"How to escalate to LEA"* for official incident escalation protocol.\n` +
    `  - Ask about forensic techniques (Deepfakes, Botnets, Disinformation).\n\n` +
    `How would you like to proceed with the investigation, Officer?`;
}

// Optional Google Gemini API integration if user configures GEMINI_API_KEY
async function callGeminiApi(apiKey, message, history, alertsSummary, activeAlert) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const promptContext = `
${SYSTEM_PROMPT}

CURRENT SOC TELEMETRY:
${JSON.stringify(alertsSummary.slice(0, 10), null, 2)}

ACTIVE SELECTED CASE:
${activeAlert ? JSON.stringify(activeAlert, null, 2) : 'None currently selected'}

USER QUERY:
${message}
`;

  const body = {
    contents: [
      ...history.slice(-6).map(h => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      {
        role: 'user',
        parts: [{ text: promptContext }]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 600
    }
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    throw new Error(`Gemini API returned status ${resp.status}`);
  }

  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated from Gemini.';
}

// Optional OpenAI API integration if user configures OPENAI_API_KEY
async function callOpenAiApi(apiKey, message, history, alertsSummary, activeAlert) {
  const url = 'https://api.openai.com/v1/chat/completions';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'system',
      content: `CURRENT SOC TELEMETRY:\n${JSON.stringify(alertsSummary.slice(0, 10))}\n\nACTIVE SELECTED CASE:\n${activeAlert ? JSON.stringify(activeAlert) : 'None'}`
    },
    ...history.slice(-6).map(h => ({
      role: h.sender === 'user' ? 'user' : 'assistant',
      content: h.text
    })),
    { role: 'user', content: message }
  ];

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.4,
      max_tokens: 600
    })
  });

  if (!resp.ok) {
    throw new Error(`OpenAI API returned status ${resp.status}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || 'No response generated from OpenAI.';
}
