import { NavLink, Link, Navigate, Route, Routes } from "react-router-dom";
import { Snowfall } from "./components/Snowfall";
import { authClient } from "./auth/client";
import { Websites } from "./pages/Websites";
import { AuthPage } from "./pages/Auth";
import { AccountPage } from "./pages/Account";
import { OAuthLogin, OAuthConsent } from "./pages/OAuth";
import { LinkPage } from "./pages/Link";
import { Center } from "./pages/Center";
import { Owner, OwnerLink } from "./pages/Owner";
import { Social } from "./pages/Social";

function Header() {
  const { data: session, isPending } = authClient.useSession();
  return <header className="portal-header">
    <Link to="/" className="portal-brand" aria-label="Zuzify home">Zuzify.xyz</Link>
    <nav className="portal-nav" aria-label="Main navigation">
      <NavLink end to="/">Explore</NavLink>
      <NavLink to="/social">Friends</NavLink>
      <NavLink to="/support">Support</NavLink>
      <NavLink to="/notifications">Notifications</NavLink>
      {session && <OwnerLink userId={session.user.id}/> }
      <Link to={session ? "/account" : "/auth/sign-in"}>{isPending ? "Account" : session ? "My account" : "Sign in"}</Link>
    </nav>
  </header>;
}

export function App() {
  return <div className="portal">
    <Snowfall/>
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
          <Route path="/social" element={<Social/>} />
          <Route path="/owner" element={<Owner/>} />
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
