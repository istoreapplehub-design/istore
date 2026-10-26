import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { WebView } from "react-native-webview";
import { API_URL } from "../constants/config";

interface DeviceFinishes {
  name: string;
  hex: string;
  accent: string;
}

export interface DeviceConfig {
  key: string;
  name: string;
  category: "iPhone" | "Mac" | "iPad" | "Watch" | "AirPods";
  type: "iphone" | "macbook" | "ipad" | "watch" | "airpods";
  dimensions: { height: string; width: string; depth: string; weight: string };
  finishes: DeviceFinishes[];
  features: string[];
}

const DEVICE_MODELS: Record<string, DeviceConfig> = {
  "iphone-16-pro-max": {
    key: "iphone-16-pro-max",
    name: "iPhone 16 Pro Max",
    category: "iPhone",
    type: "iphone",
    dimensions: { height: "163.0 mm", width: "77.6 mm", depth: "8.25 mm", weight: "227 grams" },
    finishes: [
      { name: "Desert Titanium", hex: "#C4A287", accent: "#D4B297" },
      { name: "Natural Titanium", hex: "#9E978E", accent: "#B8B1A8" },
      { name: "White Titanium", hex: "#E8E7E3", accent: "#FFFFFF" },
      { name: "Black Titanium", hex: "#323130", accent: "#1A1A1A" }
    ],
    features: [
      "Grade 5 Titanium enclosure with micro-blasted texture",
      "Camera Control sensor for instant visual intelligence",
      "A18 Pro 3nm silicon with 6-core GPU & hardware ray tracing",
      "48MP Fusion Camera with 5x Telephoto tetraprism optical zoom"
    ],
  },
  "iphone-16-pro": {
    key: "iphone-16-pro",
    name: "iPhone 16 Pro",
    category: "iPhone",
    type: "iphone",
    dimensions: { height: "149.6 mm", width: "71.5 mm", depth: "8.25 mm", weight: "199 grams" },
    finishes: [
      { name: "Desert Titanium", hex: "#C4A287", accent: "#D4B297" },
      { name: "Natural Titanium", hex: "#9E978E", accent: "#B8B1A8" },
      { name: "White Titanium", hex: "#E8E7E3", accent: "#FFFFFF" },
      { name: "Black Titanium", hex: "#323130", accent: "#1A1A1A" }
    ],
    features: [
      "6.3″ Super Retina XDR display with ProMotion 120Hz",
      "Action Button & dedicated Camera Control sensor",
      "A18 Pro performance with enhanced neural accelerators",
      "Titanium frame with thinner bezels and rounded corners"
    ],
  },
  "iphone-16": {
    key: "iphone-16",
    name: "iPhone 16",
    category: "iPhone",
    type: "iphone",
    dimensions: { height: "147.6 mm", width: "71.6 mm", depth: "7.80 mm", weight: "170 grams" },
    finishes: [
      { name: "Ultramarine", hex: "#4B6CB7", accent: "#5C7FCF" },
      { name: "Teal", hex: "#5E9B9B", accent: "#72B3B3" },
      { name: "Pink", hex: "#E5A4B2", accent: "#F2B8C4" },
      { name: "White", hex: "#F5F5F7", accent: "#FFFFFF" },
      { name: "Black", hex: "#2C2C2E", accent: "#1A1A1A" }
    ],
    features: [
      "Aerospace-grade aluminum with color-infused back glass",
      "Dynamic Island & 48MP 2-in-1 Fusion camera system",
      "A18 chip optimized for Apple Intelligence",
      "Action Button for customized quick workflows"
    ],
  },
  "macbook-pro-16": {
    key: "macbook-pro-16",
    name: "MacBook Pro 16″ (M4 Max)",
    category: "Mac",
    type: "macbook",
    dimensions: { height: "16.8 mm", width: "355.7 mm", depth: "248.1 mm", weight: "2.16 kg" },
    finishes: [
      { name: "Space Black", hex: "#2E2F32", accent: "#1E1F21" },
      { name: "Silver", hex: "#E3E4E5", accent: "#F0F0F2" }
    ],
    features: [
      "16.2″ Liquid Retina XDR display with nano-texture option",
      "M4 Max silicon with up to 16-core CPU & 40-core GPU",
      "Full-height function row Magic Keyboard & Force Touch trackpad",
      "Six-speaker sound system with force-cancelling woofers"
    ],
  },
  "ipad-pro-13": {
    key: "ipad-pro-13",
    name: "iPad Pro 13″ (M4 Tandem OLED)",
    category: "iPad",
    type: "ipad",
    dimensions: { height: "281.6 mm", width: "215.5 mm", depth: "5.10 mm", weight: "579 grams" },
    finishes: [
      { name: "Space Black", hex: "#2E2F32", accent: "#1E1F21" },
      { name: "Silver", hex: "#E3E4E5", accent: "#F0F0F2" }
    ],
    features: [
      "Ultra-thin 5.1mm unibody design — thinnest Apple product ever",
      "Ultra Retina XDR display with groundbreaking Tandem OLED technology",
      "M4 silicon powering advanced generative AI acceleration",
      "Support for Apple Pencil Pro with barrel roll & haptic squeeze"
    ],
  },
  "apple-watch-ultra-2": {
    key: "apple-watch-ultra-2",
    name: "Apple Watch Ultra 2",
    category: "Watch",
    type: "watch",
    dimensions: { height: "49.0 mm", width: "44.0 mm", depth: "14.4 mm", weight: "61.4 grams" },
    finishes: [
      { name: "Natural Titanium", hex: "#9E978E", accent: "#B8B1A8" },
      { name: "Black Titanium", hex: "#323130", accent: "#1A1A1A" }
    ],
    features: [
      "49mm aerospace-grade titanium case with raised bezel edge",
      "3000 nit sapphire crystal display with Night Mode",
      "Customizable Action Button in international safety orange",
      "Precision dual-frequency GPS & 36-hour normal battery life"
    ],
  },
  "airpods-pro-2": {
    key: "airpods-pro-2",
    name: "AirPods Pro 2",
    category: "AirPods",
    type: "airpods",
    dimensions: { height: "45.2 mm", width: "60.6 mm", depth: "21.7 mm", weight: "50.8 grams" },
    finishes: [
      { name: "White Gloss", hex: "#F5F5F7", accent: "#FFFFFF" }
    ],
    features: [
      "H2 chip delivering up to 2x more Active Noise Cancellation",
      "Adaptive Audio dynamically blending ANC and Transparency",
      "MagSafe Case (USB-C) with speaker for Find My and lanyard loop",
      "All-new Hearing Protection, Hearing Test & Clinical-Grade Hearing Aid"
    ],
  }
};

function resolveDeviceKey(input?: string): string {
  if (!input) return "iphone-16-pro-max";
  const s = input.toLowerCase();
  if (s.includes("macbook") || s.includes("mac")) return "macbook-pro-16";
  if (s.includes("ipad")) return "ipad-pro-13";
  if (s.includes("watch")) return "apple-watch-ultra-2";
  if (s.includes("airpod")) return "airpods-pro-2";
  if (s.includes("16-pro-max") || s.includes("pro-max")) return "iphone-16-pro-max";
  if (s.includes("16-pro") || s.includes("pro")) return "iphone-16-pro";
  if (s.includes("16")) return "iphone-16";
  return "iphone-16-pro-max";
}

export default function ArViewerScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const params = useLocalSearchParams<{ model?: string; color?: string }>();

  // Determine Active Model
  const initialKey = resolveDeviceKey(params.model);
  const [selectedDeviceKey, setSelectedDeviceKey] = useState<string>(initialKey);
  const activeDevice = DEVICE_MODELS[selectedDeviceKey] || DEVICE_MODELS["iphone-16-pro-max"];

  // View Mode: 'studio' (3D inspector) or 'ar' ("View in your space")
  const [selectedFinishIndex, setSelectedFinishIndex] = useState(0);
  const [showDimensions, setShowDimensions] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const activeFinish = activeDevice.finishes[selectedFinishIndex] || activeDevice.finishes[0];

  // Update 3D color finish when swatch clicked
  useEffect(() => {
    if (webViewRef.current && isReady) {
      const script = `if (window.setDeviceFinish) { window.setDeviceFinish('${activeFinish.hex}'); } true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [selectedFinishIndex, isReady, activeFinish.hex]);

  // Update 3D model when active device changes
  useEffect(() => {
    if (webViewRef.current && isReady) {
      const script = `if (window.switchDeviceModel) { window.switchDeviceModel('${activeDevice.type}', '${activeFinish.hex}', '${activeDevice.name}'); } true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [selectedDeviceKey, isReady, activeDevice.type, activeFinish.hex, activeDevice.name]);

  const handleToggleAutoRotate = () => {
    Haptics.selectionAsync();
    const nextVal = !autoRotate;
    setAutoRotate(nextVal);
    if (webViewRef.current && isReady) {
      const script = `if (window.setAutoRotate) { window.setAutoRotate(${nextVal}); } true;`;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleResetCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (webViewRef.current && isReady) {
      const script = `if (window.resetCamera) { window.resetCamera(); } true;`;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleShare = async () => {
    Haptics.selectionAsync();
    await Share.share({
      title: `${activeDevice.name} 3D Studio`,
      message: `Experience the new ${activeDevice.name} in interactive 3D & AR with LesTrades UCC Cape Coast.`
    });
  };

  // Generate Three.js WebGL Engine HTML with multi-device geometry
  const initialType = activeDevice.type;
  const initialHex = activeFinish.hex;
  const initialName = activeDevice.name;

  const htmlContent = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
          html, body { width: 100%; height: 100%; overflow: hidden; background: #0C0C0E; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          #canvas-container { width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 2; }
        </style>
        <script src="${API_URL}/models/three.r128.min.js"></script>
        <script src="${API_URL}/models/OrbitControls.js"></script>
      </head>
      <body>
        <div id="canvas-container"></div>

        <script>
          let scene, camera, renderer, controls, deviceGroup;
          let activeDeviceType = "${initialType}";
          let currentFinishColor = "${initialHex}";
          let currentDeviceName = "${initialName}";
          let isRotating = true;

          // Touch Drag Fallback
          let isTouching = false;
          let prevTouchX = 0, prevTouchY = 0;

          function init() {
            const container = document.getElementById('canvas-container');
            const width = window.innerWidth;
            const height = window.innerHeight;

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0C0C0E);

            camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
            camera.position.set(0, 0, 26);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.15;
            container.appendChild(renderer.domElement);

            if (typeof THREE.OrbitControls !== 'undefined') {
              controls = new THREE.OrbitControls(camera, renderer.domElement);
              controls.enableDamping = true;
              controls.dampingFactor = 0.06;
              controls.autoRotate = true;
              controls.autoRotateSpeed = 1.8;
              controls.minDistance = 10;
              controls.maxDistance = 45;
              controls.enablePan = false;
            }

            // Studio Lighting Setup
            const ambient = new THREE.AmbientLight(0xffffff, 0.95);
            scene.add(ambient);

            const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
            keyLight.position.set(12, 16, 20);
            scene.add(keyLight);

            const fillLight = new THREE.DirectionalLight(0x0066cc, 0.7);
            fillLight.position.set(-14, -10, 15);
            scene.add(fillLight);

            const rimLight = new THREE.DirectionalLight(0xffffff, 1.3);
            rimLight.position.set(0, 18, -16);
            scene.add(rimLight);

            buildCurrentDevice(activeDeviceType, currentFinishColor);

            window.addEventListener('resize', onResize);

            // Manual Touch Orbit Listeners
            renderer.domElement.addEventListener('touchstart', (e) => {
              if (e.touches.length === 1) {
                isTouching = true;
                prevTouchX = e.touches[0].clientX;
                prevTouchY = e.touches[0].clientY;
              }
            });

            renderer.domElement.addEventListener('touchmove', (e) => {
              if (isTouching && e.touches.length === 1 && deviceGroup) {
                const dx = e.touches[0].clientX - prevTouchX;
                const dy = e.touches[0].clientY - prevTouchY;
                deviceGroup.rotation.y += dx * 0.012;
                deviceGroup.rotation.x += dy * 0.012;
                prevTouchX = e.touches[0].clientX;
                prevTouchY = e.touches[0].clientY;
              }
            });

            renderer.domElement.addEventListener('touchend', () => {
              isTouching = false;
            });

            animate();

            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
            }
          }

          function buildCurrentDevice(type, finishHex) {
            if (deviceGroup) {
              scene.remove(deviceGroup);
            }
            deviceGroup = new THREE.Group();
            scene.add(deviceGroup);

            if (type === 'macbook') {
              buildMacBook(finishHex);
            } else if (type === 'ipad') {
              buildIPad(finishHex);
            } else if (type === 'watch') {
              buildAppleWatch(finishHex);
            } else if (type === 'airpods') {
              buildAirPods();
            } else {
              buildIPhone(finishHex);
            }
          }

          // 1. iPhone 16 Pro Max 3D Geometry
          function buildIPhone(finishHex) {
            const w = 7.76;
            const h = 16.3;
            const d = 0.825;
            const r = 1.1;

            const shape = new THREE.Shape();
            shape.moveTo(-w/2 + r, -h/2);
            shape.lineTo(w/2 - r, -h/2);
            shape.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r);
            shape.lineTo(w/2, h/2 - r);
            shape.quadraticCurveTo(w/2, h/2, w/2 - r, h/2);
            shape.lineTo(-w/2 + r, h/2);
            shape.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r);
            shape.lineTo(-w/2, -h/2 + r);
            shape.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2);

            const geo = new THREE.ExtrudeGeometry(shape, {
              depth: d,
              bevelEnabled: true,
              bevelSegments: 6,
              steps: 2,
              bevelSize: 0.1,
              bevelThickness: 0.1
            });
            geo.center();

            const mat = new THREE.MeshStandardMaterial({
              color: new THREE.Color(finishHex),
              metalness: 0.82,
              roughness: 0.28
            });
            const chassis = new THREE.Mesh(geo, mat);
            chassis.name = "chassis";
            deviceGroup.add(chassis);

            // Front Screen
            const screenGeo = new THREE.PlaneGeometry(w - 0.35, h - 0.35);
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 512, 1024);
            grad.addColorStop(0, '#0a1020');
            grad.addColorStop(0.5, '#004499');
            grad.addColorStop(1, '#050810');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 512, 1024);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.font = 'bold 44px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('9:41', 256, 170);

            ctx.fillStyle = '#0066CC';
            ctx.font = 'bold 22px -apple-system, sans-serif';
            ctx.fillText('LESTRADES_UCC', 256, 215);

            const screenTex = new THREE.CanvasTexture(canvas);
            const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
            const screen = new THREE.Mesh(screenGeo, screenMat);
            screen.position.z = d/2 + 0.11;
            deviceGroup.add(screen);

            // Dynamic Island
            const island = new THREE.Mesh(
              new THREE.PlaneGeometry(1.6, 0.45),
              new THREE.MeshBasicMaterial({ color: 0x000000 })
            );
            island.position.set(0, h/2 - 1.1, d/2 + 0.12);
            deviceGroup.add(island);

            // Back Frosted Plate
            const backMat = new THREE.MeshStandardMaterial({
              color: new THREE.Color(finishHex),
              metalness: 0.35,
              roughness: 0.4
            });
            const back = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, h - 0.2), backMat);
            back.name = "backPlate";
            back.position.z = -d/2 - 0.11;
            back.rotation.y = Math.PI;
            deviceGroup.add(back);

            // Rear Camera Plateau
            const plateau = new THREE.Mesh(
              new THREE.BoxGeometry(3.4, 3.6, 0.25),
              new THREE.MeshStandardMaterial({ color: new THREE.Color(finishHex), metalness: 0.4, roughness: 0.3 })
            );
            plateau.position.set(-w/2 + 2.2, h/2 - 2.3, -d/2 - 0.24);
            deviceGroup.add(plateau);

            // 3 Sapphire Lenses
            const lensMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.95, roughness: 0.1 });
            const l1 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 24), lensMat);
            l1.rotation.x = Math.PI/2;
            l1.position.set(-w/2 + 1.6, h/2 - 1.5, -d/2 - 0.36);
            deviceGroup.add(l1);

            const l2 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 24), lensMat);
            l2.rotation.x = Math.PI/2;
            l2.position.set(-w/2 + 1.6, h/2 - 3.1, -d/2 - 0.36);
            deviceGroup.add(l2);

            const l3 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 24), lensMat);
            l3.rotation.x = Math.PI/2;
            l3.position.set(-w/2 + 2.8, h/2 - 2.3, -d/2 - 0.36);
            deviceGroup.add(l3);
          }

          // 2. MacBook Pro 16″ 3D Geometry
          function buildMacBook(finishHex) {
            const baseW = 16.5;
            const baseD = 11.5;
            const baseH = 0.5;

            // Aluminum Base Unibody
            const baseMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(finishHex), metalness: 0.85, roughness: 0.25 });
            const base = new THREE.Mesh(new THREE.BoxGeometry(baseW, baseH, baseD), baseMat);
            base.position.set(0, -baseH/2, baseD/4);
            base.name = "chassis";
            deviceGroup.add(base);

            // Keyboard Well & Black Keys
            const kbWell = new THREE.Mesh(
              new THREE.PlaneGeometry(13.5, 5.2),
              new THREE.MeshBasicMaterial({ color: 0x151515 })
            );
            kbWell.rotation.x = -Math.PI/2;
            kbWell.position.set(0, 0.01, baseD/4 - 1.2);
            deviceGroup.add(kbWell);

            // Trackpad
            const trackpad = new THREE.Mesh(
              new THREE.PlaneGeometry(6.2, 3.8),
              new THREE.MeshStandardMaterial({ color: new THREE.Color(finishHex), metalness: 0.6, roughness: 0.3 })
            );
            trackpad.rotation.x = -Math.PI/2;
            trackpad.position.set(0, 0.01, baseD/4 + 3.4);
            deviceGroup.add(trackpad);

            // Screen Clamshell Lid (Angled at 110 deg)
            const lidH = 11.0;
            const lid = new THREE.Group();
            lid.position.set(0, 0, -baseD/4 + 0.3);
            lid.rotation.x = 0.35; // open angle

            const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(baseW, lidH, 0.3), baseMat);
            lidMesh.position.set(0, lidH/2, 0);
            lid.add(lidMesh);

            // Liquid Retina XDR Screen
            const screenCanvas = document.createElement('canvas');
            screenCanvas.width = 1024;
            screenCanvas.height = 640;
            const sctx = screenCanvas.getContext('2d');
            const sgrad = sctx.createLinearGradient(0, 0, 1024, 640);
            sgrad.addColorStop(0, '#001F3F');
            sgrad.addColorStop(0.5, '#0066CC');
            sgrad.addColorStop(1, '#050D1A');
            sctx.fillStyle = sgrad;
            sctx.fillRect(0, 0, 1024, 640);

            sctx.fillStyle = '#FFFFFF';
            sctx.font = 'bold 36px -apple-system, sans-serif';
            sctx.textAlign = 'center';
            sctx.fillText('macOS Sequoia · M4 Max', 512, 320);

            sctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            sctx.font = '22px -apple-system, sans-serif';
            sctx.fillText('LESTRADES_UCC CAPE COAST', 512, 370);

            const screenTex = new THREE.CanvasTexture(screenCanvas);
            const retinaScreen = new THREE.Mesh(
              new THREE.PlaneGeometry(baseW - 0.8, lidH - 0.8),
              new THREE.MeshBasicMaterial({ map: screenTex })
            );
            retinaScreen.position.set(0, lidH/2, 0.16);
            lid.add(retinaScreen);

            deviceGroup.add(lid);
            deviceGroup.position.y = -3;
          }

          // 3. iPad Pro 13″ 3D Geometry
          function buildIPad(finishHex) {
            const w = 13.5;
            const h = 18.0;
            const d = 0.28;

            const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(finishHex), metalness: 0.85, roughness: 0.25 });
            const ipad = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            ipad.name = "chassis";
            deviceGroup.add(ipad);

            // Tandem OLED Screen
            const canvas = document.createElement('canvas');
            canvas.width = 768;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 768, 1024);
            grad.addColorStop(0, '#100620');
            grad.addColorStop(0.5, '#440099');
            grad.addColorStop(1, '#0066CC');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 768, 1024);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 42px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('iPad Pro · Tandem OLED', 384, 512);

            const screen = new THREE.Mesh(
              new THREE.PlaneGeometry(w - 0.6, h - 0.6),
              new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) })
            );
            screen.position.z = d/2 + 0.01;
            deviceGroup.add(screen);

            // Rear Camera Module
            const cam = new THREE.Mesh(
              new THREE.BoxGeometry(2.4, 2.4, 0.2),
              new THREE.MeshStandardMaterial({ color: new THREE.Color(finishHex), metalness: 0.5, roughness: 0.3 })
            );
            cam.position.set(-w/2 + 1.8, h/2 - 1.8, -d/2 - 0.1);
            deviceGroup.add(cam);
          }

          // 4. Apple Watch Ultra 2 3D Geometry
          function buildAppleWatch(finishHex) {
            const w = 5.2;
            const h = 6.2;
            const d = 2.0;

            const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(finishHex), metalness: 0.88, roughness: 0.22 });
            const watchCase = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            watchCase.name = "chassis";
            deviceGroup.add(watchCase);

            // Sapphire Display
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#050508';
            ctx.fillRect(0, 0, 512, 512);

            ctx.fillStyle = '#FF9500';
            ctx.font = 'bold 90px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('09:41', 256, 280);

            ctx.fillStyle = '#34C759';
            ctx.font = 'bold 30px -apple-system, sans-serif';
            ctx.fillText('LESTRADES · ULTRA 2', 256, 340);

            const face = new THREE.Mesh(
              new THREE.PlaneGeometry(w - 0.4, h - 0.4),
              new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) })
            );
            face.position.z = d/2 + 0.02;
            deviceGroup.add(face);

            // Orange Action Button (Left)
            const actionBtn = new THREE.Mesh(
              new THREE.BoxGeometry(0.3, 1.8, 0.8),
              new THREE.MeshStandardMaterial({ color: 0xFF5500, roughness: 0.3 })
            );
            actionBtn.position.set(-w/2 - 0.15, 0.2, 0);
            deviceGroup.add(actionBtn);

            // Digital Crown (Right)
            const crown = new THREE.Mesh(
              new THREE.CylinderGeometry(0.65, 0.65, 0.6, 24),
              new THREE.MeshStandardMaterial({ color: new THREE.Color(finishHex), metalness: 0.9, roughness: 0.1 })
            );
            crown.rotation.z = Math.PI/2;
            crown.position.set(w/2 + 0.3, 1.2, 0);
            deviceGroup.add(crown);

            // Alpine Loop Strap (Top & Bottom)
            const strapMat = new THREE.MeshStandardMaterial({ color: 0xD87D38, roughness: 0.8 });
            const topStrap = new THREE.Mesh(new THREE.BoxGeometry(w - 0.8, 5.0, 0.4), strapMat);
            topStrap.position.set(0, h/2 + 2.5, 0);
            deviceGroup.add(topStrap);

            const bottomStrap = new THREE.Mesh(new THREE.BoxGeometry(w - 0.8, 5.0, 0.4), strapMat);
            bottomStrap.position.set(0, -h/2 - 2.5, 0);
            deviceGroup.add(bottomStrap);
          }

          // 5. AirPods Pro 2 3D Geometry
          function buildAirPods() {
            const w = 6.0;
            const h = 4.5;
            const d = 2.2;

            const caseMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.1, metalness: 0.05 });
            const airpodCase = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), caseMat);
            deviceGroup.add(airpodCase);

            // Lid Seam
            const seam = new THREE.Mesh(
              new THREE.PlaneGeometry(w + 0.02, 0.05),
              new THREE.MeshBasicMaterial({ color: 0xCCCCCC })
            );
            seam.position.set(0, 0.7, d/2 + 0.01);
            deviceGroup.add(seam);

            // LED Status Light
            const led = new THREE.Mesh(
              new THREE.CircleGeometry(0.12, 16),
              new THREE.MeshBasicMaterial({ color: 0x34C759 })
            );
            led.position.set(0, 0.1, d/2 + 0.02);
            deviceGroup.add(led);
          }

          function onResize() {
            if (!camera || !renderer) return;
            const width = window.innerWidth;
            const height = window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
          }

          function animate() {
            requestAnimationFrame(animate);
            if (controls) controls.update();
            renderer.render(scene, camera);
          }

          // Bridge Functions
          window.switchDeviceModel = function(type, hexColor, deviceName) {
            activeDeviceType = type;
            currentFinishColor = hexColor;
            currentDeviceName = deviceName;
            buildCurrentDevice(type, hexColor);
          };

          window.setDeviceFinish = function(hexColor) {
            currentFinishColor = hexColor;
            if (deviceGroup) {
              deviceGroup.traverse((child) => {
                if (child.name === "chassis" || child.name === "backPlate") {
                  child.material.color.set(hexColor);
                }
              });
            }
          };

          window.setAutoRotate = function(rotate) {
            isRotating = Boolean(rotate);
            if (controls) controls.autoRotate = isRotating;
          };

          window.resetCamera = function() {
            if (controls) controls.reset();
            if (deviceGroup) {
              deviceGroup.rotation.set(0, 0, 0);
            }
          };

          window.addEventListener('DOMContentLoaded', init);
        </script>
      </body>
      </html>
    `;
  }, [initialType, initialHex, initialName]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
          hitSlop={12}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>

        {/* Studio title */}
        <View style={styles.segmentedControl}>
          <View style={[styles.toggleBtn, styles.toggleBtnActive]}>
            <Ionicons name="cube-outline" size={15} color="#FFFFFF" />
            <Text style={[styles.toggleBtnText, styles.toggleBtnTextActive]}>
              3D Studio
            </Text>
          </View>
        </View>
      </View>

      {/* Top Device Selector Rail: Tap to switch models dynamically */}
      <View style={styles.deviceRailWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deviceRailContent}>
          {Object.entries(DEVICE_MODELS).map(([key, d]) => (
            <Pressable
              key={key}
              onPress={() => {
                setSelectedDeviceKey(key);
                setSelectedFinishIndex(0);
                Haptics.selectionAsync();
              }}
              style={[styles.deviceChip, selectedDeviceKey === key && styles.deviceChipActive]}
            >
              <Text style={[styles.deviceChipText, selectedDeviceKey === key && styles.deviceChipTextActive]}>
                {d.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Main 3D Stage with Real WebGL WebView */}
      <View style={styles.stage}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: htmlContent }}
          style={styles.webView}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === "ready") {
                setIsReady(true);
              }
            } catch (_) {}
          }}
        />

        {/* Floating Physical Dimensions Badge */}
        {showDimensions && (
          <View style={styles.dimensionsFloatingBox}>
            <Text style={styles.dimensionsTitle}>{activeDevice.name} True Dimensions</Text>
            <Text style={styles.dimensionsSubtitle}>
              Height: {activeDevice.dimensions.height} · Width: {activeDevice.dimensions.width} · Depth: {activeDevice.dimensions.depth} ({activeDevice.dimensions.weight})
            </Text>
            <Text style={styles.dimensionsHubTag}>Certified Spec @ LESTRADES_UCC CAPE COAST</Text>
          </View>
        )}

        {/* Floating Quick Camera Controls */}
        <View style={styles.stageActionStrip}>
          <Pressable
            onPress={handleToggleAutoRotate}
            style={[styles.stageIconBtn, autoRotate && styles.stageIconBtnActive]}
            hitSlop={8}
          >
            <Ionicons
              name="sync-outline"
              size={18}
              color={autoRotate ? "#0066CC" : "#FFFFFF"}
            />
          </Pressable>

          <Pressable
            onPress={handleResetCamera}
            style={styles.stageIconBtn}
            hitSlop={8}
          >
            <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={handleShare}
            style={styles.stageIconBtn}
            hitSlop={8}
          >
            <Ionicons name="share-outline" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Bottom Controls Bar: Swatch Finishes & Dimensions Toggle */}
      <View style={styles.bottomBar}>
        <View style={styles.finishPickerRow}>
          <Text style={styles.finishNameLabel}>
            Finish: {activeFinish.name}
          </Text>

          {/* Color Swatches */}
          <View style={styles.swatchRow}>
            {activeDevice.finishes.map((f, i) => {
              const isSelected = i === selectedFinishIndex;
              return (
                <Pressable
                  key={f.name}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedFinishIndex(i);
                  }}
                  style={[
                    styles.swatchRing,
                    isSelected && { borderColor: "#0066CC" }
                  ]}
                >
                  <View style={[styles.swatchDot, { backgroundColor: f.hex }]} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Bottom Utility Tools */}
        <View style={styles.controlButtonsRow}>
          <Pressable
            onPress={() => setShowDimensions(!showDimensions)}
            style={[styles.toolPill, showDimensions && styles.toolPillActive]}
          >
            <Ionicons
              name="resize-outline"
              size={16}
              color={showDimensions ? "#0066CC" : "#FFFFFF"}
            />
            <Text style={[styles.toolPillText, showDimensions && styles.toolPillTextActive]}>
              Physical Scale Spec
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0C0E"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 22,
    padding: 3,
    gap: 4
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18
  },
  toggleBtnActive: {
    backgroundColor: "#0066CC"
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)"
  },
  toggleBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  deviceRailWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(0, 0, 0, 0.3)"
  },
  deviceRailContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8
  },
  deviceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)"
  },
  deviceChipActive: {
    backgroundColor: "rgba(0, 102, 204, 0.25)",
    borderColor: "#0066CC"
  },
  deviceChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)"
  },
  deviceChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  stage: {
    flex: 1,
    position: "relative"
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent"
  },
  dimensionsFloatingBox: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(20px)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)"
  },
  dimensionsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4
  },
  dimensionsSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 17,
    marginBottom: 4
  },
  dimensionsHubTag: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0066CC",
    letterSpacing: 0.4
  },
  stageActionStrip: {
    position: "absolute",
    right: 16,
    bottom: 16,
    gap: 10
  },
  stageIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center"
  },
  stageIconBtnActive: {
    backgroundColor: "rgba(0, 102, 204, 0.25)",
    borderColor: "#0066CC"
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 14
  },
  finishPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  finishNameLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  swatchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  swatchRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    padding: 2
  },
  swatchDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3
  },
  controlButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  toolPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)"
  },
  toolPillActive: {
    backgroundColor: "rgba(0, 102, 204, 0.25)",
    borderColor: "#0066CC"
  },
  toolPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  toolPillTextActive: {
    color: "#0066CC"
  }
});
