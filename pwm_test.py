import platform
import time
if (platform.processor() != "x86_64"):
    import gpiozero



fan = gpiozero.PWMOutputDevice(13, frequency = 0.5)
heater = gpiozero.PWMOutputDevice(12, initial_value = 0.1, frequency = 5)


if __name__ == "__main__":
    i = 0
    
    while (1):
        i = i + 1 if (i < 100) else 0
        time.sleep(0.1)

        heater.value = i/100
        print(i)