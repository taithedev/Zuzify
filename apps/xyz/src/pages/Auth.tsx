import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { authClient } from "../auth/client";

function safeNext(value: string | null): string {
  // Return only to approved internal destinations, never an arbitrary redirect URL.
  if (!value || value.length > 300 || !value.startsWith("/") || value.startsWith("//")) return "/account";
  const url = new URL(value, "https://zuzify.xyz");
  if (url.origin !== "https://zuzify.xyz") return "/account";
  if (url.pathname === "/oauth/login" && url.search.startsWith("?")) return url.pathname + url.search;
  if (["/owner","/support","/notifications","/social"].includes(url.pathname)) return url.pathname;
  if (url.pathname === "/link") return url.pathname + url.search;
  return "/account";
}
function readError(error: unknown) {
  return error instanceof Error ? error.message : "The request could not be completed. Try again.";
}

export function AuthPage() {
  const { action } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const signup = action === "sign-up";
  const supported = action === "sign-in" || signup;
  const from = new URLSearchParams(location.search).get("from");
  const next = safeNext(from);
  const preserve = from ? "?from=" + encodeURIComponent(next) : "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!supported) return <Navigate to="/auth/sign-in" replace />;
  if (!isPending && session) return <Navigate to={next} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (signup) {
        const result = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password });
        if (result.error) throw new Error(result.error.message);
      } else {
        const result = await authClient.signIn.email({ email: email.trim(), password });
        if (result.error) throw new Error(result.error.message);
      }
      navigate(next, { replace: true });
    } catch (problem) { const message=readError(problem); setError(/invalid origin/i.test(message) ? "This sign-in origin was rejected. Open https://www.zuzify.xyz/auth/sign-in and try again." : message); }
    finally { setBusy(false); }
  }

  return <section className="auth-wrap">
    <div className="auth-side"><span className="eyebrow">ZUZIFY ID / 2026</span><h1>One account.<br/><em>Everywhere.</em></h1><p>Your identity across Zuzify websites, apps, and games. You choose which connected products can access your account.</p><span className="auth-side-mark">Z.</span></div>
    <div className="auth-panel">
      <span className="eyebrow">{signup ? "NEW ACCOUNT" : "WELCOME BACK"}</span>
      <h2>{signup ? "Create a Zuzify ID" : "Sign in to Zuzify"}</h2>
      <p>{signup ? "The account you'll use throughout the Zuzify ecosystem." : "Access your profile, sessions and connected applications."}</p>
      <form onSubmit={submit}>
        {signup && <label>Display name<input required autoComplete="name" maxLength={70} value={name} onChange={e => setName(e.target.value)} placeholder="How you appear across Zuzify" /></label>}
        <label>Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <label>Password<input required type="password" minLength={8} autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={signup ? "Create a secure password" : "Your password"} /></label>
        {error && <p role="alert" className="portal-error">{error} {/origin/i.test(error)&&<a href="https://www.zuzify.xyz/auth/sign-in">Open official sign-in</a>}</p>}
        <button type="submit" className="portal-primary" disabled={busy || isPending}>{busy ? "Working..." : signup ? "Create account" : "Sign in"}</button>
      </form>
      <div className="auth-switch">{signup ? "Already have an account?" : "New to Zuzify?"} <Link to={"/auth/" + (signup ? "sign-in" : "sign-up") + preserve}>{signup ? "Sign in" : "Create one"}</Link></div>
      <p className="small-note">Passwords are handled by Neon Auth, not stored by this website.</p>
    </div>
  </section>;
}
