
function NewsSection() {
  return (
    <section className="info-card news-card">
      <div className="info-heading">
        <span className="info-icon">📗</span>
        <h2>News</h2>
        <span />
      </div>

      <div className="news-content">
        <article className="news-item">
          <div className="news-title">
            <strong>Fresh paint</strong>
            <time>9th November 2022</time>
          </div>

          <p>Hello!</p>

          <ul>
            <li>Redesign of the page</li>
            <li>Mobile support</li>
            <li>
              Reworked toolbar
              <ul>
                <li>Undo button</li>
                <li>More colors</li>
                <li>Left- and rightclick to select colors and draw</li>
                <li>Experimental support for pressure touch input</li>
                <li>Configurable hotkeys</li>
              </ul>
            </li>
            <li>
              Better player interactions/moderation
              <ul>
                <li>Ability to kick and ban players as a room owner</li>
                <li>Votekick, Mute and Report naughty players</li>
              </ul>
            </li>
            <li>Invite your friends to public rooms</li>
            <li>
              More room settings
              <ul>
                <li>Increased player count in custom rooms to 20</li>
                <li>Set the amount of Words to choose from (1-5)</li>
              </ul>
            </li>
          </ul>
        </article>
      </div>
    </section>
  )
}

export default NewsSection
