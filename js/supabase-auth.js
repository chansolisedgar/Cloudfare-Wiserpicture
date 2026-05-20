/**
 * WiserPicture — Supabase Auth + Workbook Progress Module
 * 
 * This module handles:
 * 1. Authentication (Magic Link login)
 * 2. Saving workbook progress to Supabase
 * 3. Loading workbook progress from Supabase
 * 4. Fallback to localStorage when offline or not logged in
 */

// ============================================================
// CONFIGURATION — Replace these with your Supabase credentials
// ============================================================
const SUPABASE_URL = 'https://qwcagdlslkxrzqngystj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Y2FnZGxzbGt4cnpxbmd5c3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTkyNDMsImV4cCI6MjA5NDM3NTI0M30.rI6-hkEDvs9m_TJDVAc3eaPygo_1GRNUVyg9QbTvNJc';
const SITE_URL = window.location.origin || 'https://wiserpiture.netlify.app';

// ============================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================
let _supabase = null;

async function getSupabase() {
  if (_supabase) return _supabase;
  
  // Dynamic import from CDN (no build step needed)
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _supabase;
}

// ============================================================
// AUTHENTICATION
// ============================================================

/**
 * Get the current session. Returns null if not logged in.
 */
async function getSession() {
  try {
    const supabase = await getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (e) {
    console.warn('Auth check failed:', e);
    return null;
  }
}

/**
 * Get the current user. Returns null if not logged in.
 */
async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Require authentication. If not logged in, redirect to login.
 * Call this at the top of protected pages (portal, modules).
 */
async function requireAuth() {
  const user = await getUser();
  if (!user) {
    // Save current page so we can redirect back after login
    sessionStorage.setItem('wp_redirect_after_login', window.location.href);
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

/**
 * Check if the current user has access to a specific module number.
 * Returns true if access is granted, false otherwise.
 * Module 1 is always accessible (free tier).
 */
function checkModuleAccess(user, moduleNumber) {
  if (moduleNumber === 1) return true; // Module 1 is always free
  if (!user || !user.user_metadata) return false;
  const access = user.user_metadata.modules_access;
  if (!access || !Array.isArray(access)) return false;
  return access.includes(moduleNumber);
}

/**
 * Get the list of modules the user has access to.
 * Returns [1] at minimum (free module).
 */
function getModulesAccess(user) {
  if (!user || !user.user_metadata) return [1];
  const access = user.user_metadata.modules_access;
  if (!access || !Array.isArray(access)) return [1];
  // Always include module 1
  return [...new Set([1, ...access])];
}

/**
 * Require auth + module access. If no access, redirect to pricing.
 * @param {number} moduleNumber - The module number (1-5)
 */
async function requireModuleAccess(moduleNumber) {
  const user = await requireAuth();
  if (!user) return null; // Already redirecting to login
  
  if (!checkModuleAccess(user, moduleNumber)) {
    // User is logged in but doesn't have access to this module
    window.location.href = '/workbook.html#precios';
    return null;
  }
  return user;
}

/**
 * Send a Magic Link to the given email.
 */
async function sendMagicLink(email) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: SITE_URL + '/portal.html'
    }
  });
  return { data, error };
}

/**
 * Sign out the current user.
 */
async function signOut() {
  const supabase = await getSupabase();
  await supabase.auth.signOut();
  window.location.href = '/login.html';
}

/**
 * Listen for auth state changes (useful for handling magic link redirects).
 */
async function onAuthStateChange(callback) {
  const supabase = await getSupabase();
  supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// ============================================================
// WORKBOOK PROGRESS — SAVE & LOAD
// ============================================================

let _saveQueue = {};
let _saveTimer = null;
const SAVE_DEBOUNCE_MS = 2000;

/**
 * Queue a field for saving (debounced batch save).
 */
function queueSave(fieldId, value, fieldType = 'text') {
  _saveQueue[fieldId] = { value, fieldType };
  
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => flushSaves(), SAVE_DEBOUNCE_MS);
}

/**
 * Flush all queued saves to Supabase (or localStorage fallback).
 */
async function flushSaves() {
  const entries = { ..._saveQueue };
  _saveQueue = {};
  
  if (Object.keys(entries).length === 0) return;
  
  const user = await getUser();
  
  if (user) {
    // Save to Supabase
    try {
      const supabase = await getSupabase();
      const rows = Object.entries(entries).map(([fieldId, { value, fieldType }]) => ({
        user_id: user.id,
        field_id: fieldId,
        field_value: value,
        field_type: fieldType,
        updated_at: new Date().toISOString()
      }));
      
      await supabase
        .from('workbook_progress')
        .upsert(rows, { onConflict: 'user_id,field_id' });
      
      showSaveIndicator();
    } catch (e) {
      console.warn('Cloud save failed, using localStorage fallback:', e);
      // Fallback to localStorage
      Object.entries(entries).forEach(([fieldId, { value }]) => {
        localStorage.setItem(fieldId, value);
      });
      showSaveIndicator();
    }
  } else {
    // No user — save to localStorage
    Object.entries(entries).forEach(([fieldId, { value }]) => {
      localStorage.setItem(fieldId, value);
    });
    showSaveIndicator();
  }
}

/**
 * Load all saved progress for the current page.
 * Tries Supabase first, falls back to localStorage.
 */
async function loadProgress() {
  const user = await getUser();
  
  if (user) {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('workbook_progress')
        .select('field_id, field_value, field_type')
        .eq('user_id', user.id);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        // No cloud data — try migrating from localStorage
        migrateLocalStorageToCloud(user.id);
        loadFromLocalStorage();
        return;
      }
      
      applyProgressData(data);
    } catch (e) {
      console.warn('Cloud load failed, using localStorage:', e);
      loadFromLocalStorage();
    }
  } else {
    loadFromLocalStorage();
  }
}

/**
 * Apply progress data (from Supabase) to the DOM.
 */
function applyProgressData(data) {
  data.forEach(({ field_id, field_value, field_type }) => {
    const el = document.getElementById(field_id);
    if (!el) {
      // Could be a radio (stored by name)
      const radios = document.querySelectorAll(`input[name="${field_id}"]`);
      if (radios.length > 0) {
        radios.forEach(r => {
          if (r.value === field_value) r.checked = true;
        });
      }
      return;
    }
    
    if (field_type === 'checkbox') {
      el.checked = field_value === 'true';
    } else {
      el.value = field_value;
    }
  });
}

/**
 * Load progress from localStorage (fallback / offline mode).
 */
function loadFromLocalStorage() {
  // Text inputs and textareas
  const inputs = document.querySelectorAll("textarea, input[type='text'], input[type='number']");
  inputs.forEach(input => {
    const saved = localStorage.getItem(input.id);
    if (saved) input.value = saved;
  });
  
  // Radios
  const radios = document.querySelectorAll("input[type='radio']");
  radios.forEach(radio => {
    const saved = localStorage.getItem(radio.name);
    if (saved === radio.value) radio.checked = true;
  });
  
  // Checkboxes
  const checkboxes = document.querySelectorAll("input[type='checkbox']");
  checkboxes.forEach(cb => {
    const saved = localStorage.getItem(cb.id);
    if (saved === 'true') cb.checked = true;
  });
}

/**
 * One-time migration: move localStorage data to Supabase cloud.
 */
async function migrateLocalStorageToCloud(userId) {
  const inputs = document.querySelectorAll("textarea, input[type='text'], input[type='number']");
  const checkboxes = document.querySelectorAll("input[type='checkbox']");
  const radios = document.querySelectorAll("input[type='radio']");
  
  const rows = [];
  
  inputs.forEach(input => {
    const val = localStorage.getItem(input.id);
    if (val) {
      rows.push({
        user_id: userId,
        field_id: input.id,
        field_value: val,
        field_type: input.type === 'number' ? 'number' : 'text',
        updated_at: new Date().toISOString()
      });
    }
  });
  
  checkboxes.forEach(cb => {
    const val = localStorage.getItem(cb.id);
    if (val) {
      rows.push({
        user_id: userId,
        field_id: cb.id,
        field_value: val,
        field_type: 'checkbox',
        updated_at: new Date().toISOString()
      });
    }
  });
  
  // Radios — find unique names
  const radioNames = new Set();
  radios.forEach(r => radioNames.add(r.name));
  radioNames.forEach(name => {
    const val = localStorage.getItem(name);
    if (val) {
      rows.push({
        user_id: userId,
        field_id: name,
        field_value: val,
        field_type: 'radio',
        updated_at: new Date().toISOString()
      });
    }
  });
  
  if (rows.length > 0) {
    try {
      const supabase = await getSupabase();
      await supabase.from('workbook_progress').upsert(rows, { onConflict: 'user_id,field_id' });
      console.log(`Migrated ${rows.length} fields from localStorage to cloud.`);
    } catch (e) {
      console.warn('Migration failed:', e);
    }
  }
}

// ============================================================
// SAVE INDICATOR
// ============================================================

function showSaveIndicator() {
  const indicator = document.getElementById('save-status');
  if (indicator) {
    indicator.style.opacity = '1';
    setTimeout(() => { indicator.style.opacity = '0'; }, 2500);
  }
}

// ============================================================
// AUTO-SAVE SETUP — replaces the old localStorage-only system
// ============================================================

/**
 * Initialize auto-save for all inputs on the page.
 * Call this in DOMContentLoaded after loadProgress().
 */
function setupAutoSave() {
  const textareas = document.querySelectorAll("textarea");
  const textInputs = document.querySelectorAll("input[type='text']");
  const numberInputs = document.querySelectorAll("input[type='number']");
  const checkboxes = document.querySelectorAll("input[type='checkbox']");
  const radios = document.querySelectorAll("input[type='radio']");
  
  const allTextInputs = [...textareas, ...textInputs, ...numberInputs];
  
  // Text/textarea/number inputs — debounced save
  allTextInputs.forEach(input => {
    if (!input.id) return; // Skip inputs without IDs
    input.addEventListener('input', () => {
      queueSave(input.id, input.value, input.type === 'number' ? 'number' : 'text');
      // Also save to localStorage as fallback
      localStorage.setItem(input.id, input.value);
    });
  });
  
  // Radios — save by name
  radios.forEach(radio => {
    if (!radio.name) return;
    radio.addEventListener('change', () => {
      if (radio.checked) {
        queueSave(radio.name, radio.value, 'radio');
        localStorage.setItem(radio.name, radio.value);
        showSaveIndicator();
      }
    });
  });
  
  // Checkboxes — save by id
  checkboxes.forEach(cb => {
    if (!cb.id) return;
    cb.addEventListener('change', () => {
      queueSave(cb.id, String(cb.checked), 'checkbox');
      localStorage.setItem(cb.id, cb.checked);
      showSaveIndicator();
    });
  });
}

// ============================================================
// EXPORTS (available globally as window.WP)
// ============================================================

window.WP = {
  getSession,
  getUser,
  requireAuth,
  requireModuleAccess,
  checkModuleAccess,
  getModulesAccess,
  sendMagicLink,
  signOut,
  onAuthStateChange,
  loadProgress,
  setupAutoSave,
  queueSave,
  showSaveIndicator,
  getSupabase
};
