
function AboutSection() {
  return (
    <section className="info-card about-card">
      <div className="info-heading">
        <span className="info-icon">❔</span>
        <h2>About</h2>
        <span />
      </div>

      <div className="about-content">
        <p>
        <strong>skribbl.io</strong> is a free online multiplayer
          drawing and guessing pictionary game.
        </p>

        <p>
          A normal game consists of a few rounds, where every round a player has to draw their chosen word and others have to guess it to gain points!
        </p>

        <p>
          The person with the most points at the end of the game,
          will then be crowned as the winner!
          <br />
          Have fun!
        </p>
      </div>
    </section>
  )
}

export default AboutSection
