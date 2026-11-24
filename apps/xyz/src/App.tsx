import { Link, Navigate, Route, Routes } from "react-router-dom";
import { authClient } from "./auth/client";
import { Websites } from "./pages/Websites";
import { AuthPage } from "./pages/Auth";
import { AccountPage } from "./pages/Account";
import { OAuthLogin, OAuthConsent } from "./pages/OAuth";
import { LinkPage } from "./pages/Link";
import { Center } from "./pages/Center";

function Header() {
  const { data: session, isPending } = authClient.useSession();
  return <header className="portal-header">
    <Link to="/" className="portal-brand" aria-label="Zuzify home">Zuzify.xyz</Link>
    <nav className="portal-nav" aria-label="Main navigation">
      <Link to="/">Explore</Link>
      <Link to="/support">Support</Link>
      <Link to="/notifications">Notifications</Link>
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
          <Route path="/support" element={<Center mode="support" />} />
          <Route path="/notifications" element={<Center mode="notifications" />} />
          <Route path="/link" element={<LinkPage />} />
          <Route path="/oauth/login" element={<OAuthLogin />} />
          <Route path="/oauth/consent" element={<OAuthConsent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="portal-footer">© {new Date().getFullYear()} Zuzify · <Link to="/support">Help center</Link> · <Link to="/notifications">Email preferences</Link></footer>
    </div>
  </div>;
}
