import { useRef, useEffect, useState } from "react";
import {
  bootstrapCameraKit,
  Transform2D,
  createMediaStreamSource,
  CameraKit,
  CameraKitSession,
  RemoteApiService,
  RemoteApiServices,
  Injectable,
  remoteApiServicesFactory,
} from "@snap/camera-kit";
import { Push2Web } from "@snap/push2web";
import "./App.css";

const LENS_GROUP_ID = "542c15e5-1f57-450b-b0c6-f3f29df229aa";
const AUTH_TOKEN = "be39b419-c314-4879-906a-7b4b8284f8c0";
//be39b419-c314-4879-906a-7b4b8284f8c0

const apiService: RemoteApiService = {
  apiSpecId: "c2d89adb-e4df-436c-aded-9f9f002d43e4",
  getRequestHandler(request) {
    console.log("Request", request);

    return (reply) => {
      fetch("https://catfact.ninja/fact", {
        headers: {
          Accept: "application/json",
        },
      })
        .then((res) => res.text())
        .then((res) =>
          reply({
            status: "success",
            metadata: {},
            body: new TextEncoder().encode(res),
          })
        );
    };
  },
};

export const App = () => {
  console.log("Auth Token", AUTH_TOKEN);
  const cameraKitRef = useRef<CameraKit>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<CameraKitSession>();

  const mediaStreamRef = useRef<MediaStream>();

  const [isBackFacing, setIsBackFacing] = useState(true);

  const updateCamera = async () => {
    const isNowBackFacing = !isBackFacing;
    setIsBackFacing(isNowBackFacing);

    if (mediaStreamRef.current) {
      sessionRef.current?.pause();
      mediaStreamRef.current?.getVideoTracks()[0].stop();
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: isNowBackFacing ? "environment" : "user" },
    });

    mediaStreamRef.current = mediaStream;

    const source = createMediaStreamSource(mediaStream, {
      cameraType: isNowBackFacing ? "back" : "front",
    });

    await sessionRef.current?.setSource(source);
    if (!isNowBackFacing) source.setTransform(Transform2D.MirrorX);
    sessionRef.current?.play();
  };

  useEffect(() => {
    async function initCameraKit() {
      const push2Web = new Push2Web();
      const cameraKit = await bootstrapCameraKit(
        {
          apiToken:
            "eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA4NTQ0MTU3LCJzdWIiOiI3YjQwZWM4Ny1hNTk3LTQ0OTMtYjAyZi04YTFkOWVlYTNjZTN-U1RBR0lOR340ZGE0ZmUwYi05OTNmLTRkOGYtYjNiNC0yNjg3NjM2NjkxMzgifQ.BfK9vetSFkfUkL5_ueLB7xJv3S60SRfwIuISh_5F0V8",
        },
        (container) => {
          container.provides(
            Injectable(
              remoteApiServicesFactory.token,
              [remoteApiServicesFactory.token] as const,
              (existing: RemoteApiServices) => [...existing, apiService]
            )
          );

          container.provides(push2Web.extension);
          return container;
        }
      );
      cameraKitRef.current = cameraKit;

      const { lenses } = await cameraKit.lensRepository.loadLensGroups([
        LENS_GROUP_ID,
      ]);

      //console.log(lenses);

      // use existing canvas

      const session = await cameraKit.createSession({
        liveRenderTarget: canvasRef.current || undefined,
      });
      sessionRef.current = session;

      push2Web.subscribe(
        "5ae46969-b95f-4e08-a10f-d655548ed767",
        session,
        cameraKit.lensRepository
      );

      // PUSH2WEB
      // push2Web.events.addEventListener("error", (event) => {
      //   console.error(event.detail);
      // });

      // push2Web.events.addEventListener("lensReceived", async (event) => {
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
        video: { facingMode: isBackFacing ? "environment" : "user" },
      });

      mediaStreamRef.current = mediaStream;

      const source = createMediaStreamSource(mediaStream, {
        cameraType: "back",
      });
      await session.setSource(source);
      await session.applyLens(lenses[0]);
      session.play();
    }

    if (!cameraKitRef.current) {
      initCameraKit();
    }

    return () => {
      sessionRef.current?.pause();
    };
  }, [canvasRef]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <button
        onClick={updateCamera}
        style={{ position: "absolute", top: "2rem", right: "2rem" }}
      >
        {isBackFacing ? "switch to front" : "switch to back"}
      </button>

      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};
