import { useEffect, useState, useCallback } from 'react'

export default function PromptHistoryPicker({ feature, onSelect, refreshKey }) {
  const [history, setHistory] = useState([])

  const load = useCallback(async () => {
    const list = await window.api.listPromptHistory(feature)
    setHistory(list)
  }, [feature])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  if (history.length === 0) return null

  return (
    <div className="prompt-history-chips">
      {history.map((entry) => (
        <button
          key={entry.id}
          type="button"
          className="prompt-history-chip"
          title={entry.text}
          onClick={() => onSelect(entry.text)}
        >
          {entry.text}
        </button>
      ))}
    </div>
  )
}
