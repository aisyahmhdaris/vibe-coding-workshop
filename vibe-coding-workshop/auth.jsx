/* ─────────────────────────────────────────────────────────────
   Vibe Coding Workshop · Google Sign-In + whitelist gate
   ─────────────────────────────────────────────────────────────
   Uses Google Identity Services (GSI) loaded from
   https://accounts.google.com/gsi/client (declared in index.html).

   Flow when a facilitator clicks Sign In With Google:
     1. GSI popup → user picks account → JWT credential returned.
     2. We parse JWT for email/name/picture.
     3. We call sheetsApi.checkWhitelist(email) against the Apps Script.
     4. If allowed → set user, persist in sessionStorage, modal closes.
        If denied  → show "Access denied" message and discard credential.

   This is client-side gating only. The Apps Script is the source of
   truth — facilitator-only write endpoints should re-check the email
   server-side before mutating sheets.

   What this file exports to window:
     · useAuth()             — { user, signOut, gsiReady, checking, error, configured }
     · GoogleSignInButton    — renders the official GSI button
   ───────────────────────────────────────────────────────────── */

const AUTH_STORAGE_KEY = "vcw_facilitator_user";

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(json);
  } catch (e) {
    console.error("Failed to parse JWT", e);
    return {};
  }
}

function loadStoredUser() {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function storeUser(user) {
  try {
    if (user) sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
}

function useAuth() {
  const configured = !isPlaceholder(CONFIG.googleClientId);
  const [user, setUser]         = React.useState(loadStoredUser);
  const [gsiReady, setGsiReady] = React.useState(false);
  const [error, setError]       = React.useState(null);
  const [checking, setChecking] = React.useState(false);

  const handleCredential = React.useCallback(async (response) => {
    if (!response?.credential) return;
    const payload = parseJwt(response.credential);
    if (!payload.email) { setError("No email returned from Google."); return; }

    setError(null);
    setChecking(true);
    try {
      const allowed = await sheetsApi.checkWhitelist(payload.email);
      if (!allowed) {
        setError(`Access denied. ${payload.email} is not on the facilitator whitelist — contact the workshop organizer.`);
        try { window.google.accounts.id.disableAutoSelect(); } catch {}
        return;
      }
      const u = {
        name:    payload.name || payload.email,
        email:   payload.email,
        picture: payload.picture || null,
      };
      setUser(u);
      storeUser(u);
    } catch (e) {
      setError("Could not verify access: " + String(e.message || e));
    } finally {
      setChecking(false);
    }
  }, []);

  React.useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    let tries = 0;
    const tryInit = () => {
      if (cancelled) return;
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: CONFIG.googleClientId,
            callback: handleCredential,
            auto_select: false,
            use_fedcm_for_prompt: true,
          });
          setGsiReady(true);
        } catch (e) {
          setError(String(e.message || e));
        }
      } else if (tries++ < 80) {
        setTimeout(tryInit, 150);
      } else {
        setError("Google Sign-In library failed to load.");
      }
    };
    tryInit();
    return () => { cancelled = true; };
  }, [configured, handleCredential]);

  const signOut = React.useCallback(() => {
    setUser(null);
    storeUser(null);
    setError(null);
    if (window.google?.accounts?.id) {
      try { window.google.accounts.id.disableAutoSelect(); } catch {}
    }
  }, []);

  const clearError = React.useCallback(() => setError(null), []);

  return { user, gsiReady, error, checking, signOut, clearError, configured };
}

// Renders the official Google "Sign in with Google" button.
function GoogleSignInButton({ gsiReady }) {
  const hostRef = React.useRef(null);
  React.useEffect(() => {
    if (!gsiReady || !hostRef.current) return;
    if (!window.google?.accounts?.id) return;
    hostRef.current.innerHTML = "";
    try {
      window.google.accounts.id.renderButton(hostRef.current, {
        type:            "standard",
        theme:           "filled_black",
        size:            "large",
        text:            "signin_with",
        shape:           "pill",
        logo_alignment:  "left",
      });
    } catch (e) {
      console.error("Failed to render Google button", e);
    }
  }, [gsiReady]);
  return <div ref={hostRef} className="gsi-host"></div>;
}

Object.assign(window, { useAuth, GoogleSignInButton, AUTH_STORAGE_KEY });
