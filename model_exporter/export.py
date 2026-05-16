# 仮想環境をアクティベート
# .\.venv\Scripts\activate
# ディアクティベート
# deactivate

import sys
# tensorflow_decision_forests の読み込みを偽装してエラーをスキップ
sys.modules['tensorflow_decision_forests'] = object()

from ultralytics import YOLO

# Load the YOLO26 model
model = YOLO("yolo26n.pt")

# iOS向け
# model.export(format="coreml")

# Android向け
# model.export(format="tflite")

# Export the model to TF.js format
# creates '/yolo26n_web_model'
model.export(format="tfjs",imgsz=(160,160))

# Load the exported TF.js model
tfjs_model = YOLO("./yolo26n_web_model")

# Run inference
results = tfjs_model("https://ultralytics.com/images/bus.jpg")
