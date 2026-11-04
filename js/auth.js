async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

function renderAuthState(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  getCurrentSession().then(session => {
    container.textContent = session
      ? `Signed in as ${session.user?.email || 'user'}`
      : 'Sign in or create an account to save your personal diary.';
  }).catch(error => {
    container.textContent = `Could not check sign-in status: ${error.message}`;
  });
}

function renderAuthPanel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const render = session => {
    if (session?.user) {
      container.innerHTML = `
        <div class="auth-panel-row">
          <div><span class="badge">Signed in</span><p class="auth-email"></p></div>
          <button type="button" class="secondary" data-auth-action="signout">Sign out</button>
        </div>
        <p class="auth-message" role="status" aria-live="polite"></p>`;
      container.querySelector('.auth-email').textContent = session.user.email || 'Your account';
      container.querySelector('[data-auth-action="signout"]').addEventListener('click', async () => {
        showMessage('Signing out…');
        try { await signOut(); } catch (error) { showMessage(error.message); }
      });
      return;
    }

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
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;
      const submit = form.querySelector('[data-auth-action="signin"]');
      submit.disabled = true;
      message.textContent = 'Signing in…';
      try {
        await signInWithEmail(email, password);
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

  const showMessage = text => {
    const message = container.querySelector('.auth-message');
    if (message) message.textContent = text;
  };

  getCurrentSession().then(render).catch(error => {
    container.textContent = `Could not check sign-in status: ${error.message}`;
  });
  supabase.auth.onAuthStateChange((_event, session) => render(session));
}
