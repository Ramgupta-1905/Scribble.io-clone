
import { useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import type { ChatMessage } from './GameTypes'

type ChatPanelProps = {
  messages: ChatMessage[]
  guess: string
  onGuessChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  hint?: string
  disabled?: boolean
}

export default function ChatPanel({
  messages,
  guess,
  onGuessChange,
  onSubmit,
  hint,
  disabled = false,
}: ChatPanelProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = messagesContainerRef.current

    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages])

  return (
    <aside className="chat-panel" aria-label="Game chat">
      {hint && (
        <div className="chat-hint" aria-live="polite">
          {hint}
        </div>
      )}

      <div
        className="chat-messages"
        aria-live="polite"
        ref={messagesContainerRef}
      >
        {messages.map((message, index) => (
          <div
            key={message.id ?? `${message.timestamp ?? 'local'}-${index}`}
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
          onFocus={() => {
            const container = messagesContainerRef.current
            if (container) {
              container.scrollTop = container.scrollHeight
            }
          }}
          onClick={() => {
            const container = messagesContainerRef.current
            if (container) {
              container.scrollTop = container.scrollHeight
            }
          }}
          placeholder={disabled ? '' : 'Type your guess here...'}
          aria-label="Type your guess"
          autoComplete="off"
          maxLength={100}
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || !guess.trim()}>
          Send
        </button>
      </form>
    </aside>
  )
}
