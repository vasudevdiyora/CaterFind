import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/global.css'
import App from './App.jsx'
import { DialogProvider } from './components/DialogProvider.jsx'

createRoot(document.getElementById('root')).render(
  <DialogProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </DialogProvider>,
)
