import React from 'react'
import PhotoBooth from './components/PhotoBooth'

export default function App(){
  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="title">Photobooth</h1>
        <button onClick={() => window.location.href = '/chat.html'} style={{
          position: 'absolute', top: '20px', right: '20px',
          background: 'transparent', border: '1px solid #7e5a3a', 
          color: '#7e5a3a', padding: '6px 12px', borderRadius: '6px',
          cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px'
        }}>← Back to Chat</button>
      </header>
      <main className="main">
        <PhotoBooth />
      </main>
      <footer className="app-footer">Enjoy your retro photos ✨</footer>
    </div>
  )
}
