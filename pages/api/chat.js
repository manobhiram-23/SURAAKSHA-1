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

  // Greetings
  if (/^(hi|hello|hey|namaste|greetings|good\s*(morning|afternoon|evening))\b/i.test(query.trim())) {
    return `👋 **Greetings Officer.**\n\nI am **SURAAKSHA Copilot**, dedicated exclusively to Cyber Threat Intelligence, SOC Operations, and Incident Triage.\n\nYou can ask me to:\n- 🚨 Summarize critical / high-priority threats\n- 🔍 Analyze a specific case or active alert\n- 📋 Guide escalation to LEA / CERT-In\n- 🔬 Assist with deepfakes, botnets, and disinformation triage\n\nHow can I support your investigation?`;
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
