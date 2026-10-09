import { useState, useRef, useEffect } from 'react';
import styles from '@/components/AIChatbot.module.css';
import { 
  Bot, 
  Send, 
  X, 
  Minimize2, 
  Sparkles, 
  Trash2, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronDown 
} from 'lucide-react';

const INITIAL_MESSAGE = {
  id: 'init-1',
  sender: 'assistant',
  text: `👋 Greetings Officer. I am **SURAAKSHA Copilot**, your AI Cyber Intelligence Assistant.\n\nI can analyze active threat signals, evaluate account risk, guide LEA escalation procedures, and interpret evidence dossiers. How can I assist your investigation?`,
  timestamp: 'Just now'
};

const SUGGESTED_QUERIES = [
  "🌐 Options in this website",
  "💡 How can you help us?",
  "🚨 Show critical threats",
  "🔍 Analyze selected alert",
  "📋 How to escalate to LEA?"
];

export default function AIChatbot({ currentAlertId = null }) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: nextMessages.slice(-6),
          currentAlertId
        })
      });

      const data = await res.json();
      const botReply = data.reply || "Unable to retrieve response from AI engine.";

      setMessages(prev => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'assistant',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Chat request failed:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'bot-err-' + Date.now(),
          sender: 'assistant',
          text: '⚠️ Communication timeout with SOC AI service. Please verify network or try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  // Basic formatting helper for bolding, bullet points, and code
  const renderFormattedText = (text) => {
    return text.split('\n').map((line, idx) => {
      // Bold handling
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      return (
        <div key={idx} style={{ minHeight: line ? 'auto' : '8px' }}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={pIdx}>{part.slice(1, -1)}</code>;
            }
            return part;
          })}
        </div>
      );
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button 
          id="open-ai-chat-btn"
          className={styles.chatTriggerBtn}
          onClick={() => setIsOpen(true)}
          title="Open SURAAKSHA AI Threat Copilot"
        >
          <div className={styles.chatTriggerPulse} />
          <Bot size={20} />
          <span>AI Threat Copilot</span>
        </button>
      )}

      {/* Floating Chat Modal Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              <div className={styles.botAvatar}>
                <Bot size={20} />
              </div>
              <div>
                <div className={styles.chatTitle}>
                  SURAAKSHA Copilot
                  <Sparkles size={14} color="#38bdf8" />
                </div>
                <div className={styles.chatSub}>SOC Defense & Intelligence Assistant</div>
              </div>
            </div>

            <div className={styles.headerActions}>
              <button 
                className={styles.iconBtn} 
                onClick={handleClearHistory}
                title="Reset conversation"
              >
                <Trash2 size={15} />
              </button>
              <button 
                id="close-ai-chat-btn"
                className={styles.iconBtn} 
                onClick={() => setIsOpen(false)}
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Action Suggestions */}
          <div className={styles.quickPromptsBar}>
            {SUGGESTED_QUERIES.map((query, i) => (
              <button 
                key={i} 
                className={styles.quickPromptChip}
                onClick={() => handleSendMessage(query.replace(/^[^\w\s]+/, '').trim())}
              >
                {query}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className={styles.chatMessages}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`${styles.messageRow} ${msg.sender === 'user' ? styles.user : styles.assistant}`}
              >
                <div className={`${styles.msgAvatar} ${msg.sender === 'user' ? styles.userAvatar : styles.botAvatarSmall}`}>
                  {msg.sender === 'user' ? 'SOC' : <Bot size={15} />}
                </div>
                <div>
                  <div className={styles.bubble}>
                    {renderFormattedText(msg.text)}
                  </div>
                  <div className={styles.timestamp}>{msg.timestamp}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className={`${styles.messageRow} ${styles.assistant}`}>
                <div className={`${styles.msgAvatar} ${styles.botAvatarSmall}`}>
                  <Bot size={15} />
                </div>
                <div className={styles.typingIndicator}>
                  <div className={styles.typingDot} />
                  <div className={styles.typingDot} />
                  <div className={styles.typingDot} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form 
            className={styles.chatInputForm} 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              id="ai-chat-input"
              type="text"
              placeholder="Ask Copilot about threats, evidence, or triage..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className={styles.chatInput}
              disabled={isLoading}
              autoFocus
            />
            <button 
              id="ai-chat-send-btn"
              type="submit" 
              className={styles.sendBtn}
              disabled={isLoading || !inputText.trim()}
              title="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
