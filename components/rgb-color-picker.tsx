"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Copy, Check } from "lucide-react"

interface RgbColorPickerProps {
  onColorChange: (color: string, rgb: { r: number; g: number; b: number }) => void
  currentColor: string
}

export function RgbColorPicker({ onColorChange, currentColor }: RgbColorPickerProps) {
  const [rgb, setRgb] = useState({ r: 255, g: 0, b: 0 })
  const [hexInput, setHexInput] = useState("#ff0000")
  const [copied, setCopied] = useState<string | null>(null)

  // Preset colors for quick selection
  const presetColors = [
    { name: "Red", hex: "#ff0000", rgb: { r: 255, g: 0, b: 0 } },
    { name: "Green", hex: "#00ff00", rgb: { r: 0, g: 255, b: 0 } },
    { name: "Blue", hex: "#0000ff", rgb: { r: 0, g: 0, b: 255 } },
    { name: "Yellow", hex: "#ffff00", rgb: { r: 255, g: 255, b: 0 } },
    { name: "Cyan", hex: "#00ffff", rgb: { r: 0, g: 255, b: 255 } },
    { name: "Magenta", hex: "#ff00ff", rgb: { r: 255, g: 0, b: 255 } },
    { name: "White", hex: "#ffffff", rgb: { r: 255, g: 255, b: 255 } },
    { name: "Orange", hex: "#ff8000", rgb: { r: 255, g: 128, b: 0 } },
  ]

  // Convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number) => {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16)
          return hex.length === 1 ? "0" + hex : hex
        })
        .join("")
    )
  }

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 }
  }

  // Update hex when RGB changes
  useEffect(() => {
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    setHexInput(hex)
    onColorChange(hex, rgb)
  }, [rgb, onColorChange])

  // Update RGB when current color changes externally
  useEffect(() => {
    const newRgb = hexToRgb(currentColor)
    setRgb(newRgb)
    setHexInput(currentColor)
  }, [currentColor])

  const handleRgbChange = (component: "r" | "g" | "b", value: number) => {
    setRgb((prev) => ({ ...prev, [component]: value }))
  }

  const handleHexChange = (hex: string) => {
    setHexInput(hex)
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      const newRgb = hexToRgb(hex)
      setRgb(newRgb)
      onColorChange(hex, newRgb)
    }
  }

  const handlePresetClick = (preset: (typeof presetColors)[0]) => {
    setRgb(preset.rgb)
    setHexInput(preset.hex)
    onColorChange(preset.hex, preset.rgb)
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Color Preview */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-inner"
          style={{ backgroundColor: rgbToHex(rgb.r, rgb.g, rgb.b) }}
        />
        <div className="space-y-1">
          <div className="font-medium">Current Color</div>
          <div className="text-sm text-gray-600">
            RGB({rgb.r}, {rgb.g}, {rgb.b})
          </div>
          <div className="text-sm text-gray-600">{rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase()}</div>
        </div>
      </div>

      {/* RGB Sliders */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="red-slider">Red</Label>
            <span className="text-sm font-mono w-8">{rgb.r}</span>
          </div>
          <Slider
            id="red-slider"
            min={0}
            max={255}
            step={1}
            value={[rgb.r]}
            onValueChange={(value) => handleRgbChange("r", value[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="green-slider">Green</Label>
            <span className="text-sm font-mono w-8">{rgb.g}</span>
          </div>
          <Slider
            id="green-slider"
            min={0}
            max={255}
            step={1}
            value={[rgb.g]}
            onValueChange={(value) => handleRgbChange("g", value[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="blue-slider">Blue</Label>
            <span className="text-sm font-mono w-8">{rgb.b}</span>
          </div>
          <Slider
            id="blue-slider"
            min={0}
            max={255}
            step={1}
            value={[rgb.b]}
            onValueChange={(value) => handleRgbChange("b", value[0])}
            className="w-full"
          />
        </div>
      </div>

      {/* Hex Input */}
      <div className="space-y-2">
        <Label htmlFor="hex-input">Hex Color</Label>
        <div className="flex gap-2">
          <Input
            id="hex-input"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="#000000"
            className="font-mono"
          />
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(hexInput, "hex")}>
            {copied === "hex" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Copy Options */}
      <div className="space-y-2">
        <Label>Copy Values</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, "rgb")}
            className="text-xs"
          >
            {copied === "rgb" ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            RGB
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(`${rgb.r}, ${rgb.g}, ${rgb.b}`, "values")}
            className="text-xs"
          >
            {copied === "values" ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            Values
          </Button>
        </div>
      </div>

      {/* Preset Colors */}
      <div className="space-y-2">
        <Label>Preset Colors</Label>
        <div className="grid grid-cols-4 gap-2">
          {presetColors.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              className="h-12 p-1 bg-transparent"
              onClick={() => handlePresetClick(preset)}
              title={preset.name}
            >
              <div className="w-full h-full rounded border" style={{ backgroundColor: preset.hex }} />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
