from ultralytics import YOLO

# YOLO26のNanoモデルを自動ダウンロードして読み込み
model = YOLO("yolo26n.pt")

# サンプル画像に対するオブジェクト検出を実行
#（sourceに画像URLを指定すると、自動でダウンロードして解析します）
results = model.predict(source="https://ultralytics.com/images/bus.jpg", save=True)

print("推論が完了しました。結果は 'runs/detect/predict' フォルダに保存されています。")
