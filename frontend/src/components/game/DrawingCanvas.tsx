import { useEffect } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { DrawingPoint, DrawingStroke } from './GameTypes'
import { socket } from '../../lib/socket'

type DrawingCanvasProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  drawingTool: 'pencil' | 'eraser'
  drawingColor: string
  brushSize: number
  canvasBackground: string
  canDraw?: boolean
  activeStrokeRef: React.MutableRefObject<DrawingStroke | null>
  isDrawingRef: React.MutableRefObject<boolean>
  onStrokeFinished: (stroke: DrawingStroke) => void
}

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: DrawingStroke,
) {
  if (!stroke.points.length) return

  context.save()
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = stroke.width

  if (stroke.tool === 'eraser') {
    context.globalCompositeOperation = 'destination-out'
  } else {
    context.globalCompositeOperation = 'source-over'
    context.strokeStyle = stroke.color
    context.fillStyle = stroke.color
  }

  const first = stroke.points[0]

  if (stroke.points.length === 1) {
    context.beginPath()
    context.arc(first.x, first.y, stroke.width / 2, 0, Math.PI * 2)
    context.fill()
  } else {
    context.beginPath()
    context.moveTo(first.x, first.y)

    for (let i = 1; i < stroke.points.length; i += 1) {
      const previous = stroke.points[i - 1]
      const current = stroke.points[i]

      context.quadraticCurveTo(
        previous.x,
        previous.y,
        (previous.x + current.x) / 2,
        (previous.y + current.y) / 2,
      )
    }

    const last = stroke.points[stroke.points.length - 1]
    context.lineTo(last.x, last.y)
    context.stroke()
  }

  context.restore()
}

export function redrawDrawingCanvas(
  canvas: HTMLCanvasElement | null,
  strokes: DrawingStroke[],
  activeStroke: DrawingStroke | null,
  backgroundColor: string,
) {
  if (!canvas) return

  const context = canvas.getContext('2d')
  if (!context) return

  const rect = canvas.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const ratio = window.devicePixelRatio || 1
  const width = Math.round(rect.width * ratio)
  const height = Math.round(rect.height * ratio)

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)
  context.fillStyle = backgroundColor
  context.fillRect(0, 0, rect.width, rect.height)

  strokes.forEach((stroke) => drawStroke(context, stroke))
  if (activeStroke) drawStroke(context, activeStroke)
}

export default function DrawingCanvas({
  canvasRef,
  drawingTool,
  drawingColor,
  brushSize,
  canDraw = true,
  activeStrokeRef,
  isDrawingRef,
  onStrokeFinished,
}: DrawingCanvasProps) {
  useEffect(() => {
    if (!canDraw) {
      activeStrokeRef.current = null
      isDrawingRef.current = false
    }
  }, [canDraw, activeStrokeRef, isDrawingRef])

  const getPoint = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ): DrawingPoint => {
    const rect = event.currentTarget.getBoundingClientRect()

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!canDraw || !socket.connected) return
    if (event.button !== 0 && event.pointerType === 'mouse') return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    const point = getPoint(event)

    const stroke: DrawingStroke = {
      color: drawingColor,
      width: brushSize,
      tool: drawingTool,
      points: [point],
    }

    activeStrokeRef.current = stroke
    isDrawingRef.current = true

    const context = canvasRef.current?.getContext('2d')
    if (!context) return

    const ratio = window.devicePixelRatio || 1
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    drawStroke(context, stroke)

    socket.emit('draw_start', {
      x: point.x,
      y: point.y,
      color: drawingColor,
      size: brushSize,
      tool: drawingTool,
    })
  }

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!canDraw || !isDrawingRef.current || !activeStrokeRef.current) {
      return
    }

    event.preventDefault()

    const stroke = activeStrokeRef.current
    const previous = stroke.points[stroke.points.length - 1]
    const current = getPoint(event)

    stroke.points.push(current)

    const context = canvasRef.current?.getContext('2d')
    if (context) {
      const ratio = window.devicePixelRatio || 1
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.save()
      context.beginPath()
      context.moveTo(previous.x, previous.y)
      context.lineTo(current.x, current.y)
      context.lineWidth = stroke.width
      context.lineCap = 'round'
      context.lineJoin = 'round'

      if (stroke.tool === 'eraser') {
        context.globalCompositeOperation = 'destination-out'
      } else {
        context.globalCompositeOperation = 'source-over'
        context.strokeStyle = stroke.color
      }

      context.stroke()
      context.restore()
    }

    socket.emit('draw_move', {
      x: current.x,
      y: current.y,
      color: stroke.color,
      size: stroke.width,
      tool: stroke.tool,
    })
  }

  const finishDrawing = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawingRef.current || !activeStrokeRef.current) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const finishedStroke = activeStrokeRef.current

    activeStrokeRef.current = null
    isDrawingRef.current = false

    if (canDraw) {
      socket.emit('draw_end', {
        color: finishedStroke.color,
        size: finishedStroke.width,
        tool: finishedStroke.tool,
      })

      onStrokeFinished(finishedStroke)
    }
  }

  return (
    <section className="drawing-area" aria-label="Drawing canvas">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        aria-label={canDraw ? 'Game drawing canvas' : 'View drawing canvas'}
        aria-disabled={!canDraw}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
      />

      <div className="drawing-reactions">
        <button type="button" aria-label="Like drawing">
          👍
        </button>
        <button type="button" aria-label="Dislike drawing">
          👎
        </button>
      </div>
    </section>
  )
}