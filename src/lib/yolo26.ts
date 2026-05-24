/*
yolo26
https://docs.ultralytics.com/ja/models/yolo26

tensorflow.jsへのエクスポート
(ローカルpythonで実施して、失敗している。ただonnxはできているので、それを利用する。)
https://docs.ultralytics.com/ja/integrations/tfjs

github 
https://github.com/ultralytics/ultralytics

colab (これは使っていない)
https://docs.ultralytics.com/ja/integrations/google-colab

blog (あまり参考にしていない。一応、保存しておく)
https://medium.com/@ihdaanwari5/using-object-detection-model-yolov4-with-tensorflow-js-fb5a4c264a26

*/

/*
<script src="https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js"></script>
*/

const ort = (window as any).ort;
let session: any = undefined;
let sessionPromise: Promise<any> | undefined = undefined;
const imageSize = [160, 160];

export async function runOnnxModel(input: string | ImageData, canvasId: string) {
  try {
    const cv = (window as any).cv;
    if (session === undefined) {
      if (sessionPromise === undefined) {
        sessionPromise = ort.InferenceSession.create(`${import.meta.env.BASE_URL}yolo26n_${imageSize[0]}x${imageSize[1]}.onnx`);
      }
      session = await sessionPromise;
      if (sessionPromise) {
        console.log('ONNXモデルの読み込みに成功しました。');
        sessionPromise = undefined;
      }
    }

    let src;

    if (input instanceof ImageData) {
      src = cv.matFromArray(input.height, input.width, cv.CV_8UC4, new Uint8Array(input.data));
    } else {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = input;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = image.width;
      srcCanvas.height = image.height;
      const srcCtx = srcCanvas.getContext('2d');
      if (!srcCtx) throw new Error('Canvas contextの取得に失敗しました。');
      srcCtx.drawImage(image, 0, 0);
      src = cv.imread(srcCanvas);
    }
    const dst = new cv.Mat();
    const dsize = new cv.Size(...imageSize);
    cv.resize(src, dst, dsize, 0, 0, cv.INTER_LINEAR);

    const size = imageSize[0] * imageSize[1];
    const float32Array = new Float32Array(1 * 3 * size);
    for (let i = 0; i < size; i++) {
      float32Array[i] = dst.data[i * 4] / 255.0;                 // R
      float32Array[size + i] = dst.data[i * 4 + 1] / 255.0;   // G
      float32Array[size * 2 + i] = dst.data[i * 4 + 2] / 255.0; // B
    }
    const inputTensor = new ort.Tensor('float32', float32Array, [1, 3, ...imageSize]);

    const feeds = { images: inputTensor };
    const results = await session.run(feeds);

    src.delete();
    dst.delete();

    await renderResult(canvasId, input, results.output0);

    return results;
  } catch (e) {
    console.error('エラーが発生しました:', e);
    return "エラーが発生しました";
  }
}
const yolov8_postprocess_nms = (modelOutput: any, conf_thre = 0.3) => {
  const coco_class_labels = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat", "traffic light",
    "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow",
    "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
    "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove", "skateboard", "surfboard",
    "tennis racket", "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch",
    "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote", "keyboard",
    "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase",
    "scissors", "teddy bear", "hair drier", "toothbrush",
  ];

  // [1, 300, 6] → 300件をフラットに読む
  const num_dets = modelOutput.dims[1]; // 300
  const num_vals = modelOutput.dims[2]; // 6
  const data = modelOutput.data;

  const results = [];
  for (let i = 0; i < num_dets; i++) {
    const x1 = data[i * num_vals + 0];
    const y1 = data[i * num_vals + 1];
    const x2 = data[i * num_vals + 2];
    const y2 = data[i * num_vals + 3];
    const score = data[i * num_vals + 4];
    const class_id = Math.round(data[i * num_vals + 5]);

    if (score < conf_thre) continue;

    results.push({
      bbox: [x1, y1, x2 - x1, y2 - y1] as [number, number, number, number],
      score,
      class: coco_class_labels[class_id] ?? "unknown",
    });
  }

  return results;
};
async function renderResult(canvasId: string, input: string | ImageData, results: any) {
  if (!results) return;

  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = imageSize[0];
  canvas.height = imageSize[1];

  if (input instanceof ImageData) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = input.width;
    tempCanvas.height = input.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(input, 0, 0);
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    }
  } else {
    // 画像を再読み込みしてCanvasのサイズを設定し、描画
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = input;
    await new Promise((resolve) => (image.onload = resolve));
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  }
  yolov8_postprocess_nms(results).forEach(obj => {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.strokeRect(...(obj.bbox as [number, number, number, number]));
    ctx.fillStyle = 'red';
    ctx.font = '14px sans-serif';
    ctx.fillText(`${obj.class} ${obj.score.toFixed(2)}`, obj.bbox[0], obj.bbox[1] - 4);
  });
}
