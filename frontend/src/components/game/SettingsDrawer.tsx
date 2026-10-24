type SettingsDrawerProps = {
  onClose: () => void
}

export default function SettingsDrawer({ onClose }: SettingsDrawerProps) {
  return (
    <div className="settings-backdrop" onClick={onClose}>
      <section
        className="settings-drawer"
        onClick={(event) => event.stopPropagation()}
        aria-label="Room settings"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="settings-close"
          onClick={onClose}
          aria-label="Close settings"
        >
          ×
        </button>
        <h2>Room settings</h2>
        <p>Configure your private room using the settings panel.</p>
      </section>
    </div>
  )
}
