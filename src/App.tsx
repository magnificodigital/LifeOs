import { createHashRouter, RouterProvider } from 'react-router-dom'
import Layout from '@/components/Layout'
import Today from '@/pages/Today'
import Progress from '@/pages/Progress'
import Dashboard from '@/pages/Dashboard'
import LifeScore from '@/pages/LifeScore'
import Goals from '@/pages/Goals'
import Metas from '@/pages/Metas'
import Projects from '@/pages/Projects'
import Ideas from '@/pages/Ideas'
import Assistant from '@/pages/Assistant'
import Reviews from '@/pages/Reviews'

// HashRouter: funciona em qualquer host estático sem configuração de servidor.
const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Today /> },
      { path: 'progresso', element: <Progress /> },
      { path: 'objetivos', element: <Goals /> },
      { path: 'assistente', element: <Assistant /> },
      { path: 'painel', element: <Dashboard /> },
      { path: 'projetos', element: <Projects /> },
      { path: 'ideias', element: <Ideas /> },
      { path: 'metas', element: <Metas /> },
      { path: 'lifescore', element: <LifeScore /> },
      { path: 'revisoes', element: <Reviews /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
