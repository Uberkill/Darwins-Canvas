import React from 'react'
import ReactDOM from 'react-dom/client'
import { DesignSystemSandbox } from './ui/DesignSystemSandbox'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DesignSystemSandbox />
  </React.StrictMode>,
)
