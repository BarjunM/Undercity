"use client"

import { useState, useEffect } from "react"
import { DrawingCanvas } from "@/components/drawing-canvas"
import { FlightPreview } from "@/components/flight-preview"
import { Timeline } from "@/components/timeline"
import { ExportPanel } from "@/components/export-panel"
import { SettingsPanel } from "@/components/settings-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Wifi, WifiOff, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export interface DronePoint {
  x: number
  y: number
  z: number
  color: string // Hex color
  rgb: { r: number; g: number; b: number } // RGB values 0-255
  brightness: number // 0-1
  timestamp: number
  speed?: number
  transitionDuration?: number // Time to transition to this color
}

export interface DroneSequence {
  id: string
  name: string
  points: DronePoint[]
  duration: number
}

export default function DroneLightShow() {
  const [sequences, setSequences] = useState<DroneSequence[]>([])
  const [activeSequence, setActiveSequence] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentDrawingColor, setCurrentDrawingColor] = useState("#ff0000")
  const [currentDrawingRgb, setCurrentDrawingRgb] = useState({ r: 255, g: 0, b: 0 })
  const [isOnline, setIsOnline] = useState(true)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [previewSequence, setPreviewSequence] = useState<DroneSequence | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  // PWA Installation and offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: "Back Online",
        description: "Internet connection restored",
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "Offline Mode",
        description: "Working offline - data will sync when reconnected",
        variant: "destructive",
      })
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Check initial online status
    setIsOnline(navigator.onLine)

    // Load saved data from localStorage
    const savedSequences = localStorage.getItem("drone-sequences")
    if (savedSequences) {
      try {
        const parsed = JSON.parse(savedSequences)
        setSequences(parsed)
        if (parsed.length > 0 && !activeSequence) {
          setActiveSequence(parsed[0].id)
        }
      } catch (error) {
        console.error("Error loading saved sequences:", error)
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [toast, activeSequence])

  // Save sequences to localStorage whenever they change
  useEffect(() => {
    if (sequences.length > 0) {
      localStorage.setItem("drone-sequences", JSON.stringify(sequences))
    }
  }, [sequences])

  const handleInstallApp = async () => {
    if (!installPrompt) return

    const result = await installPrompt.prompt()
    if (result.outcome === "accepted") {
      toast({
        title: "App Installed",
        description: "Drone Light Show Designer has been installed to your device",
      })
    }
    setInstallPrompt(null)
  }

  const addSequence = (sequence: DroneSequence) => {
    setSequences((prev) => [...prev, sequence])
    if (!activeSequence) {
      setActiveSequence(sequence.id)
    }
    setPreviewSequence(null) // Clear preview when saving
  }

  const updateSequence = (id: string, updates: Partial<DroneSequence>) => {
    setSequences((prev) => prev.map((seq) => (seq.id === id ? { ...seq, ...updates } : seq)))
    setPreviewSequence(null) // Clear preview when saving
  }

  const deleteSequence = (id: string) => {
    setSequences((prev) => prev.filter((seq) => seq.id !== id))

    // If we're deleting the active sequence, select another one or clear
    if (activeSequence === id) {
      const remainingSequences = sequences.filter((seq) => seq.id !== id)
      setActiveSequence(remainingSequences.length > 0 ? remainingSequences[0].id : null)
    }

    toast({
      title: "Sequence Deleted",
      description: "The sequence has been removed successfully",
    })
  }

  const handleColorChange = (color: string, rgb: { r: number; g: number; b: number }) => {
    setCurrentDrawingColor(color)
    setCurrentDrawingRgb(rgb)
  }

  const handlePreviewSequence = (sequence: DroneSequence) => {
    setPreviewSequence(sequence)
  }

  const clearPreview = () => {
    setPreviewSequence(null)
  }

  const activeSeq = sequences.find((seq) => seq.id === activeSequence)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-4xl font-bold text-gray-900">Drone Light Show Designer</h1>
            <div className="flex items-center gap-2">
              {isOnline ? <Wifi className="w-5 h-5 text-green-500" /> : <WifiOff className="w-5 h-5 text-red-500" />}
              {installPrompt && (
                <Button onClick={handleInstallApp} size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </Button>
              )}
            </div>
          </div>
          <p className="text-gray-600">Design, visualize, and export drone light show routines for ArduPilot</p>
          {!isOnline && (
            <p className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full inline-block">
              Offline Mode - Changes saved locally
            </p>
          )}
        </div>
        <Tabs defaultValue="design" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="preview">3D Preview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          <TabsContent value="design" className="space-y-4">
            <div className="space-y-6">
              {/* Drawing Canvas */}
              <Card>
                <CardHeader>
                  <CardTitle>Drawing Canvas</CardTitle>
                  <CardDescription>Draw the flight path for your drone light show</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Enhanced Sequence Picker inside Drawing Canvas card */}
                  <div className="mb-4">
                    <div className="font-bold text-lg text-gray-800 mb-2 tracking-tight">Pick Route</div>
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {sequences.length === 0 ? (
                        <span className="text-gray-400 text-sm">No sequences yet</span>
                      ) : (
                        sequences.map((sequence) => {
                          const colors = Array.from(new Set(sequence.points.map((p) => p.color)))
                          return (
                            <div key={sequence.id} className="relative flex items-center group">
                              <button
                                className={`relative flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 whitespace-nowrap shadow-sm ${
                                  activeSequence === sequence.id
                                    ? "border-blue-500 bg-blue-50 text-blue-900 font-semibold"
                                    : "border-gray-200 bg-white hover:bg-gray-100 text-gray-700"
                                }`}
                                onClick={() => setActiveSequence(sequence.id)}
                                title={sequence.name}
                                type="button"
                                style={{ minWidth: 120 }}
                              >
                                {/* Active checkmark */}
                                {activeSequence === sequence.id && (
                                  <span className="absolute left-1 top-1/2 -translate-y-1/2 bg-blue-500 rounded p-0.5">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  </span>
                                )}
                                {/* Color dots */}
                                <span className="flex gap-0.5 ml-4">
                                  {colors.slice(0, 4).map((color, idx) => (
                                    <span
                                      key={idx}
                                      className="w-3 h-3 rounded border border-gray-300"
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                  ))}
                                  {colors.length > 4 && (
                                    <span className="w-3 h-3 rounded bg-gray-200 flex items-center justify-center text-xs">+{colors.length - 4}</span>
                                  )}
                                </span>
                                {/* Name with tooltip for overflow */}
                                <span className="truncate max-w-[8ch] ml-2" title={sequence.name}>{sequence.name}</span>
                                <span className="text-xs text-gray-400 ml-1">({sequence.points.length})</span>
                              </button>
                              {/* Delete button, only show on hover */}
                              <button
                                className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete route"
                                onClick={() => {
                                  setPendingDeleteId(sequence.id)
                                  setShowDeleteDialog(true)
                                }}
                                tabIndex={-1}
                                type="button"
                              >
                                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                              </button>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                  <DrawingCanvas
                    sequence={activeSeq}
                    onSequenceUpdate={(updates) => activeSequence && updateSequence(activeSequence, updates)}
                    onNewSequence={addSequence}
                    currentColor={currentDrawingColor}
                    currentRgb={currentDrawingRgb}
                    previewSequence={previewSequence}
                    onClearPreview={clearPreview}
                  />
                </CardContent>
              </Card>
              {/* Settings Panel */}
              <SettingsPanel
                onColorChange={handleColorChange}
                currentColor={currentDrawingColor}
                onPreviewSequence={handlePreviewSequence}
              />
              {/* Delete confirmation dialog (moved here for clarity) */}
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Sequence?</DialogTitle>
                  </DialogHeader>
                  <p>Are you sure you want to delete this sequence? This action cannot be undone.</p>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (pendingDeleteId) deleteSequence(pendingDeleteId)
                        setShowDeleteDialog(false)
                        setPendingDeleteId(null)
                      }}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>3D Flight Preview</CardTitle>
                <CardDescription>Visualize your drone's flight path in 3D space</CardDescription>
              </CardHeader>
              <CardContent>
                <FlightPreview sequences={sequences} activeSequence={activeSequence} currentTime={currentTime} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="timeline" className="space-y-4">
            <Timeline
              sequences={sequences}
              activeSequence={activeSequence}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onTimeChange={setCurrentTime}
              onPlayToggle={() => setIsPlaying(!isPlaying)}
              onSequenceSelect={setActiveSequence}
              onDeleteSequence={deleteSequence}
            />
          </TabsContent>
          <TabsContent value="export" className="space-y-4">
            <ExportPanel sequences={sequences} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
