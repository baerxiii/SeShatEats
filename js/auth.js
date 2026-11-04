async function signInWithEmail(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signUpWithEmail(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

async function getCurrentSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  return data.session;
}

// Compact status for app pages; keep account controls out of the main content area.
function renderAuthState(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.classList.add('auth-status-card');

  const render = session => {
    container.replaceChildren();
    const row = document.createElement('div');
    row.className = 'auth-status-bar';
    const label = document.createElement('span');
    label.className = 'auth-status-label';
    if (session?.user) {
      label.textContent = `Signed in · ${session.user.email || 'Account'}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'auth-signout secondary';
      button.textContent = 'Sign out';
      button.addEventListener('click', async () => {
        button.disabled = true;
        label.textContent = 'Signing out…';
        try { await signOut(); }
        catch (error) { label.textContent = `Could not sign out: ${error.message}`; button.disabled = false; }
      });
      row.append(label, button);
    } else {
      label.textContent = 'Not signed in';
      const link = document.createElement('a');
      link.href = 'account.html';
      link.textContent = 'Sign in';
      row.append(label, link);
    }
    container.append(row);
  };

  getCurrentSession().then(render).catch(error => {
    container.textContent = `Could not check sign-in status: ${error.message}`;
  });
  supabaseClient.auth.onAuthStateChange((_event, session) => render(session));
}

function renderAuthPanel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const render = session => {
    if (session?.user) {
      container.classList.add('auth-status-card');
      container.innerHTML = '<div class="auth-status-bar"><span class="auth-status-label"></span><button type="button" class="secondary" data-auth-action="signout">Sign out</button></div><p class="auth-message" role="status" aria-live="polite"></p>';
      container.querySelector('.auth-status-label').textContent = `Signed in · ${session.user.email || 'Account'}`;
      container.querySelector('[data-auth-action="signout"]').addEventListener('click', async event => {
        const button = event.currentTarget;
        button.disabled = true;
        try { await signOut(); } catch (error) {
          const message = container.querySelector('.auth-message');
          if (message) message.textContent = error.message;
          button.disabled = false;
        }
      });
      return;
    }

    container.classList.remove('auth-status-card');
    container.innerHTML = `
      <h2>Sign in to your diary</h2>
      <p>Your food logs are saved to your Supabase account.</p>
      <form class="auth-form">
        <label for="authEmail">Email</label>
        <input id="authEmail" name="email" type="email" autocomplete="email" required>
        <label for="authPassword">Password</label>
        <input id="authPassword" name="password" type="password" autocomplete="current-password" minlength="6" required>
        <div class="button-row">
          <button type="submit" data-auth-action="signin">Sign in</button>
          <button type="button" class="secondary" data-auth-action="signup">Create account</button>
        </div>
      </form>
      <p class="auth-message" role="status" aria-live="polite"></p>`;

    const form = container.querySelector('.auth-form');
    const message = container.querySelector('.auth-message');
    const signupButton = container.querySelector('[data-auth-action="signup"]');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const submit = form.querySelector('[data-auth-action="signin"]');
      submit.disabled = true;
      message.textContent = 'Signing in…';
      try {
        await signInWithEmail(form.elements.email.value.trim(), form.elements.password.value);
        message.textContent = 'Signed in.';
      } catch (error) {
        message.textContent = error.message || 'Sign in failed.';
      } finally { submit.disabled = false; }
    });
    signupButton.addEventListener('click', async () => {
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;
      if (!email || !form.elements.email.checkValidity()) {
        message.textContent = 'Enter a valid email address first.';
        form.elements.email.focus();
        return;
      }
      if (password.length < 6) {
        message.textContent = 'Enter a password with at least 6 characters.';
        form.elements.password.focus();
        return;
      }
      signupButton.disabled = true;
      message.textContent = 'Creating your account…';
      try {
        const { session } = await signUpWithEmail(email, password);
        message.textContent = session
          ? 'Account created and signed in.'
          : 'Account created. Check your email to confirm the account, then sign in.';
      } catch (error) {
        message.textContent = error.message || 'Account creation failed.';
      } finally { signupButton.disabled = false; }
    });
  };

  getCurrentSession().then(render).catch(error => {
    container.textContent = `Could not check sign-in status: ${error.message}`;
  });
  supabaseClient.auth.onAuthStateChange((_event, session) => render(session));
}
