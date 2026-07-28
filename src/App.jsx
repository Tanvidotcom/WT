import { useEffect, useMemo, useState } from 'react'
import './App.css'

const timeZones = [
  { label: 'New York', value: 'America/New_York' },
  { label: 'London', value: 'Europe/London' },
  { label: 'Dubai', value: 'Asia/Dubai' },
  { label: 'Singapore', value: 'Asia/Singapore' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
]

function formatTimeForZone(date, timeZone, is24Hour, showSeconds) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: !is24Hour,
  })

  return formatter.format(date)
}

function formatDateForZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getZoneParts(date, timeZone, is24Hour, showSeconds) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    second: showSeconds ? 'numeric' : undefined,
    hour12: !is24Hour,
  })

  const parts = formatter.formatToParts(date)
  const getValue = (type) => parts.find((part) => part.type === type)?.value ?? '0'
  let hour = Number(getValue('hour'))
  const minute = Number(getValue('minute'))
  const second = Number(getValue('second') ?? '0')
  const dayPeriod = getValue('dayPeriod')

  if (!is24Hour) {
    if (dayPeriod === 'PM' && hour < 12) hour += 12
    if (dayPeriod === 'AM' && hour === 12) hour = 0
  }

  return { hour, minute, second }
}

function App() {
  const [now, setNow] = useState(new Date())
  const [selectedZone, setSelectedZone] = useState('America/New_York')
  const [alarmZone, setAlarmZone] = useState('Europe/London')
  const [alarmTime, setAlarmTime] = useState('07:30')
  const [alarmEnabled, setAlarmEnabled] = useState(true)
  const [showSeconds, setShowSeconds] = useState(true)
  const [is24Hour, setIs24Hour] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [ringing, setRinging] = useState(false)

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!alarmEnabled || !alarmTime || ringing) return

    const [targetHour, targetMinute] = alarmTime.split(':').map(Number)
    const zoneParts = getZoneParts(now, alarmZone, true, false)

    if (zoneParts.hour === targetHour && zoneParts.minute === targetMinute && zoneParts.second === 0) {
      setRinging(true)

      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (AudioContextClass) {
        try {
          const context = new AudioContextClass()
          const oscillator = context.createOscillator()
          const gainNode = context.createGain()

          oscillator.type = 'sine'
          oscillator.frequency.setValueAtTime(880, context.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.6)

          gainNode.gain.setValueAtTime(0.12, context.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.9)

          oscillator.connect(gainNode)
          gainNode.connect(context.destination)

          oscillator.start()
          oscillator.stop(context.currentTime + 0.9)
        } catch (error) {
          console.error(error)
        }
      }
    }
  }, [alarmEnabled, alarmTime, alarmZone, now, ringing])

  const selectedParts = useMemo(
    () => getZoneParts(now, selectedZone, is24Hour, showSeconds),
    [now, selectedZone, is24Hour, showSeconds],
  )

  const selectedTimeLabel = useMemo(
    () => formatTimeForZone(now, selectedZone, is24Hour, showSeconds),
    [now, selectedZone, is24Hour, showSeconds],
  )

  const selectedDateLabel = useMemo(
    () => formatDateForZone(now, selectedZone),
    [now, selectedZone],
  )

  const zoneCards = useMemo(
    () =>
      timeZones.map((zone) => {
        const parts = getZoneParts(now, zone.value, is24Hour, showSeconds)
        const timeLabel = formatTimeForZone(now, zone.value, is24Hour, showSeconds)
        const dateLabel = formatDateForZone(now, zone.value)
        const offsetLabel = new Intl.DateTimeFormat('en-US', {
          timeZoneName: 'short',
          timeZone: zone.value,
        })
          .formatToParts(now)
          .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT'

        return {
          ...zone,
          parts,
          timeLabel,
          dateLabel,
          offsetLabel,
        }
      }),
    [now, is24Hour, showSeconds],
  )

  const analogHour = (selectedParts.hour % 12) * 30 + selectedParts.minute * 0.5
  const analogMinute = selectedParts.minute * 6
  const analogSecond = selectedParts.second * 6

  return (
    <div className={`app-shell ${darkMode ? 'dark' : 'light'} ${compactMode ? 'compact' : ''}`}>
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Realtime command center</p>
          <h1>World Clock Dashboard</h1>
          <p className="hero-copy">
            Monitor global time, switch regions instantly, and keep important alarms in sync.
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" className="ghost-btn" onClick={() => setIs24Hour((value) => !value)}>
            {is24Hour ? '24H' : '12H'}
          </button>
          <button type="button" className="ghost-btn" onClick={() => setShowSeconds((value) => !value)}>
            {showSeconds ? 'Hide seconds' : 'Show seconds'}
          </button>
          <button type="button" className="ghost-btn" onClick={() => setDarkMode((value) => !value)}>
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
          <button type="button" className="ghost-btn" onClick={() => setCompactMode((value) => !value)}>
            {compactMode ? 'Expand' : 'Compact'}
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="primary-card">
          <div className="live-indicator">
            <span className="dot" />
            Live sync • {selectedZone}
          </div>

          <div className="clock-layout">
            <div className="clock-face" aria-label="Analog clock">
              <div className="clock-center" />
              <div className="hand hour" style={{ transform: `rotate(${analogHour}deg)` }} />
              <div className="hand minute" style={{ transform: `rotate(${analogMinute}deg)` }} />
              <div className="hand second" style={{ transform: `rotate(${analogSecond}deg)` }} />
            </div>

            <div className="digital-panel">
              <p className="small-label">Now in {selectedZone}</p>
              <h2>{selectedTimeLabel}</h2>
              <p className="date-label">{selectedDateLabel}</p>
              <label className="select-field">
                <span>Primary region</span>
                <select value={selectedZone} onChange={(event) => setSelectedZone(event.target.value)}>
                  {timeZones.map((zone) => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <aside className="side-panel">
          <section className="controls-card">
            <h3>Alarm control</h3>
            <p className="card-copy">Set a cue for your active region and let the dashboard alert you.</p>
            <label className="select-field">
              <span>Alert region</span>
              <select value={alarmZone} onChange={(event) => setAlarmZone(event.target.value)}>
                {timeZones.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="select-field">
              <span>Alarm time</span>
              <input type="time" value={alarmTime} onChange={(event) => setAlarmTime(event.target.value)} />
            </label>
            <div className="alarm-actions">
              <button type="button" className="primary-btn" onClick={() => setAlarmEnabled((value) => !value)}>
                {alarmEnabled ? 'Pause alarm' : 'Enable alarm'}
              </button>
              <button type="button" className="ghost-btn" onClick={() => setRinging(false)}>
                Dismiss
              </button>
            </div>
            <div className={`alarm-state ${ringing ? 'ringing' : ''}`}>
              {ringing ? 'Alarm is ringing now' : `Next alert: ${alarmTime} in ${alarmZone}`}
            </div>
          </section>

          <section className="world-list">
            {zoneCards.map((zone) => (
              <article key={zone.value} className="world-card">
                <div>
                  <p className="world-name">{zone.label}</p>
                  <p className="world-offset">{zone.offsetLabel}</p>
                </div>
                <div className="world-time-block">
                  <strong>{zone.timeLabel}</strong>
                  <span>{zone.dateLabel}</span>
                </div>
              </article>
            ))}
          </section>
        </aside>
      </main>
    </div>
  )
}

export default App
