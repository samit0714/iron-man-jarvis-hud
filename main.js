import './style.css';
import * as THREE from 'three'; 


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8; // Camera thoda peeche kiya taaki blast hone par sab dikhe

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); 
renderer.setSize(window.innerWidth, window.innerHeight); 
document.getElementById('app').appendChild(renderer.domElement); 

// 2. HUD Rings (Background Elements)
const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x00d8ff, wireframe: true, transparent: true, opacity: 0.3 });
const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.02, 16, 100), glowMaterial);
const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.05, 4, 60), glowMaterial);
scene.add(ring1);
scene.add(ring2);

// 3. EXPLODABLE HOLOGRAM (Group)
const hologramGroup = new THREE.Group();
scene.add(hologramGroup);

// --- 3A. Inner Core (Andar ka Lal Hissa) ---
const coreGeo = new THREE.OctahedronGeometry(0.8, 0);
const coreMat = new THREE.MeshBasicMaterial({ color: 0xff3333, wireframe: true }); 
const innerCore = new THREE.Mesh(coreGeo, coreMat);
hologramGroup.add(innerCore);

// --- 3B. Outer Armor Plates (Bahar ke 25 tukde) ---
const shellPieces = [];
const shellGeo = new THREE.TetrahedronGeometry(0.5, 0); // Chote shapes
const shellMat = new THREE.MeshBasicMaterial({ color: 0x00d8ff, wireframe: true, transparent: true, opacity: 0.9 });

for(let i = 0; i < 25; i++) {
    const piece = new THREE.Mesh(shellGeo, shellMat);
    
    // Maths to distribute 25 pieces evenly in a sphere shape around the core
    const phi = Math.acos(-1 + (2 * i) / 25);
    const theta = Math.sqrt(25 * Math.PI) * phi;
    
    // Assembled Position (Core ke paas)
    const startX = 1.3 * Math.cos(theta) * Math.sin(phi);
    const startY = 1.3 * Math.sin(theta) * Math.sin(phi);
    const startZ = 1.3 * Math.cos(phi);
    piece.position.set(startX, startY, startZ);
    
    // Exploded Position (Core se door blast hone par kahan jayenge)
    const explodeDir = new THREE.Vector3(startX, startY, startZ).normalize();
    const explodedPos = new THREE.Vector3().copy(piece.position).add(explodeDir.multiplyScalar(3.5)); // Door phaikna
    
    // Save data for animation
    piece.userData = {
        assembledPos: new THREE.Vector3(startX, startY, startZ),
        explodedPos: explodedPos,
        rotSpeed: new THREE.Vector3(Math.random()*0.05, Math.random()*0.05, Math.random()*0.05)
    };
    
    shellPieces.push(piece);
    hologramGroup.add(piece);
}

// 4. Tracking & Audio Variables
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;
let explodeMode = false; 

// Sounds
const assembleSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); 
const explodeSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
let isLocked = false;

// 5. WebSockets (J.A.R.V.I.S. Vision)
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
    document.getElementById('tracking-status').innerText = "HAND TRACKING ACTIVE";
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    mouseX = (data.x * window.innerWidth) - windowHalfX;
    mouseY = (data.y * window.innerHeight) - windowHalfY; 
    
    // CONDITION 1: EXPLODE MODE (Jab Panja Poora Khula Ho)
    if (data.palm_open && !data.pinch) {
        if (!explodeMode) {
            explodeSound.currentTime = 0;
            explodeSound.play().catch(e => console.log("Audio Blocked"));
            explodeMode = true;
            
            // HUD Text Change
            document.getElementById('tracking-status').innerText = "DISASSEMBLY MODE: SCANNING CORE";
            document.getElementById('tracking-status').style.color = "#ffaa00"; // Orange Warning Color
            document.getElementById('flash-overlay').style.opacity = "0.5"; // Halka sa flash
            setTimeout(() => { document.getElementById('flash-overlay').style.opacity = "0"; }, 150);
        }
    } 
    // CONDITION 2: ASSEMBLE/GRAB MODE (Jab Pinch Kiya Ho)
    else if (data.pinch) {
        if (explodeMode) {
            assembleSound.currentTime = 0;
            assembleSound.play().catch(e => console.log("Audio Blocked"));
        }
        explodeMode = false;
        
        document.getElementById('tracking-status').innerText = "OBJECT GRABBED";
        document.getElementById('tracking-status').style.color = "#ff3333"; // Red
    } 
    // CONDITION 3: NORMAL STATE
    else {
        if (explodeMode) {
            assembleSound.currentTime = 0;
            assembleSound.play().catch(e => console.log("Audio Blocked"));
        }
        explodeMode = false;
        
        document.getElementById('tracking-status').innerText = "HAND TRACKING ACTIVE";
        document.getElementById('tracking-status').style.color = "#00ffcc";
    }
};

// 6. Animation Loop (Jahan Asli Magic Hota Hai)
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate Rings & Group
    ring1.rotation.x += 0.005; ring1.rotation.y -= 0.005;
    ring2.rotation.y += 0.01;  ring2.rotation.z -= 0.01;
    hologramGroup.rotation.x += 0.002;
    hologramGroup.rotation.y += 0.003;
    innerCore.rotation.y -= 0.01; // Core reverse direction mein ghumega

    // EXPLOSION ANIMATION (Lerp for smooth transition)
    shellPieces.forEach(piece => {
        // Agar explode mode true hai toh bahar jao, warna wapas core ke paas aao
        const targetPos = explodeMode ? piece.userData.explodedPos : piece.userData.assembledPos;
        piece.position.lerp(targetPos, 0.1); // 0.1 speed hai jisse wo smooth hawa mein tairte hue jayenge
        
        // Har ek tukda apne aap ghumta rahega
        piece.rotation.x += piece.userData.rotSpeed.x;
        piece.rotation.y += piece.userData.rotSpeed.y;
    });

    // Hand Parallax (Camera Tilt)
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;
    scene.rotation.y += 0.05 * (targetX - scene.rotation.y);
    scene.rotation.x += 0.05 * (targetY - scene.rotation.x);

    renderer.render(scene, camera);
}
animate(); 

// 7. Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}); 

// 8. Fake System Data
setInterval(() => {
    document.getElementById('energy-level').innerText = Math.floor(Math.random() * (99 - 85 + 1) + 85);
    document.getElementById('ping-rate').innerText = Math.floor(Math.random() * (30 - 10 + 1) + 10);
    const coordX = (Math.random() * 100).toFixed(4);
    const coordY = (Math.random() * 100).toFixed(4);
    document.getElementById('coordinates').innerText = `${coordX}, ${coordY}`;
}, 800);