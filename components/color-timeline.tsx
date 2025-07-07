"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DroneSequence } from "@/app/page"

interface ColorTimelineProps {
  sequence: DroneSequence
  currentTime: number
}

export function ColorTimeline({ sequence, currentTime }: ColorTimelineProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getCurrentColor = () => {
    if (!sequence.points.length) return null

    const totalDuration = sequence.duration
    const progress = (currentTime % totalDuration) / totalDuration
    const pointIndex = Math.floor(progress * sequence.points.length)
    return sequence.points[pointIndex] || sequence.points[0]
  }

  const currentPoint = getCurrentColor()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Timeline</CardTitle>
        <CardDescription>RGB color sequence for LED control</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Color Display */}
        {currentPoint && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div
              className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: currentPoint.color }}
            />
            <div className="space-y-1">
              <div className="font-medium">Current Color</div>
              <div className="text-sm text-gray-600">
                RGB({currentPoint.rgb.r}, {currentPoint.rgb.g}, {currentPoint.rgb.b})
              </div>
              <div className="text-sm text-gray-600">
                Hex: {currentPoint.color} • Brightness: {Math.round(currentPoint.brightness * 100)}%
              </div>
            </div>
          </div>
        )}

        {/* Color Sequence */}
        <div className="space-y-2">
          <h4 className="font-medium">Color Sequence</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {sequence.points.map((point, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 rounded border ${
                  currentPoint === point ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                  <div className="w-6 h-6 rounded border" style={{ backgroundColor: point.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    RGB({point.rgb.r}, {point.rgb.g}, {point.rgb.b})
                  </div>
                  <div className="text-xs text-gray-500">
                    {point.color} • {Math.round(point.brightness * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Color Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold">{sequence.points.length}</div>
            <div className="text-xs text-gray-500">Total Colors</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{new Set(sequence.points.map((p) => p.color)).size}</div>
            <div className="text-xs text-gray-500">Unique Colors</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {sequence.points.length > 0
                ? Math.round((sequence.points.reduce((sum, p) => sum + p.brightness, 0) / sequence.points.length) * 100)
                : 0}
              %
            </div>
            <div className="text-xs text-gray-500">Avg Brightness</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{formatTime(sequence.duration)}</div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
