from flask import Flask
from multiprocessing import Process, Queue

import controller.controller as ctl
import api.api as api


app = Flask(__name__)
command_queue = Queue()
roaster = ctl.RoasterController(command_queue, verbose = True)
controller_process = Process(target=roaster.update)



if __name__ == "__main__":


    controller_process.start()

    api.RoasterAPI.register(app, route_base = '/', init_argument=command_queue)
    app.run(host = '192.168.0.24')

