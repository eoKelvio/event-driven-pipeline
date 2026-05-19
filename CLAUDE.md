# Event-Driven Pipeline — Instruções do Projeto

## Plano Ativo

O plano completo está em:
```
/home/kelvin-silvestre/.claude/plans/tarefa-refatorar-projeto-staged-moonbeam.md
```

Leia esse arquivo no início de cada sessão antes de responder qualquer pergunta sobre o que fazer a seguir.

---

## Abordagem Obrigatória

Este projeto segue um ciclo **educativo + implementação**. Nunca pule para o código sem antes explicar.

Para cada fase, o ciclo é:
1. **Explicar** — o que é a tecnologia, como funciona, por que foi escolhida, analogias com o que o usuário já conhece
2. **Aguardar** — deixar o usuário confirmar que entendeu antes de avançar
3. **Implementar** — só então escrever o código
4. **Revisitar** — tirar dúvidas antes de passar para a próxima fase

Nunca implementar múltiplas fases sem pausa para explicação.

---

## Estado Atual das Fases

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Fundação (monorepo, shared, docker-compose infra) | ✅ Concluída |
| 2 | Webhook Service | ✅ Concluída |
| 3 | Storage Service | ✅ Concluída |
| 4 | Streaming Service (GraphQL + MongoDB) | ✅ Concluída |
| 5 | Infra & Monitoring (Dockerfiles, nginx, Grafana) | ✅ Concluída |
| 6 | Monitoring Dashboard (Next.js + Socket.io) | ⏳ Pendente |
| 7 | Polimento (coverage, Docker Hub) | ⏳ Pendente |

---

## Contexto Técnico

- **Repo:** https://github.com/eoKelvio/event-driven-pipeline
- **Branch principal de desenvolvimento:** `develop`
- **Stack:** TypeScript, Fastify, KafkaJS, Drizzle ORM, Mongoose, Apollo Server 4, Pothos, Prometheus, Grafana
- **Portas:** webhook `:9999`, storage `:9998`, streaming `:9997`, dashboard `:3000`
- **Tópicos Kafka:** `events.{person,account,card}.{raw,stored}`, `triggers.consolidation`

---

## Regras de Git

- Commits granulares por unidade lógica (não por fase inteira)
- Formato: `feat(scope): descrição` em inglês
- PRs via `gh` CLI com `GH_TOKEN` do `.env` (o MCP GitHub está autenticado na conta Voidr, não na pessoal)
- Nunca commitar sem o usuário pedir explicitamente
