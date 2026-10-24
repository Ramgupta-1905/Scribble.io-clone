
import { useState } from 'react'

const slides = [
  {
    title: 'Draw a word',
    description: 'Try to draw your chosen word! No spelling!',
    illustration: '✏️',
  },
  {
    title: 'Guess the word',
    description: 'When it is not your turn, try to guess what other players are drawing!',
    illustration: '💭',
  },
  {
    title: 'Earn points',
    description: 'Guess the word correctly to earn points. The faster you guess, the better!',
    illustration: '🏆',
  },
]

function HowToPlaySection() {
  const [activeSlide, setActiveSlide] = useState(0)
  const currentSlide = slides[activeSlide]

  return (
    <section className="info-card how-to-play-card">
      <div className="info-heading">
        <span className="info-icon" aria-hidden="true">✏️</span>
        <h2>How to play</h2>
        <span />
      </div>

      <div className="how-to-play-content">
        <div className="how-to-play-illustration" aria-hidden="true">
          {currentSlide.illustration}
        </div>

        <h3>{currentSlide.title}</h3>
        <p>{currentSlide.description}</p>

        <div className="carousel-dots" aria-label="How to play slides">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              className={index === activeSlide ? 'active-dot' : ''}
              aria-label={`Show slide ${index + 1}: ${slide.title}`}
              aria-current={index === activeSlide ? 'step' : undefined}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowToPlaySection
