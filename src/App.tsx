import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { BusinessDataProvider } from './context/BusinessDataContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Revenue from './pages/Revenue'
import Expenses from './pages/Expenses'
import Employees from './pages/Employees'
import SocialMedia from './pages/SocialMedia'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Calendar from './pages/Calendar'
import Integrations from './pages/Integrations'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <BusinessDataProvider>
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/social" element={<SocialMedia />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AppProvider>
      </BusinessDataProvider>
    </BrowserRouter>
  )
}
