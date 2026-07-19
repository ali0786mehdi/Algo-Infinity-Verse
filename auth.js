(function () {
  document.documentElement.classList.add('auth-loading');
  const privateHashes = new Set(['#dashboard', '#profile']);
  let currentSession = null;
  let authReady = false;

  function isAuthPage() {
    return (
      location.pathname === '/login' ||
      location.pathname.endsWith('/login.html') ||
      location.pathname === '/signup' ||
      location.pathname.endsWith('/signup.html')
    );
  }

  function authUrl(path) {
    if (location.protocol === 'file:') return path.endsWith('.html') ? path : `${path}.html`;
    return path;
  }

  function nextUrl() {
    return `${location.pathname}${location.search}${location.hash}`;
  }

  async function getSession() {
    if (location.protocol === 'file:') return { authenticated: false, user: null };

    try {
      const response = await fetch('/api/session', {
        credentials: 'include',
      });
      if (!response.ok) return { authenticated: false, user: null };
      return response.json();
    } catch {
      return { authenticated: false, user: null };
    }
  }

  function loginRedirect() {
    location.href = `${authUrl('/login')}?next=${encodeURIComponent(nextUrl())}`;
  }

  function guardPrivateHash() {
    if (!authReady) return;

    if (privateHashes.has(location.hash) && !currentSession?.authenticated) {
      loginRedirect();
    }
  }

  function updateProfileNames(user) {
    if (!user) {
      ['profileName', 'profileSectionName', 'dashboardProfileName', 'profileNameInput'].forEach(
        (id) => {
          const element = document.getElementById(id);
          if (!element) return;

          if (element.tagName === 'INPUT') element.value = '';
          element.textContent = 'Learner';
        }
      );

      document
        .querySelectorAll('[data-auth-user-name]')
        .forEach((el) => (el.textContent = 'Hello Learner'));

      document.querySelectorAll('[data-auth-user-email]').forEach((el) => (el.textContent = ''));

      document.querySelectorAll('[data-auth-avatar]').forEach((el) => {
        el.style.display = 'none';
      });
      return;
    }

    ['profileName', 'profileSectionName', 'dashboardProfileName', 'profileNameInput'].forEach(
      (id) => {
        const element = document.getElementById(id);
        if (!element) return;

        if (element.tagName === 'INPUT') element.value = user.name;
        else {
          element.textContent = user.name;
        }
      }
    );

    const displayName = user?.name || 'Guest';

    document
      .querySelectorAll('[data-auth-user-name]')
      .forEach((el) => (el.textContent = `Hello ${displayName}`));

    document
      .querySelectorAll('[data-auth-user-email]')
      .forEach((el) => (el.textContent = user.email));

    document.querySelectorAll('[data-auth-avatar]').forEach((el) => {
      if (user && user.avatar) {
        el.src = user.avatar;
        el.style.display = 'inline-block';
      } else {
        el.style.display = 'none';
      }
    });

    const supportName = document.querySelector(".support-form input[placeholder='Name']");
    const supportEmail = document.querySelector(".support-form input[placeholder='Email']");

    if (supportName && !supportName.value) supportName.value = user.name;
    if (supportEmail && !supportEmail.value) supportEmail.value = user.email;
  }

  function renderAuthNav() {
    function inject() {
      const header = document.getElementById('settingsProfileHeader');
      if (!header) return;

      if (currentSession?.authenticated) {
        header.style.display = '';
        header.innerHTML = `
          <div class="settings-profile-info">
            <div class="settings-avatar-wrapper">
              <img class="settings-avatar" src="" alt="" data-auth-avatar style="display: none;" />
              <i class="fas fa-user-circle settings-avatar-fallback"></i>
            </div>
            <div class="settings-user-details">
              <div class="settings-user-name" data-auth-user-name>Hello Learner</div>
              <div class="settings-user-email" data-auth-user-email></div>
            </div>
          </div>
        `;
        updateProfileNames(currentSession.user);
      } else {
        header.style.display = 'none';
        header.innerHTML = '';
      }
    }

    if (document.getElementById('settingsProfileHeader')) {
      inject();
    } else {
      const observer = new MutationObserver(() => {
        if (document.getElementById('settingsProfileHeader')) {
          observer.disconnect();
          inject();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function wireLogout() {
    document.addEventListener('click', async (event) => {
      const logoutButton = event.target.closest('[data-auth-logout]');
      if (!logoutButton) return;

      event.preventDefault();
      if (!confirm('Are you sure you want to logout?')) return;
      logoutButton.disabled = true;

      if (location.protocol !== 'file:') {
        try {
          const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include',
          });

          if (!response.ok) throw new Error('Logout failed.');
        } catch (error) {
          void 0;
          logoutButton.disabled = false;
          return;
        }
      }

      location.href = authUrl('/login');
    }); // ✅ closes addEventListener
  } // ✅ closes wireLogout

  function wireGuestButton() {
    document.addEventListener('click', async (event) => {
      const guestBtn = event.target.closest('[data-auth-guest]');
      if (!guestBtn) return;
      event.preventDefault();
      guestBtn.disabled = true;
      guestBtn.dataset.loading = 'true';
      guestBtn.innerHTML = '<span class="btn-spinner"></span><span>Entering as guest...</span>';
      try {
        const response = await fetch('/api/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
          currentSession = { authenticated: true, user: payload.user };
          window.algoAuth = currentSession;
          document.documentElement.classList.remove('auth-unverified', 'auth-loading');
          document.documentElement.classList.add('auth-verified');
          renderAuthNav();
          updateProfileNames(currentSession.user);
          location.href = getNextDestination();
        } else {
          const text = JSON.stringify(payload);
          void 0;
          throw new Error('Guest login failed: ' + (payload.error || text || response.status));
        }
      } catch (error) {
        void 0;
      } finally {
        guestBtn.disabled = false;
        delete guestBtn.dataset.loading;
        guestBtn.innerHTML = '<i class="fas fa-user-astronaut"></i><span>Continue as Guest</span>';
      }
    });
  }

  function setFormMessage(form, message, type) {
    const messageBox = form.querySelector('[data-auth-message]');
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `auth-message ${type || ''}`.trim();
  }

  function getNextDestination() {
    const params = new URLSearchParams(location.search);
    const next = params.get('next');

    if (next && next.startsWith('/') && !next.startsWith('//')) {
      return next;
    }
    return '/';
  }

  function wireAuthForm() {
    const form = document.querySelector('[data-auth-form]');
    if (!form) return;

    const mode = form.dataset.authForm;
    const passwordInput = form.querySelector("input[name='password']");
    const strengthBar = form.querySelector('[data-password-strength]');

    const validators = {
      name: (val) => (val.trim().length >= 2 ? '' : 'Name must be at least 2 characters.'),
      email: (val) =>
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim())
          ? ''
          : 'Please enter a valid email address.',
      password: (val) => {
        if (mode === 'login') return val.length > 0 ? '' : 'Password is required.';
        if (val.length < 8) return 'Password must be at least 8 characters.';
        if (!/[A-Z]/.test(val)) return 'Must include an uppercase letter.';
        if (!/[a-z]/.test(val)) return 'Must include a lowercase letter.';
        if (!/\d/.test(val)) return 'Must include a number.';
        if (!/[^A-Za-z0-9]/.test(val)) return 'Must include a special character.';
        return '';
      },
      confirmPassword: (val) => {
        if (mode === 'login') return '';
        return val === passwordInput?.value ? '' : 'Passwords do not match.';
      },
    };

    function showError(input, message) {
      const container = input.closest('.form-group') || input.parentElement;
      let errorEl = container.querySelector('.inline-error');

      if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'inline-error';
        errorEl.style.color = '#ef4444';
        errorEl.style.fontSize = '0.8rem';
        errorEl.style.marginTop = '0.3rem';
        container.appendChild(errorEl);
      }

      errorEl.textContent = message;
      input.style.borderColor = message ? '#ef4444' : 'rgba(255, 255, 255, 0.1)';
    }

    const touched = new Set();

    form.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', () => {
        if (input.value) touched.add(input.name);
        if (validators[input.name]) {
          showError(input, validators[input.name](input.value));
        }

        if (input.name === 'password' && strengthBar) {
          strengthBar.dataset.score = String(passwordStrength(input.value));

          const confirmInput = form.querySelector("input[name='confirmPassword']");

          if (confirmInput && confirmInput.value) {
            showError(confirmInput, validators.confirmPassword(confirmInput.value));
          }
        }
      });

      input.addEventListener('blur', () => {
        if (touched.has(input.name) && validators[input.name]) {
          showError(input, validators[input.name](input.value));
        }
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      let isValid = true;
      const formData = new FormData(form);
      const dataObj = Object.fromEntries(formData.entries());

      form.querySelectorAll('input').forEach((input) => {
        touched.add(input.name);
        if (validators[input.name]) {
          const errorMsg = validators[input.name](input.value);
          showError(input, errorMsg);
          if (errorMsg) isValid = false;
        }
      });

      if (!isValid) {
        setFormMessage(form, 'Please fix the errors above before submitting.', 'error');
        return;
      }

      // Loading state ON
      const submitButton = form.querySelector("button[type='submit']");
      if (!submitButton) return; // Guard: ensure submit button exists
      submitButton.disabled = true;
      submitButton.dataset.loading = 'true';
      submitButton.innerHTML = `
  <span class="btn-spinner"></span>
  <span>${mode === 'login' ? 'Logging in...' : 'Signing up...'}</span>
`;
      setFormMessage(form, 'Working...', 'info');

      try {
        // --- 1. FETCH CSRF TOKEN FIRST ---
        const csrfResponse = await fetch('/api/csrf-token', { credentials: 'include' });
        if (!csrfResponse.ok) throw new Error('Failed to initialize secure session.');
        const { csrfToken } = await csrfResponse.json();
        // ---------------------------------

        // --- 2. INJECT TOKEN INTO HEADERS ---
        const response = await fetch(`/api/${mode}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken, // <-- New Header Added
          },
          body: JSON.stringify(dataObj),
        });

        const payload = await response.json();
        if (payload.requiresVerification) {
          const emailEnc = encodeURIComponent(payload.email || '');
          location.href = `/verify-email?email=${emailEnc}`;
          return;
        }
        if (!response.ok) throw new Error(payload.error || 'Authentication failed.');

        setFormMessage(form, 'Success. Redirecting...', 'success');
        location.href = getNextDestination();
      } catch (error) {
        setFormMessage(form, error.message, 'error');
      } finally {
        submitButton.disabled = false;
        delete submitButton.dataset.loading;
        // Restore button text
        submitButton.innerHTML =
          mode === 'login'
            ? `<i class="fas fa-right-to-bracket"></i><span>Log In</span>`
            : `<i class="fas fa-user-plus"></i><span>Sign Up</span>`;
      }
    });
  }

  function renderFileModeError() {
    const form = document.querySelector('[data-auth-form]');
    const container = form?.closest('main') || document.body;

    const box = document.createElement('div');
    box.style.margin = '16px 0';
    box.style.padding = '12px 14px';
    box.style.border = '1px solid #ef4444';
    box.style.borderRadius = '10px';
    box.style.background = 'rgba(239,68,68,0.08)';
    box.style.color = '#ef4444';
    box.style.fontWeight = '600';
    box.setAttribute('role', 'alert');

    box.textContent =
      'Authentication requires running the server. Open this app at  (run: npm start or node server.js).';

    container.prepend(box);

    if (form) {
      const submitBtn = form.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (location.protocol === 'file:') {
      renderFileModeError();
      currentSession = {
        authenticated: false,
        user: null,
      };
      document.documentElement.classList.remove('auth-verified', 'auth-loading');
      document.documentElement.classList.add('auth-unverified');
      authReady = true;
      window.algoAuth = currentSession;

      renderAuthNav();
      wireLogout();
      wireAuthForm();
      wireDeactivateAccount();
      wireChangePassword();
      wireDeleteAccount();
      updateProfileNames(currentSession.user);
      guardPrivateHash();

      window.addEventListener('hashchange', guardPrivateHash);
      return;
    }

    currentSession = await getSession();

    // Supabase OAuth bridge removed. Auth is now strictly handled by our JWT
    // cookie session via /api/session + /api/login + /api/signup + /api/guest.

    authReady = true;
    window.algoAuth = currentSession;

    if (currentSession.authenticated) {
      document.documentElement.classList.remove('auth-unverified', 'auth-loading');
      document.documentElement.classList.add('auth-verified');
    } else {
      document.documentElement.classList.remove('auth-verified', 'auth-loading');
      document.documentElement.classList.add('auth-unverified');
    }

    if (currentSession.authenticated && isAuthPage()) {
      location.href = getNextDestination();
      return;
    }

    renderAuthNav();
    wireLogout();
    wireGuestButton();
    wireAuthForm();
    wireDeactivateAccount();
    wireChangePassword();
    wireDeleteAccount();
    updateProfileNames(currentSession.user);

    window.addEventListener('hashchange', guardPrivateHash);
    guardPrivateHash();
  });

  // Partials (profile section with action buttons) load AFTER DOMContentLoaded,
  // so re-wire once they're available.
  // Use a flag to prevent duplicate listeners from repeated wiring calls.
  let _wired = false;
  document.addEventListener('partialsLoaded', () => {
    if (_wired) return;
    _wired = true;
    wireDeactivateAccount();
    wireChangePassword();
    wireDeleteAccount();
  });
})();

/**
 * Shows an in-page confirmation modal for a destructive account action,
 * replacing the native confirm()/prompt() dialogs this codebase avoids.
 * Resolves with { confirmed, password } — password is only collected when
 * requirePassword is true, and is null otherwise or on cancel.
 */
function showAccountActionModal({ title, message, confirmText, requirePassword = false }) {
  return new Promise((resolve) => {
    let settled = false;

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 480px;">
        <div class="modal-header">
          <h3></h3>
          <button type="button" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <p></p>
          ${
            requirePassword
              ? `
            <div class="password-field">
              <label for="accountActionPassword">Confirm your password</label>
              <input type="password" id="accountActionPassword" placeholder="Enter your password" autocomplete="current-password" />
              <small id="accountActionPasswordError" class="field-error"></small>
            </div>
          `
              : ''
          }
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="accountActionCancel">Cancel</button>
          <button type="button" class="btn btn-danger" id="accountActionConfirm"></button>
        </div>
      </div>
    `;
    modal.querySelector('.modal-header h3').textContent = title;
    modal.querySelector('.modal-body p').textContent = message;
    modal.querySelector('#accountActionConfirm').textContent = confirmText;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('#accountActionCancel');
    const confirmBtn = modal.querySelector('#accountActionConfirm');
    const passwordInput = modal.querySelector('#accountActionPassword');
    const passwordError = modal.querySelector('#accountActionPasswordError');

    function settle(result) {
      if (settled) return;
      settled = true;
      document.removeEventListener('keydown', onKeydown);
      modal.classList.remove('active');
      modal.remove();
      resolve(result);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') settle({ confirmed: false, password: null });
    }

    document.addEventListener('keydown', onKeydown);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) settle({ confirmed: false, password: null });
    });
    closeBtn.addEventListener('click', () => settle({ confirmed: false, password: null }));
    cancelBtn.addEventListener('click', () => settle({ confirmed: false, password: null }));

    confirmBtn.addEventListener('click', () => {
      if (requirePassword) {
        const password = passwordInput.value;
        if (!password) {
          passwordError.textContent = 'Password is required.';
          passwordInput.focus();
          return;
        }
        settle({ confirmed: true, password });
        return;
      }
      settle({ confirmed: true, password: null });
    });

    setTimeout(() => (passwordInput || confirmBtn).focus(), 50);
  });
}

function showDeactivateAccountModal() {
  return new Promise((resolve) => {
    let settled = false;
    const isGuest =
      window.algoAuth?.user?.id && String(window.algoAuth.user.id).startsWith('guest-');

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="modal-content deactivate-modal-content">
        <button type="button" class="modal-close" id="deactivateModalClose" aria-label="Close">
          &times;
        </button>
        <div class="deactivate-icon">
          <div class="deactivate-icon-ring">
            <i class="fas ${isGuest ? 'fa-lock' : 'fa-triangle-exclamation'} deactivate-icon-symbol"></i>
          </div>
        </div>
        <h2 class="deactivate-title">Deactivate Account</h2>
        <p class="deactivate-subtitle">
          ${isGuest
            ? 'Guest accounts cannot be deactivated.'
            : 'Are you sure you want to deactivate your account?'}
        </p>
        <div class="deactivate-info-box">
          <p class="deactivate-info-text">
            ${isGuest
              ? 'Sign in to manage your account settings and access all features.'
              : 'Your profile, progress, and data will be hidden. You can reactivate at any time by logging back in.'}
          </p>
        </div>
        <div class="deactivate-actions">
          <div class="deactivate-actions__main">
            <button type="button" class="deactivate-btn deactivate-btn--outline" id="deactivateCancel">Cancel</button>
            <button type="button" class="deactivate-btn deactivate-btn--danger" id="deactivateConfirm" ${isGuest ? 'disabled' : ''}>
              <i class="fas fa-user-slash"></i> Deactivate
            </button>
          </div>
        </div>
        <p class="deactivate-dismiss">
          <button type="button" class="deactivate-dismiss-btn" id="deactivateDismiss">Maybe later</button>
        </p>
      </div>
    `;

    document.body.appendChild(modal);

    function settle(confirmed) {
      if (settled) return;
      settled = true;
      document.removeEventListener('keydown', onKeydown);
      modal.classList.remove('active');
      modal.remove();
      resolve({ confirmed });
    }

    function onKeydown(e) {
      if (e.key === 'Escape') settle(false);
    }

    document.addEventListener('keydown', onKeydown);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) settle(false);
    });
    modal.querySelector('#deactivateModalClose').addEventListener('click', () => settle(false));
    modal.querySelector('#deactivateCancel').addEventListener('click', () => settle(false));
    modal.querySelector('#deactivateDismiss').addEventListener('click', () => settle(false));
    modal.querySelector('#deactivateConfirm').addEventListener('click', () => {
      if (isGuest) return;
      settle(true);
    });

    setTimeout(() => modal.querySelector('#deactivateCancel').focus(), 50);
  });
}

let _deactWired = false;

function wireDeactivateAccount() {
  if (_deactWired) return;
  _deactWired = true;

  const btn = document.getElementById('deactivateAccountBtn');

  if (!btn) return;

  btn.addEventListener('click', async () => {
    const { confirmed } = await showDeactivateAccountModal();

    if (!confirmed) return;

    try {
      const response = await fetch('/api/deactivate-account', {
        method: 'POST',
        credentials: 'include',
      });

      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deactivate account.');
      }

      void 0;

      window.location.href = '/login';
    } catch (error) {
      void 0;
    }
  });
}

let _delWired = false;

function wireDeleteAccount() {
  if (_delWired) return;
  _delWired = true;

  const btn = document.getElementById('deleteAccountBtn');

  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!window.algoAuth?.authenticated) {
      if (window.authGate) {
        window.authGate.open('Please log in to delete your account.', 'login');
      }
      return;
    }

    const { confirmed, password } = await showDeleteAccountModal();

    if (!confirmed) return;
    if (!password) return;

    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
        }),
      });

      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account.');
      }

      void 0;

      window.location.href = '/login';
    } catch (error) {
      void 0;
    }
  });
}

function showDeleteAccountModal() {
  return new Promise((resolve) => {
    let settled = false;
    const modal = document.getElementById('deleteAccountModal');

    if (!modal) {
      resolve({ confirmed: false, password: null });
      return;
    }

    const closeBtn = document.getElementById('deleteAccountModalClose');
    const cancelBtn = document.getElementById('deleteAccountCancel');
    const confirmBtn = document.getElementById('deleteAccountConfirm');
    const passwordInput = document.getElementById('deleteAccountPassword');
    const passwordError = document.getElementById('deleteAccountPasswordError');
    const passwordToggle = modal.querySelector('.password-toggle');

    passwordInput.value = '';
    passwordError.textContent = '';
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Delete Account';

    function onToggle() {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordToggle.innerHTML =
        passwordInput.type === 'password'
          ? '<i class="fas fa-eye"></i>'
          : '<i class="fas fa-eye-slash"></i>';
    }

    passwordToggle.addEventListener('click', onToggle);

    function settle(result) {
      if (settled) return;
      settled = true;
      document.removeEventListener('keydown', onKeydown);
      modal.removeEventListener('click', onOverlayClick);
      passwordToggle.removeEventListener('click', onToggle);
      modal.classList.remove('active');
      resolve(result);
    }

    function onOverlayClick(e) {
      if (e.target === modal) settle({ confirmed: false, password: null });
    }

    function onKeydown(e) {
      if (e.key === 'Escape') settle({ confirmed: false, password: null });
    }

    document.addEventListener('keydown', onKeydown);

    modal.addEventListener('click', onOverlayClick);

    closeBtn.addEventListener('click', () => settle({ confirmed: false, password: null }));
    cancelBtn.addEventListener('click', () => settle({ confirmed: false, password: null }));

    confirmBtn.addEventListener('click', () => {
      const password = passwordInput.value;

      if (!password) {
        passwordError.textContent = 'Password is required.';
        passwordInput.focus();
        return;
      }

      settle({ confirmed: true, password });
    });

    modal.classList.add('active');
    setTimeout(() => passwordInput.focus(), 100);
  });
}

function passwordStrength(password) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
}

let _cpwWired = false;

function wireChangePassword() {
  // Guard: already fully wired (prevents duplicate listeners from partialsLoaded retry)
  if (_cpwWired) return;
  _cpwWired = true;

  // ── Toggle password visibility (delegated — works even when partial loads late) ──
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.cpw-toggle, .password-toggle');
    if (!toggle) return;
    const input = document.getElementById(toggle.dataset.target);
    if (!input) return;
    const wasPassword = input.type === 'password';
    input.type = wasPassword ? 'text' : 'password';
    toggle.innerHTML = wasPassword
      ? '<i class="fas fa-eye-slash"></i>'
      : '<i class="fas fa-eye"></i>';
    if (toggle.classList.contains('password-toggle')) {
      toggle.setAttribute('aria-pressed', String(wasPassword));
      toggle.setAttribute('aria-label', wasPassword ? 'Hide password' : 'Show password');
    }
  });

  // ── DOM refs ──
  const modal = document.getElementById('changePasswordModal');
  const openBtn = document.getElementById('changePasswordBtn');
  if (!modal || !openBtn) return;

  const closeBtn = document.getElementById('changePasswordClose');
  const cancelBtn = document.getElementById('cancelPasswordChange');
  const saveBtn = document.getElementById('savePasswordBtn');
  const message = document.getElementById('changePasswordMessage');
  const formBody = document.getElementById('cpwFormBody');
  const guestNotice = document.getElementById('cpwGuestNotice');
  const currentPasswordInput = document.getElementById('currentPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmNewPassword');
  const strengthBar = document.getElementById('passwordStrengthBar');
  const strengthText = document.getElementById('passwordStrengthText');
  const confirmError = document.getElementById('confirmPasswordError');

  // ── Password strengths labels and colors ──
  const STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const STRENGTH_COLORS = [
    '#ef4444', '#ef4444', '#f97316', '#facc15', '#22c55e', '#22c55e',
  ];

  // ── Helper: show/hide guest notice ──
  function isAuthenticatedUser() {
    // Use the <html> class set by auth.js as primary indicator,
    // fall back to window.algoAuth for in-memory guest upgrades.
    return document.documentElement.classList.contains('auth-verified') ||
           !!(window.algoAuth && window.algoAuth.authenticated);
  }

  function updateGuestState() {
    const isAuth = isAuthenticatedUser();
    if (guestNotice) guestNotice.hidden = isAuth;
    if (formBody) formBody.hidden = !isAuth;
    if (saveBtn) saveBtn.disabled = !isAuth;
    if (message) {
      message.hidden = true;
      message.className = 'cpw-message';
      message.textContent = '';
    }
  }

  // ── Close modal with scroll restoration ──
  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    // Safety net: restore scroll only when no other modal is active
    if (!document.querySelector('.modal.active')) {
      document.body.classList.remove('modal-open');
      document.documentElement.style.removeProperty('--scrollbar-width');
    }
  }

  // ── Open modal ──
  openBtn.addEventListener('click', () => {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    resetForm();
    // Must run after resetForm() so guest state (diasbled button) wins
    updateGuestState();
    // Focus first field when not guest
    if (currentPasswordInput && !guestNotice?.hidden) {
      setTimeout(() => currentPasswordInput.focus(), 100);
    }
  });

  // ── Close handlers ──
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // ── Reset form fields ──
  function resetForm() {
    [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach((el) => {
      if (el) {
        el.value = '';
        el.classList.remove('input-error');
      }
    });
    if (strengthBar) {
      strengthBar.style.width = '0%';
      strengthBar.style.background = '#ef4444';
    }
    if (strengthText) strengthText.textContent = 'Password strength';
    if (confirmError) confirmError.textContent = '';
    if (message) {
      message.hidden = true;
      message.className = 'cpw-message';
      message.textContent = '';
    }
    // Reset rules (scoped to this modal)
    modal.querySelectorAll('.cpw-rule').forEach((r) => {
      r.classList.remove('valid', 'invalid');
      const icon = r.querySelector('.cpw-rule-icon i');
      if (icon) icon.className = 'fas fa-circle';
    });
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-key"></i><span>Change Password</span>';
    }
  }

  // ── Live password strength & rules ──
  if (newPasswordInput && strengthBar && strengthText) {
    newPasswordInput.addEventListener('input', () => {
      const val = newPasswordInput.value;
      const score = passwordStrength(val);

      strengthBar.style.width = `${score * 20}%`;
      strengthBar.style.background = STRENGTH_COLORS[score] || '#ef4444';
      strengthText.textContent = STRENGTH_LABELS[score] || 'Very Weak';

      // Update rule icons
      updateRule('ruleLength', val.length >= 8);
      updateRule('ruleUpper', /[A-Z]/.test(val));
      updateRule('ruleLower', /[a-z]/.test(val));
      updateRule('ruleNumber', /\d/.test(val));
      updateRule('ruleSpecial', /[^A-Za-z0-9]/.test(val));

      // Re-check confirm match
      if (confirmPasswordInput && confirmPasswordInput.value) {
        checkConfirmMatch();
      }
    });
  }

  function updateRule(id, isValid) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('valid', 'invalid');
    el.classList.add(isValid ? 'valid' : 'invalid');
    const icon = el.querySelector('.cpw-rule-icon i');
    if (icon) {
      icon.className = isValid ? 'fas fa-check-circle' : 'fas fa-circle';
    }
  }

  // ── Confirm password matching ──
  function checkConfirmMatch() {
    if (!confirmPasswordInput || !newPasswordInput || !confirmError) return;
    if (confirmPasswordInput.value && confirmPasswordInput.value !== newPasswordInput.value) {
      confirmError.textContent = 'Passwords do not match';
      confirmPasswordInput.classList.add('input-error');
    } else {
      confirmError.textContent = '';
      confirmPasswordInput.classList.remove('input-error');
    }
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', checkConfirmMatch);
  }

  // ── Save / submit ──
  saveBtn?.addEventListener('click', async () => {
    const currentPassword = currentPasswordInput?.value || '';
    const newPassword = newPasswordInput?.value || '';
    const confirmPassword = confirmPasswordInput?.value || '';

    // ── Client-side validation ──
    if (!currentPassword) {
      showMessage('Please enter your current password.', 'error');
      currentPasswordInput?.focus();
      return;
    }
    if (!newPassword) {
      showMessage('Please enter a new password.', 'error');
      newPasswordInput?.focus();
      return;
    }
    if (passwordStrength(newPassword) < 3) {
      showMessage('Password is too weak. Aim for at least "Good" strength.', 'error');
      newPasswordInput?.focus();
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage('New passwords do not match.', 'error');
      confirmPasswordInput?.focus();
      return;
    }

    // ── Loading state ──
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="cpw-btn-spinner"></span><span>Saving...</span>';
    showMessage('Changing password...', 'info');

    try {
      // ── Fetch CSRF token ──
      let csrfToken = null;
      if (location.protocol !== 'file:') {
        try {
          const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
          if (csrfRes.ok) {
            const csrfData = await csrfRes.json();
            csrfToken = csrfData.csrfToken;
          }
        } catch (e) {
          // Non-critical; proceed without CSRF
        }
      }

      const headers = { 'Content-Type': 'application/json' };
      if (csrfToken) headers['x-csrf-token'] = csrfToken;

      const response = await fetch('/api/change-password', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password.');
      }

      showMessage('Password changed successfully. Redirecting to login...', 'success');

      // Reset button state
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-check"></i><span>Done</span>';

      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (error) {
      showMessage(error.message || 'Something went wrong. Please try again.', 'error');
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-key"></i><span>Change Password</span>';
    }
  });

  // ── Helper: show message ──
  function showMessage(text, type) {
    if (!message) return;
    message.hidden = false;
    message.className = `cpw-message ${type}`;
    message.textContent = text;
  }

  // ── Escape key handler ──
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // ── Initial guest check ──
  updateGuestState();
}
