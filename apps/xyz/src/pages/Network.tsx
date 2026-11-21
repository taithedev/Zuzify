import { useMemo, useState } from "react";
import { Activity, ArrowUpRight, Globe2, Search, Server, ShieldCheck } from "lucide-react";
import "./network.css";

type Area = "North America" | "Europe" | "Asia Pacific" | "Other";
type Region = { name: string; city: string; country: string; lat: number; lng: number; area: Area };

const regions: Region[] = [
  { name: "San Francisco, USA", city: "San Francisco", country: "United States", lat: 37.77, lng: -122.42, area: "North America" },
  { name: "Washington, D.C., USA", city: "Washington, D.C.", country: "United States", lat: 38.91, lng: -77.04, area: "North America" },
  { name: "Cleveland, USA", city: "Cleveland", country: "United States", lat: 41.50, lng: -81.69, area: "North America" },
  { name: "Portland, USA", city: "Portland", country: "United States", lat: 45.52, lng: -122.68, area: "North America" },
  { name: "Montréal, Canada", city: "Montréal", country: "Canada", lat: 45.50, lng: -73.57, area: "North America" },
  { name: "Frankfurt, Germany", city: "Frankfurt", country: "Germany", lat: 50.11, lng: 8.68, area: "Europe" },
  { name: "London, United Kingdom", city: "London", country: "United Kingdom", lat: 51.51, lng: -0.13, area: "Europe" },
  { name: "Paris, France", city: "Paris", country: "France", lat: 48.86, lng: 2.35, area: "Europe" },
  { name: "Stockholm, Sweden", city: "Stockholm", country: "Sweden", lat: 59.33, lng: 18.07, area: "Europe" },
  { name: "Dublin, Ireland", city: "Dublin", country: "Ireland", lat: 53.35, lng: -6.26, area: "Europe" },
  { name: "Tokyo, Japan", city: "Tokyo", country: "Japan", lat: 35.68, lng: 139.69, area: "Asia Pacific" },
  { name: "Osaka, Japan", city: "Osaka", country: "Japan", lat: 34.69, lng: 135.50, area: "Asia Pacific" },
  { name: "Seoul, South Korea", city: "Seoul", country: "South Korea", lat: 37.56, lng: 126.98, area: "Asia Pacific" },
  { name: "Hong Kong", city: "Hong Kong", country: "Hong Kong", lat: 22.32, lng: 114.17, area: "Asia Pacific" },
  { name: "Singapore", city: "Singapore", country: "Singapore", lat: 1.35, lng: 103.82, area: "Asia Pacific" },
  { name: "Sydney, Australia", city: "Sydney", country: "Australia", lat: -33.87, lng: 151.21, area: "Asia Pacific" },
  { name: "Mumbai, India", city: "Mumbai", country: "India", lat: 19.08, lng: 72.88, area: "Asia Pacific" },
  { name: "São Paulo, Brazil", city: "São Paulo", country: "Brazil", lat: -23.55, lng: -46.63, area: "Other" },
  { name: "Dubai, United Arab Emirates", city: "Dubai", country: "United Arab Emirates", lat: 25.20, lng: 55.27, area: "Other" },
  { name: "Cape Town, South Africa", city: "Cape Town", country: "South Africa", lat: -33.92, lng: 18.42, area: "Other" }
];

const landMask = [
"000000000000000010001000000000111111111100000000000000000000110000001111100000001000000000",
"000000000000001111101000110000011111111000000000000000000010001010111101111110001100000000",
"100011111110111100101111100100001111100000000000011111101111111011111111111111111111111111",
"000001111111111111111101100110001110000110000000110111111111111111111111111111111111111111",
"000011110011111111111000001000000000000001110001111111111111111111111111111111111111010000",
"000000000000111111111110001111000000000000000001101111111111111111111111111111100000110000",
"000000000000011111110111111111100000000000101011111111111111111111111110111111111000100000",
"000000000000001111111110111110110000000000001111111111111111111111111111111111110000000000",
"000000000000001111111111011110000000000000000110011100011011111111111111111111101000000000",
"000000000000001111111111110000000000000000011000001011111011111111111111111110000000000000",
"000000000000000111111111110000000000000000000111000000111111111111111111111000010000000000",
"000000000000000011111111100000000000000000011111101000111111111111111111111000000000000000",
"000000000000000011111000100000000000000000111111111110111011111111111111111000000000000000",
"000000000000000001111000000000000000000001111111111111011110001111111111110000000000000000",
"000000000000000000011010000000000000000001111111111111011110000111101111000000000000000000",
"000000000000000000000110000000000000000001111111111111101100000110000111000000000000000000",
"000000000000000000000001000100000000000001111111111111110000000010000001000000000000000000",
"000000000000000000000000011111000000000000111111111111111100000000000000000010000000000000",
"000000000000000000000000001111110000000000000001111111111000000000000110010000000000000000",
"000000000000000000000000011111110000000000000001101110110000000000000010110000000000000000",
"000000000000000000000000011111111110000000000000111111100000000000000000000100011000000000",
"000000000000000000000000011111111111000000000000111111100000000000000000010000011100000000",
"000000000000000000000000001111111111000000000000111111100000000000000000000000100000000000",
"000000000000000000000000000111111110000000000000111111101000000000000000000011101000000000",
"000000000000000000000000000111111110000000000000111111001000000000000000000111111100000000",
"000000000000000000000000000111111000000000000000011111001000000000000000011111111110000000",
"000000000000000000000000000111111000000000000000011110000000000000000000001111111110000000",
"000000000000000000000000000111110000000000000000001100000000000000000000001110111110000000",
"000000000000000000000000000111100000000000000000000000000000000000000000000000001110000010",
"000000000000000000000000000110000000000000000000000000000000000000000000000000000000000000",
"000000000000000000000000000110000000000000000000000000000000000000000000000000000000000100",
"000000000000000000000000000110000000000000000000000000000000000000000000000000000000000000",
"000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000",
"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
];

function position(lng: number, lat: number) {
  return { x: ((lng + 180) / 360) * 1000, y: ((80 - lat) / 136) * 460 };
}

const landDots = landMask.flatMap((row, y) =>
  [...row].flatMap((value, x) =>
    value === "1" ? [{ x: position(-178 + x * 4, 76 - y * 4).x, y: position(-178 + x * 4, 76 - y * 4).y }] : []
  )
);

const filters = ["All", "North America", "Europe", "Asia Pacific", "Other"] as const;
type Filter = (typeof filters)[number];

export function NetworkMap({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(regions[5].name);
  const visible = useMemo(() => regions.filter(region =>
    (filter === "All" || region.area === filter) &&
    (region.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  ), [filter, query]);
  const active = regions.find(region => region.name === selected) || regions[5];

  return <div className={"network-widget" + (compact ? " network-compact" : "")}>
    <div className="network-toolbar">
      <div className="network-toolbar-label"><span className="network-live-indicator" /> EDGE NETWORK <span className="network-toolbar-muted">/ REGIONAL EXPLORER</span></div>
      <span className="network-reference-label">REGION REFERENCE MAP</span>
    </div>
    <div className="network-tabs" role="group" aria-label="Filter network regions">
      {filters.map(item => <button type="button" key={item} className={filter === item ? "is-selected" : ""} aria-pressed={filter === item} onClick={() => { setFilter(item); setQuery(""); }}>{item}</button>)}
    </div>
    <div className="network-body">
      <aside className="network-sidebar">
        <div className="network-search"><Search size={14} aria-hidden="true" /><input aria-label="Search regions" placeholder="Find a region" value={query} onChange={event => setQuery(event.target.value)} /></div>
        <div className="network-region-list" aria-label="Region locations">
          {visible.length === 0 ? <p className="network-empty">No matching regions.</p> : visible.map(region => <button key={region.name} type="button" className={"network-region" + (active.name === region.name ? " is-active" : "")} onClick={() => setSelected(region.name)}>
            <span className="network-region-dot" /><span>{region.name}</span><span className="network-region-arrow">↗</span>
          </button>)}
        </div>
        <div className="network-sidebar-footer"><Globe2 size={14} /> {visible.length} SHOWN / {regions.length} ON MAP</div>
      </aside>
      <div className="network-map-area">
        <div className="network-map-top"><span><Activity size={14} /> GLOBAL DISTRIBUTION</span><span>REGION VIEW · NOT LIVE TRAFFIC</span></div>
        <svg className="network-world" viewBox="0 0 1000 460" role="img" aria-label={"Dotted world map with region locations; selected " + active.name}>
          <defs>
            <radialGradient id="network-node-glow"><stop offset="0%" stopColor="#bcd1ff" stopOpacity=".9" /><stop offset="100%" stopColor="#5695ff" stopOpacity=".08" /></radialGradient>
          </defs>
          {landDots.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="2.05" className="network-land-dot" />)}
          {visible.map(region => {
            const { x, y } = position(region.lng, region.lat);
            const isActive = active.name === region.name;
            return <g key={region.name} transform={"translate(" + x + " " + y + ")"} className={"network-map-node" + (isActive ? " is-active" : "")} onClick={() => setSelected(region.name)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(region.name); } }} role="button" tabIndex={0} aria-label={"Select " + region.name}>
              {isActive && <circle r="31" fill="url(#network-node-glow)" className="network-node-halo" />}
              <circle r={isActive ? 12 : 8} className="network-node-pulse" />
              <circle r={isActive ? 8 : 5} className="network-node-core" />
              <circle r="22" fill="transparent" />
            </g>;
          })}
        </svg>
        <div className="network-selected">
          <div><span className="network-detail-label">SELECTED REGION</span><strong>{active.city}</strong><span>{active.country} · {active.area}</span></div>
          <span className="network-coordinate">{Math.abs(active.lat).toFixed(2)}°{active.lat >= 0 ? "N" : "S"} / {Math.abs(active.lng).toFixed(2)}°{active.lng >= 0 ? "E" : "W"}</span>
        </div>
      </div>
    </div>
    <div className="network-footnote"><ShieldCheck size={14}/><span>Vercel serves the actual CDN. This is a public visualization of reference regions, not account-level request data.</span></div>
  </div>;
}

export function Network() {
  return <main className="container network-page">
    <div className="page-topline">THE ZUZIFY NETWORK <span>NETWORK / 001</span></div>
    <div className="network-heading"><span className="eyebrow"><span className="eyebrow-dot"/> GLOBAL DELIVERY</span><h1>Built to reach <em>everywhere.</em></h1><p>Explore the global locations behind modern edge delivery. A visual companion to the CDN powering Zuzify.</p></div>
    <NetworkMap />
    <div className="network-info-grid">
      <div><Globe2 size={22}/><span>GLOBAL</span><h2>Worldwide delivery.</h2><p>Vercel's CDN delivers public website assets through a distributed edge network.</p></div>
      <div><Server size={22}/><span>CONNECTED</span><h2>www.zuzify.xyz</h2><p>Hosted on Vercel, with CDN delivery already enabled for the website.</p></div>
      <div><Activity size={22}/><span>LIVE METRICS</span><h2>Private by default.</h2><p>Request counts, regional percentages and cache hit rates are available in the site's Vercel dashboard, not exposed here.</p></div>
    </div>
    <a href="https://vercel.com/docs/cdn" className="network-docs" target="_blank" rel="noopener noreferrer">HOW VERCEL CDN WORKS <ArrowUpRight size={16}/></a>
  </main>;
}
