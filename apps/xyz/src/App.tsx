import { Link, Navigate, Route, Routes } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { authClient } from "./auth/client";
import { Websites } from "./pages/Websites";
import { AuthPage } from "./pages/Auth";
import { AccountPage } from "./pages/Account";
import { OAuthLogin, OAuthConsent } from "./pages/OAuth";

function Header() {
  const { data: session, isPending } = authClient.useSession();
  return <header className="portal-header">
    <Link to="/" className="portal-brand" aria-label="Zuzify home"><span className="portal-brand-symbol">Z</span><strong>ZUZIFY<span className="portal-brand-period">.</span></strong><small>XYZ</small></Link>
    <div className="portal-nav">
      <Link to="/">Sites</Link>
      <Link className="portal-account-button" to={session ? "/account" : "/auth/sign-in"}>{isPending ? "Account" : session ? "My account" : "Sign in"} <ArrowUpRight size={15}/></Link>
    </div>
  </header>;
}

export function App() {
  return <div className="portal">
    <div className="portal-glow" aria-hidden="true" />
    <div className="portal-shell">
      <Header />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<Websites />} />
          <Route path="/websites" element={<Navigate to="/" replace />} />
          <Route path="/auth/:action" element={<AuthPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/oauth/login" element={<OAuthLogin />} />
          <Route path="/oauth/consent" element={<OAuthConsent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="portal-footer"><span>© {new Date().getFullYear()} ZUZIFY</span><span>Independent software · By Zuzify</span></footer>
    </div>
  </div>;
}
