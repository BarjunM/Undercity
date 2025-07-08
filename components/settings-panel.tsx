"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { RgbColorPicker } from "@/components/rgb-color-picker"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, Zap, Sparkles, Circle, Infinity, SplineIcon as Spiral, Users, Star, Heart, Waves, Dna, Shuffle, Square, Triangle, Zap as Lightning, Sparkle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { DroneSequence, DronePoint } from "@/app/page"

interface SettingsPanelProps {
  onColorChange: (color: string, rgb: { r: number; g: number; b: number }) => void
  currentColor: string
  onPreviewSequence?: (sequence: DroneSequence) => void
}

export function SettingsPanel({ onColorChange, currentColor, onPreviewSequence }: SettingsPanelProps) {
  const { toast } = useToast()
  const [flightSettings, setFlightSettings] = useState({
    maxAltitude: 50,
    maxSpeed: 10,
    safetyRadius: 50,
    smoothPath: true,
    autoOptimize: false,
    batteryMonitoring: true,
  })

  const [ledSettings, setLedSettings] = useState({
    brightness: 80,
    transitionSpeed: 500,
    strobeMode: false,
  })

  // Canvas center coordinates (400x300 canvas)
  const CANVAS_CENTER_X = 200
  const CANVAS_CENTER_Y = 150

  // Quick action pattern generators
  const generateCirclePattern = () => {
    const points: DronePoint[] = []
    const radius = 60
    const numPoints = 12
    const altitude = 15

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI
      const x = CANVAS_CENTER_X + Math.cos(angle) * radius
      const y = CANVAS_CENTER_Y + Math.sin(angle) * radius

      // Create color gradient around the circle
      const hue = (i / numPoints) * 360
      const color = `hsl(${hue}, 70%, 50%)`
      const rgb = hslToRgb(hue, 70, 50)

      points.push({
        x,
        y,
        z: altitude,
        color,
        rgb,
        brightness: ledSettings.brightness / 100,
        timestamp: i * 1000,
        speed: flightSettings.maxSpeed,
        transitionDuration: ledSettings.transitionSpeed,
      })
    }

    const sequence: DroneSequence = {
      id: `circle-preview-${Date.now()}`,
      name: `Circle Pattern ${new Date().toLocaleTimeString()}`,
      points,
      duration: points.length * 1000,
    }

    onPreviewSequence?.(sequence)
    toast({
      title: "Circle Pattern Generated",
      description: `Preview created with ${points.length} waypoints. Save to keep it.`,
    })
  }

  const generateFigure8Pattern = () => {
    const points: DronePoint[] = []
    const width = 70
    const height = 50
    const numPoints = 20
    const altitude = 18

    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * 4 * Math.PI
      const x = CANVAS_CENTER_X + Math.sin(t) * width
      const y = CANVAS_CENTER_Y + Math.sin(t * 2) * height

      // Color changes based on position in figure-8
      const progress = i / numPoints
      const hue = (progress * 720) % 360
      const color = `hsl(${hue}, 80%, 60%)`
      const rgb = hslToRgb(hue, 80, 60)

      points.push({
        x,
        y,
        z: altitude + Math.sin(t) * 3,
        color,
        rgb,
        brightness: ledSettings.brightness / 100,
        timestamp: i * 800,
        speed: flightSettings.maxSpeed,
        transitionDuration: ledSettings.transitionSpeed,
      })
    }

    const sequence: DroneSequence = {
      id: `figure8-preview-${Date.now()}`,
      name: `Figure-8 Pattern ${new Date().toLocaleTimeString()}`,
      points,
      duration: points.length * 800,
    }

    onPreviewSequence?.(sequence)
    toast({
      title: "Figure-8 Pattern Generated",
      description: `Preview created with ${points.length} waypoints. Save to keep it.`,
    })
  }

  const generateSpiralPattern = () => {
    const points: DronePoint[] = []
    const maxRadius = 80
    const numPoints = 24
    const maxAltitude = 25

    for (let i = 0; i < numPoints; i++) {
      const progress = i / numPoints
      const angle = progress * 6 * Math.PI // 3 full rotations
      const radius = progress * maxRadius
      const x = CANVAS_CENTER_X + Math.cos(angle) * radius
      const y = CANVAS_CENTER_Y + Math.sin(angle) * radius
      const z = 5 + progress * maxAltitude // Start at 5m altitude

      // Color transitions from blue to red as it spirals up
      const hue = 240 - progress * 240
      const color = `hsl(${hue}, 90%, 55%)`
      const rgb = hslToRgb(hue, 90, 55)

      points.push({
        x,
        y,
        z,
        color,
        rgb,
        brightness: (ledSettings.brightness / 100) * (0.7 + progress * 0.3),
        timestamp: i * 600,
        speed: flightSettings.maxSpeed * (0.5 + progress * 0.5),
        transitionDuration: ledSettings.transitionSpeed,
      })
    }

    const sequence: DroneSequence = {
      id: `spiral-preview-${Date.now()}`,
      name: `Spiral Pattern ${new Date().toLocaleTimeString()}`,
      points,
      duration: points.length * 600,
    }

    onPreviewSequence?.(sequence)
    toast({
      title: "Spiral Pattern Generated",
      description: `Preview created with ${points.length} waypoints. Save to keep it.`,
    })
  }

  const generateFormationPattern = () => {
    const points: DronePoint[] = []
    const formations = [
      // Diamond formation - centered
      [
        { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - 30 }, // Top
        { x: CANVAS_CENTER_X + 30, y: CANVAS_CENTER_Y }, // Right
        { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y + 30 }, // Bottom
        { x: CANVAS_CENTER_X - 30, y: CANVAS_CENTER_Y }, // Left
      ],
      // Line formation - centered
      [
        { x: CANVAS_CENTER_X - 45, y: CANVAS_CENTER_Y },
        { x: CANVAS_CENTER_X - 15, y: CANVAS_CENTER_Y },
        { x: CANVAS_CENTER_X + 15, y: CANVAS_CENTER_Y },
        { x: CANVAS_CENTER_X + 45, y: CANVAS_CENTER_Y },
      ],
      // V formation - centered
      [
        { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - 15 }, // Lead
        { x: CANVAS_CENTER_X - 20, y: CANVAS_CENTER_Y }, // Left wing
        { x: CANVAS_CENTER_X + 20, y: CANVAS_CENTER_Y }, // Right wing
        { x: CANVAS_CENTER_X - 35, y: CANVAS_CENTER_Y + 15 }, // Left rear
        { x: CANVAS_CENTER_X + 35, y: CANVAS_CENTER_Y + 15 }, // Right rear
      ],
    ]

    formations.forEach((formation, formationIndex) => {
      formation.forEach((pos, posIndex) => {
        const timeOffset = formationIndex * 4000 + posIndex * 200
        const hue = (formationIndex * 120 + posIndex * 60) % 360
        const color = `hsl(${hue}, 75%, 50%)`
        const rgb = hslToRgb(hue, 75, 50)

        points.push({
          x: pos.x,
          y: pos.y,
          z: 20 + formationIndex * 8,
          color,
          rgb,
          brightness: ledSettings.brightness / 100,
          timestamp: timeOffset,
          speed: flightSettings.maxSpeed,
          transitionDuration: ledSettings.transitionSpeed,
        })
      })
    })

    const sequence: DroneSequence = {
      id: `formation-preview-${Date.now()}`,
      name: `Formation Flying ${new Date().toLocaleTimeString()}`,
      points,
      duration: 14000,
    }

    onPreviewSequence?.(sequence)
    toast({
      title: "Formation Pattern Generated",
      description: `Preview created with ${points.length} waypoints. Save to keep it.`,
    })
  }

  const generateStarPattern = () => {
    const points: DronePoint[] = []
    const numPoints = 10
    const outerRadius = 70
    const innerRadius = 35
    const altitude = 22

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI - Math.PI / 2
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const x = CANVAS_CENTER_X + Math.cos(angle) * radius
      const y = CANVAS_CENTER_Y + Math.sin(angle) * radius

      const hue = (i / numPoints) * 360
      const color = `hsl(${hue}, 85%, 55%)`
      const rgb = hslToRgb(hue, 85, 55)

      points.push({
        x,
        y,
        z: altitude + (i % 2 === 0 ? 5 : 0),
        color,
        rgb,
        brightness: ledSettings.brightness / 100,
        timestamp: i * 700,
        speed: flightSettings.maxSpeed,
        transitionDuration: ledSettings.transitionSpeed,
      })
    }

    const sequence: DroneSequence = {
      id: `star-preview-${Date.now()}`,
      name: `Star Pattern ${new Date().toLocaleTimeString()}`,
      points,
      duration: points.length * 700,
    }

    onPreviewSequence?.(sequence)
    toast({
      title: "Star Pattern Generated",
      description: `Preview created with ${points.length} waypoints. Save to keep it.`,
    })
  }

  const generateHeartPattern = () => {
    const points: DronePoint[] = []
    const numPoints = 40
    const scale = 2.5 // Reduced scale to fit better in canvas
    const altitude = 25

    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * 2 * Math.PI
      
      // Parametric heart equation
      const heartX = 16 * Math.sin(t) ** 3
      const heartY = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
      
      // Scale and position the heart
      const x = CANVAS_CENTER_X + heartX * scale
      const y = CANVAS_CENTER_Y - heartY * scale // Flip Y to make heart upright

      // Red to pink gradient with better color range
      const progress = i / numPoints
      const hue = 340 + progress * 40 // From deep red to pink
      const saturation = 85 - progress * 15 // Slightly decrease saturation
      const lightness = 50 + progress * 20 // Increase lightness for pink effect
      const color = `hsl(${hue % 360}, ${saturation}%, ${lightness}%)`
      const rgb = hslToRgb(hue % 360, saturation, lightness)

      points.push({
        x,
        y,
        z: altitude + Math.sin(t * 2) * 2, // Add slight altitude variation
        color,
        rgb,
        brightness: ledSettings.brightness / 100,
        timestamp: i * 400,
        speed: flightSettings.maxSpeed * 0.6,
        transitionDuration: ledSettings.transitionSpeed,
      })
    }

    const sequence: DroneSequence = {
      id: `heart-preview-${Date.now()}`,
      name: `Heart Pattern ${new Date().toLocaleTimeString()}`,
      points,
      duration: points.length * 400,
    }

    onPreviewSequence?.(sequence)
    toast({
      title: "Heart Pattern Generated",
      description: `Preview created with ${points.length} waypoints. Save to keep it.`,
    })
  }

  const generateWavePattern = () => {
    const points: DronePoint[] = []
    const numPoints = 25
    const waveWidth = 120
    const waveHeight = 40
    const altitude = 18

    for (let i = 0; i < numPoints; i++) {
      const progress = i / (numPoints - 1)
      const x = CANVAS_CENTER_X - waveWidth / 2 + progress * waveWidth
      const y = CANVAS_CENTER_Y + Math.sin(progress * 4 * Math.PI) * waveHeight

      // Blue to cyan wave colors
      const hue = 180 + Math.sin(progress * 4 * Math.PI) * 60
      const color = `hsl(${hue}, 70%, 55%)`
      const rgb = hslToRgb(hue, 70, 55)

      points.push({
        x,
        y,
        z: altitude + Math.sin(progress * 2 * Math.PI) * 8,
        color,
        rgb,
        brightness: ledSettings.brightness / 100,
        timestamp: i * 400,
        speed: flightSettings.maxSpeed,
        transitionDuration: ledSettings.transitionSpeed,
      })
    }

    const sequence: DroneSequence = {
      id: `wave-preview-${Date.now()}`,
      name: `Wave Pattern ${new Date().toLocaleTimeString()}`,
      points,
      duration: points.length * 400,
    }

    onPreviewSequence?.(sequence)
    toast({
      title: "Wave Pattern Generated",
      description: `Preview created with ${points.length} waypoints. Save to keep it.`,
    })
  }

  const generateHelixPattern = () => {
    const points: DronePoint[] = []
    const numPoints = 30
    const radius = 50
    const height = 35
    const turns = 3

    for (let i = 0; i < numPoints; i++) {
      const progress = i / (numPoints - 1)
      const angle = progress * turns * 2 * Math.PI
      const x = CANVAS_CENTER_X + Math.cos(angle) * radius * (1 - progress * 0.5)
      const y = CANVAS_CENTER_Y + Math.sin(angle) * radius * (1 - progress * 0.5)
      const z = 10 + progress * height

      // Rainbow spiral colors
      const hue = progress * 720 % 360
      const color = `hsl(${hue}, 80%, 60%)`
      const rgb = hslToRgb(hue, 80, 60)

      points.push({
        x,
        y,
        z,
        color,
        rgb,
        brightness: ledSettings.brightness / 100,
        timestamp: i * 300,
        speed: flightSettings.maxSpeed * 0.8,
        transitionDuration: ledSettings.transitionSpeed,
      })
    }

    const sequence: DroneSequence = {
      id: `helix-preview-${Date.now()}`,
      name: `Helix Pattern ${new Date().toLocaleTimeString()}`,
      points,
      duration: points.length * 300,
    }

    onPreviewSequence?.(sequence)
    toast({
      title: "Helix Pattern Generated",
      description: `Preview created with ${points.length} waypoints. Save to keep it.`,
    })
  }

  const generateRandomPattern = () => {
    const points: DronePoint[] = []
    const numPoints = 15
    const maxRadius = 80
    const minAltitude = 10
    const maxAltitude = 40

    for (let i = 0; i < numPoints; i++) {
      const angle = Math.random() * 2 * Math.PI
      const radius = Math.random() * maxRadius
      const x = CANVAS_CENTER_X + Math.cos(angle) * radius
      const y = CANVAS_CENTER_Y + Math.sin(angle) * radius
      const z = minAltitude + Math.random() * (maxAltitude - minAltitude)

      const hue = Math.random() * 360
      const color = `hsl(${hue}, 70%, 55%)`
      const rgb = hslToRgb(hue, 70, 55)

      points.push({
        x,
        y,
        z,
        color,
        rgb,
        brightness: ledSettings.brightness / 100,
        timestamp: i * 800,
        speed: flightSettings.maxSpeed,
        transitionDuration: ledSettings.transitionSpeed,
      })
    }

    const sequence: DroneSequence = {
      id: `random-preview-${Date.now()}`,
      name: `Random Pattern ${new Date().toLocaleTimeString()}`,
      points,
      duration: points.length * 800,
    }

    onPreviewSequence?.(sequence)
    toast({
      title: "Random Pattern Generated",
      description: `Preview created with ${points.length} waypoints. Save to keep it.`,
    })
  }

  const generateSquarePattern = () => {
    const points: DronePoint[] = []
    const sideLength = 80
    const pointsPerSide = 6
    const altitude = 20

    // Generate square perimeter
    for (let side = 0; side < 4; side++) {
      for (let i = 0; i < pointsPerSide; i++) {
        let x = CANVAS_CENTER_X
        let y = CANVAS_CENTER_Y
        const progress = i / (pointsPerSide - 1)

        switch (side) {
          case 0: // Top side
            x = CANVAS_CENTER_X - sideLength / 2 + progress * sideLength
            y = CANVAS_CENTER_Y - sideLength / 2
            break
          case 1: // Right side
            x = CANVAS_CENTER_X + sideLength / 2
            y = CANVAS_CENTER_Y - sideLength / 2 + progress * sideLength
            break
          case 2: // Bottom side
            x = CANVAS_CENTER_X + sideLength / 2 - progress * sideLength
            y = CANVAS_CENTER_Y + sideLength / 2
            break
          case 3: // Left side
            x = CANVAS_CENTER_X - sideLength / 2
            y = CANVAS_CENTER_Y + sideLength / 2 - progress * sideLength
            break
        }

        const hue = (side * 90 + progress * 60) % 360
        const color = `hsl(${hue}, 75%, 55%)`
        const rgb = hslToRgb(hue, 75, 55)

        points.push({
          x,
          y,
          z: altitude,
          color,
          rgb,
          brightness: ledSettings.brightness / 100,
          timestamp: (side * pointsPerSide + i) * 300,
          speed: flightSettings.maxSpeed,
          transitionDuration: ledSettings.transitionSpeed,
        })
      }
    }

    const sequence: DroneSequence = {
      id: `square-preview-${Date.now()}`,
      name: `Square Pattern ${new Date().toLocaleTimeString()}`,
      points,
      duration: points.length * 300,
    }

    onPreviewSequence?.(sequence)
    toast({
      title: "Square Pattern Generated",
      description: `Preview created with ${points.length} waypoints. Save to keep it.`,
    })
  }

  const generateTrianglePattern = () => {
    const points: DronePoint[] = []
    const sideLength = 90
    const pointsPerSide = 5
    const altitude = 22

    // Triangle vertices
    const vertices = [
      { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - sideLength * 0.6 }, // Top
      { x: CANVAS_CENTER_X - sideLength / 2, y: CANVAS_CENTER_Y + sideLength * 0.3 }, // Bottom left
      { x: CANVAS_CENTER_X + sideLength / 2, y: CANVAS_CENTER_Y + sideLength * 0.3 }, // Bottom right
    ]

    for (let side = 0; side < 3; side++) {
      const startVertex = vertices[side]
      const endVertex = vertices[(side + 1) % 3]

      for (let i = 0; i < pointsPerSide; i++) {
        const progress = i / (pointsPerSide - 1)
        const x = startVertex.x + (endVertex.x - startVertex.x) * progress
        const y = startVertex.y + (endVertex.y - startVertex.y) * progress

        const hue = (side * 120 + progress * 80) % 360
        const color = `hsl(${hue}, 80%, 60%)`
        const rgb = hslToRgb(hue, 80, 60)

        points.push({
          x,
          y,
          z: altitude + Math.sin(progress * Math.PI) * 5,
          color,
          rgb,
          brightness: ledSettings.brightness / 100,
          timestamp: (side * pointsPerSide + i) * 400,
          speed: flightSettings.maxSpeed,
          transitionDuration: ledSettings.transitionSpeed,
        })
      }
    }

    const sequence: DroneSequence = {
      id: `triangle-preview-${Date.now()}`,
      name: `Triangle Pattern ${new Date().toLocaleTimeString()}`,
      points,
      duration: points.length * 400,
    }

    onPreviewSequence?.(sequence)
    toast({
      title: "Triangle Pattern Generated",
      description: `Preview created with ${points.length} waypoints. Save to keep it.`,
    })
  }

  const generateZigzagPattern = () => {
    const points: DronePoint[] = []
    const numZigs = 6
    const zigWidth = 100
    const zigHeight = 60
    const altitude = 16

    for (let i = 0; i <= numZigs; i++) {
      const isEven = i % 2 === 0
      const x = CANVAS_CENTER_X - zigWidth / 2 + (i / numZigs) * zigWidth
      const y = CANVAS_CENTER_Y + (isEven ? -zigHeight / 2 : zigHeight / 2)

      const hue = (i / numZigs) * 240 + 120 // Blue to green gradient
      const color = `hsl(${hue}, 75%, 55%)`
      const rgb = hslToRgb(hue, 75, 55)

      points.push({
        x,
        y,
        z: altitude + Math.sin((i / numZigs) * Math.PI * 2) * 6,
        color,
        rgb,
        brightness: ledSettings.brightness / 100,
        timestamp: i * 600,
        speed: flightSettings.maxSpeed,
        transitionDuration: ledSettings.transitionSpeed,
      })
    }

    const sequence: DroneSequence = {
      id: `zigzag-preview-${Date.now()}`,
      name: `Zigzag Pattern ${new Date().toLocaleTimeString()}`,
      points,
      duration: points.length * 600,
    }

    onPreviewSequence?.(sequence)
    toast({
      title: "Zigzag Pattern Generated",
      description: `Preview created with ${points.length} waypoints. Save to keep it.`,
    })
  }

  const generateBurstPattern = () => {
    const points: DronePoint[] = []
    const numRays = 8
    const rayLength = 70
    const pointsPerRay = 4
    const altitude = 25

    for (let ray = 0; ray < numRays; ray++) {
      const angle = (ray / numRays) * 2 * Math.PI
      
      for (let i = 0; i < pointsPerRay; i++) {
        const progress = (i + 1) / pointsPerRay // Start from center and go outward
        const radius = progress * rayLength
        const x = CANVAS_CENTER_X + Math.cos(angle) * radius
        const y = CANVAS_CENTER_Y + Math.sin(angle) * radius

        const hue = (ray / numRays) * 360
        const saturation = 60 + progress * 30
        const lightness = 50 + progress * 20
        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`
        const rgb = hslToRgb(hue, saturation, lightness)

        points.push({
          x,
          y,
          z: altitude - progress * 10, // Descend as it moves outward
          color,
          rgb,
          brightness: (ledSettings.brightness / 100) * (1.2 - progress * 0.4),
          timestamp: ray * 800 + i * 200,
          speed: flightSettings.maxSpeed * (0.5 + progress * 0.5),
          transitionDuration: ledSettings.transitionSpeed,
        })
      }
    }

    const sequence: DroneSequence = {
      id: `burst-preview-${Date.now()}`,
      name: `Burst Pattern ${new Date().toLocaleTimeString()}`,
      points,
      duration: numRays * 800 + pointsPerRay * 200,
    }

    onPreviewSequence?.(sequence)
    toast({
      title: "Burst Pattern Generated",
      description: `Preview created with ${points.length} waypoints. Save to keep it.`,
    })
  }

  // Helper function to convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360
    s /= 100
    l /= 100

    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
    const m = l - c / 2

    let r = 0,
      g = 0,
      b = 0

    if (0 <= h && h < 1 / 6) {
      r = c
      g = x
      b = 0
    } else if (1 / 6 <= h && h < 2 / 6) {
      r = x
      g = c
      b = 0
    } else if (2 / 6 <= h && h < 3 / 6) {
      r = 0
      g = c
      b = x
    } else if (3 / 6 <= h && h < 4 / 6) {
      r = 0
      g = x
      b = c
    } else if (4 / 6 <= h && h < 5 / 6) {
      r = x
      g = 0
      b = c
    } else if (5 / 6 <= h && h < 1) {
      r = c
      g = 0
      b = x
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* RGB Color Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            RGB Color Picker
          </CardTitle>
          <CardDescription>Select colors for your drone's LED lights</CardDescription>
        </CardHeader>
        <CardContent>
          <RgbColorPicker onColorChange={onColorChange} currentColor={currentColor} />
        </CardContent>
      </Card>

      {/* Flight Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Flight Settings
          </CardTitle>
          <CardDescription>Configure drone flight parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Max Altitude</Label>
                <Badge variant="outline">{flightSettings.maxAltitude}m</Badge>
              </div>
              <Slider
                value={[flightSettings.maxAltitude]}
                onValueChange={(value) => setFlightSettings((prev) => ({ ...prev, maxAltitude: value[0] }))}
                max={100}
                min={10}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Max Speed</Label>
                <Badge variant="outline">{flightSettings.maxSpeed} m/s</Badge>
              </div>
              <Slider
                value={[flightSettings.maxSpeed]}
                onValueChange={(value) => setFlightSettings((prev) => ({ ...prev, maxSpeed: value[0] }))}
                max={25}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Safety Radius</Label>
                <Badge variant="outline">{flightSettings.safetyRadius}m</Badge>
              </div>
              <Slider
                value={[flightSettings.safetyRadius]}
                onValueChange={(value) => setFlightSettings((prev) => ({ ...prev, safetyRadius: value[0] }))}
                max={200}
                min={20}
                step={10}
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="smooth-path">Smooth Path Interpolation</Label>
              <Switch
                id="smooth-path"
                checked={flightSettings.smoothPath}
                onCheckedChange={(checked) => setFlightSettings((prev) => ({ ...prev, smoothPath: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-optimize">Auto Optimize Routes</Label>
              <Switch
                id="auto-optimize"
                checked={flightSettings.autoOptimize}
                onCheckedChange={(checked) => setFlightSettings((prev) => ({ ...prev, autoOptimize: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="battery-monitoring">Battery Monitoring</Label>
              <Switch
                id="battery-monitoring"
                checked={flightSettings.batteryMonitoring}
                onCheckedChange={(checked) => setFlightSettings((prev) => ({ ...prev, batteryMonitoring: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LED Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            LED Settings
          </CardTitle>
          <CardDescription>Configure LED behavior and effects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>LED Brightness</Label>
              <Badge variant="outline">{ledSettings.brightness}%</Badge>
            </div>
            <Slider
              value={[ledSettings.brightness]}
              onValueChange={(value) => setLedSettings((prev) => ({ ...prev, brightness: value[0] }))}
              max={100}
              min={10}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Transition Speed</Label>
              <Badge variant="outline">{ledSettings.transitionSpeed}ms</Badge>
            </div>
            <Slider
              value={[ledSettings.transitionSpeed]}
              onValueChange={(value) => setLedSettings((prev) => ({ ...prev, transitionSpeed: value[0] }))}
              max={2000}
              min={100}
              step={100}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="strobe-mode">Strobe Mode</Label>
            <Switch
              id="strobe-mode"
              checked={ledSettings.strobeMode}
              onCheckedChange={(checked) => setLedSettings((prev) => ({ ...prev, strobeMode: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Generate common flight patterns for preview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Basic Patterns */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Basic Patterns</div>
            <Button onClick={generateCirclePattern} variant="outline" className="w-full justify-start bg-transparent">
              <Circle className="w-4 h-4 mr-2" />
              Circle Pattern
            </Button>

            <Button onClick={generateSquarePattern} variant="outline" className="w-full justify-start bg-transparent">
              <Square className="w-4 h-4 mr-2" />
              Square Pattern
            </Button>

            <Button onClick={generateTrianglePattern} variant="outline" className="w-full justify-start bg-transparent">
              <Triangle className="w-4 h-4 mr-2" />
              Triangle Pattern
            </Button>

            <Button onClick={generateStarPattern} variant="outline" className="w-full justify-start bg-transparent">
              <Star className="w-4 h-4 mr-2" />
              Star Pattern
            </Button>
          </div>

          <Separator />

          {/* Advanced Patterns */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Advanced Patterns</div>
            <Button onClick={generateFigure8Pattern} variant="outline" className="w-full justify-start bg-transparent">
              <Infinity className="w-4 h-4 mr-2" />
              Figure-8 Pattern
            </Button>

            <Button onClick={generateSpiralPattern} variant="outline" className="w-full justify-start bg-transparent">
              <Spiral className="w-4 h-4 mr-2" />
              Spiral Pattern
            </Button>

            <Button onClick={generateHelixPattern} variant="outline" className="w-full justify-start bg-transparent">
              <Dna className="w-4 h-4 mr-2" />
              Helix Pattern
            </Button>

            <Button onClick={generateWavePattern} variant="outline" className="w-full justify-start bg-transparent">
              <Waves className="w-4 h-4 mr-2" />
              Wave Pattern
            </Button>

            <Button onClick={generateZigzagPattern} variant="outline" className="w-full justify-start bg-transparent">
              <Lightning className="w-4 h-4 mr-2" />
              Zigzag Pattern
            </Button>
          </div>

          <Separator />

          {/* Creative Patterns */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Creative Patterns</div>
            <Button onClick={generateHeartPattern} variant="outline" className="w-full justify-start bg-transparent">
              <Heart className="w-4 h-4 mr-2" />
              Heart Pattern
            </Button>

            <Button onClick={generateBurstPattern} variant="outline" className="w-full justify-start bg-transparent">
              <Sparkle className="w-4 h-4 mr-2" />
              Burst Pattern
            </Button>

            <Button onClick={generateFormationPattern} variant="outline" className="w-full justify-start bg-transparent">
              <Users className="w-4 h-4 mr-2" />
              Formation Flying
            </Button>

            <Button onClick={generateRandomPattern} variant="outline" className="w-full justify-start bg-transparent">
              <Shuffle className="w-4 h-4 mr-2" />
              Random Pattern
            </Button>
          </div>

          <Separator />

          <div className="text-xs text-gray-500 space-y-1">
            <div>• Patterns preview in drawing canvas</div>
            <div>• Uses current flight & LED settings</div>
            <div>• Click Save to keep the pattern</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
