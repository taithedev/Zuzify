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
      <div className="sites-list">
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
