import { useEffect } from 'react';
import { FpsCounter, recordFrame } from './FpsCounter';

interface SmartphoneCameraProps {
  onRunModel: (...args: any[]) => Promise<any>;
}

let smartphone_camera: any = undefined;


export function SmartphoneCamera({ onRunModel }: SmartphoneCameraProps) {
  async function render() {
    smartphone_camera?.render();
    const imageData = smartphone_camera.get_imageData();
    await onRunModel(imageData);
    recordFrame();
    requestAnimationFrame(render);
  }

  useEffect(() => {
    (async () => {
      if (smartphone_camera === undefined) {
        smartphone_camera = null;
        console.log("cv", (window as any).cv);


        const fileName = 'smartphone_camera.js';
        const component = await import(/* @vite-ignore */ `${import.meta.env.BASE_URL}webcamera/${fileName}`);
        let video_info = await component.smartphone_camera.init();
        console.log(video_info)

        smartphone_camera = component.smartphone_camera;
        console.log(smartphone_camera)
        requestAnimationFrame(render);
      }

    })();
  }, []);

  return (
    <>
      <FpsCounter />
    </>
  );
}