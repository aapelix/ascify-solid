import { createEffect, createSignal, onCleanup } from 'solid-js'

const CHARSET = '@#&$%*+=-:. '

type Src = string | MediaStream

interface AsciifierProps {
  src: Src
  class?: string
  width?: number
  transparentBg?: boolean
}

export function imageToAscii(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  transparentBg = false,
) {
  const imgData = ctx.getImageData(0, 0, w, h).data
  const ascii: string[] = []

  for (let y = 0; y < h; y++) {
    let row = ''
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const alpha = imgData[i + 3] ?? 255
      if (transparentBg && alpha < 50) {
        row += ' '
      } else {
        const r = imgData[i] ?? 0
        const g = imgData[i + 1] ?? 0
        const b = imgData[i + 2] ?? 0
        const avg = (r + g + b) / 3
        const char = CHARSET[Math.floor((avg / 255) * (CHARSET.length - 1))]
        row += char
      }
    }
    ascii.push(row)
  }

  return ascii.join('\n')
}

export function Asciifier(props: AsciifierProps) {
  const [ascii, setAscii] = createSignal('')
  let videoRef: HTMLVideoElement | undefined
  let imgRef: HTMLImageElement | undefined
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  let animationFrameId: number

  function renderFrame() {
    const w = canvas.width
    const h = canvas.height

    if (videoRef && videoRef.readyState === 4) {
      ctx.drawImage(videoRef, 0, 0, w, h)
      const asciiFrame = imageToAscii(ctx, w, h)
      setAscii(asciiFrame)
    } else if (imgRef && imgRef.complete) {
      ctx.drawImage(imgRef, 0, 0, w, h)
      const asciiFrame = imageToAscii(ctx, w, h, props.transparentBg)
      setAscii(asciiFrame)
    }

    animationFrameId = requestAnimationFrame(renderFrame)
  }

  createEffect(() => {
    if (!props.src) return

    if (props.src instanceof MediaStream) {
      videoRef!.srcObject = props.src
      videoRef?.play()

      videoRef!.onloadedmetadata = () => {
        const scale = (props.width ?? 80) / videoRef!.videoWidth
        canvas.width = props.width ?? 80
        canvas.height = videoRef!.videoHeight * scale
      }

      renderFrame()
    } else if (typeof props.src === 'string') {
      const isVideo = /\.(mp4|webm|ogg)$/i.test(props.src)
      if (isVideo) {
        if (!videoRef) return
        videoRef.src = props.src
        videoRef.play()

        videoRef.onloadedmetadata = () => {
          const scale = (props.width ?? 80) / videoRef!.videoWidth
          canvas.width = props.width ?? 80
          canvas.height = videoRef!.videoHeight * scale
        }

        renderFrame()
      } else {
        if (!imgRef) return

        imgRef.src = props.src

        imgRef.onload = () => {
          const scale = (props.width ?? 80) / imgRef!.naturalWidth
          canvas.width = props.width ?? 80
          canvas.height = imgRef!.naturalHeight * scale
          renderFrame()
        }
      }
    }
  })

  onCleanup(() => {
    cancelAnimationFrame(animationFrameId)
    if (videoRef && videoRef.srcObject instanceof MediaStream) {
      videoRef.srcObject.getTracks().forEach(t => t.stop())
    }
  })

  return (
    <>
      <video ref={el => (videoRef = el)} style={{ display: 'none' }} muted playsinline />
      <img ref={el => (imgRef = el)} style={{ display: 'none' }} />
      <pre
        style={{
          'font-family': 'monospace',
          'font-size': '0.75rem',
          'line-height': '0.6',
          'white-space': 'pre',
        }}
        class={props.class}
      >
        {ascii()}
      </pre>
    </>
  )
}
