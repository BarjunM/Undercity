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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

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
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [newRouteName, setNewRouteName] = useState("")

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
      ctx.strokeStyle = "#a3a3a3"; // Slightly darker gray for dotted lines
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Draw altitude lines every 10m (every 30 pixels)
      for (let alt = 10; alt <= 100; alt += 10) {
        const y = height - alt * 3; // 3 pixels per meter
        if (y > 0) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();

          // Label altitude (left-aligned, all dark grey)
          ctx.fillStyle = "#374151"; // Tailwind gray-700 for all text
          ctx.font = "10px monospace";
          ctx.textAlign = "left";
          ctx.fillText(`${alt} m`, 8, y - 2);
        }
      }
      ctx.setLineDash([]);
      ctx.textAlign = "start";
    }

    // Labels
    ctx.fillStyle = "#6b7280"
    ctx.font = "12px sans-serif"

    if (isFrontView) {
      ctx.fillText("Right", width - 35, height - 10)
      ctx.fillText("Up", width - 20, 15)
    } // Cardinal direction labels for bird's eye view have been removed
  }, [])

  const drawWaypoints = useCallback(
    (ctx: CanvasRenderingContext2D, points: DronePoint[], isFrontView = false) => {
      if (!showWaypoints || !points.length) return

      // Determine if this is a preview (check for preview ID)
      const isPreview = previewSequence && points === unsavedPoints

      // Draw path lines
      // Black lines for normal mode (not preview, not unsaved changes)
      ctx.strokeStyle = isPreview
        ? "#8b5cf6"
        : hasUnsavedChanges
        ? "#fb923c" // Orange-500 for unsaved modifications (matches button)
        : "#000000" // Black for normal mode
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

        // Only draw border if preview or unsaved changes
        if (isPreview || hasUnsavedChanges) {
          ctx.strokeStyle = isPreview ? "#8b5cf6" : hasUnsavedChanges ? "#fb923c" : "#ffffff"
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Waypoint number
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText((index + 1).toString(), x, y + 3)

        // Altitude label for bird's eye view and front view (only last point)
        if (!isFrontView && index === points.length - 1) {
          ctx.fillStyle = "#000000" // Black for last waypoint altitude
          ctx.font = "9px sans-serif"
          ctx.fillText(`${Math.round(point.z)}m`, x, y - 12)
        }
        if (isFrontView && index === points.length - 1) {
          ctx.fillStyle = "#000000" // Black for last waypoint altitude
          ctx.font = "9px sans-serif"
          ctx.fillText(`${Math.round(point.z)}m`, x + 18, y + 4)
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

    // Assign timestamp based on order, not Date.now()
    const interval = 1000 // ms between waypoints
    const nextIndex = unsavedPoints.length
    const newTimestamp = nextIndex * interval

    const newPoint: DronePoint = {
      x: x,
      y: isFrontView ? canvasHeight / 2 : y, // Front view fixes Y at center
      z: isFrontView ? Math.max(0, (canvasHeight - y) / 3) : currentAltitude, // Front view uses Y for altitude
      color: currentColor,
      rgb: currentRgb,
      brightness: 0.8,
      timestamp: newTimestamp,
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
    redrawCanvas() // Immediately clear both canvases
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

    // Ensure all timestamps are sequential and duration is correct
    const interval = 1000 // ms between waypoints
    const pointsWithTimestamps = unsavedPoints.map((p, i) => ({ ...p, timestamp: i * interval }))
    const duration = pointsWithTimestamps.length > 0 ? (pointsWithTimestamps.length - 1) * interval + interval : 0

    const newSequence: DroneSequence = {
      id: sequence?.id || Date.now().toString(),
      name: sequenceName,
      points: pointsWithTimestamps,
      duration,
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
    // Just open the dialog for naming the new route
    setNewRouteName("")
    setShowNameDialog(true)
  }

  const handleNameDialogSave = () => {
    // Save current route if there are unsaved points
    if (unsavedPoints.length > 0) {
      const interval = 1000
      const pointsWithTimestamps = unsavedPoints.map((p, i) => ({ ...p, timestamp: i * interval }))
      const duration = pointsWithTimestamps.length > 0 ? (pointsWithTimestamps.length - 1) * interval + interval : 0
      const newSequence: DroneSequence = {
        id: sequence?.id || Date.now().toString(),
        name: sequenceName,
        points: pointsWithTimestamps,
        duration,
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
    }
    // Now create and select the new empty route
    const name = newRouteName.trim() || "New Sequence"
    const newId = Date.now().toString()
    onNewSequence({
      id: newId,
      name,
      points: [],
      duration: 0,
    })
    if (typeof window !== "undefined" && window.dispatchEvent) {
      // Custom event to notify parent to select the new route
      window.dispatchEvent(new CustomEvent("select-drone-sequence", { detail: { id: newId } }))
    }
    setSequenceName(name)
    setUnsavedPoints([])
    setHasUnsavedChanges(false)
    setShowNameDialog(false)
    onClearPreview?.()
    redrawCanvas()
    toast({
      title: "New Sequence Started",
      description: `Route "${name}" created. Ready to add waypoints.`,
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
      {/* Name new route dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name Your New Route</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Enter route name"
            value={newRouteName}
            onChange={e => setNewRouteName(e.target.value)}
            className="mt-2"
          />
          <DialogFooter>
            <Button onClick={handleNameDialogSave} disabled={!newRouteName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Controls Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Sequence Name */}
          <div className="flex items-center gap-2 min-w-0">
            <Label htmlFor="sequence-name" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Route Name:
            </Label>
            <Input
              id="sequence-name"
              value={sequenceName}
              onChange={(e) => handleSequenceNameChange(e.target.value)}
              className="w-48 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              placeholder="Enter route name..."
            />
          </div>

          {/* Altitude Control */}
          <div className="flex items-center gap-3">
            <Label htmlFor="altitude" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Altitude:
            </Label>
            <div className="flex items-center gap-2">
              <Slider
                id="altitude"
                min={1}
                max={100}
                step={1}
                value={[currentAltitude]}
                onValueChange={(value) => setCurrentAltitude(value[0])}
                className="w-24"
              />
              <div className="bg-white border border-gray-300 rounded px-2 py-1 min-w-[3rem] text-center">
                <span className="text-sm font-mono font-semibold text-gray-800">{currentAltitude}m</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowWaypoints(!showWaypoints)}
              className="border-gray-300 hover:border-gray-400"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showWaypoints ? "Hide" : "Show"} Points
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={createNewSequence}
              className="border-green-300 hover:border-green-400 text-green-700 hover:text-green-800 hover:bg-green-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Route
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearCanvas}
              className="border-red-300 hover:border-red-400 text-red-700 hover:text-red-800 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>

            <Button
              onClick={saveSequence}
              size="sm"
              disabled={!hasUnsavedChanges && unsavedPoints.length === 0}
              className={`min-w-[120px] ${
                isPreviewMode
                  ? "bg-purple-600 hover:bg-purple-700 border-purple-600"
                  : hasUnsavedChanges
                  ? "bg-orange-500 hover:bg-orange-600 border-orange-500"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Save className="w-4 h-4 mr-2" />
              {isPreviewMode ? "Save Preview" : hasUnsavedChanges ? "Save Changes" : "Save Route"}
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bird's Eye View */}
        <Card className="border border-gray-200 bg-white/90 shadow-lg rounded-2xl transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2 tracking-tight">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Bird's Eye View
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 font-medium">
              Top-down view for horizontal path planning • Altitude: <span className="font-semibold text-gray-700">{currentAltitude}m</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <canvas
              ref={birdEyeCanvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="border border-gray-200 rounded-lg cursor-crosshair bg-white w-full shadow-inner hover:shadow-lg transition-shadow duration-200"
              onClick={(e) => handleCanvasClick(e, false)}
            />
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
              <span>Click to add waypoints</span>
              <span className="bg-gray-100 px-2 py-1 rounded-full">XY Plane</span>
            </div>
          </CardContent>
        </Card>

        {/* Front View */}
        <Card className="border border-gray-200 bg-white/90 shadow-lg rounded-2xl transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2 tracking-tight">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Side Profile View
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 font-medium">
              Side view for altitude planning • Y-axis controls height
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <canvas
              ref={frontViewCanvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="border border-gray-200 rounded-lg cursor-crosshair bg-white w-full shadow-inner hover:shadow-lg transition-shadow duration-200"
              onClick={(e) => handleCanvasClick(e, true)}
            />
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
              <span>Click to set altitude directly</span>
              <span className="bg-gray-100 px-2 py-1 rounded-full">XZ Plane</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Sequence Statistics */}
      <Card className="border border-gray-200 bg-white/90 shadow-lg rounded-2xl mt-8">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
              </svg>
              Route Statistics
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              isPreviewMode
                ? "bg-purple-50 border-purple-200 text-purple-700"
                : hasUnsavedChanges
                ? "bg-orange-50 border-orange-200 text-orange-700"
                : "bg-green-50 border-green-200 text-green-700"
            }`}>
              {isPreviewMode ? "Preview" : hasUnsavedChanges ? "Modified" : "Saved"}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Waypoints */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-start gap-1 min-w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs font-medium text-gray-500">Waypoints</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{unsavedPoints.length}</div>
            </div>
            {/* Max Altitude */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-start gap-1 min-w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4" />
                </svg>
                <span className="text-xs font-medium text-gray-500">Max Altitude</span>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {unsavedPoints.length > 0 ? Math.max(...unsavedPoints.map((p) => p.z)).toFixed(0) : 0}
                <span className="text-xs font-normal text-gray-400 ml-1">m</span>
              </div>
            </div>
            {/* Duration */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-start gap-1 min-w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-gray-500">Duration</span>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {Math.round((unsavedPoints.length > 0 ? (unsavedPoints.length - 1) * 1000 + 1000 : 0) / 1000)}
                <span className="text-xs font-normal text-gray-400 ml-1">s</span>
              </div>
            </div>
            {/* Colors */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-start gap-1 min-w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21h16a2 2 0 002-2v-4a2 2 0 00-2-2H7m0-9h16a2 2 0 012 2v4a2 2 0 01-2 2H7m8-13v16" />
                </svg>
                <span className="text-xs font-medium text-gray-500">Colors</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-xl font-bold text-gray-900">
                  {new Set(unsavedPoints.map((p) => p.color)).size}
                </div>
                <div className="flex -space-x-1">
                  {[...new Set(unsavedPoints.map((p) => p.color))].slice(0, 4).map((color, idx) => (
                    <div
                      key={color}
                      className="w-5 h-5 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: color, zIndex: 10 - idx }}
                      title={color}
                    />
                  ))}
                  {new Set(unsavedPoints.map((p) => p.color)).size > 4 && (
                    <div className="w-5 h-5 rounded-full bg-gray-200 border border-white shadow-sm flex items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-500">+{new Set(unsavedPoints.map((p) => p.color)).size - 4}</span>
                    </div>
                  )}
                  {new Set(unsavedPoints.map((p) => p.color)).size === 0 && (
                    <span className="text-gray-300 text-xs">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
