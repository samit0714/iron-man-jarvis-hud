import cv2
import mediapipe as mp
from fastapi import FastAPI, WebSocket
import asyncio
import json
import math

app = FastAPI()

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7, model_complexity=0)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Frontend Connected: J.A.R.V.I.S Vision Online")
    
    cap = cv2.VideoCapture(0)
    
    try:
        while cap.isOpened():
            success, image = cap.read()
            if not success:
                break
            
            image = cv2.flip(image, 1)
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb_image)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(image, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                    
                    index_x = hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP].x
                    index_y = hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP].y
                    thumb_x = hand_landmarks.landmark[mp_hands.HandLandmark.THUMB_TIP].x
                    thumb_y = hand_landmarks.landmark[mp_hands.HandLandmark.THUMB_TIP].y
                    
                    
                    distance = math.hypot(index_x - thumb_x, index_y - thumb_y)
                    is_pinching = True if distance < 0.05 else False

                    
                    tips = [8, 12, 16, 20] 
                    pips = [6, 10, 14, 18] 
                    fingers_up = 0
                    
                    for tip, pip in zip(tips, pips):
                        if hand_landmarks.landmark[tip].y < hand_landmarks.landmark[pip].y:
                            fingers_up += 1
                            
                    is_palm_open = True if fingers_up == 4 else False
                    
                    
                    await websocket.send_json({
                        "x": index_x, 
                        "y": index_y, 
                        "pinch": is_pinching, 
                        "palm_open": is_palm_open
                    })
            
            cv2.imshow("J.A.R.V.I.S. Vision Scanner", image)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
            
            await asyncio.sleep(0.001) 
            
    except Exception as e:
        print("Frontend disconnected.")
    finally:
        cap.release()
        cv2.destroyAllWindows()