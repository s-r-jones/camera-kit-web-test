import { useRef, useEffect } from "react";
import {
  bootstrapCameraKit,
  Transform2D,
  createMediaStreamSource,
} from "@snap/camera-kit";
import "./App.css";

function App() {
  const cameraKitRef = useRef(null);
  const canvasRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    async function initCameraKit() {
      const cameraKit = await bootstrapCameraKit({
        apiToken: import.meta.env.VITE_CAMERA_KIT_API_KEY,
      });
      cameraKitRef.current = cameraKit;

      const { lenses } = await cameraKit.lensRepository.loadLensGroups([
        "542c15e5-1f57-450b-b0c6-f3f29df229aa",
      ]);

      console.log(lenses);

      const session = await cameraKit.createSession({
        liveRenderTarget: canvasRef.current,
      });

      sessionRef.current = session;
      session.events.addEventListener("error", (event) =>
        console.error(event.detail)
      );
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      session.setSource(mediaStream);
      await session.applyLens(lenses[4]);
      session.play();
    }
    if (!cameraKitRef.current) {
      initCameraKit();
    }

    return () => {
      sessionRef.current &&
        sessionRef.current.stop &&
        sessionRef.current.stop();
    };
  }, []);

  return (
    <>
      <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
        <canvas ref={canvasRef} />
      </div>
    </>
  );
}

export default App;
