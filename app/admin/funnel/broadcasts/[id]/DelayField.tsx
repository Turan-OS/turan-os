'use client'

import { useState } from 'react'

// Выбор задержки шага: «немедленно», через N минут/часов/дней, либо «в определённое время»
// (delay_unit='at': delay_value = смещение в днях, send_time='HH:MM' по Ташкенту).
const UNITS = [
  { v: 'minutes', l: 'минут' },
  { v: 'hours', l: 'часов' },
  { v: 'days', l: 'дней' },
]

export default function DelayField({ defaultValue, defaultUnit, defaultSendTime, isFirst }: {
  defaultValue: number
  defaultUnit: string
  defaultSendTime?: string | null
  isFirst: boolean
}) {
  const [unit, setUnit] = useState(defaultUnit || 'days')
  const immediate = unit === 'immediate'
  const at = unit === 'at'
  const grey = { fontSize: 12, color: '#8a929c' } as React.CSSProperties

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={grey}>Отправить</span>

      {at ? (
        <>
          <span style={grey}>через</span>
          <input name="delay_value" type="number" min={0} defaultValue={defaultValue} className="admin-input" style={{ width: 62, padding: '7px 9px' }} />
          <span style={grey}>дн., в</span>
          <input name="send_time" type="time" defaultValue={defaultSendTime || '10:00'} className="admin-input" style={{ width: 'auto', padding: '7px 9px' }} />
        </>
      ) : immediate ? (
        <input type="hidden" name="delay_value" value={0} readOnly />
      ) : (
        <>
          <span style={grey}>через</span>
          <input name="delay_value" type="number" min={0} defaultValue={defaultValue} className="admin-input" style={{ width: 70, padding: '7px 9px' }} />
        </>
      )}

      {/* send_time передаём пустым, если режим не «в определённое время» */}
      {!at && <input type="hidden" name="send_time" value="" readOnly />}

      <select name="delay_unit" value={unit} onChange={e => setUnit(e.target.value)} className="admin-input" style={{ width: 'auto', padding: '7px 9px' }}>
        <option value="immediate">немедленно</option>
        {UNITS.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
        <option value="at">в определённое время</option>
      </select>

      {!immediate && <span style={grey}>{isFirst ? 'после подписки' : 'после прошлого шага'}</span>}
    </div>
  )
}
