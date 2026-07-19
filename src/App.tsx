import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Today from '@/pages/Today'
import Plan from '@/pages/Plan'
import Progress from '@/pages/Progress'
import Reviews from '@/pages/Reviews'
import Assistant from '@/pages/Assistant'
import Dashboard from '@/pages/Dashboard'
import LifeScore from '@/pages/LifeScore'
import Metas from '@/pages/Metas'

// HashRouter: funciona em qualquer host estático sem configuração de servidor.
// O app segue o ciclo PDCA: Plan → Action → Progress → Check.
const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Today /> }, // ACTION
      { path: 'plan', element: <Plan /> },
      { path: 'progress', element: <Progress /> },
      { path: 'check', element: <Reviews /> },
      { path: 'stark', element: <Assistant /> },
      // Secundárias (acessadas por links dentro dos pilares)
      { path: 'painel', element: <Dashboard /> },
      { path: 'lifescore', element: <LifeScore /> },
      { path: 'metas', element: <Metas /> },
      // Compatibilidade com rotas antigas
      { path: 'objetivos', element: <Navigate to="/plan" replace /> },
      { path: 'projetos', element: <Navigate to="/plan" replace /> },
      { path: 'ideias', element: <Navigate to="/plan" replace /> },
      { path: 'assistente', element: <Navigate to="/stark" replace /> },
      { path: 'progresso', element: <Navigate to="/progress" replace /> },
      { path: 'revisoes', element: <Navigate to="/check" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
