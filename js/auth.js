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

  const status = document.createElement('div');
  status.className = 'auth-status';
  status.textContent = 'Checking sign-in status…';
  container.innerHTML = '';
  container.appendChild(status);

  getCurrentSession()
    .then(session => {
      if (!session) {
        status.textContent = 'Signed out — add Supabase Auth and sign in to save personal diary data.';
        return;
      }
      status.textContent = `Signed in as ${session.user?.email || 'user'}`;
    })
    .catch(() => {
      status.textContent = 'Auth is not configured yet for this browser session.';
    });
}
