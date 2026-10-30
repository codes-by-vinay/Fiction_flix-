const ownerName = document.body.dataset.ownerName || 'Owner';
const ownerInitials = ownerName
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part[0].toUpperCase())
  .join('');

document.querySelectorAll('.profile strong, .owner-chip strong').forEach(element => {
  element.textContent = ownerName;
});
document.querySelectorAll('.profile .avatar, .owner-chip .avatar').forEach(element => {
  element.textContent = ownerInitials || 'FF';
});
document.querySelector('.welcome h2').textContent = `Welcome, ${ownerName}`;

const notice = document.createElement('p');
notice.setAttribute('role', 'status');
notice.style.cssText = 'margin:0 0 16px;padding:12px 15px;border:1px solid #3c3033;border-radius:12px;background:#171114;color:#c9b9bd;font-size:12px';
notice.textContent = 'Account and content counts are live. Revenue, analytics and activity shown here are sample data and are not connected.';
document.querySelector('.welcome').after(notice);

const signOutButton = document.createElement('button');
signOutButton.className = 'date-btn';
signOutButton.type = 'button';
signOutButton.textContent = 'Sign out';
signOutButton.addEventListener('click', async () => {
  signOutButton.disabled = true;
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
    if (!response.ok) {
      throw new Error('Could not sign out. Please try again.');
    }
    window.location.assign('/login');
  } catch (error) {
    signOutButton.disabled = false;
    console.error('Could not sign out of FictionFlix.', error);
    document.getElementById('toast').textContent = error.message;
    document.getElementById('toast').classList.add('show');
  }
});
document.querySelector('.top-actions').append(signOutButton);

document.addEventListener('click', event => {
  const navButton = event.target.closest('button[data-page]');
  const actionButton = event.target.closest('button[data-action]');
  const label = navButton?.dataset.page || actionButton?.dataset.action;
  if (!label) return;

  const routes = {
    Overview: null,
    'Content Library': '/admin',
    'Web Series': '/admin',
    Episodes: '/admin',
    'Audio & Media': '/admin',
    'Users & Members': '/admin',
    'Team & Roles': '/admin',
    'Open content library': '/admin',
    'Add new web series': '/admin',
    'Upload new episode': '/admin',
    'Manage members': '/admin',
  };
  if (Object.hasOwn(routes, label) && routes[label]) {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(routes[label]);
  } else if (navButton && label !== 'Overview') {
    event.preventDefault();
    event.stopImmediatePropagation();
    document.getElementById('toast').textContent = `${label} is not available in the current app yet.`;
    document.getElementById('toast').classList.add('show');
  }
}, true);

function setMetric(index, label, value, detail) {
  const card = document.querySelectorAll('.stat')[index];
  card.querySelector('.stat-head').firstChild.textContent = `${label} `;
  card.querySelector('.stat-value').textContent = String(value);
  card.querySelector('.stat-foot').textContent = detail;
}

function addContentRow(show) {
  const row = document.createElement('tr');
  const title = document.createElement('td');
  const type = document.createElement('td');
  const status = document.createElement('td');
  const updated = document.createElement('td');
  title.textContent = show.title || 'Untitled';
  type.textContent = show.format || show.category || 'Story';
  status.textContent = show.status || 'Draft';
  updated.textContent = show.updatedAt || '—';
  row.append(title, type, status, updated);
  return row;
}

async function loadOwnerOverview() {
  const [accountsResponse, contentResponse] = await Promise.all([
    fetch('/api/studio/users', {credentials: 'same-origin'}),
    fetch('/api/content/managed', {credentials: 'same-origin'}),
  ]);
  if (accountsResponse.status === 401 || accountsResponse.status === 403
      || contentResponse.status === 401 || contentResponse.status === 403) {
    window.location.replace('/login');
    return;
  }
  if (!accountsResponse.ok || !contentResponse.ok) {
    throw new Error('Could not load owner dashboard data.');
  }

  const [accounts, content] = await Promise.all([
    accountsResponse.json(),
    contentResponse.json(),
  ]);
  if (accounts.status === 'error' || content.status === 'error') {
    throw new Error(accounts.message || content.message || 'Could not load owner dashboard data.');
  }

  const users = accounts.users || [];
  const shows = content.shows || [];
  const categories = content.categories || [];
  const published = shows.filter(show => show.status === 'Published');
  const drafts = shows.filter(show => show.status !== 'Published');

  setMetric(0, 'Total Accounts', users.length, 'Accounts in FictionFlix');
  setMetric(1, 'Published Titles', published.length, 'Published in the content library');
  setMetric(2, 'Draft Titles', drafts.length, 'Unpublished content');
  setMetric(3, 'Categories', categories.length, 'Available content categories');

  document.querySelector('.donut-center strong').textContent = String(shows.length);
  document.querySelector('.donut-center small').textContent = 'Total titles';
  const breakdown = document.querySelectorAll('.legend-item b');
  breakdown[0].textContent = `${published.length} published`;
  breakdown[1].textContent = `${drafts.length} drafts`;
  breakdown[2].textContent = `${categories.length} categories`;
  breakdown[3].textContent = `${users.length} accounts`;

  const tableBody = document.querySelector('#contentTable tbody');
  tableBody.replaceChildren(...shows.slice()
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
    .slice(0, 8)
    .map(addContentRow));
  document.getElementById('emptyState').style.display = shows.length ? 'none' : 'block';
}

loadOwnerOverview().catch(error => {
  console.error('Could not load owner dashboard data.', error);
  notice.textContent = error.message || 'Could not load owner dashboard data.';
});
