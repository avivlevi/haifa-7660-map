import { lazy, Suspense } from 'react'

const MapPage = lazy(() => import('./pages/Map/MapPage').then(m => ({ default: m.MapPage })))

function LoadingScreen() {
  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
        direction: 'rtl',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{
        width: 44,
        height: 44,
        border: '3px solid #e2e8f0',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>טוען מפה…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function App() {
  return (
    <div style={{ height: '100dvh' }}>
      <Suspense fallback={<LoadingScreen />}>
        <MapPage />
      </Suspense>
    </div>
  )
}
