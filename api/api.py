from flask import Flask
from flask import url_for
from flask import request
from flask import redirect
from flask import render_template
from flask import Response

from flask_classful import FlaskView, route

import threading
from time import sleep
import json

class RoasterAPI(FlaskView):

    def __init__(self, command_queue):
        self.command_queue = command_queue
        self.server_busy = threading.Lock()


    # Web UI


    # Home Page
    @route('/')
    def default(self):
        print("home")
        return "home" #render_template('home.html')



    # API Endpoints

    # Test Connection
    @route('/test_connection')
    def test_connection(self):
        return Response("Working", 200)

    @route('/blink_for_a_while')
    def blink_for_a_while(self):
        self.command_queue.put(("controller", "R0", 0))
        for i in range(0,20,2):
            self.command_queue.put(("controller", "L0", i))
            sleep(.200)
            self.command_queue.put(("controller", "L1", i+1))
            sleep(.200)
        self.command_queue.put(("controller", "L0", i+2))
        self.command_queue.put(("controller", "R0", 0))
        return True

    @route('/warmup_twice')
    def warmup(self):
        self.command_queue.put(("controller", "R0", 0))
        self.command_queue.put(("controller", "H0,1", 0))
        for i in range(2):
            self.command_queue.put(("controller", "H0,0", 1))
            self.command_queue.put(("controller", "H2,100,10000",2))
        self.command_queue.put(("controller", "H0,0", 3))
        self.command_queue.put(("controller", "R1", 0))
        return "warmingup"

    @route('/turn_on')
    def turn_on(self):
        self.command_queue.put(("controller", "R0", 0))
        self.command_queue.put(("controller", "H0,1", 0))
        self.command_queue.put(("controller", "H2,100,100", 1))
        self.command_queue.put(("controller", "R1", 0))
        return "warmingup"


    @route('/get_temp')
    def get_temp(self):
        self.command_queue.put(("controller", "T", 0))

        temp_data = False
        while(not temp_data):
            for i in range(self.command_queue.qsize()): # iterates through the whole queue, saves then discards self addressed items, and puts everything back in order
                address, value, order = self.command_queue.get()
                if (address == "api"):
                    print(value)
                    temp_data = str(value)
                else:
                    self.command_queue.put((address, value, order))
        return temp_data


    @route('/get_state')
    def get_state(self):
        self.command_queue.put(("controller", "S", 0))

        state_data = False
        while(not state_data):
            for i in range(self.command_queue.qsize()): # iterates through the whole queue, saves then discards self addressed items, and puts everything back in order
                address, value, order = self.command_queue.get()
                if (address == "api"):
                    print(value)
                    state_data = str(value)
                else:
                    self.command_queue.put((address, value, order))
        return state_data

    @route('/plot')
    def plot(self):
        return render_template('realtime_plot.html')

    @route('/create')
    def create(self):
        return render_template('profile_creator.html')

    @route('/reset')
    def reset(self):
        self.command_queue.put(("controller", "R3", 0))
        return ""

    @route('/shutdown')
    def shutdown(self):
        self.command_queue.put(("controller", "R3", 0))
        return ""

    @route("/commands", methods=['GET', 'POST'])
    def commands(self):
        commands = json.loads(request.data)
        inc = 0
        for command in commands:
            if (len(command) == 0): continue
            self.command_queue.put(("controller", command, inc))
            inc+=1
        return ""



    def get_lock(self, func):
        if self.server_busy.acquire(False):
            data = func()
            self.server_busy.release()
            return Response(data, status=201)
        else:
            return Response("busy", status=409)




