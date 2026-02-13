import React, { useEffect, useRef, useState } from 'react'
import PhotoStrip from './PhotoStrip'

const CAPTURE_COUNT = 4

export default function PhotoBooth(){
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [photos, setPhotos] = useState([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [filter, setFilter] = useState('none')
  const flashRef = useRef(null)
  const capturingRef = useRef(false)
  const [soundOn, setSoundOn] = useState(true)
  const audioCtxRef = useRef(null)

  const ensureAudio = ()=>{
    if(!audioCtxRef.current){
      const C = window.AudioContext || window.webkitAudioContext
      if(!C) return
      audioCtxRef.current = new C()
    }
  }

  const playBeep = (freq = 880, duration = 0.12) => {
    if(!soundOn) return
    try{
      ensureAudio()
      const ctx = audioCtxRef.current
      if(!ctx) return
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.value = 0.0001
      o.connect(g); g.connect(ctx.destination)
      o.start()
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
      o.stop(ctx.currentTime + duration + 0.02)
    }catch(e){ console.warn('Audio failed', e) }
  }

  const playShutter = ()=>{
    if(!soundOn) return
    try{
      ensureAudio()
      const ctx = audioCtxRef.current
      if(!ctx) return
      const bufferSize = ctx.sampleRate * 0.08
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for(let i=0;i<bufferSize;i++) data[i] = (Math.random()*2-1) * Math.exp(-5*i/bufferSize) * 0.6
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const g = ctx.createGain()
      g.gain.value = 1
      noise.connect(g); g.connect(ctx.destination)
      noise.start()
      setTimeout(()=>{ try{ noise.stop() }catch(e){} }, 120)
    }catch(e){ console.warn('shutter failed', e) }
  }

  useEffect(()=>{
    async function start(){
      try{
        const s = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'user'}, audio: false})
        streamRef.current = s
        if(videoRef.current) videoRef.current.srcObject = s
      }catch(e){
        console.error('Camera error', e)
      }
    }
    start()
    return ()=>{ if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop()) }
  },[])

  // countdown handled per-capture inside startCapture to avoid race conditions

  const doFlash = ()=>{
    if(!flashRef.current) return
    flashRef.current.classList.add('flash-on')
    setTimeout(()=> flashRef.current.classList.remove('flash-on'), 150)
  }

  const captureSingle = () => {
    const video = videoRef.current
    if(!video) return null
    const w = video.videoWidth
    const h = video.videoHeight
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    // mirror the capture so it matches the mirrored preview
    ctx.save()
    if(filter === 'sepia') ctx.filter = 'sepia(0.9) contrast(1.05)'
    else if(filter === 'bw') ctx.filter = 'grayscale(1) contrast(1.05)'
    else if(filter === 'faded') ctx.filter = 'saturate(0.85) contrast(0.95) brightness(1.02)'
    else if(filter === 'grain') ctx.filter = 'contrast(1.02)'
    else if(filter === 'classic') ctx.filter = 'sepia(0.95) contrast(1.2) saturate(0.9)'
    else ctx.filter = 'none'
    ctx.translate(w,0)
    ctx.scale(-1,1)
    ctx.drawImage(video, 0, 0, w, h)
    ctx.restore()
    if(filter === 'grain' || filter === 'classic'){
      // simple grain: overlay noise
      const img = ctx.getImageData(0,0,w,h)
      for(let i=0;i<img.data.length;i+=4){
        const v = (Math.random()-0.5)*30
        img.data[i] = img.data[i]+v
        img.data[i+1] = img.data[i+1]+v
        img.data[i+2] = img.data[i+2]+v
      }
      ctx.putImageData(img,0,0)
    }
    if(filter === 'classic'){
      // vignette
      const vg = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.2, w/2, h/2, Math.max(w,h)*0.8)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(0,0,0,0.45)')
      ctx.fillStyle = vg
      ctx.fillRect(0,0,w,h)
      // light scratches
      ctx.globalAlpha = 0.08
      ctx.strokeStyle = '#fff'
      for(let s=0;s<15;s++){
        ctx.beginPath()
        const y = Math.random()*h
        ctx.moveTo(0, y)
        ctx.quadraticCurveTo(w/2, y + (Math.random()-0.5)*40, w, y + (Math.random()-0.5)*10)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
    return canvas.toDataURL('image/png')
  }

  const startCapture = async ()=>{
    setPhotos([])
    capturingRef.current = true
    setIsCapturing(true)
    for(let i=0;i<CAPTURE_COUNT;i++){
      if(!capturingRef.current) break
      let seconds = 3
      setCountdown(seconds)
      await new Promise(res=>{
        const t = setInterval(()=>{
          // play beep each tick
          if(seconds > 0) playBeep(900 - seconds*80, 0.12)
          seconds -= 1
          setCountdown(seconds)
          if(seconds <= 0){ clearInterval(t); setCountdown(0); res() }
        }, 1000)
      })
      if(!capturingRef.current) break
      doFlash()
      playShutter()
      const data = captureSingle()
      setPhotos(prev => [...prev, data])
      // small pause between shots
      await new Promise(r => setTimeout(r, 600))
    }
    capturingRef.current = false
    setIsCapturing(false)
  }

  const retake = ()=>{ capturingRef.current = false; setPhotos([]); setIsCapturing(false); setCountdown(0) }

  return (
    <div className="photobooth-root">
      <div className="frame">
        <div className="frame-decor"> 
          <div className="camera-top">
            <div className="led" />
            <div className="viewfinder">PHOTOMAT</div>
            <div className="speaker" />
          </div>
          <div className="camera-area">
            <video ref={videoRef} autoPlay playsInline muted className="preview mirrored" />
            <div ref={flashRef} className="flash-overlay" />
            {countdown>0 && <div className="countdown">{countdown}</div>}
          </div>
          <div className="controls">
            <label className="filter-select">Filter:
              <select value={filter} onChange={e=>setFilter(e.target.value)}>
                <option value="none">None</option>
                <option value="sepia">Sepia</option>
                <option value="bw">Black & White</option>
                <option value="faded">Faded Film</option>
                <option value="grain">Grain</option>
                <option value="classic">Classic Film</option>
              </select>
            </label>
            <div className="buttons">
              <button onClick={startCapture} disabled={isCapturing || photos.length>0}>Take Strip</button>
              <button onClick={retake}>Retake</button>
              <button className={`sound-toggle ${soundOn? 'on':'off'}`} onClick={()=>setSoundOn(s=>!s)} aria-pressed={soundOn}>{soundOn? '🔊':'🔈'}</button>
            </div>
          </div>
        </div>
      </div>

      <aside className="strip-area">
        <PhotoStrip images={photos} filter={filter} />
      </aside>
    </div>
  )
}
