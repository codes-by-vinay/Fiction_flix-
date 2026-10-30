const authView = document.querySelector('#auth-view');
const signedInView = document.querySelector('#signed-in-view');
const authForm = document.querySelector('#auth-form');
const message = document.querySelector('#message');
const sessionMessage = document.querySelector('#session-message');
const submitButton = document.querySelector('#submit-button');
const modeButtons = document.querySelectorAll('[data-mode]');
let mode = 'login';

function setMode(nextMode) {
  mode = nextMode;
  const signingUp = mode === 'signup';
  document.querySelector('#form-title').textContent = signingUp ? 'Create your account' : 'Welcome back';
  document.querySelector('#form-intro').textContent = signingUp
    ? 'Create an account to keep your stories close.'
    : 'Sign in to continue where your story left off.';
  document.querySelector('#password').autocomplete = signingUp ? 'new-password' : 'current-password';
  submitButton.firstChild.textContent = signingUp ? 'Create account ' : 'Sign in ';
  message.textContent = '';
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function showSession(user) {
  document.querySelector('#account-email').textContent = user.email;
  authView.hidden = true;
  signedInView.hidden = false;
}

function showAuth() {
  signedInView.hidden = true;
  authView.hidden = false;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {'Content-Type': 'application/json', ...options.headers},
    ...options,
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return data;
}

modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  submitButton.disabled = true;

  const form = new FormData(authForm);
  try {
    const data = await requestJson(`/api/auth/${mode === 'signup' ? 'signup' : 'login'}`, {
      method: 'POST',
      body: JSON.stringify({email: form.get('email'), password: form.get('password')}),
    });
    showSession(data.user);
    authForm.reset();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelector('#logout-button').addEventListener('click', async () => {
  sessionMessage.textContent = '';
  try {
    await requestJson('/api/auth/logout', {method: 'POST'});
    showAuth();
    setMode('login');
  } catch (error) {
    sessionMessage.textContent = error.message;
  }
});

requestJson('/api/auth/me')
  .then(({user}) => showSession(user))
  .catch(() => showAuth());