/**
 * utils.js — Shared Utility Functions
 *
 * Provides:
 *   - Date/time formatting helpers
 *   - Input sanitization (XSS prevention)
 *   - Toast notification system
 *   - Modal helpers
 *   - Form validation helpers
 *   - Geofence distance calculation
 */

const Utils = (() => {

  // ─── Date & Time ─────────────────────────────────────────────────────────────

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-PH', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const todayISO = () => new Date().toISOString().split('T')[0];

  const todayLabel = () => new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const timeNow = () => new Date().toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const minutesBetween = (isoA, isoB) => {
    return Math.round((new Date(isoB) - new Date(isoA)) / 60000);
  };

  const hoursBetween = (isoA, isoB) => {
    return ((new Date(isoB) - new Date(isoA)) / 3600000).toFixed(2);
  };

  // ─── Security: Input Sanitization ────────────────────────────────────────────

  /**
   * Escapes HTML special characters to prevent XSS.
   * Use when inserting user-supplied text into innerHTML.
   */
  const sanitize = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  /**
   * Strips all HTML tags from a string.
   */
  const stripTags = (str) => {
    if (!str) return '';
    return String(str).replace(/<[^>]*>/g, '');
  };

  // ─── Validation ──────────────────────────────────────────────────────────────

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^[0-9+\-\s]{7,15}$/.test(phone);
  const isNonEmpty = (val) => val !== null && val !== undefined && String(val).trim() !== '';

  const validateForm = (fields) => {
    const errors = [];
    fields.forEach(({ name, value, rules }) => {
      rules.forEach(rule => {
        if (rule === 'required' && !isNonEmpty(value)) errors.push(`${name} is required.`);
        if (rule === 'email' && value && !isValidEmail(value)) errors.push(`${name} must be a valid email.`);
        if (rule === 'phone' && value && !isValidPhone(value)) errors.push(`${name} must be a valid phone number.`);
        if (typeof rule === 'object' && rule.minLength && value && value.length < rule.minLength)
          errors.push(`${name} must be at least ${rule.minLength} characters.`);
      });
    });
    return errors;
  };

  // ─── Toast Notifications ──────────────────────────────────────────────────────

  const toast = (message, type = 'info', duration = 3500) => {
    const container = document.getElementById('toast-container') || (() => {
      const el = document.createElement('div');
      el.id = 'toast-container';
      document.body.appendChild(el);
      return el;
    })();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${
        type === 'success' ? '✓' :
        type === 'error'   ? '✕' :
        type === 'warning' ? '⚠' : 'ℹ'
      }</span>
      <span class="toast-msg">${sanitize(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  };

  // ─── Modal ───────────────────────────────────────────────────────────────────

  const openModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  // Close modal on backdrop click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.closest('.modal')?.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // ─── Geofence ────────────────────────────────────────────────────────────────

  /**
   * Haversine formula — distance in meters between two lat/lng pairs.
   */
  const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const isWithinGeofence = (userLat, userLng, officeLat, officeLng, radiusMeters) => {
    return haversineDistance(userLat, userLng, officeLat, officeLng) <= radiusMeters;
  };

  // ─── Misc ────────────────────────────────────────────────────────────────────

  const getDepartmentName = (id) => {
    const dept = DB.find('departments', d => d.id === id);
    return dept ? dept.name : '—';
  };

  const getRoleName = (id) => {
    const role = DB.find('roles', r => r.id === id);
    return role ? role.name : '—';
  };

  const getSettings = () => DB.all('system_settings')[0] || {};

  const statusBadge = (status) => {
    const colors = {
      active: 'badge-green', inactive: 'badge-red',
      pending: 'badge-yellow', approved: 'badge-green',
      rejected: 'badge-red', present: 'badge-green',
      absent: 'badge-red', late: 'badge-yellow',
    };
    return `<span class="badge ${colors[status] || 'badge-gray'}">${sanitize(status)}</span>`;
  };

  return {
    formatDate, formatDateTime, formatTime,
    todayISO, todayLabel, timeNow,
    minutesBetween, hoursBetween,
    sanitize, stripTags,
    isValidEmail, isNonEmpty, validateForm,
    toast, openModal, closeModal,
    haversineDistance, isWithinGeofence,
    getDepartmentName, getRoleName,
    getSettings, statusBadge,
  };
})();
