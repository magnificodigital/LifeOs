import { createHashRouter, RouterProvider } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import LifeScore from '@/pages/LifeScore'
import Goals from '@/pages/Goals'
import Metas from '@/pages/Metas'
import Projects from '@/pages/Projects'
import Ideas from '@/pages/Ideas'
import Assistant from '@/pages/Assistant'
import Reviews from '@/pages/Reviews'

// HashRouter: funciona em qualquer host estático (GitHub Pages, Netlify, etc.)
// sem exigir configuração de rewrite no servidor.
const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'lifescore', element: <LifeScore /> },
      { path: 'objetivos', element: <Goals /> },
      { path: 'metas', element: <Metas /> },
      { path: 'projetos', element: <Projects /> },
      { path: 'ideias', element: <Ideas /> },
      { path: 'assistente', element: <Assistant /> },
      { path: 'revisoes', element: <Reviews /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
