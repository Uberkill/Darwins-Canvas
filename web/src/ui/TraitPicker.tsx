import React from 'react'
import { Swords, Zap, Shield, Activity, Heart } from 'lucide-react'
import { TRAIT_STATS } from '../constants'
import { Tooltip } from './Tooltip'

// ─── Size picker ──────────────────────────────────────────────────────────────

interface TraitPickerProps<T extends string> {
  label: string
  options: { value: T; label: string; icon: React.ReactNode }[]
  value: T
  onChange: (v: T) => void
}

export function TraitPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: TraitPickerProps<T>) {
  return (
    <div>
      <div className="section-title">{label}</div>
      <div className="pill-group" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const statsInfo = TRAIT_STATS[opt.value];
          return (
            <button
              key={opt.value}
              id={`trait-${label.toLowerCase().replace(/\s/g, '-')}-${opt.value.toLowerCase()}`}
              className={`pill${value === opt.value ? ' selected' : ''}`}
              role="radio"
              aria-checked={value === opt.value}
              onClick={() => onChange(opt.value)}
            >
              {statsInfo ? (
                <Tooltip
                  position="top"
                  content={
                    <>
                      <p className="decal-desc">{statsInfo.desc}</p>
                      {statsInfo.stats.length > 0 && (
                        <div className="decal-stats">
                          {statsInfo.stats.map((stat, i) => (
                            <div key={i} className={`decal-stat-row ${stat.isGood ? 'stat-good' : 'stat-bad'}`}>
                              {stat.label === 'Damage' && <Swords size={14} />}
                              {stat.label === 'Base Damage' && <Swords size={14} />}
                              {stat.label === 'Health' && <Heart size={14} />}
                              {stat.label === 'Speed' && <Zap size={14} />}
                              {stat.label === 'Energy' && <Activity size={14} />}
                              {stat.label === 'Bravery' && <Shield size={14} />}
                              <span>{stat.value} {stat.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  }
                >
                  <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>{opt.icon}</span>
                  {opt.label}
                </Tooltip>
              ) : (
                <>
                  <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>{opt.icon}</span>
                  {opt.label}
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Preset option arrays (imported by CreationPanel) ─────────────────────────
