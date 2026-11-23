import { Link, Navigate, Route, Routes } from "react-router-dom";
import { authClient } from "./auth/client";
import { Websites } from "./pages/Websites";
import { AuthPage } from "./pages/Auth";
import { AccountPage } from "./pages/Account";
import { OAuthLogin, OAuthConsent } from "./pages/OAuth";
import { LinkPage } from "./pages/Link";

function Header() {
  const { data: session, isPending } = authClient.useSession();
  return <header className="portal-header">
    <Link to="/" className="portal-brand" aria-label="Zuzify home">Zuzify.xyz</Link>
    <nav className="portal-nav" aria-label="Main navigation">
      <Link to="/">Sites</Link>
      <Link to={session ? "/account" : "/auth/sign-in"}>{isPending ? "Account" : session ? "My account" : "Sign in"}</Link>
    </nav>
  </header>;
}

export function App() {
  return <div className="portal">
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
      <footer className="portal-footer">© {new Date().getFullYear()} Zuzify</footer>
    </div>
  </div>;
}
