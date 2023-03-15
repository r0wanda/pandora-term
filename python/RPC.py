# Discord RPC client that communicates thru stdin/out

from pypresence import Presence
import time

print("ready")

CLIENT_ID = input()
RPC = Presence(client_id=CLIENT_ID)
RPC.connect()
print("rpcconn")

while True:
    print('ready')
    cmd = input()
    cmd = cmd.split("")
    if cmd[0] == "set":
        RPC.update(state=cmd[1], details=cmd[2], large_image="logo2")
    print('done')
    time.sleep(15)
