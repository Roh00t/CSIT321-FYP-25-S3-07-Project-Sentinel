import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ColorModeProvider } from "./components/ui/color-mode"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { ColorModeButton } from "./components/ui/color-mode"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider value={defaultSystem}>
       <ColorModeProvider>
          <ColorModeButton className="dark-mode-btn"/>
          <App />
       </ColorModeProvider>
    </ChakraProvider>
  </StrictMode>,
)
