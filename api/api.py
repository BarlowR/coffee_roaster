from flask import Flask
from flask import url_for
from flask import request
from flask import redirect
from flask import render_template
from flask import Response

from flask_classful import FlaskView, route

import threading


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

    @route('/shutdown')
    def print_from_browser(self):
        self.command_queue.put("B0")
        return ""



    def get_lock(self, func):
        if self.server_busy.acquire(False):
            data = func()
            server_busy.release()
            return Response(data, status=201)
        else:
            return Response("busy", status=409)



