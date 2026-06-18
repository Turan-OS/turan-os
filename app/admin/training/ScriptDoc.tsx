'use client'

import type { ParsedScript } from '@/lib/scriptDoc'

export default function ScriptDoc({ data }: { data: ParsedScript }) {
  return (
    <div className="script-doc">
      {data.intro && (
        <div className="script-intro">
          <div className="script-intro-label">🎯 Цель звонка</div>
          <div className="script-intro-text">{data.intro}</div>
        </div>
      )}

      {data.stages.map((st, i) => (
        <div className="script-stage" key={i}>
          <div className="script-stage-side">
            <span className="script-num">{i + 1}</span>
            <span className="script-pill">{st.title}</span>
          </div>

          <div className="script-stage-body">
            {st.instruction && <div className="script-instr">{st.instruction}</div>}

            {st.says.map((s, j) => (
              <div key={j}>
                {s.cond && <div className="script-cond">{s.cond}</div>}
                <div className="script-say">{s.text}</div>
              </div>
            ))}

            {st.tips.map((t, j) => (
              <div className="script-tip" key={j}>💡 {t}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
