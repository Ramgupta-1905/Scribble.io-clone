import type { PointerEvent as ReactPointerEvent } from 'react'
import type { DrawingPoint, DrawingStroke } from './gameTypes'

type DrawingCanvasProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  drawingTool: 'pencil' | 'eraser'
  drawingColor: string
  brushSize: number
  canvasBackground: string
  activeStrokeRef: React.MutableRefObject<DrawingStroke | null>
  isDrawingRef: React.MutableRefObject<boolean>
  onStrokeFinished: (stroke: DrawingStroke) => void
}

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  backgroundColor = '#ffffff',
) {
  if (stroke.points.length === 0) return

  context.save()
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = stroke.width
  context.strokeStyle = stroke.tool === 'eraser' ? backgroundColor : stroke.color
  context.fillStyle = stroke.tool === 'eraser' ? backgroundColor : stroke.color

  const first = stroke.points[0]
  if (stroke.points.length === 1) {
    context.beginPath()
    context.arc(first.x, first.y, stroke.width / 2, 0, Math.PI * 2)
    context.fill()
  } else {
    context.beginPath()
    context.moveTo(first.x, first.y)
    for (let i = 1; i < stroke.points.length; i += 1) {
      context.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
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
  strokes.forEach((stroke) => drawStroke(context, stroke, backgroundColor))
  if (activeStroke) drawStroke(context, activeStroke, backgroundColor)
}

export default function DrawingCanvas({
  canvasRef,
  drawingTool,
  drawingColor,
  brushSize,
  canvasBackground,
  activeStrokeRef,
  isDrawingRef,
  onStrokeFinished,
}: DrawingCanvasProps) {
  const getPoint = (event: ReactPointerEvent<HTMLCanvasElement>): DrawingPoint => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    const stroke: DrawingStroke = {
      color: drawingColor,
      width: brushSize,
      tool: drawingTool,
      points: [getPoint(event)],
    }
    activeStrokeRef.current = stroke
    isDrawingRef.current = true

    const context = canvasRef.current?.getContext('2d')
    if (context) {
      const ratio = window.devicePixelRatio || 1
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      drawStroke(context, stroke, canvasBackground)
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !activeStrokeRef.current) return
    event.preventDefault()

    const point = getPoint(event)
    const stroke = activeStrokeRef.current
    const previous = stroke.points[stroke.points.length - 1]
    stroke.points.push(point)

    const context = canvasRef.current?.getContext('2d')
    if (!context) return
    const ratio = window.devicePixelRatio || 1
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.beginPath()
    context.moveTo(previous.x, previous.y)
    context.lineTo(point.x, point.y)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = stroke.width
    context.strokeStyle = stroke.tool === 'eraser' ? canvasBackground : stroke.color
    context.stroke()
  }

  const finishDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !activeStrokeRef.current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const finishedStroke = activeStrokeRef.current
    activeStrokeRef.current = null
    isDrawingRef.current = false
    onStrokeFinished(finishedStroke)
  }

  return (
    <section className="drawing-area" aria-label="Drawing canvas">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        aria-label="Game drawing canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
      />
      <div className="drawing-reactions">
        <button type="button" aria-label="Like drawing">👍</button>
        <button type="button" aria-label="Dislike drawing">👎</button>
      </div>
    </section>
  )
}
