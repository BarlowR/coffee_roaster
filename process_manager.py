from flask import Flask
from multiprocessing import Process, Queue

import controller.controller as ctl
import api.api as api


app = Flask(__name__)
roaster = ctl.RoasterController(verbose = True)
command_queue = Queue()
controller_process = Process(target=roaster.update, args=(command_queue,))



if __name__ == "__main__":


    controller_process.start()

    api.RoasterAPI.register(app, route_base = '/', init_argument=command_queue)
    app.run()