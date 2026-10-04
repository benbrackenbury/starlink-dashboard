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
} from "@/data/stats";
import { getGroundTracks } from "@/lib/groundTracks";

export const dynamic = "force-static";

function SourceLine({
  label,
  url,
  published,
}: {
  label: string;
  url: string;
  published: string;
}) {
  return (
    <p className="source">
      <span className="source-chip">
        Source:{" "}
        <a href={url} rel="noreferrer">
          {label}
        </a>
      </span>
      <span>{published}</span>
    </p>
  );
}

function LaunchRow({
  name,
  date,
  site,
  payload,
  status,
  done,
}: {
  name: string;
  date: string;
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
          {date} · {site}
        </p>
      </div>
      <div className="task-side">
        <span>{payload}</span>
        <span className="task-status">{status}</span>
      </div>
    </li>
  );
}

export default function HomePage() {
  const groundTracks = getGroundTracks();
  const compiled = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  });
  const shareTicks = [
    { id: "v1", n: 8, label: "V1" },
    { id: "v2", n: 20, label: "V2 Mini" },
    { id: "v3", n: 1, label: "V3" },
  ];

  return (
    <>
      <ScrollProgress />
      <ContentsNav />
      <main>
        <header className="page-head">
          <div>
            <p className="kicker">Public figures · compiled {compiled}</p>
            <h1>Starlink stats</h1>
            <p className="lede">
              Estimates are labelled. Each number keeps its source.
            </p>
          </div>
          <ThemeSwitcher />
        </header>

        <section className="hero" id="orbit">
          <p className="kicker">Satellites in orbit</p>
          <div className="hero-figure">
            <Odometer value={constellation.totalInOrbit} />
          </div>
          <p className="sub">
            {constellation.totalWorking.toLocaleString("en-GB")} working
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
              <i className="tick tick-v1" /> V1 / Gen1
            </span>
            <span>
              <i className="tick tick-v2" /> V2 Mini / Gen2
            </span>
            <span>
              <i className="tick tick-v3" /> V3
            </span>
          </p>
        </section>

        <section id="version">
          <h2>By version</h2>
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
                    {row.inOrbit.toLocaleString("en-GB")} in orbit
                  </span>
                  <span className="task-status">
                    {row.working.toLocaleString("en-GB")} working
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <SourceLine {...constellation.source} />
          <SourceLine {...constellation.sourceV3} />
        </section>

        <section id="shells">
          <h2>Inclination shells</h2>
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
                  <span>{row.inOrbit.toLocaleString("en-GB")} in orbit</span>
                </div>
              </li>
            ))}
          </ul>
          <SourceLine {...shells.source} />
        </section>

        <section id="tracks">
          <h2>Ground tracks</h2>
          <p className="sub">{groundTracks.subsetNote}</p>
          {groundTracks.tracks.length > 0 ? (
            <GroundTrackPanel data={groundTracks} />
          ) : (
            <p>
              Unavailable: SGP4 did not return positions for the stored GP
              sets.
            </p>
          )}
          <SourceLine
            label={groundTracks.sourceLabel}
            url={groundTracks.sourceUrl}
            published={`GP data fetched ${groundTracks.fetchedLabel}`}
          />
        </section>

        <section id="trains">
          <h2>Visible trains</h2>
          <p className="sub">
            Times when a recent launch is still a string of lights: dark sky,
            satellites in sunlight, at least 20° up, three or more in the same
            pass.
          </p>
          <TrainSightingsPanel />
        </section>

        <section id="launches">
          <h2>Launch history</h2>
          <h3>Upcoming</h3>
          <ul className="task-list">
            {launches.upcoming.map((row) => (
              <LaunchRow key={row.name} {...row} done={false} />
            ))}
          </ul>
          <SourceLine {...launches.upcomingSource} />

          <h3>Recent</h3>
          <ul className="task-list">
            {launches.recent.map((row) => (
              <LaunchRow key={row.name} {...row} done />
            ))}
          </ul>
          <SourceLine {...launches.source} />
        </section>

        <section id="finance">
          <h2>Revenue, profit, and customers</h2>
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
            <h2>Where it operates</h2>
            <div className="figure figure-phrase">{coverage.official}</div>
            <p className="sub">Starlink’s own availability map wording.</p>
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
          >
            Ben Brackenbury
          </a>
        </p>
      </main>
    </>
  );
}
