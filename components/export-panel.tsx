"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DroneSequence } from "@/app/page"
import { Download, FileText, Settings } from "lucide-react"

interface ExportPanelProps {
  sequences: DroneSequence[]
}

interface MissionSettings {
  homeLatitude: number
  homeLongitude: number
  homeAltitude: number
  maxSpeed: number
  safetyRadius: number
}

interface DronePoint {
  x: number
  y: number
  z: number
  color: string
  rgb: { r: number; g: number; b: number }
  brightness: number
  timestamp: number
  speed?: number
  transitionDuration?: number
}

export function ExportPanel({ sequences }: ExportPanelProps) {
  const [missionSettings, setMissionSettings] = useState<MissionSettings>({
    homeLatitude: 37.7749,
    homeLongitude: -122.4194,
    homeAltitude: 0,
    maxSpeed: 10,
    safetyRadius: 100,
  })
  const [exportFormat, setExportFormat] = useState<"mavlink" | "json">("mavlink")

  const generateMAVLinkMission = (sequence: DroneSequence) => {
    const { homeLatitude, homeLongitude, homeAltitude } = missionSettings

    let mission = `QGC WPL 110\n`
    mission += `0\t1\t0\t16\t0\t0\t0\t0\t${homeLatitude}\t${homeLongitude}\t${homeAltitude}\t1\n`

    sequence.points.forEach((point, index) => {
      // Convert canvas coordinates to GPS coordinates (simplified)
      const lat = homeLatitude + (point.y - 300) / 111320 // Rough conversion
      const lng = homeLongitude + (point.x - 400) / (111320 * Math.cos((homeLatitude * Math.PI) / 180))
      const alt = homeAltitude + point.z

      // MAVLink waypoint command (16 = NAV_WAYPOINT)
      mission += `${index + 1}\t0\t3\t16\t0\t0\t0\t0\t${lat.toFixed(7)}\t${lng.toFixed(7)}\t${alt}\t1\n`
    })

    return mission
  }

  // Update the generateJSONMission function to include comprehensive color data
  const generateJSONMission = (sequence: DroneSequence) => {
    const mission = {
      name: sequence.name,
      version: "1.0",
      home: {
        latitude: missionSettings.homeLatitude,
        longitude: missionSettings.homeLongitude,
        altitude: missionSettings.homeAltitude,
      },
      settings: missionSettings,
      waypoints: sequence.points.map((point, index) => ({
        id: index + 1,
        x: point.x,
        y: point.y,
        altitude: point.z,
        color: point.color,
        rgb: point.rgb,
        brightness: point.brightness,
        timestamp: point.timestamp,
        speed: point.speed || 5,
        transitionDuration: point.transitionDuration || 500,
        latitude: missionSettings.homeLatitude + (point.y - 300) / 111320,
        longitude:
          missionSettings.homeLongitude +
          (point.x - 400) / (111320 * Math.cos((missionSettings.homeLatitude * Math.PI) / 180)),
      })),
      lightingSequence: sequence.points.map((point, index) => ({
        waypoint: index + 1,
        timestamp: point.timestamp,
        color: {
          hex: point.color,
          rgb: point.rgb,
          brightness: point.brightness,
        },
        transitionDuration: point.transitionDuration || 500,
        // PWM values for common LED controllers (0-255)
        pwm: {
          red: Math.round(point.rgb.r * point.brightness),
          green: Math.round(point.rgb.g * point.brightness),
          blue: Math.round(point.rgb.b * point.brightness),
        },
        // Percentage values for some controllers (0-100)
        percentage: {
          red: Math.round((point.rgb.r / 255) * point.brightness * 100),
          green: Math.round((point.rgb.g / 255) * point.brightness * 100),
          blue: Math.round((point.rgb.b / 255) * point.brightness * 100),
        },
      })),
      colorInterpolation: generateColorInterpolation(sequence.points),
    }

    return JSON.stringify(mission, null, 2)
  }

  // Add color interpolation generation
  const generateColorInterpolation = (points: DronePoint[]) => {
    const interpolations = []

    for (let i = 1; i < points.length; i++) {
      const startPoint = points[i - 1]
      const endPoint = points[i]
      const duration = endPoint.timestamp - startPoint.timestamp

      // Generate intermediate color steps for smooth transitions
      const steps = Math.max(2, Math.floor(duration / 100)) // One step per 100ms

      for (let step = 0; step <= steps; step++) {
        const progress = step / steps
        const timestamp = startPoint.timestamp + duration * progress

        // Linear interpolation for RGB values
        const r = Math.round(startPoint.rgb.r + (endPoint.rgb.r - startPoint.rgb.r) * progress)
        const g = Math.round(startPoint.rgb.g + (endPoint.rgb.g - startPoint.rgb.g) * progress)
        const b = Math.round(startPoint.rgb.b + (endPoint.rgb.b - startPoint.rgb.b) * progress)
        const brightness = startPoint.brightness + (endPoint.brightness - startPoint.brightness) * progress

        interpolations.push({
          timestamp,
          rgb: { r, g, b },
          brightness,
          pwm: {
            red: Math.round(r * brightness),
            green: Math.round(g * brightness),
            blue: Math.round(b * brightness),
          },
        })
      }
    }

    return interpolations
  }

  const downloadMission = (sequence: DroneSequence) => {
    const content = exportFormat === "mavlink" ? generateMAVLinkMission(sequence) : generateJSONMission(sequence)

    const filename = `${sequence.name.replace(/\s+/g, "_")}.${exportFormat === "mavlink" ? "waypoints" : "json"}`
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Update the ArduPilot script to include LED control
  const generateArduPilotScript = () => {
    return `# ArduPilot Integration Script with RGB LED Control
# This script demonstrates how to integrate with ArduPilot for drone light shows

import time
import json
from pymavlink import mavutil
import threading

class DroneLightShow:
    def __init__(self, connection_string, led_controller_port=None):
        self.master = mavutil.mavlink_connection(connection_string)
        self.master.wait_heartbeat()
        self.led_controller = led_controller_port
        self.current_mission = None
        
    def upload_mission(self, waypoints):
        """Upload waypoints to ArduPilot"""
        # Clear existing mission
        self.master.mav.mission_clear_all_send(
            self.master.target_system,
            self.master.target_component
        )
        
        # Upload new waypoints
        for i, wp in enumerate(waypoints):
            self.master.mav.mission_item_send(
                self.master.target_system,
                self.master.target_component,
                i,
                mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT,
                mavutil.mavlink.MAV_CMD_NAV_WAYPOINT,
                0, 1,  # current, autocontinue
                0, 0, 0, 0,  # param1-4
                wp['latitude'], wp['longitude'], wp['altitude']
            )
    
    def control_rgb_leds(self, rgb, brightness):
        """Control RGB LED strip with specific color and brightness"""
        # Calculate PWM values (0-255)
        red_pwm = int(rgb['r'] * brightness)
        green_pwm = int(rgb['g'] * brightness)
        blue_pwm = int(rgb['b'] * brightness)
        
        # Method 1: Using MAVLink servo commands (if LEDs connected to servo outputs)
        self.master.mav.command_long_send(
            self.master.target_system,
            self.master.target_component,
            mavutil.mavlink.MAV_CMD_DO_SET_SERVO,
            0,
            9,  # Servo 9 (AUX1) for Red
            red_pwm * 4 + 1000,  # Convert to PWM microseconds (1000-2000)
            0, 0, 0, 0, 0
        )
        
        self.master.mav.command_long_send(
            self.master.target_system,
            self.master.target_component,
            mavutil.mavlink.MAV_CMD_DO_SET_SERVO,
            0,
            10,  # Servo 10 (AUX2) for Green
            green_pwm * 4 + 1000,
            0, 0, 0, 0, 0
        )
        
        self.master.mav.command_long_send(
            self.master.target_system,
            self.master.target_component,
            mavutil.mavlink.MAV_CMD_DO_SET_SERVO,
            0,
            11,  # Servo 11 (AUX3) for Blue
            blue_pwm * 4 + 1000,
            0, 0, 0, 0, 0
        )
        
        print(f"LED Control: R={red_pwm}, G={green_pwm}, B={blue_pwm}, Brightness={brightness:.2f}")
    
    def led_controller_thread(self, lighting_sequence):
        """Separate thread for controlling LEDs based on timeline"""
        start_time = time.time()
        
        for light_cmd in lighting_sequence:
            # Wait until the correct timestamp
            target_time = start_time + (light_cmd['timestamp'] / 1000.0)
            current_time = time.time()
            
            if target_time > current_time:
                time.sleep(target_time - current_time)
            
            # Set LED color
            self.control_rgb_leds(
                light_cmd['color']['rgb'],
                light_cmd['color']['brightness']
            )
    
    def execute_show(self, mission_file, use_interpolation=True):
        """Execute the complete light show with RGB control"""
        with open(mission_file, 'r') as f:
            mission = json.load(f)
        
        self.current_mission = mission
        
        # Upload waypoints
        self.upload_mission(mission['waypoints'])
        
        # Start LED control thread
        if use_interpolation and 'colorInterpolation' in mission:
            led_thread = threading.Thread(
                target=self.led_interpolation_thread,
                args=(mission['colorInterpolation'],)
            )
        else:
            led_thread = threading.Thread(
                target=self.led_controller_thread,
                args=(mission['lightingSequence'],)
            )
        
        led_thread.daemon = True
        led_thread.start()
        
        # Start mission
        self.master.mav.command_long_send(
            self.master.target_system,
            self.master.target_component,
            mavutil.mavlink.MAV_CMD_MISSION_START,
            0, 0, 0, 0, 0, 0, 0, 0
        )
        
        print(f"Light show '{mission['name']}' started!")
        return led_thread

# Usage example:
# drone = DroneLightShow('/dev/ttyUSB0')
# led_thread = drone.execute_show('mission.json')
`
  }

  const downloadArduPilotScript = () => {
    const content = generateArduPilotScript()
    const blob = new Blob([content], { type: "text/python" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "ardupilot_integration.py"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Mission Settings
          </CardTitle>
          <CardDescription>Configure the base parameters for your drone mission</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="home-lat">Home Latitude</Label>
              <Input
                id="home-lat"
                type="number"
                step="0.0000001"
                value={missionSettings.homeLatitude}
                onChange={(e) =>
                  setMissionSettings((prev) => ({
                    ...prev,
                    homeLatitude: Number.parseFloat(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home-lng">Home Longitude</Label>
              <Input
                id="home-lng"
                type="number"
                step="0.0000001"
                value={missionSettings.homeLongitude}
                onChange={(e) =>
                  setMissionSettings((prev) => ({
                    ...prev,
                    homeLongitude: Number.parseFloat(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home-alt">Home Altitude (m)</Label>
              <Input
                id="home-alt"
                type="number"
                value={missionSettings.homeAltitude}
                onChange={(e) =>
                  setMissionSettings((prev) => ({
                    ...prev,
                    homeAltitude: Number.parseFloat(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-speed">Max Speed (m/s)</Label>
              <Input
                id="max-speed"
                type="number"
                value={missionSettings.maxSpeed}
                onChange={(e) =>
                  setMissionSettings((prev) => ({
                    ...prev,
                    maxSpeed: Number.parseFloat(e.target.value),
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Missions
          </CardTitle>
          <CardDescription>Download your sequences as ArduPilot-compatible mission files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={exportFormat === "mavlink" ? "default" : "outline"}
              onClick={() => setExportFormat("mavlink")}
            >
              MAVLink Format
            </Button>
            <Button variant={exportFormat === "json" ? "default" : "outline"} onClick={() => setExportFormat("json")}>
              JSON Format
            </Button>
          </div>

          <div className="space-y-2">
            {sequences.map((sequence) => (
              <div key={sequence.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{sequence.name}</h4>
                  <p className="text-sm text-gray-600">{sequence.points.length} waypoints</p>
                </div>
                <Button onClick={() => downloadMission(sequence)} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
            {sequences.length === 0 && (
              <p className="text-gray-500 text-center py-8">No sequences available for export</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            ArduPilot Integration
          </CardTitle>
          <CardDescription>Download Python script for ArduPilot integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This script provides a foundation for integrating your light show missions with ArduPilot. It includes
            waypoint upload, mission execution, and LED control functionality.
          </p>
          <Button onClick={downloadArduPilotScript}>
            <Download className="w-4 h-4 mr-2" />
            Download Integration Script
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
