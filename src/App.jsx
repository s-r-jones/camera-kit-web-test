import { useRef, useEffect } from "react";
import {
  bootstrapCameraKit,
  Transform2D,
  createMediaStreamSource,
} from "@snap/camera-kit";
import { Push2Web } from "@snap/push2web";
import "./App.css";

const LENS_GROUP_ID = "542c15e5-1f57-450b-b0c6-f3f29df229aa";

function App() {
  const cameraKitRef = useRef(null);
  const canvasRef = useRef(null);
  const sessionRef = useRef(null);
  const push2WebRef = useRef(null);

  useEffect(() => {
    async function initCameraKit() {
      if (!push2WebRef.current) {
        const push2web = new Push2Web();
        push2WebRef.current = push2web;

        push2web.events.addEventListener("error", async (event) => {
          const { id } = event.detail;

          const newLens = await cameraKitRef.current?.lensRepository.loadLens(
            id,
            LENS_GROUP_ID
          );
          await session.applyLens(newLens);
        });
      }

      const cameraKit = await bootstrapCameraKit(
        {
          apiToken: import.meta.env.VITE_CAMERA_KIT_API_KEY,
        },
        (container) => container.provides(push2WebRef.current)
      );
      cameraKitRef.current = cameraKit;

      const { lenses } = await cameraKit.lensRepository.loadLensGroups([
        LENS_GROUP_ID,
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
      const source = createMediaStreamSource(mediaStream, {
        transform: Transform2D.MirrorX,
        cameraType: "front",
      });
      session.setSource(source);
      await session.applyLens(lenses[8]);
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
