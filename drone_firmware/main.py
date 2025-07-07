# ArduPilot Integration Script with RGB LED Control
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
