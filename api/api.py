from flask import Flask
from flask import url_for
from flask import request
from flask import redirect
from flask import render_template
from flask import Response

import threading


flask_api = Flask(__name__)
server_busy = threading.Lock()


def __init__():
    global host
    global port

    # load in port and host
    with open(os.path.dirname(__file__) + '/../config.json') as config:
        config_data = json.load(config)

        verbose = config_data["verbose"]
        host = config_data["host"]
        port = config_data["port"]
        burnout_pass = config_data["burnout_pass"]


# Web UI


# Home Page
@flask_api.route('/')
def default():
	return render_template('home.html')



# API Endpoints

# Test Connection
@flask_api.route('/test_connection')
def test_connection():
    return Response("Working", 200)



def get_lock(func):
    if server_busy.acquire(False):
        data = func()
        server_busy.release()
        return Response(data, status=201)
    else:
        return Response("busy", status=409)



if __name__ == '__main__':
    __init__()
    tt.__init__()
    flask_api.secret_key = 'placeholder'
    flask_api.config['SESSION_TYPE'] = 'filesystem'
    flask_api.run(host=host, port=port)
