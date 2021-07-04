from threading import Thread

class loadingMessage:
    def __init__(self) -> None:
        self.con = False

    def start(self, message):
        def p():
            bars = ['|', '/', '\\']
            i = 0
            while self.con:
                print(f'{bars[i]} {message}', end='\r')
                i += 1 if i != 2 else -2
        self.con = True
        Thread(target=p, daemon=True).start()
    
    def end(self, message):
        self.con = False
        print(message)


def err(message):
    print(f'\u001b[31mERROR: {message}\u001b[0m')
    exit()

def success(message):
    print(f'\u001b[32mSUCCESS: {message}\u001b[0m')
    exit()