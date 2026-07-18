# LifeOS AI — o sistema operacional da sua vida

> "O que é a melhor coisa que você pode fazer hoje para construir a vida que deseja daqui a 10 anos?"

LifeOS AI **não é um app de tarefas**. É um **Sistema Operacional Pessoal** onde uma IA
age como mentor, estrategista, coach executivo e conselheiro — o **CEO da sua vida** —
ajudando você a tomar melhores decisões todos os dias.

Inspirado nos princípios de Tim Ferriss, Peter Drucker, Naval Ravikant, James Clear,
David Allen e Ray Dalio: **80/20, Essencialismo, Deep Work, One Thing, Atomic Habits,
sistema em vez de motivação, automação antes de esforço, delegação antes de sobrecarga.**

Toda decisão no app responde a uma única pergunta:
**"Isso aproxima ou afasta o usuário da vida que ele deseja?"**

---

## ✨ O que já está funcionando

| Módulo | O que faz |
| --- | --- |
| **Dashboard** | Score Geral da Vida (0–100), radar das 10 dimensões, barras por área, trajetória de 14 dias, Modo CEO e Norte Financeiro. |
| **Life Score** | Check-in diário (sono, treino, peso, água, foco, deep work, receita, família, leitura, meditação, gratidão, humor…). A IA calcula o score automaticamente com pesos ponderados. |
| **Objetivos** | Objetivos de longo prazo (horizonte de 10 anos) com progresso %, prazo, próximos passos e sugestões da IA. |
| **Metas & Tarefas** | Hierarquia conectada — anual → trimestral → mensal → semanal → diária. **Nenhuma tarefa existe sem uma meta.** Marque a *One Thing* (80/20) do dia. |
| **Projetos** | Sistema de priorização: 8 critérios (impacto financeiro, propósito, escala, retorno, simplicidade, automação, sinergia, potencial de IA). A IA ranqueia e aplica a **Regra do Projeto Único** — só UM pode estar "Em Execução". |
| **Banco de Ideias** | Captura por texto ou **voz**. Sistema anti-distração: a IA nunca deixa começar por impulso — ela analisa a troca contra o projeto atual antes de qualquer decisão. |
| **Assistente IA** | Conselheiro conversacional que lê **todo** o seu estado e responde como um CEO: "no que focar", "o que delegar", "o que está atrasando sua vida", "como ganhar mais dinheiro". Mais o **Modo CEO** diário. |
| **Revisões** | Diária, semanal e mensal — com relatório executivo automático (gráficos, insights, evolução, patrimônio, peso, deep work). |

Os dados persistem localmente (localStorage) e o app vem com um usuário de exemplo
alinhado ao briefing para você explorar imediatamente.

---

## 🧠 A camada de IA

O "mentor" vive em `src/lib/ai/` e foi desenhado em duas partes:

- **`mentor.ts`** — motor estratégico **determinístico** (baseado em regras) que roda
  100% offline, sem chave de API. Ele calcula o Modo CEO, desafia o usuário
  ("Você está ocupado ou realmente produzindo resultado?"), faz a análise
  anti-distração das ideias e responde perguntas em linguagem natural.
- **`provider.ts`** — ponto único de troca para plugar um **LLM real**
  (Claude / OpenAI / Gemini). A interface `chatWithLLM()` já monta um *system prompt*
  com a persona do LifeOS + o estado da vida do usuário. Quando não configurado,
  a UI cai automaticamente no motor local.

> **Segurança:** nunca exponha chaves de modelo no cliente. Encaminhe para uma
> Edge Function (Supabase/Firebase/Vercel) que guarda o segredo. Veja `.env.example`.

---

## 🧮 Onde a filosofia vira número

`src/lib/scoring.ts`:

- **Life Score** — normaliza cada hábito (0–1) e aplica pesos: sono e deep work
  pesam mais, refletindo o que move uma vida extraordinária.
- **Prioridade de Projeto** — favorece alto impacto, alavancagem (escala/automação/IA)
  e simplicidade — os pilares do 80/20 e de "Trabalhe 4 Horas por Semana".
- **Progresso de Objetivo** — lida com metas de aumentar (patrimônio) e diminuir (peso).

---

## 🚀 Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + build de produção
npm run preview  # serve o build
```

## 🛠️ Stack

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · Recharts · Framer Motion ·
lucide-react. Router em modo *hash* — hospeda em qualquer host estático sem config.

Interface minimalista, dark mode, poucas cores, muito espaço em branco, animações
suaves — inspirada em Apple, Notion, Linear e Arc.

---

## 🗺️ Arquitetura

```
src/
├── lib/
│   ├── types.ts        # modelo de domínio (a "constituição": nada é isolado)
│   ├── scoring.ts      # motores de cálculo (Life Score, prioridade, progresso)
│   ├── store.ts        # estado global (Zustand + persistência + seed)
│   ├── utils.ts
│   └── ai/
│       ├── mentor.ts   # o conselheiro (motor de regras, offline)
│       └── provider.ts # ponte para LLM real (Claude/OpenAI/Gemini)
├── components/         # Layout + UI kit (ScoreRing, ProgressBar, Slider…)
├── pages/              # Dashboard, LifeScore, Goals, Metas, Projects, Ideas,
│                       # Assistant, Reviews
└── App.tsx             # rotas
```

---

## 🔭 Roadmap (do briefing)

Wearables e biomarcadores · IA por voz / Modo Jarvis · integração com Google/Apple
Health, Calendar, e-mail, WhatsApp, Notion, Google Drive · OCR e transcrição de
reuniões · resumo automático · mapas mentais · integração com bancos e investimentos ·
backend Supabase/PostgreSQL para sincronização multi-dispositivo.

Este repositório é a **fundação arquitetural** desses recursos: o domínio, a lógica
de decisão e a experiência já existem — as integrações se conectam nas bordas
(`provider.ts` para IA; o `store` para uma camada de sincronização).
