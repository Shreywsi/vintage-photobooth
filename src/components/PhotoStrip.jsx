import React, { useRef, useEffect, useState } from 'react'

export default function PhotoStrip({ images = [], filter = 'none' }){
  const canvasRef = useRef(null)
  const [dataUrl, setDataUrl] = useState(null)

  useEffect(()=>{
    if(images.length === 0) { setDataUrl(null); return }
    const imgs = []
    let loaded = 0
    images.forEach((d, i)=>{
      const im = new Image()
      im.onload = ()=>{
        imgs[i] = im
        loaded++
        if(loaded === images.length) renderStrip(imgs)
      }
      im.src = d
    })
    async function renderStrip(imgs){
      const w = 600
      const h = Math.round((w / imgs[0].width) * imgs[0].height)
      const spacing = 20
      const top = 30
      const totalH = top + imgs.length * (h + spacing) + 20
      const canvas = canvasRef.current
      canvas.width = w
      canvas.height = totalH
      const ctx = canvas.getContext('2d')
      // background
      ctx.fillStyle = '#f7efe2'
      ctx.fillRect(0,0,canvas.width,canvas.height)
      // decorative top
      ctx.fillStyle = '#efe1d0'
      ctx.fillRect(10,10,canvas.width-20,top-10)

      for(let i=0;i<imgs.length;i++){
        const y = top + i*(h+spacing)
        // film border
        ctx.fillStyle = '#222'
        ctx.fillRect(30,y-6,w-60,h+12)
        // image
        ctx.save()
        if(filter === 'sepia') ctx.filter = 'sepia(0.9) contrast(1.05)'
        else if(filter === 'bw') ctx.filter = 'grayscale(1) contrast(1.05)'
        else if(filter === 'faded') ctx.filter = 'saturate(0.85) contrast(0.95) brightness(1.02)'
        else if(filter === 'grain') ctx.filter = 'contrast(1.02)'
        else if(filter === 'classic') ctx.filter = 'sepia(0.95) contrast(1.2) saturate(0.9)'
        else ctx.filter = 'none'
        ctx.drawImage(imgs[i], 40, y, w-80, h)
        // classic overlay per photo
        if(filter === 'classic'){
          // vignette for each cell
          ctx.globalCompositeOperation = 'multiply'
          const vg = ctx.createRadialGradient(w/2, y + h/2, Math.min(w,h)*0.15, w/2, y + h/2, Math.max(w,h)*0.6)
          vg.addColorStop(0, 'rgba(0,0,0,0)')
          vg.addColorStop(1, 'rgba(0,0,0,0.45)')
          ctx.fillStyle = vg
          ctx.fillRect(40, y, w-80, h)
          ctx.globalCompositeOperation = 'source-over'
          // light scratches
          ctx.globalAlpha = 0.08
          ctx.strokeStyle = '#fff'
          for(let s=0;s<10;s++){
            ctx.beginPath()
            const yy = y + Math.random()*h
            ctx.moveTo(40, yy)
            ctx.quadraticCurveTo(w/2, yy + (Math.random()-0.5)*40, w-40, yy + (Math.random()-0.5)*10)
            ctx.stroke()
          }
          ctx.globalAlpha = 1
        }
        ctx.restore()
      }
      // add perforations on left and right edges
      const holeW = 8
      const holeH = 14
      const holeGap = 18
      ctx.fillStyle = '#efe6da'
      for(let i=0;i<Math.floor((totalH - top)/holeGap); i++){
        const yy = top + 10 + i*holeGap
        // left
        ctx.fillRect(12, yy, holeW, holeH)
        // right
        ctx.fillRect(w - 12 - holeW, yy, holeW, holeH)
      }
      // footer text
      ctx.fillStyle = '#6b4a3d'
      ctx.font = '18px "Playfair Display", serif'
      ctx.fillText('vintage-photobooth', 40, canvas.height - 10)

      setDataUrl(canvas.toDataURL('image/png'))
    }
  },[images,filter])

  const download = ()=>{
    if(!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'photostrip.png'
    a.click()
  }

  return (
    <div className="photostrip">
      <div className="strip-preview">
        {images.length === 0 ? <div className="placeholder">No strip yet — take photos!</div> : <canvas ref={canvasRef} className="strip-canvas" />}
      </div>
      <div className="strip-actions">
        <button onClick={download} disabled={!dataUrl}>Download Strip</button>
      </div>
    </div>
  )
}
