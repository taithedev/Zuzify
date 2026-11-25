import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authClient } from "../auth/client";
import {getApiToken,parseApi} from "../auth/apiToken";

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
    if (requestedCode) {
      setCode(requestedCode);
      setComplete(false);
      setError("");
    }
  }, [requestedCode]);

  async function link(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || busy) return;
    setBusy(true);
    setError("");
    const pairingCode = normalizeCode(code);
    if (!/^(?:[A-F0-9]{16}|[a-f0-9]{64})$/.test(pairingCode)) {
      setError("Enter the one-time code shown by the Discord bot.");
      setBusy(false);
      return;
    }
    try {
      // Neon Auth issues an authenticated JWT; never send the opaque session token.
      const token = await getApiToken();
      const response = await fetch("/api/link/complete", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + token },
        body: JSON.stringify({ code: pairingCode }),
        cache: "no-store",
        credentials: "omit"
      });
      await parseApi<{ok:boolean;service?:string}>(response);
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
    <p>In Discord, run <code>/linkaccount</code>, then check your DMs for your private pairing code. Only approve a request you started.</p>
    {isPending ? <p className="account-muted">Checking your account...</p> :
      !session ? <div>
        <p className="account-muted">Sign in to the Zuzify account you want to connect before entering your code. If you do not have an account, create one first.</p>
        <Link className="portal-primary" to={"/auth/sign-in?from=" + encodeURIComponent("/link" + location.search)}>Sign in to continue</Link> <Link className="portal-quiet" to={"/auth/sign-up?from=" + encodeURIComponent("/link" + location.search)}>Create account</Link>
      </div> : complete ? <div role="status" className="link-status">
        <h2>Discord connected</h2>
        <p>Return to Discord and use <code>/accounts</code> to confirm the connection.</p>
        <Link className="portal-quiet" to="/account">Back to account</Link>
      </div> : <form className="oauth-form" onSubmit={link}>
        <p className="account-muted">Requested service: <strong>{serviceName}</strong>. Your code determines the actual account connection.</p>
        <p className="account-muted">Signed in as <strong>{session.user.name}</strong>. <Link to="/account">View account</Link></p>
        <label htmlFor="discord-pair-code">Discord pairing code
          <input id="discord-pair-code" name="pairCode" autoCapitalize="characters" autoComplete="off"
            spellCheck={false} value={code} placeholder="XXXX-XXXX-XXXX-XXXX"
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
