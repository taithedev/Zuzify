import { ArrowUpRight } from "lucide-react";
import "./websites.css";

type Website = {
  name: string;
  domain: string;
  description: string;
};

const websites: Website[] = [
  {
    name: "Zuzify",
    domain: "zuzify.xyz",
    description: "The home of Zuzify. Discover all our apps, products and creative projects.",
  },
  {
    name: "Zuzify LOL",
    domain: "zuzify.lol",
    description: "Our creative playground for experiments, unexpected ideas and the fun stuff.",
  },
  {
    name: "ZuzuOS",
    domain: "zuzuos.lol",
    description: "The home domain for ZuzuOS, our desktop operating system project.",
  },
  {
    name: "Zuzu",
    domain: "zuzu.lol",
    description: "A domain for the Zuzu brand and its growing collection of projects.",
  },
];

const stars = [
  { left: "8%", top: "14%", size: "11px", delay: "0s" },
  { left: "19%", top: "70%", size: "18px", delay: "1.1s" },
  { left: "39%", top: "7%", size: "10px", delay: "2.2s" },
  { left: "63%", top: "16%", size: "20px", delay: "1.7s" },
  { left: "84%", top: "29%", size: "12px", delay: "0.6s" },
  { left: "94%", top: "64%", size: "18px", delay: "2.6s" },
  { left: "12%", top: "91%", size: "8px", delay: "2.9s" },
  { left: "76%", top: "93%", size: "9px", delay: "1.8s" },
];

export function Websites() {
  return (
    <section className="sites-page container" aria-label="Zuzify websites">
      <h1 className="sr-only">Zuzify websites</h1>
      <div className="sites-sky" aria-hidden="true">
        {stars.map((star, index) => (
          <span
            key={index}
            className="sites-sky-star"
            style={{
              left: star.left,
              top: star.top,
              fontSize: star.size,
              animationDelay: star.delay,
            }}
          >
            ✦
          </span>
        ))}
      </div>
      <div className="sites-list">
        {websites.map((site, index) => (
          <a
            className="sites-entry"
            key={site.domain}
            href={`https://${site.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${site.name} at ${site.domain} (opens in a new tab)`}
          >
            <span className="sites-entry-stars" aria-hidden="true">
              <span className="sites-entry-star-big">✦</span>
              <span className="sites-entry-star-small">✧</span>
            </span>
            <div className="sites-entry-content">
              <h2>{site.name}</h2>
              <span className="sites-entry-byline">By Zuzify</span>
              <p>{site.description}</p>
              <span className="sites-entry-link">
                {site.domain}
                <ArrowUpRight size={16} strokeWidth={1.6} />
              </span>
            </div>
            <span className="sites-entry-corner-star" aria-hidden="true">✳</span>
            <span className="sites-entry-number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
