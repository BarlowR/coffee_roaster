from multiprocessing import Process, Queue
import controller.controller as ctl

if __name__ == "__main__":
    roaster = ctl.RoasterController()
    command_queue = Queue()
    controller_process = Process(target=roaster.update, args=(command_queue,))
    controller_process.start()

    command_queue.put("Print this")

    controller_process.join()