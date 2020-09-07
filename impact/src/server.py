
import asyncio
import websockets

import numpy as np
from sklearn.externals import joblib

model_2 = joblib.load(open('../resources/Model2.sav', 'rb'))



# ========================
# Server Interface

async def predict(websocket, path):
    msg_in = await websocket.recv()
    print(f"< recieved: {msg_in}")

    msg_to_list = lambda msg: [float(v) for v in msg.strip('[]').split(',')]

    msg_as_list = msg_to_list(msg_in)

    # Predict
    pred = model_2.predict(np.array([msg_as_list]))

    msg_out = str(pred[0])

    await websocket.send(msg_out)
    print(f"> {msg_out}")



start_server = websockets.serve(predict, "127.0.0.1", 8181)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()