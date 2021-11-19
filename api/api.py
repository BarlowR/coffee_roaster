from flask import Flask
from flask import url_for
from flask import request
from flask import redirect
from flask import render_template
from flask import Response

from flask_classful import FlaskView, route

import threading
from time import sleep

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
        for i in range(10):
            self.command_queue.put(("controller", "L0"))
            sleep(.200)
            self.command_queue.put(("controller", "L1"))
            sleep(.200)
        self.command_queue.put(("controller", "L0"))
        return True

    @route('/warmup_twice')
    def warmup(self):
        for i in range(2):
            self.command_queue.put(("controller", "H0,0"))
            self.command_queue.put(("controller", "H2,100,10000"))
        return True

    @route('/get_temp')
    def get_temp(self):
        self.command_queue.put(("controller", "T"))

        temp_data = False
        while(not temp_data):
            #print("waiting")
            if (self.command_queue.qsize() == 1):
                address, value = self.command_queue.get()
                if (address == "api"):
                    print(value)
                    temp_data = str(value)
                else:
                    self.command_queue.put((address, value))
        return temp_data

    @route('/shutdown')
    def print_from_browser(self):
        self.command_queue.put(("controller", "B0"))
        return ""



    def get_lock(self, func):
        if self.server_busy.acquire(False):
            data = func()
            server_busy.release()
            return Response(data, status=201)
        else:
            return Response("busy", status=409)




