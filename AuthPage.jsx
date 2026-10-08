import { useState } from 'react';
import styles from '@/AuthPage.module.css';
import {
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Badge,
  AlertCircle,
  CheckCircle,
  Shield,
  Zap,
  Globe,
  Activity,
  Lock as LockIcon
} from 'lucide-react';

const DEMO_USERS = [
  { email: 'officer@suraaksha.gov', password: 'SOC@2024', name: 'Officer Arjun Kumar', role: 'officer', badge: 'SOC-4492' },
  { email: 'admin@suraaksha.gov', password: 'Admin@2024', name: 'Director Priya Shah', role: 'admin', badge: 'ADM-0001' },
];

const REGISTERED_ACCOUNTS_KEY = 'suraaksha.registeredAccounts';
const PASSWORD_HASH_ITERATIONS = 310000;

function loadRegisteredAccounts() {
  const storedAccounts = window.localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
  if (!storedAccounts) return [];

  const accounts = JSON.parse(storedAccounts);
  if (
    !Array.isArray(accounts) ||
    accounts.some(account =>
      !account ||
      typeof account.email !== 'string' ||
      typeof account.name !== 'string' ||
      typeof account.role !== 'string' ||
      typeof account.badge !== 'string' ||
      typeof account.passwordSalt !== 'string' ||
      typeof account.passwordHash !== 'string'
    )
  ) {
    throw new Error('Saved account data is invalid.');
  }

  return accounts;
}

function toBase64(bytes) {
  return window.btoa(String.fromCharCode(...bytes));
}

function fromBase64(value) {
  return Uint8Array.from(window.atob(value), character => character.charCodeAt(0));
}

async function hashPassword(password, salt) {
  if (!window.crypto.subtle) {
    throw new Error('Secure account creation and sign-in require HTTPS or localhost.');
  }

  const key = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PASSWORD_HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256
  );

  return toBase64(new Uint8Array(derivedBits));
}

export default function AuthPage({ onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpBadge, setSignUpBadge] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');
  const [signUpRole, setSignUpRole] = useState('officer');
  const [signUpAgreed, setSignUpAgreed] = useState(false);

  // Field errors
  const [fieldErrors, setFieldErrors] = useState({});

  const clearState = () => {
    setError('');
    setSuccess('');
    setFieldErrors({});
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    clearState();
  };

  const fillDemoCredentials = (demoUser) => {
    setSignInEmail(demoUser.email);
    setSignInPassword(demoUser.password);
    clearState();
  };

  /* ─── Sign In ─── */
  const handleSignIn = async (e) => {
    e.preventDefault();
    clearState();
    const errs = {};
    if (!signInEmail.trim()) errs.signInEmail = 'Email is required';
    if (!signInPassword.trim()) errs.signInPassword = 'Password is required';
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      const normalizedEmail = signInEmail.trim().toLowerCase();
      const demoUser = DEMO_USERS.find(
        user => user.email === normalizedEmail && user.password === signInPassword
      );

      let authenticatedUser = null;
      if (demoUser) {
        const { password, ...user } = demoUser;
        authenticatedUser = user;
      } else {
        const account = loadRegisteredAccounts().find(
          registeredAccount => registeredAccount.email.toLowerCase() === normalizedEmail
        );
        if (
          account &&
          await hashPassword(signInPassword, fromBase64(account.passwordSalt)) === account.passwordHash
        ) {
          const { passwordHash, passwordSalt, ...user } = account;
          authenticatedUser = user;
        }
      }

      if (authenticatedUser) {
        setSuccess(`Welcome back, ${authenticatedUser.name}! Redirecting to SOC dashboard...`);
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(authenticatedUser);
        }, 500);
      } else {
        setError('Invalid email or password. Check your credentials and try again.');
      }
    } catch (authError) {
      console.error('Sign-in failed:', authError);
      setError(authError.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Sign Up ─── */
  const handleSignUp = async (e) => {
    e.preventDefault();
    clearState();
    const errs = {};
    if (!signUpName.trim()) errs.signUpName = 'Full name is required';
    if (!signUpEmail.trim()) errs.signUpEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(signUpEmail)) errs.signUpEmail = 'Enter a valid email address';
    if (!signUpBadge.trim()) errs.signUpBadge = 'Badge ID is required';
    if (!signUpPassword) errs.signUpPassword = 'Password is required';
    else if (signUpPassword.length < 8) errs.signUpPassword = 'Password must be at least 8 characters';
    if (!signUpConfirm) errs.signUpConfirm = 'Confirm your password';
    else if (signUpConfirm !== signUpPassword) errs.signUpConfirm = 'Passwords do not match';
    if (!signUpAgreed) errs.signUpAgreed = 'You must accept the terms to continue';

    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      const normalizedEmail = signUpEmail.trim().toLowerCase();
      const normalizedBadge = signUpBadge.trim().toLowerCase();
      const accounts = loadRegisteredAccounts();
      const emailExists = accounts.some(account => account.email.toLowerCase() === normalizedEmail) ||
        DEMO_USERS.some(user => user.email === normalizedEmail);
      const badgeExists = accounts.some(account => account.badge.toLowerCase() === normalizedBadge) ||
        DEMO_USERS.some(user => user.badge.toLowerCase() === normalizedBadge);

      if (emailExists) {
        setError('An account with this email already exists. Sign in or use a different email.');
        return;
      }
      if (badgeExists) {
        setError('An account with this badge / ID already exists. Use a different badge / ID.');
        return;
      }

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const passwordHash = await hashPassword(signUpPassword, salt);
      const user = {
        name: signUpName.trim(),
        email: normalizedEmail,
        role: signUpRole,
        badge: signUpBadge.trim(),
      };

      window.localStorage.setItem(
        REGISTERED_ACCOUNTS_KEY,
        JSON.stringify([
          ...accounts,
          {
            ...user,
            passwordSalt: toBase64(salt),
            passwordHash,
          },
        ])
      );
      setSignInEmail(user.email);
      setSignInPassword('');
      setActiveTab('signin');
      setSuccess('Account created successfully. Sign in with your new email and password.');
    } catch (registrationError) {
      console.error('Account creation failed:', registrationError);
      setError(registrationError.message || 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authWrapper}>
      {/* ── Left Brand Panel ── */}
      <div className={styles.leftPanel}>
        <div className={styles.gridOverlay} />
        <div className={styles.brandContent}>
          {/* Logo */}
          <div className={styles.brandLogo}>
            <div className={styles.logoShield}>
              <ShieldAlert size={30} color="#fff" />
            </div>
            <div className={styles.logoWordmark}>
              <div className={styles.logoName}>SURAAKSHA</div>
              <div className={styles.logoTagline}>Cyber Defense SOC Platform</div>
            </div>
          </div>

          <h1 className={styles.heroTitle}>
            Protect. Detect.<br />
            <span>Respond.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            India's premier Social Media Threat Intelligence platform for cybersecurity officers.
            Monitor, triage, and neutralize digital threats in real time.
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={`${styles.featureIcon} ${styles.iconBlue}`}>
                <Activity size={17} />
              </div>
              <div className={styles.featureText}>
                <div className={styles.featureTitle}>Live Threat Intelligence Feed</div>
                <div className={styles.featureDesc}>Real-time alerts across Twitter/X, Instagram, Telegram & more</div>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={`${styles.featureIcon} ${styles.iconRed}`}>
                <Zap size={17} />
              </div>
              <div className={styles.featureText}>
                <div className={styles.featureTitle}>AI-Powered Severity Scoring</div>
                <div className={styles.featureDesc}>Automated threat classification with ML confidence levels</div>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={`${styles.featureIcon} ${styles.iconGreen}`}>
                <Shield size={17} />
              </div>
              <div className={styles.featureText}>
                <div className={styles.featureTitle}>Officer Case Management</div>
                <div className={styles.featureDesc}>End-to-end triage, evidence collection & LEA escalation</div>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={`${styles.featureIcon} ${styles.iconPurple}`}>
                <Globe size={17} />
              </div>
              <div className={styles.featureText}>
                <div className={styles.featureTitle}>Geo-Intelligence & Analytics</div>
                <div className={styles.featureDesc}>Cross-platform attribution and threat actor mapping</div>
              </div>
            </div>
          </div>

          <div className={styles.floatingStats}>
            <div className={styles.statPill}><strong>2,400+</strong> Threats Neutralized</div>
            <div className={styles.statPill}><strong>98%</strong> Accuracy Rate</div>
            <div className={styles.statPill}><strong>24/7</strong> Live Radar</div>
          </div>
        </div>
      </div>

      {/* ── Right Auth Panel ── */}
      <div className={styles.rightPanel}>
        <div className={styles.formHeader}>
          <div className={styles.formTitle}>
            {activeTab === 'signin' ? 'Officer Sign In' : 'Create Account'}
          </div>
          <div className={styles.formSubtitle}>
            {activeTab === 'signin'
              ? 'Authenticate to access the SURAAKSHA SOC platform'
              : 'Enter your details, accept the policy, then continue to create your account'}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabSwitcher}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'signin' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabSwitch('signin')}
          >
            Sign In
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'signup' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabSwitch('signup')}
          >
            Create Account
          </button>
        </div>

        {/* Alert Banners */}
        {error && (
          <div className={`${styles.alertBanner} ${styles.alertBannerError}`}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}
        {success && (
          <div className={`${styles.alertBanner} ${styles.alertBannerSuccess}`}>
            <CheckCircle size={15} style={{ flexShrink: 0 }} />
            {success}
          </div>
        )}

        {/* ── Sign In Form ── */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Officer Email</label>
              <div className={styles.inputWrapper}>
                <Mail size={15} className={styles.inputIcon} />
                <input
                  id="signin-email"
                  type="email"
                  className={`${styles.formInput} ${fieldErrors.signInEmail ? styles.inputError : ''}`}
                  placeholder="you@organisation.gov"
                  value={signInEmail}
                  onChange={e => setSignInEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.signInEmail && (
                <div className={styles.fieldError}><AlertCircle size={11} />{fieldErrors.signInEmail}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Password</label>
              <div className={styles.inputWrapper}>
                <Lock size={15} className={styles.inputIcon} />
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`${styles.formInput} ${fieldErrors.signInPassword ? styles.inputError : ''}`}
                  placeholder="Enter your password"
                  value={signInPassword}
                  onChange={e => {
                    setSignInPassword(e.target.value);
                    if (success) setSuccess('');
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.togglePasswordBtn}
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldErrors.signInPassword && (
                <div className={styles.fieldError}><AlertCircle size={11} />{fieldErrors.signInPassword}</div>
              )}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading || !!success}>
              {loading ? (
                <><div className={styles.spinner} /><span>Authenticating...</span></>
              ) : (
                <><ShieldAlert size={15} /><span>Access SOC Platform</span></>
              )}
            </button>

            <div className={styles.demoCredentials}>
              <div className={styles.demoTitle}>Demo credentials</div>
              {DEMO_USERS.map(demoUser => (
                <div className={styles.demoAccount} key={demoUser.email}>
                  <div className={styles.demoDetails}>
                    <div className={styles.demoRow}>
                      <span className={styles.demoLabel}>Email</span>
                      <span className={styles.demoValue}>{demoUser.email}</span>
                    </div>
                    <div className={styles.demoRow}>
                      <span className={styles.demoLabel}>Password</span>
                      <span className={styles.demoValue}>{demoUser.password}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.demoFillBtn}
                    onClick={() => fillDemoCredentials(demoUser)}
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          </form>
        )}

        {/* ── Sign Up Form ── */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name</label>
                <div className={styles.inputWrapper}>
                  <User size={15} className={styles.inputIcon} />
                  <input
                    id="signup-name"
                    type="text"
                    className={`${styles.formInput} ${fieldErrors.signUpName ? styles.inputError : ''}`}
                    placeholder="Officer Name"
                    value={signUpName}
                    onChange={e => setSignUpName(e.target.value)}
                  />
                </div>
                {fieldErrors.signUpName && (
                  <div className={styles.fieldError}><AlertCircle size={11} />{fieldErrors.signUpName}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Badge / ID</label>
                <div className={styles.inputWrapper}>
                  <Badge size={15} className={styles.inputIcon} />
                  <input
                    id="signup-badge"
                    type="text"
                    className={`${styles.formInput} ${fieldErrors.signUpBadge ? styles.inputError : ''}`}
                    placeholder="SOC-XXXX"
                    value={signUpBadge}
                    onChange={e => setSignUpBadge(e.target.value)}
                  />
                </div>
                {fieldErrors.signUpBadge && (
                  <div className={styles.fieldError}><AlertCircle size={11} />{fieldErrors.signUpBadge}</div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Work Email</label>
              <div className={styles.inputWrapper}>
                <Mail size={15} className={styles.inputIcon} />
                <input
                  id="signup-email"
                  type="email"
                  className={`${styles.formInput} ${fieldErrors.signUpEmail ? styles.inputError : ''}`}
                  placeholder="officer@organisation.gov"
                  value={signUpEmail}
                  onChange={e => setSignUpEmail(e.target.value)}
                />
              </div>
              {fieldErrors.signUpEmail && (
                <div className={styles.fieldError}><AlertCircle size={11} />{fieldErrors.signUpEmail}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone (Optional)</label>
              <div className={styles.inputWrapper}>
                <Phone size={15} className={styles.inputIcon} />
                <input
                  id="signup-phone"
                  type="tel"
                  className={styles.formInput}
                  placeholder="+91 XXXXX XXXXX"
                  value={signUpPhone}
                  onChange={e => setSignUpPhone(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Officer Role</label>
              <div className={styles.roleSelector}>
                {[
                  { value: 'officer', label: 'SOC Officer', icon: '🛡️' },
                  { value: 'analyst', label: 'Threat Analyst', icon: '🔍' },
                  { value: 'supervisor', label: 'Supervisor', icon: '👁️' },
                  { value: 'admin', label: 'Admin', icon: '⚙️' },
                ].map(r => (
                  <label key={r.value} className={styles.roleOption}>
                    <input
                      type="radio"
                      name="signUpRole"
                      value={r.value}
                      checked={signUpRole === r.value}
                      onChange={() => setSignUpRole(r.value)}
                    />
                    <div className={styles.roleCard}>
                      <span className={styles.roleCardIcon}>{r.icon}</span>
                      <span className={styles.roleCardLabel}>{r.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={15} className={styles.inputIcon} />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`${styles.formInput} ${fieldErrors.signUpPassword ? styles.inputError : ''}`}
                    placeholder="Min. 8 characters"
                    value={signUpPassword}
                    onChange={e => setSignUpPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.togglePasswordBtn}
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {fieldErrors.signUpPassword && (
                  <div className={styles.fieldError}><AlertCircle size={11} />{fieldErrors.signUpPassword}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Confirm Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={15} className={styles.inputIcon} />
                  <input
                    id="signup-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`${styles.formInput} ${fieldErrors.signUpConfirm ? styles.inputError : ''}`}
                    placeholder="Repeat password"
                    value={signUpConfirm}
                    onChange={e => setSignUpConfirm(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.togglePasswordBtn}
                    onClick={() => setShowConfirmPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {fieldErrors.signUpConfirm && (
                  <div className={styles.fieldError}><AlertCircle size={11} />{fieldErrors.signUpConfirm}</div>
                )}
              </div>
            </div>

            <div className={styles.agreementRow}>
              <input
                type="checkbox"
                id="agree"
                className={styles.agreementCheckbox}
                checked={signUpAgreed}
                onChange={e => setSignUpAgreed(e.target.checked)}
              />
              <label htmlFor="agree" className={styles.agreementText}>
                I agree to the <a href="#">SURAAKSHA demo use policy</a> and understand that this demo stores accounts
                in this browser only and is not a production authentication service.
              </label>
            </div>
            {fieldErrors.signUpAgreed && (
              <div className={styles.fieldError} style={{ marginTop: -12, marginBottom: 14 }}>
                <AlertCircle size={11} />{fieldErrors.signUpAgreed}
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={loading || !!success}>
              {loading ? (
                <><div className={styles.spinner} /><span>Creating Account...</span></>
              ) : (
                <><User size={15} /><span>Continue</span></>
              )}
            </button>
          </form>
        )}

        {/* Switch tab footer */}
        <div className={styles.formFooter}>
          {activeTab === 'signin' ? (
            <>New to SURAAKSHA?{' '}
              <button onClick={() => handleTabSwitch('signup')}>Create an Account →</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => handleTabSwitch('signin')}>Sign In →</button>
            </>
          )}
        </div>

        {/* Security badges */}
        <div className={styles.securityBadges}>
          <div className={styles.secBadge}><LockIcon size={11} /> PBKDF2 Password Hash</div>
          <div className={styles.secBadge}><Shield size={11} /> Browser-only Account</div>
          <div className={styles.secBadge}><Activity size={11} /> Tab Session</div>
        </div>
      </div>
    </div>
  );
}
