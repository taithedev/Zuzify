import "./websites.css";
import { Link } from "react-router-dom";
import { ArrowUpRight, Bell, LifeBuoy } from "lucide-react";

type Website = {
  name: string;
  domain: string;
  description: string;
};

const websites: Website[] = [
  {
    name: "Zuzify",
    domain: "zuzify.xyz",
    description: "The home of Zuzify. Discover our apps, products, and projects.",
  },
  {
    name: "Zuzify LOL",
    domain: "zuzify.lol",
    description: "A space for experiments, creative projects, and new ideas.",
  },
  {
    name: "ZuzuOS",
    domain: "zuzuos.lol",
    description: "The website for the ZuzuOS operating system project.",
  },
  {
    name: "Zuzu",
    domain: "zuzu.lol",
    description: "The Zuzu brand and its growing collection of projects.",
  },
];

export function Websites() {
  return (
    <section className="sites-page" aria-label="Zuzify websites">
      <div className="center-hero"><span className="eyebrow">ZUZIFY / CONNECTED ECOSYSTEM</span><h1>Everything Zuzify.<br/>One place.</h1><p>Discover projects, manage your identity and stay connected to the services you use.</p><div className="center-shortcuts"><Link className="portal-primary" to="/account">Your Zuzify ID <ArrowUpRight size={16}/></Link><Link className="portal-quiet" to="/support">Get support</Link></div></div><div className="center-tiles"><Link to="/support"><LifeBuoy size={22}/><strong>Support center</strong><span>Create and track tickets.</span></Link><Link to="/notifications"><Bell size={22}/><strong>Notifications</strong><span>App updates, news and email preferences.</span></Link></div><span className="eyebrow center-section-label">EXPLORE / WEBSITES</span><div className="sites-list">
        {websites.map((site) => (
          <article className="sites-entry" key={site.domain}>
            <h2>{site.name}</h2>
            <p className="sites-entry-byline">By Zuzify</p>
            <p className="sites-entry-description">{site.description}</p>
            <a
              className="sites-entry-link"
              href={`https://${site.domain}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {site.domain}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
