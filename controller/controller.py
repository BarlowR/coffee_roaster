import time
import multiprocessing as mp


class RoasterController:

    # command_queue is a queue of commands sent to the controller. 
    # commands should be injested quickly but should not block operation

    def __init__(self, verbose=False):
        
        self.last_update_time = time.time_ns()

        if verbose:
            print("Starting up")

    
    # update: main program loop
    def update(self, command_queue):
        while(1):

            current_time = time.time_ns()
            ts = current_time - self.last_update_time
            self.last_update_time = current_time

            if (not command_queue.empty()):
                command = command_queue.get()
                print(command)

    #parse roastercommand
    def parse_command(self, command_string):
        return False


