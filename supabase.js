import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

// Initialize client only if valid configuration credentials exist
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Normalizes Supabase database row to dashboard alert format
 */
export function formatSupabaseAlert(row) {
  if (!row) return null;
  return {
    id: row.id,
    account: row.account,
    platform: row.platform,
    type: row.type,
    severity: row.severity,
    reason: row.reason,
    status: row.status || 'open',
    flaggedAt: row.created_at,
    reportedBy: row.reported_by || '1 officer',
    evidence: row.evidence || {},
    accountProfile: row.account_profile || {},
    decision: row.decision || null,
    notes: row.notes || '',
    reviewedAt: row.reviewed_at || null,
    reviewedBy: row.reviewed_by || null,
  };
}

/**
 * Fetch all alerts from Supabase
 */
export async function dbFetchAlerts() {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('id', { ascending: false });

  if (error) return { data: null, error };
  return { data: (data || []).map(formatSupabaseAlert), error: null };
}

/**
 * Insert a new alert case into Supabase
 */
export async function dbCreateAlert(alertData) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const insertPayload = {
    account: alertData.account,
    platform: alertData.platform || 'Twitter / X',
    type: alertData.type || 'Hate Speech',
    severity: Number(alertData.severity) || 5,
    reason: alertData.reason || 'Manually flagged threat case',
    status: alertData.status || 'open',
    reported_by: alertData.reportedBy || '1 officer',
    evidence: alertData.evidence || {},
    account_profile: alertData.accountProfile || {},
    decision: alertData.decision || null,
    notes: alertData.notes || '',
  };

  const { data, error } = await supabase
    .from('alerts')
    .insert([insertPayload])
    .select()
    .single();

  if (error) return { data: null, error };
  return { data: formatSupabaseAlert(data), error: null };
}

/**
 * Update an alert's verdict / decision / notes in Supabase
 */
export async function dbUpdateAlert(alertId, updateFields) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const patch = {};
  if (updateFields.decision !== undefined) patch.decision = updateFields.decision;
  if (updateFields.notes !== undefined) patch.notes = updateFields.notes;
  if (updateFields.status !== undefined) patch.status = updateFields.status;
  if (updateFields.reviewedAt !== undefined) patch.reviewed_at = updateFields.reviewedAt;
  if (updateFields.reviewedBy !== undefined) patch.reviewed_by = updateFields.reviewedBy;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('alerts')
    .update(patch)
    .eq('id', alertId)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data: formatSupabaseAlert(data), error: null };
}

/**
 * Sign in using Supabase Auth
 */
export async function supabaseSignIn(email, password) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign up using Supabase Auth
 */
export async function supabaseSignUp(email, password, metadata = {}) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
}

/**
 * Sign out of Supabase Auth
 */
export async function supabaseSignOut() {
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
}

/**
 * Send password reset email
 */
export async function supabaseResetPassword(email) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.auth.resetPasswordForEmail(email);
}
