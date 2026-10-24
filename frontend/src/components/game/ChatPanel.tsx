import type { FormEvent } from 'react'
import type { ChatMessage } from './gameTypes'

type ChatPanelProps = {
  messages: ChatMessage[]
  guess: string
  onGuessChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function ChatPanel({
  messages,
  guess,
  onGuessChange,
  onSubmit,
}: ChatPanelProps) {
  return (
    <aside className="chat-panel" aria-label="Game chat">
      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => (
          <div
            key={`${message.text}-${index}`}
            className={`chat-message chat-${message.type}`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <form className="guess-form" onSubmit={onSubmit}>
        <input
          value={guess}
          onChange={(event) => onGuessChange(event.target.value)}
          placeholder="Type your guess here..."
          aria-label="Type your guess"
          autoComplete="off"
          maxLength={100}
        />
      </form>
    </aside>
  )
}
