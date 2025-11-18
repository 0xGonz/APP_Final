import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import ClinicView from './pages/ClinicView'
import Comparison from './pages/Comparison'
import Analytics from './pages/Analytics'
import DataManagement from './pages/DataManagement'

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clinic/:clinicId" element={<ClinicView />} />
        <Route path="/comparison" element={<Comparison />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/data-management" element={<DataManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default App
