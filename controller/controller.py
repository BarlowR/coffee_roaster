import time
import multiprocessing as mp


class RoasterController:

    # command_queue is a queue of commands sent to the controller. 
    # commands should be injested quickly but should not block operation

    def __init__(self, verbose=False):
        
        self.last_update_time = time.time_ns()
        self.verbose = verbose
        if self.verbose:
            print("Starting up")

    
    # update: main program loop
    def update(self, command_queue):
        while(1):

            current_time = time.time_ns()
            ts = current_time - self.last_update_time
            self.last_update_time = current_time

            if (not command_queue.empty()):
                command = command_queue.get()
                self.parse_command(command)


    #parse string commands
    def parse_command(self, command_string):

        command = command_string.split(",")

        #fans
        if (command[0] == "F0"):
            if self.verbose:
                print("Turning off fans")
            return True
        elif (command[0] == "F1"):
            if self.verbose:
                print("")
            return True
        elif (command[0] == "F2"):
            if self.verbose:
                print("")
            return True

        #heater
        elif (command[0] == "H0"):
            if self.verbose:
                print("Turning off heater")
            return True
        elif (command[0] == "H1"):
            if self.verbose:
                print("")
            return True
        elif (command[0] == "H2"):
            if self.verbose:
                print("")
            return True

        #bean temp controller
        elif (command[0] == "B0"):
            if self.verbose:
                print("Turning off heater & fans")
            return True
        elif (command[0] == "B1"):
            if self.verbose:
                print("")
            return True
        elif (command[0] == "B2"):
            if self.verbose:
                print("")
            return True

        #lights
        elif (command[0] == "L0"):
            if self.verbose:
                print("Turning off lights")
            return True   
        elif (command[0] == "L1"):
            if self.verbose:
                print("")
            return True 


        else :
            if self.verbose:
                print("Invaid command")   
            return False


