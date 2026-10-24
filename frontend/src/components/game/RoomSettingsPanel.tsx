import type { ChangeEvent } from 'react'
import { settingOptions } from './GameTypes'

type RoomSettingsPanelProps = {
  settings: Record<string, string>
  onSettingChange: (name: string, value: string) => void
  customWords: string
  onCustomWordsChange: (value: string) => void
  useCustomWordsOnly: boolean
  onUseCustomWordsOnlyChange: (value: boolean) => void
  copyLabel: string
  onCopyInviteLink: () => void
  onStartGame: () => void
  startError: string
  roomMemberCount: number
  roomCode?: string
}

export default function RoomSettingsPanel({
  settings,
  onSettingChange,
  customWords,
  onCustomWordsChange,
  useCustomWordsOnly,
  onUseCustomWordsOnlyChange,
  copyLabel,
  onCopyInviteLink,
  onStartGame,
  startError,
  roomMemberCount,
  roomCode,
}: RoomSettingsPanelProps) {
  return (
    <section
      className="room-settings-panel"
      aria-label="Private room settings"
    >
      {roomCode && (
        <div className="room-code-display">
          <strong>Room code: {roomCode}</strong>
        </div>
      )}

      <div className="room-settings-list">
        {settingOptions.map((setting) => (
          <label className="room-setting-row" key={setting.name}>
            <span className="room-setting-label">
              <span className="room-setting-icon" aria-hidden="true">
                {setting.icon}
              </span>
              {setting.label}
            </span>

            <select
              name={setting.name}
              value={settings[setting.name]}
              onChange={(event) =>
                onSettingChange(setting.name, event.target.value)
              }
            >
              {setting.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="custom-words-heading">
        <strong>Custom words</strong>

        <label className="custom-words-checkbox">
          <span>Use custom words only</span>
          <input
            type="checkbox"
            checked={useCustomWordsOnly}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onUseCustomWordsOnlyChange(event.target.checked)
            }
          />
        </label>
      </div>

      <textarea
        className="custom-words-input"
        value={customWords}
        onChange={(event) =>
          onCustomWordsChange(event.target.value)
        }
        placeholder="Minimum of 10 words. 1-32 characters per word! 20000 characters maximum. Separated by a , (comma)"
        aria-label="Custom words separated by commas"
      />

      <div className="room-actions">
        <div className="invite-copy-group">
          <div
            className="invite-link"
            title={
              roomCode
                ? `${window.location.origin}/game?room=${roomCode}`
                : window.location.href
            }
          >
            {roomCode
              ? `Invite code: ${roomCode}`
              : 'Hover over me to see the invite link!'}
          </div>

          <button
            type="button"
            className="copy-button"
            onClick={onCopyInviteLink}
          >
            {copyLabel}
          </button>
        </div>

        <button
          type="button"
          className="start-button"
          onClick={onStartGame}
        >
          Start!
        </button>
      </div>

      {startError && (
        <p className="start-error" role="alert">
          {startError}
          <span> Players joined: {roomMemberCount}</span>
        </p>
      )}
    </section>
  )
}