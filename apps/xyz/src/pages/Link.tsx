import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authClient } from "../auth/client";

const serviceLabels: Record<string, string> = {
  zuzify: "Zuzify Account", prezzstore: "PrezzStore",
  zuzifysocials: "Zuzify Socials", zuzuos: "ZuzuOS",
  fastproxy: "FastProxy", zuzuloader: "ZuzuLoader", zuzuai: "ZuzuAI"
};

function normalizeCode(value: string) {
  const clean = value.trim().replace(/[\s-]/g, "");
  return clean.length <= 16 ? clean.toUpperCase() : clean;
}

export function LinkPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const params = new URLSearchParams(location.search);
  const requestedCode = params.get("code") || "";
  const service = params.get("service") || "zuzify";
  const serviceName = serviceLabels[service] || "Zuzify Account";

  const [code, setCode] = useState(requestedCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setCode(requestedCode);
    setComplete(false);
    setError("");
  }, [requestedCode]);

  async function link(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || busy) return;
    setBusy(true);
    setError("");
    const pairingCode = normalizeCode(code);
    if (!/^[A-Za-z0-9]{8,128}$/.test(pairingCode)) {
      setError("Enter the one-time code shown by the Discord bot.");
      setBusy(false);
      return;
    }
    try {
      // Neon Auth issues an authenticated JWT; never send the opaque session token.
      const client = authClient as typeof authClient & { getJWTToken?: () => Promise<string | null> };
      const token = await client.getJWTToken?.();
      if (!token) throw new Error("Your session could not be verified. Sign out and sign in again.");
      const response = await fetch("/api/link/complete", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + token },
        body: JSON.stringify({ code: pairingCode }),
        cache: "no-store",
        credentials: "omit"
      });
      const body = await response.json().catch(() => ({})) as { error?: string; service?: string };
      if (!response.ok) throw new Error(body.error || "Could not link Discord. Try a new code.");
      setCode("");
      setComplete(true);
      navigate("/link", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not connect Discord.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="oauth-wrap link-page">
    <span className="eyebrow">ZUZIFY ID / DISCORD</span>
    <h1>Link your Discord account</h1>
    <p>In Discord, run <code>/linkaccount</code>, then enter the one-time pairing code shown by the bot. Only approve a request you started.</p>
    {isPending ? <p className="account-muted">Checking your account...</p> :
      !session ? <div>
        <p className="account-muted">Sign in to the Zuzify account you want to connect before entering your code.</p>
        <Link className="portal-primary" to={"/auth/sign-in?from=" + encodeURIComponent("/link" + location.search)}>Sign in to continue</Link>
      </div> : complete ? <div role="status" className="link-status">
        <h2>Discord connected</h2>
        <p>Return to Discord and use <code>/accounts</code> to confirm the connection.</p>
        <Link className="portal-quiet" to="/account">Back to account</Link>
      </div> : <form className="oauth-form" onSubmit={link}>
        <p className="account-muted">Connecting <strong>{serviceName}</strong> to the Discord account that generated this code.</p>
        <p className="account-muted">Signed in as <strong>{session.user.name}</strong>. <Link to="/account">View account</Link></p>
        <label htmlFor="discord-pair-code">Discord pairing code
          <input id="discord-pair-code" name="pairCode" autoCapitalize="characters" autoComplete="off"
            spellCheck={false} value={code} placeholder="Enter one-time pairing code"
            maxLength={140} onChange={event => setCode(event.target.value)} required />
        </label>
        <small className="account-muted">Codes expire after 10 minutes and work once. Do not share them.</small>
        {error && <p role="alert" className="portal-error">{error}</p>}
        <button type="submit" className="portal-primary" disabled={busy || !code.trim()}>
          {busy ? "Connecting..." : "Confirm Discord link"}
        </button>
      </form>}
  </section>;
}
