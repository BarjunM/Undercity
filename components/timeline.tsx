"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, Trash2 } from "lucide-react"
import { ColorTimeline } from "@/components/color-timeline"
import type { DroneSequence } from "@/app/page"

interface TimelineProps {
  sequences: DroneSequence[]
  activeSequence: string | null
  currentTime: number
  isPlaying: boolean
  onTimeChange: (time: number) => void
  onPlayToggle: () => void
  onSequenceSelect: (id: string) => void
  onDeleteSequence: (id: string) => void
}

export function Timeline({
  sequences,
  activeSequence,
  currentTime,
  isPlaying,
  onTimeChange,
  onPlayToggle,
  onSequenceSelect,
  onDeleteSequence,
}: TimelineProps) {
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  const activeSeq = sequences.find((seq) => seq.id === activeSequence)
  const maxDuration = activeSeq ? activeSeq.duration : 10000

  // Auto-advance time when playing
  useEffect(() => {
    if (!isPlaying || !activeSeq) return

    const interval = setInterval(() => {
      onTimeChange((prevTime) => {
        const nextTime = prevTime + 100 * playbackSpeed
        return nextTime >= maxDuration ? 0 : nextTime
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, playbackSpeed, maxDuration, onTimeChange, activeSeq])

  const handleReset = () => {
    onTimeChange(0)
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleDeleteSequence = (e: React.MouseEvent, sequenceId: string) => {
    e.stopPropagation() // Prevent sequence selection
    onDeleteSequence(sequenceId)
  }

  return (
    <div className="space-y-6">
      {/* Sequence Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Sequences</CardTitle>
          <CardDescription>Select a sequence to preview and control</CardDescription>
        </CardHeader>
        <CardContent>
          {sequences.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sequences created yet. Create one in the Design tab.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sequences.map((sequence) => (
                <div
                  key={sequence.id}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md group ${
                    activeSequence === sequence.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => onSequenceSelect(sequence.id)}
                >
                  {/* Delete button - appears on hover */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    onClick={(e) => handleDeleteSequence(e, sequence.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <div className="space-y-2 pr-8">
                    <h3 className="font-medium text-sm">{sequence.name}</h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{sequence.points.length} points</Badge>
                      <Badge variant="outline">{formatTime(sequence.duration)}</Badge>
                      <Badge variant="outline">
                        {sequence.points.length > 0
                          ? `${Math.max(...sequence.points.map((p) => p.z)).toFixed(1)}m max`
                          : "0m max"}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {Array.from(new Set(sequence.points.map((p) => p.color)))
                        .slice(0, 5)
                        .map((color, index) => (
                          <div
                            key={index}
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      {new Set(sequence.points.map((p) => p.color)).size > 5 && (
                        <div className="w-3 h-3 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                          +
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline Controls */}
      {activeSeq && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline Controls</CardTitle>
            <CardDescription>Control playback of "{activeSeq.name}"</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Playback Controls */}
            <div className="flex items-center gap-4">
              <Button onClick={onPlayToggle} size="sm">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm">Speed:</span>
                <div className="flex gap-1">
                  {[0.5, 1, 2, 4].map((speed) => (
                    <Button
                      key={speed}
                      variant={playbackSpeed === speed ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPlaybackSpeed(speed)}
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Scrubber */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(maxDuration)}</span>
              </div>
              <Slider
                value={[currentTime]}
                onValueChange={(value) => onTimeChange(value[0])}
                max={maxDuration}
                min={0}
                step={100}
                className="w-full"
              />
            </div>

            {/* Color Timeline */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Color Timeline</h4>
              <ColorTimeline sequence={activeSeq} currentTime={currentTime} />
            </div>

            {/* Sequence Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Waypoints:</span> {activeSeq.points.length}
              </div>
              <div>
                <span className="font-medium">Duration:</span> {formatTime(activeSeq.duration)}
              </div>
              <div>
                <span className="font-medium">Max Altitude:</span>{" "}
                {activeSeq.points.length > 0 ? Math.max(...activeSeq.points.map((p) => p.z)).toFixed(1) : 0}m
              </div>
              <div>
                <span className="font-medium">Colors:</span> {new Set(activeSeq.points.map((p) => p.color)).size}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
