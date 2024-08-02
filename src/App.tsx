import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const App = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [modelUrl, setModelUrl] = useState<string>("");

  useEffect(() => {
    if (!mountRef.current) return;

    const mountElement = mountRef.current;

    // シーン、カメラ、レンダラーの設定
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();

    renderer.setSize(window.innerWidth, window.innerHeight);
    mountElement.appendChild(renderer.domElement);

    // ライトの追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    camera.position.z = 5;

    // OrbitControlsの設定
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    // glTFモデルのロード
    const loader = new GLTFLoader();
    let model: THREE.Object3D | null = null;

    if (modelUrl) {
      loader.load(
        modelUrl,
        (gltf) => {
          model = gltf.scene;
          scene.add(model);

          // モデルの中心を計算し、カメラの位置を調整
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = camera.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

          camera.position.z = cameraZ * 1.5;
          camera.updateProjectionMatrix();

          // モデルを中心に配置
          model.position.x = -center.x;
          model.position.y = -center.y;
          model.position.z = -center.z;
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        (error) => {
          console.error("An error happened", error);
        }
      );
    }

    // アニメーションループ
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // ウィンドウリサイズ時の処理
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // クリーンアップ関数
    return () => {
      if (model) {
        scene.remove(model);
      }
      mountElement.removeChild(renderer.domElement);
      window.removeEventListener("resize", handleResize);
    };
  }, [modelUrl]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
    }
  };

  return (
    <div>
      <input type="file" accept=".gltf,.glb" onChange={handleFileUpload} />
      <div ref={mountRef} className="w-full h-screen" />
    </div>
  );
};

export default App;
