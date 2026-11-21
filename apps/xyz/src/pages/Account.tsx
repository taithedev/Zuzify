import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, Copy, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authClient } from "../auth/client";

type Integration = { slug: string; name: string; neon_project_id: string | null; is_live: boolean };
type Grant = { id: string; name: string; scopes: string; created?: string };
function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function readGrants(value: unknown): Grant[] {
  const r = record(value);
  const list = Array.isArray(value) ? value : Array.isArray(r?.consents) ? r.consents : Array.isArray(r?.data) ? r.data : [];
  return list.map((item: unknown, index: number) => {
    const row = record(item) || {};
    const app = record(row.client) || {};
    const scope = row.scope ?? row.scopes ?? [];
    return {
      id: String(row.clientId ?? row.client_id ?? row.id ?? index),
      name: String(app.client_name ?? app.name ?? row.clientName ?? row.client_name ?? row.clientId ?? row.client_id ?? "Connected application"),
      scopes: Array.isArray(scope) ? scope.join(", ") : String(scope || "Account access"),
      created: typeof row.createdAt === "string" ? row.createdAt : undefined
    };
  });
}
function accountDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}
export function AccountPage() {
  const navigate = useNavigate();
  const { data: session, isPending, refetch } = authClient.useSession();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationError, setIntegrationError] = useState("");
  const [loadingGrants, setLoadingGrants] = useState(false);
  const [grantError, setGrantError] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadConnections() {
    setLoadingGrants(true); setGrantError("");
    try {
      const result = await authClient.oauth2.getConsents();
      if (result.error) throw new Error(result.error.message);
      setGrants(readGrants(result.data));
    } catch (error) {
      setGrantError(error instanceof Error ? error.message : "Could not load connections");
    } finally { setLoadingGrants(false); }
  }
  useEffect(() => { if (session) void loadConnections(); }, [session?.user.id]);
  useEffect(() => {
    if (!session) return;
    const ctrl = new AbortController();
    const api = (import.meta.env.VITE_NEON_DATA_API_URL || "https://ep-rough-recipe-bcjp6wq7.apirest.c-16.us-east-1.aws.neon.tech/neondb/rest/v1").replace(/\\/$/, "");
    fetch(api + "/zuzify_integrations?select=slug,name,neon_project_id,is_live&order=name.asc", { signal: ctrl.signal, credentials: "omit" })
      .then(async response => { if (!response.ok) throw new Error("Integration registry is unavailable"); return response.json() as Promise<Integration[]>; })
      .then(rows => { if (!ctrl.signal.aborted) setIntegrations(Array.isArray(rows) ? rows : []); })
      .catch(error => { if (!ctrl.signal.aborted) setIntegrationError(error instanceof Error ? error.message : "Integration registry is unavailable"); });
    return () => ctrl.abort();
  }, [session?.user.id]);
  useEffect(() => { if (session) setNewName(session.user.name); }, [session?.user.id]);

  if (isPending) return <div className="portal-loading" role="status">Loading your Zuzify account...</div>;
  if (!session) return <Navigate to="/auth/sign-in" replace />;

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const result = await authClient.updateUser({ name: newName.trim() });
      if (result.error) throw new Error(result.error.message);
      await refetch(); setMessage("Profile updated.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update profile."); }
    finally { setSaving(false); }
  }
  async function signOut() {
    await authClient.signOut();
    navigate("/", { replace: true });
  }

  return <section className="account-page">
    <div className="account-heading"><div><span className="eyebrow">ZUZIFY ID / ACCOUNT CENTER</span><h1>Hi, {session.user.name}.</h1><p>Your home for everything connected to your Zuzify identity.</p></div><button className="portal-quiet" onClick={signOut}><LogOut size={16}/> Sign out</button></div>
    <div className="account-grid">
      <section className="account-card identity-card">
        <span className="eyebrow">01 / YOUR IDENTITY</span>
        <div className="identity-avatar">{session.user.image ? <img src={session.user.image} alt="" /> : session.user.name.slice(0,1).toUpperCase()}</div>
        <h2>{session.user.name}</h2><p className="account-muted">{session.user.email}</p>
        <div className="identity-row"><span>Member since</span><strong>{accountDate(session.user.createdAt)}</strong></div>
        <div className="identity-row"><span>Email status</span><strong>{session.user.emailVerified ? "Verified" : "Not verified"}</strong></div>
        <div className="identity-row"><span>Zuzify user ID</span><button className="copy-id" title="Copy user ID" onClick={()=>navigator.clipboard.writeText(session.user.id)}>{session.user.id.slice(0,8)}… <Copy size={14}/></button></div>
        <form className="edit-name" onSubmit={saveName}><label htmlFor="display-name">Display name</label><div className="edit-name-row"><input id="display-name" value={newName} onChange={e=>setNewName(e.target.value)} required maxLength={70} /><button type="submit" disabled={saving || !newName.trim()}>{saving?"Saving…":"Save"}</button></div></form>
        {message && <p role="status" className="account-notice">{message}</p>}
      </section>
      <section className="account-card connections-card">
        <div className="card-title"><div><span className="eyebrow">02 / AUTHORIZED APPS</span><h2>Connections</h2></div><button className="refresh-action" disabled={loadingGrants} onClick={loadConnections} aria-label="Refresh connections"><RefreshCw size={17}/></button></div>
        <p className="account-muted">Apps you approve using “Continue with Zuzify” will appear here.</p>
        {loadingGrants ? <p className="account-muted">Checking your authorizations...</p> : grantError ? <p className="portal-error">{grantError}</p> : grants.length ? <div className="grant-list">{grants.map((g,i)=><div className="grant-item" key={g.id+"-"+i}><span className="grant-icon">Z</span><div><strong>{g.name}</strong><small>Permissions: {g.scopes}</small></div><Check size={16}/></div>)}</div> : <div className="empty-connections"><ShieldCheck size={30}/><h3>No connected apps yet</h3><p>No app has been authorized with this ID. Your data stays private until you choose to connect an app.</p></div>}
        <div className="account-footnote">Connections require each Zuzify product to integrate the official login flow. Existing app accounts are not automatically merged.</div>
      </section>
    </div>
    <section className="account-card connections-card" aria-label="Neon application integration status">
      <span className="eyebrow">03 / NEON DATABASE SYNC</span>
      <h2>Application setup</h2>
      <p className="account-muted">An assigned Neon project is not proof of a complete migration. Existing accounts remain separate until you explicitly link them through an official app.</p>
      {integrationError ? <p className="portal-error">{integrationError}</p> : !integrations.length ? <p className="account-muted">No integration information available.</p> :
        <div className="grant-list">{integrations.map(app=><div className="grant-item" key={app.slug}>
          <span className="grant-icon">Z</span><div><strong>{app.name}</strong><small>{app.is_live ? "Production integration verified" : app.neon_project_id ? "Neon project assigned · cutover unverified" : "Neon migration pending"}</small></div>
        </div>)}</div>}
    </section>
    <div className="account-bottom"><div><span className="eyebrow">ZUZIFY ECOSYSTEM</span><h3>Explore the websites</h3></div><Link to="/" className="portal-quiet">Back to sites <ArrowUpRight size={16}/></Link></div>
  </section>;
}
