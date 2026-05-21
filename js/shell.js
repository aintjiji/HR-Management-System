/**
 * shell.js — App Shell Renderer
 *
 * Renders the sidebar navigation and top bar dynamically
 * for both Employee and Admin portals.
 *
 * Usage: call Shell.render(config) at page load.
 */

const Shell = (() => {

  const employeeNav = [
    { label: 'Overview', section: true },
    { icon: '⬡', label: 'Dashboard',      href: 'employee-dashboard.html' },
    { label: 'Attendance', section: true },
    { icon: '📍', label: 'Check In/Out',   href: 'employee-attendance.html' },
    { label: 'Work & Leaves', section: true },
    { icon: '📝', label: 'Work Log',       href: 'employee-worklog.html' },
    { icon: '🏖️', label: 'Leave Requests', href: 'employee-leaves.html' },
    { label: 'Account', section: true },
    { icon: '👤', label: 'My Profile',     href: 'employee-profile.html' },
    { icon: '📢', label: 'Notices',        href: 'employee-notices.html' },
  ];

  const adminNav = [
    { label: 'Overview', section: true },
    { icon: '⬡', label: 'Dashboard',       href: 'admin-dashboard.html' },
    { label: 'People', section: true },
    { icon: '👥', label: 'Employees',       href: 'admin-employees.html' },
    { icon: '📍', label: 'Attendance',      href: 'admin-attendance.html' },
    { label: 'Requests', section: true },
    { icon: '🏖️', label: 'Leave Approvals', href: 'admin-leaves.html' },
    { label: 'Reports & Config', section: true },
    { icon: '📋', label: 'Activity Logs',   href: 'admin-logs.html' },
    { icon: '📢', label: 'Notifications',   href: 'admin-notifications.html' },
    { icon: '⚙️', label: 'Settings',        href: 'admin-settings.html' },
  ];

  const render = ({ type, activePage, pageTitle }) => {
    const session = type === 'admin'
      ? Auth.requireAdmin()
      : Auth.requireEmployee();

    if (!session) return; // Guard redirected

    const nav = type === 'admin' ? adminNav : employeeNav;

    // Build nav HTML
    const navHTML = nav.map(item => {
      if (item.section) {
        return `<div class="nav-section-label">${Utils.sanitize(item.label)}</div>`;
      }
      const isActive = item.href === activePage;
      return `
        <a class="nav-link ${isActive ? 'active' : ''}" href="${item.href}">
          <span class="nav-icon">${item.icon}</span>
          <span>${Utils.sanitize(item.label)}</span>
        </a>
      `;
    }).join('');

    // Sidebar HTML
    const sidebarHTML = `
      <div class="sidebar-header">
        <div class="sidebar-logo">HR PORTAL</div>
        <div class="sidebar-role">${type === 'admin' ? 'Admin Control Panel' : 'Employee Portal'}</div>
      </div>
      <div class="sidebar-user">
        <div class="user-avatar">${Utils.sanitize(session.fullName.charAt(0))}</div>
        <div class="user-info">
          <div class="user-name">${Utils.sanitize(session.fullName)}</div>
          <div class="user-code text-mono">${Utils.sanitize(session.empCode || session.username)}</div>
        </div>
      </div>
      <nav class="sidebar-nav">${navHTML}</nav>
      <div class="sidebar-footer">
        <button class="btn-logout" onclick="Auth.logout()">
          <span>⬡</span> Sign Out
        </button>
      </div>
    `;

    document.getElementById('sidebar').innerHTML = sidebarHTML;
    document.getElementById('top-bar-title').textContent = pageTitle || '';
    document.getElementById('top-bar-date').textContent = Utils.todayLabel();

    // Mobile toggle
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Close sidebar on nav click (mobile)
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
      });
    });

    return session;
  };

  return { render };
})();
