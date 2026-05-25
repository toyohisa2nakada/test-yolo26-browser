import './App.css'
import { SmartphoneCamera } from './components/SmartphoneCamera';
import { runOnnxModel } from './lib/yolo26';
function App() {
  return (
    <>
      <canvas id="outputCanvas" style={{ position: 'relative', zIndex: 10 }} />
      <SmartphoneCamera onRunModel={(args) => runOnnxModel(args, "outputCanvas")} />
    </>
  )
}
export default App
