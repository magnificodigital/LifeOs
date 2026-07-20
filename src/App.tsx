import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Today from '@/pages/Today'
import Agenda from '@/pages/Agenda'
import Kanban from '@/pages/Kanban'
import Plan from '@/pages/Plan'
import Progress from '@/pages/Progress'
import Stark from '@/pages/Stark'
import Finances from '@/pages/Finances'
import Notes from '@/pages/Notes'
import Connections from '@/pages/Connections'

// Navegação PLANA: um clique para cada tela, sem abas aninhadas.
const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Today /> },
      { path: 'agenda', element: <Agenda /> },
      { path: 'planejar', element: <Plan /> },
      { path: 'evolucao', element: <Progress /> },
      { path: 'stark', element: <Stark /> },
      { path: 'kanban', element: <Kanban /> },
      { path: 'financas', element: <Finances /> },
      { path: 'notas', element: <Notes /> },
      { path: 'conexoes', element: <Connections /> },
      // Rotas antigas → novas
      { path: 'plan', element: <Navigate to="/planejar" replace /> },
      { path: 'progress', element: <Navigate to="/evolucao" replace /> },
      { path: 'progresso', element: <Navigate to="/evolucao" replace /> },
      { path: 'check', element: <Navigate to="/evolucao" replace /> },
      { path: 'revisoes', element: <Navigate to="/evolucao" replace /> },
      { path: 'objetivos', element: <Navigate to="/planejar" replace /> },
      { path: 'projetos', element: <Navigate to="/planejar" replace /> },
      { path: 'ideias', element: <Navigate to="/planejar" replace /> },
      { path: 'assistente', element: <Navigate to="/stark" replace /> },
      { path: 'painel', element: <Navigate to="/evolucao" replace /> },
      { path: 'lifescore', element: <Navigate to="/" replace /> },
      { path: 'metas', element: <Navigate to="/planejar" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
