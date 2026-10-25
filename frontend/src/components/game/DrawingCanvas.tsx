
import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { DrawingPoint, DrawingStroke } from './GameTypes'
import { socket } from '../../lib/socket'

type DrawingCanvasProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  drawingTool: 'pencil' | 'eraser'
  drawingColor: string
  brushSize: number
  roomCode: string
  canDraw?: boolean
  activeStrokeRef: React.MutableRefObject<DrawingStroke | null>
  isDrawingRef: React.MutableRefObject<boolean>
  onStrokeFinished: (stroke: DrawingStroke, strokeId: string) => void
}

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  canvasWidth: number,
  canvasHeight: number,
) {
  if (stroke.points.length === 0) return

  const toCanvasPoint = (point: DrawingPoint) => ({
    x: point.x * canvasWidth,
    y: point.y * canvasHeight,
  })

  context.save()
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = stroke.width
  context.globalCompositeOperation =
    stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
  context.strokeStyle = stroke.color
  context.fillStyle = stroke.color

  const first = toCanvasPoint(stroke.points[0])

  if (stroke.points.length === 1) {
    context.beginPath()
    context.arc(first.x, first.y, stroke.width / 2, 0, Math.PI * 2)
    context.fill()
  } else {
    context.beginPath()
    context.moveTo(first.x, first.y)

    for (let i = 1; i < stroke.points.length; i += 1) {
      const previous = toCanvasPoint(stroke.points[i - 1])
      const current = toCanvasPoint(stroke.points[i])

      context.quadraticCurveTo(
        previous.x,
        previous.y,
        (previous.x + current.x) / 2,
        (previous.y + current.y) / 2,
      )
    }

    const last = toCanvasPoint(stroke.points[stroke.points.length - 1])
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
  const pixelWidth = Math.round(rect.width * ratio)
  const pixelHeight = Math.round(rect.height * ratio)

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
  }

  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.globalCompositeOperation = 'source-over'
  context.clearRect(0, 0, rect.width, rect.height)

  context.fillStyle = backgroundColor
  context.fillRect(0, 0, rect.width, rect.height)

  strokes.forEach((stroke) =>
    drawStroke(context, stroke, rect.width, rect.height),
  )

  if (activeStroke) {
    drawStroke(context, activeStroke, rect.width, rect.height)
  }
}

export default function DrawingCanvas({
  canvasRef,
  drawingTool,
  drawingColor,
  brushSize,
  roomCode,
  canDraw = true,
  activeStrokeRef,
  isDrawingRef,
  onStrokeFinished,
}: DrawingCanvasProps) {
  const activePointerIdRef = useRef<number | null>(null)
  const activeStrokeIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (canDraw || !activeStrokeRef.current) return

    const stroke = activeStrokeRef.current
    const strokeId = activeStrokeIdRef.current
    const canvas = canvasRef.current
    const pointerId = activePointerIdRef.current

    activeStrokeRef.current = null
    isDrawingRef.current = false
    activePointerIdRef.current = null
    activeStrokeIdRef.current = null

    if (canvas && pointerId !== null && canvas.hasPointerCapture(pointerId)) {
      canvas.releasePointerCapture(pointerId)
    }

    if (stroke && strokeId) {
      onStrokeFinished(stroke, strokeId)
    }
  }, [
    canDraw,
    canvasRef,
    activeStrokeRef,
    isDrawingRef,
    onStrokeFinished,
  ])

  const getPoint = (
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
  ): DrawingPoint => {
    const rect = canvas.getBoundingClientRect()

    return {
      x: rect.width
        ? Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
        : 0,
      y: rect.height
        ? Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
        : 0,
    }
  }

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!canDraw) {
      return
    }

    if (!socket.connected || isDrawingRef.current || !event.isPrimary) {
      return
    }

    if (event.pointerType !== 'touch' && event.button !== 0) {
      console.warn('[DRAW BLOCKED] Non-primary pointer button:', {
        pointerType: event.pointerType,
        button: event.button,
      })
      return
    }

    const canvas = event.currentTarget
    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    event.preventDefault()

    try {
      canvas.setPointerCapture(event.pointerId)
    } catch (error) {
      console.warn(
        '[DRAW] Could not capture pointer; drawing will end at the canvas boundary.',
        error,
      )
    }

    activePointerIdRef.current = event.pointerId
    activeStrokeIdRef.current = window.crypto.randomUUID()
    const rect = canvas.getBoundingClientRect()
    const point = getPoint(event.clientX, event.clientY, canvas)

    const stroke: DrawingStroke = {
      color: drawingColor,
      width: brushSize,
      tool: drawingTool,
      points: [point],
    }

    activeStrokeRef.current = stroke
    isDrawingRef.current = true

    const ratio = window.devicePixelRatio || 1
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    drawStroke(context, stroke, rect.width, rect.height)

    socket.emit('draw_start', {
      strokeId: activeStrokeIdRef.current,
      roomCode,
      x: point.x,
      y: point.y,
      color: stroke.color,
      size: stroke.width,
      tool: stroke.tool,
    })
  }

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const stroke = activeStrokeRef.current

    if (
      !canDraw ||
      !isDrawingRef.current ||
      !stroke ||
      activePointerIdRef.current !== event.pointerId
    ) {
      return
    }

    event.preventDefault()

    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    const context = canvas.getContext('2d')
    const coalescedEvents =
      event.nativeEvent.getCoalescedEvents?.() ?? []
    const pointerEvents = coalescedEvents.length
      ? coalescedEvents
      : [event.nativeEvent]

    for (const pointerEvent of pointerEvents) {
      if (stroke.points.length >= 10000) break

      const current = getPoint(
        pointerEvent.clientX,
        pointerEvent.clientY,
        canvas,
      )
      const previous = stroke.points[stroke.points.length - 1]
      stroke.points.push(current)

      if (context) {
        const ratio = window.devicePixelRatio || 1
        context.setTransform(ratio, 0, 0, ratio, 0, 0)
        context.save()
        context.beginPath()
        context.moveTo(previous.x * rect.width, previous.y * rect.height)
        context.lineTo(current.x * rect.width, current.y * rect.height)
        context.lineWidth = stroke.width
        context.lineCap = 'round'
        context.lineJoin = 'round'
        context.globalCompositeOperation =
          stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
        context.strokeStyle = stroke.color
        context.stroke()
        context.restore()
      }

      if (socket.connected) {
        socket.emit('draw_move', {
          strokeId: activeStrokeIdRef.current,
          roomCode,
          x: current.x,
          y: current.y,
          color: stroke.color,
          size: stroke.width,
          tool: stroke.tool,
        })
      }
    }
  }

  const finishDrawing = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas = event.currentTarget
    const stroke = activeStrokeRef.current
    const strokeId = activeStrokeIdRef.current

    if (
      !isDrawingRef.current ||
      !stroke ||
      !strokeId ||
      activePointerIdRef.current !== event.pointerId
    ) {
      return
    }

    activeStrokeRef.current = null
    isDrawingRef.current = false
    activePointerIdRef.current = null
    activeStrokeIdRef.current = null

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }

    onStrokeFinished(stroke, strokeId)
  }

  const handlePointerLeave = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      finishDrawing(event)
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
        onPointerLeave={handlePointerLeave}
        onLostPointerCapture={finishDrawing}
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
