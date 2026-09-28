import './styles.css'
import { Toaster } from '@litbase/ui/components/sonner'
import { TooltipProvider } from '@litbase/ui/components/tooltip'
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Taskpane } from './features/taskpane'
import { queryClient } from './lib/query-client'
import { setWordHost } from './word/office'

function render() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Taskpane />
          <Toaster position="bottom-center" />
        </TooltipProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
}

// Ausserhalb von Office (Browser-Vorschau) fehlt Office.js oder meldet keinen Host.
if (typeof Office === 'undefined') {
  render()
} else {
  void Office.onReady((info) => {
    setWordHost(info.host === Office.HostType.Word)
    render()
  })
}
