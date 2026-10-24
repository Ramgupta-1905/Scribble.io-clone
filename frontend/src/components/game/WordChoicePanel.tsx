
type WordChoicePanelProps = {
  words: string[]
  onChooseWord: (word: string) => void
  choosingPlayerName?: string
}

export default function WordChoicePanel({
  words,
  onChooseWord,
  choosingPlayerName = 'You',
}: WordChoicePanelProps) {
  return (
    <section
      aria-labelledby="word-choice-title"
      style={{
        display: 'flex',
        flex: '1 1 0',
        minHeight: 0,
        width: '100%',
        boxSizing: 'border-box',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '24px',
        background: '#ffffff',
        textAlign: 'center',
      }}
    >
      <div>
        <h2
          id="word-choice-title"
          style={{ margin: '0 0 8px', fontSize: 'clamp(22px, 3vw, 32px)' }}
        >
          Choose a word to draw
        </h2>
        <p style={{ margin: 0, color: '#555', fontSize: '15px' }}>
          {choosingPlayerName}, select one of these words to start your turn.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px',
          width: '100%',
          maxWidth: '650px',
        }}
      >
        {words.map((word) => (
          <button
            key={word}
            type="button"
            onClick={() => onChooseWord(word)}
            style={{
              minWidth: '140px',
              maxWidth: '100%',
              padding: '14px 22px',
              border: '2px solid #2587e8',
              borderRadius: '6px',
              background: '#ffffff',
              color: '#171717',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
              overflowWrap: 'anywhere',
            }}
          >
            {word}
          </button>
        ))}
      </div>

      <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
        Your drawing timer starts after you choose.
      </p>
    </section>
  )
}
