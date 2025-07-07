"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Trash2, Save, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { DroneSequence, DronePoint } from "@/app/page"

interface DrawingCanvasProps {
  sequence?: DroneSequence
  onSequenceUpdate: (updates: Partial<DroneSequence>) => void
  onNewSequence: (sequence: DroneSequence) => void
  currentColor: string
  currentRgb: { r: number; g: number; b: number }
  previewSequence?: DroneSequence | null
  onClearPreview?: () => void
}

export function DrawingCanvas({
  sequence,
  onSequenceUpdate,
  onNewSequence,
  currentColor,
  currentRgb,
  previewSequence,
  onClearPreview,
}: DrawingCanvasProps) {
  const { toast } = useToast()
  const birdEyeCanvasRef = useRef<HTMLCanvasElement>(null)
  const frontViewCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentAltitude, setCurrentAltitude] = useState(20)
  const [sequenceName, setSequenceName] = useState("New Sequence")
  const [showWaypoints, setShowWaypoints] = useState(true)
  const [unsavedPoints, setUnsavedPoints] = useState<DronePoint[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const canvasWidth = 400
  const canvasHeight = 300

  useEffect(() => {
    if (sequence) {
      setUnsavedPoints([...sequence.points])
      setSequenceName(sequence.name)
      setHasUnsavedChanges(false)
    } else {
      setUnsavedPoints([])
      setHasUnsavedChanges(false)
    }
  }, [sequence])

  // Handle preview sequence
  useEffect(() => {
    if (previewSequence) {
      setUnsavedPoints([...previewSequence.points])
      setSequenceName(previewSequence.name)
      setHasUnsavedChanges(true)
    }
  }, [previewSequence])

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, isFrontView = false) => {
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1

    // Draw grid lines
    for (let x = 0; x <= width; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y <= height; y += 20) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw center lines
    ctx.strokeStyle = "#9ca3af"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, height)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()

    // Draw altitude reference lines for front view
    if (isFrontView) {
      ctx.strokeStyle = "#fbbf24"
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])

      // Draw altitude lines every 10m (every 30 pixels)
      for (let alt = 10; alt <= 100; alt += 10) {
        const y = height - alt * 3 // 3 pixels per meter
        if (y > 0) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(width, y)
          ctx.stroke()

          // Label altitude
          ctx.fillStyle = "#f59e0b"
          ctx.font = "10px sans-serif"
          ctx.fillText(`${alt}m`, 5, y - 2)
        }
      }
      ctx.setLineDash([])
    }

    // Labels
    ctx.fillStyle = "#6b7280"
    ctx.font = "12px sans-serif"

    if (isFrontView) {
      ctx.fillText("Front View (X-Z)", 10, 20)
      ctx.fillText("Left", 10, height - 10)
      ctx.fillText("Right", width - 35, height - 10)
      ctx.fillText("Up", width - 20, 15)
    } else {
      ctx.fillText("Bird's Eye View (X-Y)", 10, 20)
      ctx.fillText("West", 10, height - 10)
      ctx.fillText("East", width - 25, height - 10)
      ctx.fillText("North", width - 30, 15)
      ctx.fillText("South", 10, height / 2 + 15)
    }
  }, [])

  const drawWaypoints = useCallback(
    (ctx: CanvasRenderingContext2D, points: DronePoint[], isFrontView = false) => {
      if (!showWaypoints || !points.length) return

      // Determine if this is a preview (check for preview ID)
      const isPreview = previewSequence && points === unsavedPoints

      // Draw path lines
      ctx.strokeStyle = isPreview ? "#8b5cf6" : hasUnsavedChanges ? "#f59e0b" : "#3b82f6"
      ctx.lineWidth = isPreview ? 3 : hasUnsavedChanges ? 3 : 2
      ctx.setLineDash(isPreview ? [10, 5] : hasUnsavedChanges ? [5, 5] : [])
      ctx.beginPath()

      points.forEach((point, index) => {
        const x = point.x
        const y = isFrontView ? canvasHeight - point.z * 3 : point.y // Front view uses altitude

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()
      ctx.setLineDash([])

      // Draw waypoint markers
      points.forEach((point, index) => {
        const x = point.x
        const y = isFrontView ? canvasHeight - point.z * 3 : point.y

        // Waypoint circle
        ctx.fillStyle = point.color
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, 2 * Math.PI)
        ctx.fill()

        // Border - purple if preview, orange if unsaved, white if saved
        ctx.strokeStyle = isPreview ? "#8b5cf6" : hasUnsavedChanges ? "#f59e0b" : "#ffffff"
        ctx.lineWidth = 2
        ctx.stroke()

        // Waypoint number
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText((index + 1).toString(), x, y + 3)

        // Altitude label for bird's eye view
        if (!isFrontView) {
          ctx.fillStyle = "#374151"
          ctx.font = "9px sans-serif"
          ctx.fillText(`${point.z}m`, x, y - 12)
        }
      })

      ctx.textAlign = "start"
    },
    [showWaypoints, canvasHeight, hasUnsavedChanges, previewSequence, unsavedPoints],
  )

  const redrawCanvas = useCallback(() => {
    const birdEyeCanvas = birdEyeCanvasRef.current
    const frontViewCanvas = frontViewCanvasRef.current

    if (!birdEyeCanvas || !frontViewCanvas) return

    const birdEyeCtx = birdEyeCanvas.getContext("2d")
    const frontViewCtx = frontViewCanvas.getContext("2d")

    if (!birdEyeCtx || !frontViewCtx) return

    // Clear canvases
    birdEyeCtx.clearRect(0, 0, canvasWidth, canvasHeight)
    frontViewCtx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Draw grids
    drawGrid(birdEyeCtx, canvasWidth, canvasHeight, false)
    drawGrid(frontViewCtx, canvasWidth, canvasHeight, true)

    // Draw waypoints (use unsaved points if available, otherwise sequence points)
    const pointsToShow = unsavedPoints.length > 0 ? unsavedPoints : sequence?.points || []
    if (pointsToShow.length > 0) {
      drawWaypoints(birdEyeCtx, pointsToShow, false)
      drawWaypoints(frontViewCtx, pointsToShow, true)
    }
  }, [unsavedPoints, sequence?.points, drawGrid, drawWaypoints])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>, isFrontView = false) => {
    // If we're showing a preview, clear it first
    if (previewSequence) {
      onClearPreview?.()
    }

    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()

    // Get the actual canvas dimensions
    const canvasActualWidth = canvas.width
    const canvasActualHeight = canvas.height

    // Get the displayed canvas dimensions (after CSS scaling)
    const canvasDisplayWidth = rect.width
    const canvasDisplayHeight = rect.height

    // Calculate scale factors
    const scaleX = canvasActualWidth / canvasDisplayWidth
    const scaleY = canvasActualHeight / canvasDisplayHeight

    // Get mouse position relative to canvas and scale to actual canvas coordinates
    const rawX = e.clientX - rect.left
    const rawY = e.clientY - rect.top

    // Apply scaling to get precise canvas coordinates
    const x = rawX * scaleX
    const y = rawY * scaleY

    const newPoint: DronePoint = {
      x: x,
      y: isFrontView ? canvasHeight / 2 : y, // Front view fixes Y at center
      z: isFrontView ? Math.max(0, (canvasHeight - y) / 3) : currentAltitude, // Front view uses Y for altitude
      color: currentColor,
      rgb: currentRgb,
      brightness: 0.8,
      timestamp: Date.now(),
      speed: 5,
      transitionDuration: 500,
    }

    setUnsavedPoints((prev) => [...prev, newPoint])
    setHasUnsavedChanges(true)
  }

  const clearCanvas = () => {
    setUnsavedPoints([])
    setHasUnsavedChanges(false)
    onClearPreview?.()
    toast({
      title: "Canvas Cleared",
      description: "All waypoints have been removed",
    })
  }

  const saveSequence = () => {
    if (unsavedPoints.length === 0) {
      toast({
        title: "No Points to Save",
        description: "Add some waypoints before saving",
        variant: "destructive",
      })
      return
    }

    const newSequence: DroneSequence = {
      id: sequence?.id || Date.now().toString(),
      name: sequenceName,
      points: [...unsavedPoints],
      duration: unsavedPoints.length > 0 ? Math.max(...unsavedPoints.map((p) => p.timestamp)) + 1000 : 0,
    }

    if (sequence) {
      onSequenceUpdate(newSequence)
      toast({
        title: "Sequence Updated",
        description: `"${sequenceName}" has been saved with ${unsavedPoints.length} waypoints`,
      })
    } else {
      onNewSequence(newSequence)
      toast({
        title: "New Sequence Created",
        description: `"${sequenceName}" has been saved with ${unsavedPoints.length} waypoints`,
      })
    }

    setHasUnsavedChanges(false)
    onClearPreview?.()
  }

  const createNewSequence = () => {
    setUnsavedPoints([])
    setSequenceName("New Sequence")
    setHasUnsavedChanges(false)
    onClearPreview?.()
    toast({
      title: "New Sequence Started",
      description: "Ready to create a new flight path",
    })
  }

  const handleSequenceNameChange = (name: string) => {
    setSequenceName(name)
    if (sequence && name !== sequence.name) {
      setHasUnsavedChanges(true)
    }
  }

  const isPreviewMode = previewSequence !== null && previewSequence !== undefined

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Label htmlFor="sequence-name">Sequence Name:</Label>
          <Input
            id="sequence-name"
            value={sequenceName}
            onChange={(e) => handleSequenceNameChange(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="altitude">Altitude (m):</Label>
          <Slider
            id="altitude"
            min={1}
            max={100}
            step={1}
            value={[currentAltitude]}
            onValueChange={(value) => setCurrentAltitude(value[0])}
            className="w-32"
          />
          <span className="text-sm font-medium w-8">{currentAltitude}</span>
        </div>

        <Button variant="outline" size="sm" onClick={() => setShowWaypoints(!showWaypoints)}>
          <Eye className="w-4 h-4 mr-2" />
          {showWaypoints ? "Hide" : "Show"} Points
        </Button>

        <Button variant="outline" size="sm" onClick={createNewSequence}>
          <Plus className="w-4 h-4 mr-2" />
          New
        </Button>

        <Button variant="destructive" size="sm" onClick={clearCanvas}>
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>

        <Button
          onClick={saveSequence}
          size="sm"
          disabled={!hasUnsavedChanges && unsavedPoints.length === 0}
          className={hasUnsavedChanges || isPreviewMode ? "bg-orange-600 hover:bg-orange-700" : ""}
        >
          <Save className="w-4 h-4 mr-2" />
          {isPreviewMode ? "Save Preview" : hasUnsavedChanges ? "Save Changes" : "Save Sequence"}
        </Button>
      </div>

      {(hasUnsavedChanges || isPreviewMode) && (
        <div
          className={`border rounded-lg p-3 ${isPreviewMode ? "bg-purple-50 border-purple-200" : "bg-orange-50 border-orange-200"}`}
        >
          <p className={`text-sm ${isPreviewMode ? "text-purple-800" : "text-orange-800"}`}>
            <strong>{isPreviewMode ? "Preview Mode:" : "Unsaved Changes:"}</strong>{" "}
            {isPreviewMode
              ? `Previewing ${unsavedPoints.length} waypoints from quick action. Click Save to keep it.`
              : `You have ${unsavedPoints.length} waypoints that haven't been saved yet.`}
          </p>
        </div>
      )}

      {/* Side-by-Side Canvas Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bird's Eye View - Left */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bird's Eye View</CardTitle>
            <CardDescription>Top-down view for horizontal path planning</CardDescription>
          </CardHeader>
          <CardContent>
            <canvas
              ref={birdEyeCanvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="border border-gray-300 rounded cursor-crosshair bg-white w-full"
              onClick={(e) => handleCanvasClick(e, false)}
            />
            <p className="text-xs text-gray-500 mt-2">Click to add waypoints. Altitude: {currentAltitude}m</p>
          </CardContent>
        </Card>

        {/* Front View - Right */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Front View</CardTitle>
            <CardDescription>Side profile for altitude planning</CardDescription>
          </CardHeader>
          <CardContent>
            <canvas
              ref={frontViewCanvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="border border-gray-300 rounded cursor-crosshair bg-white w-full"
              onClick={(e) => handleCanvasClick(e, true)}
            />
            <p className="text-xs text-gray-500 mt-2">Click to add waypoints with altitude control</p>
          </CardContent>
        </Card>
      </div>

      {/* Sequence Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sequence Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Waypoints:</span> {unsavedPoints.length}
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <span
                className={
                  isPreviewMode
                    ? "text-purple-600 ml-1"
                    : hasUnsavedChanges
                      ? "text-orange-600 ml-1"
                      : "text-green-600 ml-1"
                }
              >
                {isPreviewMode ? "Preview" : hasUnsavedChanges ? "Unsaved" : "Saved"}
              </span>
            </div>
            <div>
              <span className="font-medium">Max Altitude:</span>{" "}
              {unsavedPoints.length > 0 ? Math.max(...unsavedPoints.map((p) => p.z)).toFixed(1) : 0}m
            </div>
            <div>
              <span className="font-medium">Colors:</span> {new Set(unsavedPoints.map((p) => p.color)).size}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
