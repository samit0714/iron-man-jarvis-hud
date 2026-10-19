# J.A.R.V.I.S. Interactive 3D HUD 🚀🤖

An advanced, interactive Iron Man-inspired holographic web application. It combines 3D rendering with real-time AI hand-gesture recognition to create a truly touchless, sci-fi user experience.

## ✨ Features
* **Real-Time Hand Tracking:** Uses OpenCV and MediaPipe to track hand coordinates with zero latency.
* **Interactive 3D Holograms:** Built with Three.js. Features rotating cyber-rings and an interactive core.
* **Exploded View (Disassembly Mode):** Open your palm to blast the 3D core into floating pieces (just like Tony Stark's lab).
* **Target Lock:** Pinch your fingers to grab the core, change its state, and trigger SFX.
* **WebSocket Integration:** Lightning-fast communication between the Python AI backend and the Vite frontend.

## 🛠️ Tech Stack
* **Frontend:** HTML5, CSS3, Vanilla JavaScript, Three.js, Vite
* **Backend:** Python, FastAPI, WebSockets
* **Computer Vision:** OpenCV, Google MediaPipe

## 🚀 How to Run Locally
1. **Clone the repository:**
   `git clone https://github.com/your-username/iron-man-jarvis-hud.git`
2. **Start the AI Gesture Server (Backend):**
   `python -m pip install fastapi uvicorn opencv-python mediapipe websockets`
   `python -m uvicorn gesture_server:app --port 8000`
3. **Start the Frontend (Vite):**
   `npm install`
   `npm run dev`
4. **Action:** Open the browser link, click anywhere to allow audio, and use your hands to control the HUD!