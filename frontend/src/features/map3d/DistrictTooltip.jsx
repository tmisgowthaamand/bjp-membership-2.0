import { getDistrictNumber } from '../../data/districtNormalizer'

export function LocationPinIcon({ size = 16, color = '#F76201', fill = '#F76201', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: '-3px', ...style }}
    >
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill={fill}
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" fill="#FFFFFF" />
    </svg>
  )
}

export function DistrictTooltip({ tooltip }) {
  if (!tooltip || !tooltip.visible) return null

  const distNum = getDistrictNumber(tooltip.district)

  return (
    <div
      className="tn-map-tooltip"
      style={{
        position: 'absolute',
        left: tooltip.x + 14,
        top: tooltip.y - 75,
        pointerEvents: 'none',
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1.5px solid #2563EB',
        borderRadius: 12,
        padding: '10px 14px',
        minWidth: 180,
        boxShadow: '0 10px 25px -5px rgba(15,23,42,0.4)',
        color: '#ffffff',
      }}
    >
      <div className="tn-tooltip-district" style={{ fontSize: 13.5, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <LocationPinIcon size={16} color="#2563EB" fill="#2563EB" />
        <span>{distNum ? `#${distNum} ` : ''}{tooltip.district}</span>
      </div>

      <div className="tn-tooltip-count" style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="tn-tooltip-num" style={{ fontSize: 20, fontWeight: 900, color: '#F59E0B', fontFamily: 'JetBrains Mono, monospace' }}>
          {tooltip.count.toLocaleString()}
        </span>
        <span className="tn-tooltip-label" style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Plus Jakarta Sans, sans-serif' }}> applications</span>
      </div>

      {tooltip.lat && tooltip.lng && (
        <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>🌐</span>
          <span style={{ fontWeight: 600 }}>{tooltip.lat}° N, {tooltip.lng}° E</span>
        </div>
      )}

      {tooltip.count === 0 && (
        <div className="tn-tooltip-empty" style={{ fontSize: 10.5, color: '#64748B', fontStyle: 'italic', marginTop: 2 }}>
          No applications yet
        </div>
      )}
    </div>
  )
}
