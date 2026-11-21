import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authClient } from "../auth/client";

const errorText = (value: unknown) => value instanceof Error ? value.message : "This authorization could not be completed.";
export function OAuthLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending } = authClient.useSession();
  const params = new URLSearchParams(location.search);
  const isRequest = params.has("client_id");
  const forceLogin = /\b(login|create)\b/.test(params.get("prompt") || "");
  const tried = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isPending && session && isRequest && !forceLogin && !tried.current) {
      tried.current = true;
      authClient.oauth2.continue({ selected: true }).catch(err => setError(errorText(err)));
    }
    if (!isPending && session && !isRequest) navigate("/account", { replace:true });
  }, [isPending, session, isRequest, forceLogin, navigate]);
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message);
      if (!isRequest) navigate("/account", { replace: true });
      else if (!result.data?.redirect) await authClient.oauth2.continue({ selected: true });
    } catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  }
  const signupUrl = "/auth/sign-up?from=" + encodeURIComponent("/oauth/login" + location.search);
  return <section className="oauth-wrap"><span className="eyebrow">SECURE ZUZIFY SIGN-IN</span><h1>Continue with Zuzify</h1><p>Sign in to choose what this app can access. Never enter your Zuzify password into another app.</p>
    {!isRequest ? <p className="portal-error">This page must be opened by a registered application. <Link to="/auth/sign-in">Go to regular sign-in.</Link></p> :
    isPending || (session && !forceLogin && !error) ? <p className="account-muted">Continuing authorization...</p> :
    <form className="oauth-form" onSubmit={signIn}>
      <label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error && <p role="alert" className="portal-error">{error}</p>}
      <button className="portal-primary" type="submit" disabled={busy}>{busy?"Signing in...":"Sign in & continue"}</button>
      <p className="small-note">New account? <Link to={signupUrl}>Create Zuzify ID</Link>, then continue the authorization.</p>
    </form>}
  </section>;
}
export function OAuthConsent() {
  const location = useLocation();
  const { data: session, isPending } = authClient.useSession();
  const [client, setClient] = useState<{client_name?:string; name?:string}|null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const params = new URLSearchParams(location.search);
  const clientId = params.get("client_id") || "";
  const scope = params.get("scope") || "basic profile";
  useEffect(() => {
    if (!clientId || !session) return;
    authClient.oauth2.publicClient({ query: { client_id: clientId } })
      .then(result => { if (result.error) throw new Error(result.error.message); setClient(result.data); })
      .catch(err => setError(errorText(err)));
  }, [clientId, session?.user.id]);
  async function answer(accept: boolean) {
    setBusy(true); setError("");
    try {
      const result = await authClient.oauth2.consent({ accept });
      if (result.error) throw new Error(result.error.message);
      // Neon Auth performs the verified redirect itself after a successful decision.
    } catch (err) { setError(errorText(err)); setBusy(false); }
  }
  return <section className="oauth-wrap"><span className="eyebrow">ZUZIFY ID / PERMISSION REQUEST</span><h1>Connect an app</h1>
    {!clientId ? <p className="portal-error">No application authorization request was provided.</p> :
    isPending ? <p>Checking your session...</p> :
    !session ? <p>Please <Link to={"/oauth/login"+location.search}>sign in to Zuzify</Link> to review this request.</p> :
    <><p><strong>{client?.client_name || client?.name || "An application"}</strong> is requesting access to your Zuzify account.</p>
    <div className="permission-box"><span className="eyebrow">REQUESTED PERMISSIONS</span><p>{scope.replaceAll(" ", " · ")}</p><small>Only approve applications you trust. You can review authorizations from your account center.</small></div>
    {error && <p role="alert" className="portal-error">{error}</p>}
    <div className="permission-actions"><button disabled={busy} onClick={()=>answer(false)} className="portal-quiet">Deny</button><button disabled={busy || !client} onClick={()=>answer(true)} className="portal-primary">Allow access</button></div></>}
  </section>;
}
