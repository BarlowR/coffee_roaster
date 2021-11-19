import time
import multiprocessing as mp
import gpiozero
import numpy as np

from multiprocessing import Process, Queue



class RoasterController:

    # command_queue is a queue of commands sent to the controller. 
    # commands are injested one at a time and do not block normal operation

    def __init__(self, command_queue, verbose=False):
        
        self.last_update_time = time.time_ns()
        self.verbose = verbose
        self.command_queue = command_queue
        if self.verbose:
            print("Starting up")

        self.rgb = [gpiozero.LED(8), gpiozero.LED(7), gpiozero.LED(25)]
        for led in self.rgb:
            led.off()

        self.adc = {"heater": 0,
                    "barrel_base": 1,
                    "barrel_mid": 2,
                    "barrel_tip": 3}
        
        for key, value in self.adc.items():
            self.adc[key] = gpiozero.MCP3204(channel=value, clock_pin=21, mosi_pin=20, miso_pin=19, select_pin=16)
            #tuple with (device, kalman instance) 

        self.internal_val = {"heater" : gpiozero.PWMOutputDevice(6, frequency = 0.5),
                        "fan" : gpiozero.PWMOutputDevice(12, frequency = 10),
                        "temp" : gpiozero.PWMOutputDevice(13, frequency = 10)}


        self.control_points = { "fan" : [(0,0)],
                                "heater" : [(0,0)],
                                "temp" : [(0,0), (10000, 0)]}
        self.last_point = { "fan" : 0,
                            "heater" : 0,
                            "temp": 0}

        self.global_time = 0;




    
    # update: main program loop
    def update(self):
        initial_time = time.time_ns()
        while(1):

            time_ns = time.time_ns() - initial_time
            self.global_time = time_ns/1000000
            ts = time_ns - self.last_update_time
            self.last_update_time = time_ns

            if (not self.command_queue.empty()):
                address, new_command = self.command_queue.get()
                if (address == "controller"):
                    self.parse_command(new_command)
                else:
                    command_queue.put((address, new_command))

            for key, value in self.last_point.items():
                #grab the list of control points
                control_points = self.control_points[key]

                #increment last_point if we passed the previous value
                if (len(control_points) > value + 1 and 
                    self.global_time > control_points[value+1][0]):
                    
                    self.last_point[key] = value+1



                # if we have more than one point, interpolate between the two that we're at
                if (len(control_points)> value + 1):
                    self.internal_val[key].value = self.interpolate(control_points[value], control_points[value+1], self.global_time)/100
                

            # update kalman filter for temp
            for name, adc in self.adc.items():
                #update_kalman adc.value
            #print(f'fan: {self.internal_val["fan"].value:.2f} heater: {self.internal_val["heater"].value:.2f} time: {self.global_time:.2f}')






    #parse string commands
    def parse_command(self, command_string):

        command = command_string.split(",")
        if self.verbose:
            print(command)

        #fans
        if (command[0] == "F0"):
            if (self.read_command_value(command[1]) == 1):
                prev_time = self.global_time
            else:
                prev_time = self.control_points["fan"][-1][0]
            new_point = (prev_time, 0)
            self.control_points["fan"].append(new_point)
            return True

        elif (command[0] == "F1"):
            prev_time = self.control_points["fan"][-1][0]
            new_point = (prev_time, self.read_command_value(command[1]))
            self.control_points["fan"].append(new_point)
            return True


        elif (command[0] == "F2"):
            prev_time = self.control_points["fan"][-1][0]
            new_point = (prev_time + self.read_command_value(command[2]), self.read_command_value(command[1]))
            self.control_points["fan"].append(new_point)
            return True



        #heater
        elif (command[0] == "H0"):
            if (self.read_command_value(command[1]) == 1):
                prev_time = self.global_time
            else:
                prev_time = self.control_points["heater"][-1][0]
            new_point = (prev_time, 0)
            self.control_points["heater"].append(new_point)
            return True

        elif (command[0] == "H1"):
            prev_time = self.control_points["heater"][-1][0]
            new_point = (prev_time,self.read_command_value(command[1]))
            self.control_points["heater"].append(new_point)
            return True

        elif (command[0] == "H2"):
            prev_time = self.control_points["heater"][-1][0]
            new_point = (prev_time + self.read_command_value(command[2]), self.read_command_value(command[1]))
            self.control_points["heater"].append(new_point)
            return True

        #bean temp controller
        elif (command[0] == "B0"):
            return True
        elif (command[0] == "B1"):
            return True
        elif (command[0] == "B2"):
            return True

        #lights
        elif (command[0] == "L0"):
            for led in self.rgb:
                led.off()
            return True   

        elif (command[0] == "L1"):
            for led in self.rgb:
                led.on()
            return True 

        elif (command[0] == "DUMP"):
            print("fan :")
            print(self.control_points["fan"])

            print("heater :")
            print(self.control_points["heater"])



        elif (command[0] == "T"):
            temp_data = {}
            for name, item in self.adc.items():
                temp_data[name] = self.resistance_to_temp(self.adc_to_resistance(item.value))
            self.command_queue.put(("api", temp_data))
            return True

        else :
            if self.verbose:
                print("Invaid command")   
            return False

    def read_command_value(self, val):
        if val.isdigit():
            return (int(val))
        else:
            print("invalid value passed: " + val)


    def interpolate(self, previous_node, next_node, current_time):
        #print(previous_node, next_node)
        if (current_time < previous_node[0]):
            #print("Interpolate: before first node")
            return(previous_node[1])

        if (current_time > next_node[0]):
            #print("Interpolate: after second node")
            return(next_node[1])

        elapsed_time = current_time - previous_node[0]

        delta_t = previous_node[0] - next_node[0]
        delta_val = previous_node[1] - next_node[1]

        return (elapsed_time * (delta_val/delta_t) + previous_node[1])

    def adc_to_resistance(self, adc):
        # adc is Vout/Vin
        # Vout = Vin * Rt/(Rs + Rt)
        # adc = Rt/(Rs + Rt)

        rs = 1000
        rt = rs/(1/adc - 1)

        return rt

    def resistance_to_temp(self, rt):
        # Beta = ln(R1/R2)/(1/T1 - 1/T2) 

        # beta/T2 = beta/T1 - ln(R1/R2)
        # T2 = beta/(beta/T1 - ln(R1/R2))

        t1 = 298.15 # 25c in kelvin
        r1 = 10000 
        beta = 3933

        temp_kelvin = beta/(beta/t1 - np.log(r1/rt))
        temp_c = temp_kelvin - 273.15

        return temp_c

    def adc_to_temp(adc):
        return self.resistance_to_temp(self.adc_to_resistance(adc))

        #https://www.desmos.com/calculator/ky78lxirfi



if __name__ == "__main__":
    roaster = RoasterController(verbose = True)

    command_queue = Queue()
    command_queue.put(("controller", "F0,0"))
    command_queue.put(("controller", "H0,0"))
    command_queue.put(("controller", "F1,50"))
    command_queue.put(("controller", "F2,100,5000"))
    command_queue.put(("controller", "H2,50,10000"))
    command_queue.put(("controller", "F2,100,5000"))
    command_queue.put(("controller", "H2,30,5000")
)
    command_queue.put(("controller", "F0,0"))
    command_queue.put(("controller", "H0,0"))
    command_queue.put(("controller", "DUMP"))


    roaster.update(command_queue)
