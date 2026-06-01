import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import QRPage from './components/QRPage.jsx'
import './index.css'

const isQRPage = window.location.pathname === '/qr';

ReactDOM.createRoot(document.getElementById('root')).render(
  isQRPage ? <QRPage /> : <App />
)
