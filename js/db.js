/**
 * db.js — Database Layer (SQLite via localStorage simulation)
 * 
 * Manages all persistent data using localStorage as a structured
 * key-value store, mimicking SQLite table operations.
 * 
 * Tables:
 *   - employees       : Core employee profiles
 *   - users           : Employee login credentials (hashed passwords)
 *   - admin_users     : Admin login credentials
 *   - departments     : Department lookup
 *   - roles           : Role lookup
 *   - attendance      : Daily check-in/out records
 *   - leave_requests  : Leave applications
 *   - activity_logs   : Audit trail with timestamps
 *   - system_settings : Global configuration
 *   - notifications   : Announcements
 */

const DB = (() => {

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getTable = (name) => {
    try {
      return JSON.parse(localStorage.getItem(`hr_${name}`)) || [];
    } catch { return []; }
  };

  const setTable = (name, data) => {
    localStorage.setItem(`hr_${name}`, JSON.stringify(data));
  };

  const nextId = (table) => {
    const rows = getTable(table);
    return rows.length === 0 ? 1 : Math.max(...rows.map(r => r.id)) + 1;
  };

  const now = () => new Date().toISOString();

  // ─── Seed / Init ────────────────────────────────────────────────────────────

  const isSeeded = () => !!localStorage.getItem('hr_seeded');

  const seed = () => {
    if (isSeeded()) return;

    // Departments
    setTable('departments', [
      { id: 1, name: 'Engineering' },
      { id: 2, name: 'Human Resources' },
      { id: 3, name: 'Finance' },
      { id: 4, name: 'Marketing' },
    ]);

    // Roles
    setTable('roles', [
      { id: 1, name: 'Software Engineer' },
      { id: 2, name: 'HR Specialist' },
      { id: 3, name: 'Accountant' },
      { id: 4, name: 'Marketing Analyst' },
      { id: 5, name: 'Team Lead' },
    ]);

    // Admin users (password: admin123 → hashed)
    setTable('admin_users', [
      {
        id: 1,
        username: 'admin',
        password_hash: Auth.hash('admin123'),
        full_name: 'System Administrator',
        email: 'admin@hrportal.com',
        created_at: now(),
      }
    ]);

    // Employees
    setTable('employees', [
      {
        id: 1, emp_code: 'EMP001', full_name: 'Alice Santos',
        department_id: 1, role_id: 1, status: 'active',
        email: 'alice@hrportal.com', phone: '09171234567',
        hire_date: '2022-03-15', profile_image: null,
        emergency_contact: 'Bob Santos — 09179876543',
      },
      {
        id: 2, emp_code: 'EMP002', full_name: 'Carlos Reyes',
        department_id: 2, role_id: 2, status: 'active',
        email: 'carlos@hrportal.com', phone: '09181234567',
        hire_date: '2021-07-01', profile_image: null,
        emergency_contact: 'Maria Reyes — 09189876543',
      },
      {
        id: 3, emp_code: 'EMP003', full_name: 'Diana Cruz',
        department_id: 3, role_id: 3, status: 'active',
        email: 'diana@hrportal.com', phone: '09191234567',
        hire_date: '2023-01-10', profile_image: null,
        emergency_contact: 'Jose Cruz — 09199876543',
      },
    ]);

    // User credentials for employees (password: pass123)
    setTable('users', [
      { id: 1, employee_id: 1, username: 'alice', password_hash: Auth.hash('pass123'), last_login: null },
      { id: 2, employee_id: 2, username: 'carlos', password_hash: Auth.hash('pass123'), last_login: null },
      { id: 3, employee_id: 3, username: 'diana', password_hash: Auth.hash('pass123'), last_login: null },
    ]);

    // System settings
    setTable('system_settings', [{
      id: 1,
      workday_start: '08:00',
      workday_end: '17:00',
      late_threshold_minutes: 15,
      casual_leave_days: 15,
      sick_leave_days: 10,
      office_lat: 14.5995,
      office_lng: 120.9842,
      geofence_radius_meters: 300,
      office_name: 'HR Portal HQ — Manila',
    }]);

    // Sample notifications
    setTable('notifications', [
      {
        id: 1, title: 'Welcome to HR Portal',
        body: 'The new HR Management System is now live. Please update your profile and review company policies.',
        type: 'info', created_at: now(), created_by: 'admin',
      },
      {
        id: 2, title: 'Holiday Notice — June 12',
        body: 'Independence Day is a non-working holiday. No attendance required.',
        type: 'holiday', created_at: now(), created_by: 'admin',
      },
    ]);

    localStorage.setItem('hr_seeded', '1');
    console.log('[DB] Database seeded successfully.');
  };

  // ─── CRUD Operations ────────────────────────────────────────────────────────

  const insert = (table, data) => {
    const rows = getTable(table);
    const row = { id: nextId(table), created_at: now(), ...data };
    rows.push(row);
    setTable(table, rows);
    return row;
  };

  const find = (table, predicate) => {
    return getTable(table).find(predicate) || null;
  };

  const filter = (table, predicate) => {
    return predicate ? getTable(table).filter(predicate) : getTable(table);
  };

  const update = (table, id, changes) => {
    const rows = getTable(table);
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...changes, updated_at: now() };
    setTable(table, rows);
    return rows[idx];
  };

  const remove = (table, id) => {
    const rows = getTable(table).filter(r => r.id !== id);
    setTable(table, rows);
  };

  const all = (table) => getTable(table);

  // ─── Activity Log ────────────────────────────────────────────────────────────

  const log = (actor, action, details = '') => {
    insert('activity_logs', {
      actor,
      action,
      details,
      ip_address: '127.0.0.1', // In a real app, captured server-side
      timestamp: now(),
    });
  };

  return { seed, insert, find, filter, update, remove, all, log, now };
})();
