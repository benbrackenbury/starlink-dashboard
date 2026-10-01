import { GroundTrackPanel } from "@/components/GroundTrackPanel";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import {
  constellation,
  coverage,
  finance,
  launches,
  pageFetched,
} from "@/data/stats";
import { getGroundTracks } from "@/lib/groundTracks";

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
      Source:{" "}
      <a href={url} rel="noreferrer">
        {label}
      </a>
      . {published}.
    </p>
  );
}

export default function HomePage() {
  const groundTracks = getGroundTracks();

  return (
    <main>
      <header className="page-head">
        <div>
          <h1>Starlink stats</h1>
          <p className="lede">
            Public figures only. Estimates are labelled. Compiled {pageFetched}.
          </p>
        </div>
        <ThemeSwitcher />
      </header>

      <section>
        <h2>Satellites in orbit</h2>
        <div className="figure">
          {constellation.totalInOrbit.toLocaleString("en-GB")}
        </div>
        <p className="sub">
          Total in orbit. {constellation.totalWorking.toLocaleString("en-GB")}{" "}
          working.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Version (source labels)</th>
                <th>In orbit</th>
                <th>Working</th>
              </tr>
            </thead>
            <tbody>
              {constellation.versions.map((row) => (
                <tr key={row.name}>
                  <td data-label="Version">
                    {row.name}
                    <div className="note">{row.note}</div>
                  </td>
                  <td data-label="In orbit">
                    {row.inOrbit.toLocaleString("en-GB")}
                  </td>
                  <td data-label="Working">
                    {row.working.toLocaleString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceLine {...constellation.source} />
        <SourceLine {...constellation.sourceV3} />
      </section>

      <section>
        <h2>Ground tracks</h2>
        <p className="sub">{groundTracks.subsetNote}</p>
        {groundTracks.tracks.length > 0 ? (
          <GroundTrackPanel data={groundTracks} />
        ) : (
          <p>Unavailable: SGP4 did not return positions for the stored GP sets.</p>
        )}
        <SourceLine
          label={groundTracks.sourceLabel}
          url={groundTracks.sourceUrl}
          published={`GP data fetched ${groundTracks.fetchedLabel}`}
        />
      </section>

      <section>
        <h2>Launch history</h2>
        <h3>Upcoming</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mission</th>
                <th>Time</th>
                <th>Site</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              {launches.upcoming.map((row) => (
                <tr key={row.name}>
                  <td data-label="Mission">
                    {row.name}
                    <div className="note">{row.status}</div>
                  </td>
                  <td data-label="Time">{row.date}</td>
                  <td data-label="Site">{row.site}</td>
                  <td data-label="Payload">{row.payload}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceLine {...launches.upcomingSource} />

        <h3>Recent</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mission</th>
                <th>Time</th>
                <th>Site</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              {launches.recent.map((row) => (
                <tr key={row.name}>
                  <td data-label="Mission">
                    {row.name}
                    <div className="note">{row.status}</div>
                  </td>
                  <td data-label="Time">{row.date}</td>
                  <td data-label="Site">{row.site}</td>
                  <td data-label="Payload">{row.payload}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceLine {...launches.source} />
      </section>

      <div className="grid">
        <section>
          <h2>Estimated revenue and profit</h2>
          <div className="figure">{finance.revenue}</div>
          <p className="sub">
            Estimate / reported figure: {finance.revenueLabel}, {finance.year}.
          </p>
          <div className="figure">{finance.profit}</div>
          <p className="sub">
            Estimate / reported figure: {finance.profitLabel}, {finance.year}.
          </p>
          <p className="note">{finance.caveat}</p>
          <SourceLine {...finance.source} />
        </section>

        <section>
          <h2>Where it operates</h2>
          <div className="figure">{coverage.official}</div>
          <p className="sub">Starlink’s own availability map wording.</p>
          <p>
            Prospectus reporting: {coverage.prospectus}. A country-level list
            from SpaceX is not published as a static table; check the map for
            current service areas.
          </p>
          <SourceLine {...coverage.sourceOfficial} />
          <SourceLine {...coverage.sourceProspectus} />
        </section>
      </div>
    </main>
  );
}
