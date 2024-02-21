import { useRef, useEffect } from "react";
import {
  bootstrapCameraKit,
  Transform2D,
  createMediaStreamSource,
} from "@snap/camera-kit";
import { Push2Web } from "@snap/push2web";
import "./App.css";

const LENS_GROUP_ID = import.meta.env.VITE_LENS_GROUP_ID;
const AUTH_TOKEN = import.meta.env.VITE_CAMERA_KIT_AUTH_ID;

function App() {
  const cameraKitRef = useRef(null);
  const canvasRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    async function initCameraKit() {
      const push2web = new Push2Web();
      const cameraKit = await bootstrapCameraKit(
        {
          apiToken: import.meta.env.VITE_CAMERA_KIT_API_KEY,
        },
        (container) => container.provides(push2web.extension)
      );
      cameraKitRef.current = cameraKit;

      const { lenses } = await cameraKit.lensRepository.loadLensGroups([
        LENS_GROUP_ID,
      ]);

      console.log(lenses);

      const session = await cameraKit.createSession({
        liveRenderTarget: canvasRef.current,
      });

      // PUSH2WEB
      // const push2web = new Push2Web();
      // push2WebRef.current = push2web;

      // push2web.events.addEventListener("error", async (event) => {
      //   const { id } = event.detail;

      //   const newLens = await cameraKitRef.current?.lensRepository.loadLens(
      //     id,
      //     LENS_GROUP_ID
      //   );
      //   await session.applyLens(newLens);
      // });

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
