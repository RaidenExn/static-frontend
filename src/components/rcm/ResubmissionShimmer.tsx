import React from 'react'

export default function ResubmissionShimmer() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 180px' }}>
          <span className="shimmer-text" style={{ width: '110px', height: '12px', borderRadius: '4px' }} />
          <div className="shimmer-text" style={{ height: '38px', borderRadius: 'var(--border-radius)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '2 1 280px', minWidth: 0 }}>
          <span className="shimmer-text" style={{ width: '90px', height: '12px', borderRadius: '4px' }} />
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <div className="shimmer-text" style={{ height: '38px', flex: 1, borderRadius: 'var(--border-radius)' }} />
            <div
              className="shimmer-text"
              style={{ height: '38px', width: '100px', borderRadius: 'var(--border-radius)' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="shimmer-text" style={{ width: '130px', height: '12px', borderRadius: '4px' }} />
          <span className="shimmer-text" style={{ width: '90px', height: '11px', borderRadius: '4px' }} />
        </div>
        <div className="shimmer-text" style={{ height: '80px', borderRadius: 'var(--border-radius)' }} />
      </div>

      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
        <div className="shimmer-text" style={{ height: '38px', flex: 1, borderRadius: 'var(--border-radius)' }} />
        <div className="shimmer-text" style={{ height: '38px', width: '80px', borderRadius: 'var(--border-radius)' }} />
      </div>

      <div style={{ marginTop: '16px', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
        <span
          className="shimmer-text"
          style={{ width: '200px', height: '12px', borderRadius: '4px', marginBottom: '8px', display: 'block' }}
        />
        <div className="shimmer-text" style={{ height: '32px', borderRadius: 'var(--border-radius)' }} />
      </div>
    </div>
  )
}
