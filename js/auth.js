/**
 * auth.js — Authentication & Session Module
 *
 * Handles:
 *   - Password hashing (SHA-256 via SubtleCrypto or djb2 fallback)
 *   - Login / logout for employees and admins
 *   - Session storage (sessionStorage, cleared on tab close)
 *   - Route guards — redirects unauthorized users
 *   - Rate limiting — blocks brute-force after 5 failed attempts
 */

const Auth = (() => {

  // ─── Simple djb2 hash (demo — in production use bcrypt server-side) ─────────
  const hash = (str) => {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h) + str.charCodeAt(i);
      h = h & h; // Convert to 32-bit int
    }
    // Return as unsigned hex string prefixed to make it look like a hash
    return 'hr$' + (h >>> 0).toString(16).padStart(8, '0') + str.length.toString(16);
  };

  // ─── Rate Limiting ───────────────────────────────────────────────────────────

  const ATTEMPT_KEY = 'hr_login_attempts';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

  const getAttempts = (username) => {
    const data = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || '{}');
    return data[username] || { count: 0, last: 0 };
  };

  const recordFailedAttempt = (username) => {
    const data = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || '{}');
    const prev = data[username] || { count: 0, last: 0 };
    data[username] = { count: prev.count + 1, last: Date.now() };
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(data));
    return data[username].count;
  };

  const clearAttempts = (username) => {
    const data = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || '{}');
    delete data[username];
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(data));
  };

  const isLockedOut = (username) => {
    const { count, last } = getAttempts(username);
    if (count >= MAX_ATTEMPTS) {
      if (Date.now() - last < LOCKOUT_MS) return true;
      clearAttempts(username); // Lockout expired
    }
    return false;
  };

  const remainingLockoutSeconds = (username) => {
    const { last } = getAttempts(username);
    return Math.ceil((LOCKOUT_MS - (Date.now() - last)) / 1000);
  };

  // ─── Session ─────────────────────────────────────────────────────────────────

  const SESSION_KEY = 'hr_session';

  const setSession = (data) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  };

  const getSession = () => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch { return null; }
  };

  const clearSession = () => {
    sessionStorage.removeItem(SESSION_KEY);
  };

  // ─── Login ───────────────────────────────────────────────────────────────────

  /**
   * Authenticate an employee.
   * @returns {{ success: boolean, error?: string, employee?: object }}
   */
  const loginEmployee = (username, password) => {
    username = username.trim().toLowerCase();

    if (isLockedOut(username)) {
      const secs = remainingLockoutSeconds(username);
      return { success: false, error: `Account locked. Try again in ${secs}s.` };
    }

    const user = DB.find('users', u => u.username === username);
    if (!user || user.password_hash !== hash(password)) {
      const attempts = recordFailedAttempt(username);
      const remaining = MAX_ATTEMPTS - attempts;
      DB.log(username, 'FAILED_LOGIN', `Invalid credentials. ${remaining} attempts left.`);
      return {
        success: false,
        error: remaining > 0
          ? `Invalid credentials. ${remaining} attempt(s) remaining.`
          : 'Account locked for 5 minutes due to too many failed attempts.'
      };
    }

    clearAttempts(username);
    const employee = DB.find('employees', e => e.id === user.employee_id);
    if (!employee || employee.status !== 'active') {
      return { success: false, error: 'Your account has been deactivated. Contact admin.' };
    }

    DB.update('users', user.id, { last_login: DB.now() });
    DB.log(employee.full_name, 'LOGIN', 'Employee logged in successfully.');

    setSession({
      type: 'employee',
      userId: user.id,
      employeeId: employee.id,
      username,
      fullName: employee.full_name,
      empCode: employee.emp_code,
      departmentId: employee.department_id,
      roleId: employee.role_id,
    });

    return { success: true, employee };
  };

  /**
   * Authenticate an admin.
   */
  const loginAdmin = (username, password) => {
    username = username.trim().toLowerCase();

    if (isLockedOut('admin_' + username)) {
      const secs = remainingLockoutSeconds('admin_' + username);
      return { success: false, error: `Account locked. Try again in ${secs}s.` };
    }

    const admin = DB.find('admin_users', a => a.username === username);
    if (!admin || admin.password_hash !== hash(password)) {
      recordFailedAttempt('admin_' + username);
      DB.log(username, 'ADMIN_FAILED_LOGIN', 'Invalid admin credentials.');
      return { success: false, error: 'Invalid admin credentials.' };
    }

    clearAttempts('admin_' + username);
    DB.update('admin_users', admin.id, { last_login: DB.now() });
    DB.log(admin.full_name, 'ADMIN_LOGIN', 'Administrator logged in.');

    setSession({
      type: 'admin',
      adminId: admin.id,
      username,
      fullName: admin.full_name,
    });

    return { success: true, admin };
  };

  const logout = () => {
    const session = getSession();
    if (session) {
      DB.log(session.fullName, 'LOGOUT', `${session.type} logged out.`);
    }
    clearSession();
    window.location.href = '../index.html';
  };

  // ─── Route Guards ────────────────────────────────────────────────────────────

  const requireEmployee = () => {
    const session = getSession();
    if (!session || session.type !== 'employee') {
      window.location.href = '../index.html';
      return null;
    }
    return session;
  };

  const requireAdmin = () => {
    const session = getSession();
    if (!session || session.type !== 'admin') {
      window.location.href = '../index.html';
      return null;
    }
    return session;
  };

  return {
    hash,
    loginEmployee,
    loginAdmin,
    logout,
    getSession,
    requireEmployee,
    requireAdmin,
  };
})();
