import { ContentsNav } from "@/components/ContentsNav";
import { GroundTrackPanel } from "@/components/GroundTrackPanel";
import { Odometer } from "@/components/Odometer";
import { OutlookPanel } from "@/components/OutlookPanel";
import { ScrollProgress } from "@/components/ScrollProgress";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { TrainSightingsPanel } from "@/components/TrainSightingsPanel";
import {
  constellation,
  coverage,
  directToCell,
  finance,
  launches,
  shells,
  type Source,
} from "@/data/stats";
import {
  formatCount,
  formatLaunchWhen,
  formatUtcDay,
} from "@/lib/format";
import { getGroundTracks, SHELLS, type ShellId } from "@/lib/groundTracks";
import { oneParam } from "@/lib/query";

export const dynamic = "force-static";

function Brand({ children = "Starlink" }: { children?: string }) {
  return <span translate="no">{children}</span>;
}

function formatSourcePublished(source: Source) {
  const day = formatUtcDay(source.publishedIso);
  if (source.publishedNote === "Fetched") return `Fetched ${day}`;
  if (source.publishedNote) return `${day} (${source.publishedNote})`;
  return day;
}

function SourceLine({
  label,
  url,
  publishedIso,
  publishedNote,
}: Source) {
  return (
    <p className="source">
      <span className="source-chip">
        Source:{" "}
        <a href={url} rel="noreferrer">
          {label}
        </a>
      </span>
      <span>
        {formatSourcePublished({ label, url, publishedIso, publishedNote })}
      </span>
    </p>
  );
}

function LaunchRow({
  name,
  dateIso,
  net,
  site,
  payload,
  status,
  done,
}: {
  name: string;
  dateIso: string;
  net?: boolean;
  site: string;
  payload: string;
  status: string;
  done: boolean;
}) {
  return (
    <li className={done ? "task-row is-done" : "task-row"}>
      <span className="task-mark" aria-hidden="true" />
      <div className="task-copy">
        <p className="task-title">{name}</p>
        <p className="task-meta">
          {formatLaunchWhen(dateIso, net)} · {site}
        </p>
      </div>
      <div className="task-side">
        <span>{payload}</span>
        <span className="task-status">{status}</span>
      </div>
    </li>
  );
}

function LaunchGroup({
  title,
  rows,
  empty,
  done,
}: {
  title: string;
  rows: {
    name: string;
    dateIso: string;
    net?: boolean;
    site: string;
    payload: string;
    status: string;
  }[];
  empty: string;
  done: boolean;
}) {
  return (
    <>
      <h3>{title}</h3>
      {rows.length > 0 ? (
        <ul className="task-list">
          {rows.map((row) => (
            <LaunchRow key={row.name} {...row} done={done} />
          ))}
        </ul>
      ) : (
        <p className="note">{empty}</p>
      )}
    </>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const groundTracks = getGroundTracks();
  const compiled = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date());
  const shareTicks = [
    { id: "v1", n: 8, label: "V1" },
    { id: "v2", n: 20, label: "V2 Mini" },
    { id: "v3", n: 1, label: "V3" },
  ];
  const shellsParam = oneParam(query.shells);
  const initialShells = Object.fromEntries(
    SHELLS.map((shell) => [
      shell,
      shellsParam ? shellsParam.split(",").includes(shell) : true,
    ]),
  ) as Record<ShellId, boolean>;
  const satRaw = oneParam(query.sat);
  const satNum = satRaw ? Number(satRaw) : NaN;
  const initialSat = Number.isFinite(satNum) ? satNum : null;

  return (
    <>
      <ScrollProgress />
      <ContentsNav />
      <main id="main">
        <header className="page-head">
          <div>
            <p className="kicker">Public figures · compiled {compiled}</p>
            <h1>
              <Brand /> Stats
            </h1>
            <p className="lede">
              Estimates are labelled. Each number keeps its source.
            </p>
          </div>
          <ThemeSwitcher />
        </header>

        <section className="hero" id="orbit">
          <p className="kicker">Satellites in Orbit</p>
          <div className="hero-figure">
            <Odometer value={constellation.totalInOrbit} />
          </div>
          <p className="sub">
            {formatCount(constellation.totalWorking)} working
          </p>
          <div className="tick-ruler" aria-hidden="true">
            {shareTicks.flatMap((group, gi) => {
              const offset = shareTicks
                .slice(0, gi)
                .reduce((n, g) => n + g.n, 0);
              return Array.from({ length: group.n }, (_, i) => (
                <span
                  key={`${group.id}-${i}`}
                  className={`tick tick-${group.id}`}
                  style={{
                    animationDelay: `${120 + (offset + i) * 16}ms`,
                  }}
                />
              ));
            })}
          </div>
          <p className="tick-legend">
            <span>
              <i className="tick tick-v1" aria-hidden="true" /> V1 / Gen1
            </span>
            <span>
              <i className="tick tick-v2" aria-hidden="true" /> V2 Mini / Gen2
            </span>
            <span>
              <i className="tick tick-v3" aria-hidden="true" /> V3
            </span>
          </p>
        </section>

        <section id="version">
          <h2>By Version</h2>
          <ul className="task-list version-list">
            {constellation.versions.map((row) => (
              <li key={row.name} className="task-row">
                <span className="task-mark is-dot" aria-hidden="true" />
                <div className="task-copy">
                  <p className="task-title">{row.name}</p>
                  {row.note ? <p className="task-meta">{row.note}</p> : null}
                </div>
                <div className="task-side">
                  <span>
                    {formatCount(row.inOrbit)}
                    {"\u00a0"}in orbit
                  </span>
                  <span className="task-status">
                    {formatCount(row.working)}
                    {"\u00a0"}working
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <SourceLine {...constellation.source} />
          <SourceLine {...constellation.sourceV3} />
        </section>

        <section id="shells">
          <h2>Inclination Shells</h2>
          <p className="sub">
            Same four inclination bins as the ground-track colours. Counts are
            McDowell’s planes grouped to those bins; they sum to the in-orbit
            total above.
          </p>
          <div className="shell-stack" aria-hidden="true">
            {shells.rows.map((row) => (
              <span
                key={row.id}
                data-shell={row.id}
                style={{ flexGrow: row.inOrbit, flexBasis: 0 }}
              />
            ))}
          </div>
          <ul className="task-list version-list">
            {shells.rows.map((row) => (
              <li key={row.id} className="task-row">
                <span className="track-swatch" data-shell={row.id} />
                <div className="task-copy">
                  <p className="task-title">
                    {row.name} · {row.altitude}
                  </p>
                  <p className="task-meta">{row.note}</p>
                </div>
                <div className="task-side">
                  <span>
                    {formatCount(row.inOrbit)}
                    {"\u00a0"}in orbit
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <SourceLine {...shells.source} />
        </section>

        <section id="tracks">
          <h2>Ground Tracks</h2>
          <p className="sub">{groundTracks.subsetNote}</p>
          {groundTracks.tracks.length > 0 ? (
            <GroundTrackPanel
              data={groundTracks}
              initialShells={initialShells}
              initialSat={initialSat}
            />
          ) : (
            <p>
              Unavailable: SGP4 did not return positions for the stored GP
              sets. Refresh after updating the GP sample.
            </p>
          )}
          <SourceLine
            label={groundTracks.sourceLabel}
            url={groundTracks.sourceUrl}
            publishedIso={groundTracks.fetchedUtc}
            publishedNote="Fetched"
          />
        </section>

        <section id="trains">
          <h2>Visible Trains</h2>
          <p className="sub">
            Times when a recent launch is still a string of lights: dark sky,
            satellites in sunlight, at least 20° up, three or more in the same
            pass.
          </p>
          <TrainSightingsPanel
            initialLat={oneParam(query.lat) ?? ""}
            initialLon={oneParam(query.lon) ?? ""}
          />
        </section>

        <section id="launches">
          <h2>Launch History</h2>
          <LaunchGroup
            title="Upcoming"
            rows={launches.upcoming}
            done={false}
            empty="No upcoming Starlink launches in this list. Check the source for a new NET date."
          />
          <SourceLine {...launches.upcomingSource} />
          <LaunchGroup
            title="Recent"
            rows={launches.recent}
            done
            empty="No recent Starlink launches in this list. Check the source for new missions."
          />
          <SourceLine {...launches.source} />
        </section>

        <section id="finance">
          <h2>Revenue, Profit, and Customers</h2>
          <p className="sub">
            Drag the year to move through prospectus history and a naive
            projection to 2030.
          </p>
          <OutlookPanel />
          <p className="note">{finance.caveat}</p>
          <SourceLine {...finance.source} />
          <SourceLine {...finance.sourceFiling} />
        </section>

        <div className="grid">
          <section id="coverage">
            <h2>Where It Operates</h2>
            <div className="figure figure-phrase">{coverage.official}</div>
            <p className="sub">
              <span translate="no">Starlink’s</span> own availability map wording.
            </p>
            <p>
              Prospectus reporting: {coverage.prospectus}. A country-level list
              from SpaceX is not published as a static table; check the map for
              current service areas.
            </p>
            <SourceLine {...coverage.sourceOfficial} />
            <SourceLine {...coverage.sourceProspectus} />
          </section>

          <section id="d2c">
            <h2>Direct to Cell</h2>
            <div className="figure figure-phrase">{directToCell.headline}</div>
            <p className="sub">{directToCell.note}</p>
            <ul className="task-list version-list">
              {directToCell.partners.map((row) => (
                <li key={row.name} className="task-row">
                  <span className="task-mark is-dot" aria-hidden="true" />
                  <div className="task-copy">
                    <p className="task-title">{row.name}</p>
                    <p className="task-meta">{row.market}</p>
                  </div>
                  <div className="task-side">
                    <span className="task-status">{row.status}</span>
                  </div>
                </li>
              ))}
            </ul>
            <SourceLine {...directToCell.source} />
          </section>
        </div>
        <p className="attrib">
          Created by{" "}
          <a
            href="https://x.com/benbrackenbury"
            target="_blank"
            rel="noreferrer"
            aria-label="Ben Brackenbury (opens in a new tab)"
          >
            Ben Brackenbury
          </a>
        </p>
      </main>
    </>
  );
}
