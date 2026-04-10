# 🧠 Valora — Inteligência Operacional para Clínicas

> ⚠️ **Status: MVP (Minimum Viable Product)**  
Este projeto está em fase inicial e em evolução ativa. A versão atual já está publicada e funcional, mas ainda em desenvolvimento contínuo com foco em validação de produto.

---

## 🔗 Acesso ao Projeto

- 🌐 Front-end: https://renanntj.github.io/Valora  
- ⚙️ API: https://valora-api-g8rh.onrender.com  
- 💼 LinkedIn: https://www.linkedin.com/in/renanalves433/   

---

## 📌 Visão Geral

O **Valora** é um SaaS de inteligência operacional para clínicas de saúde, projetado para transformar dados operacionais em decisões estratégicas.

Diferente de sistemas tradicionais que apenas exibem métricas, o Valora interpreta os dados e entrega recomendações acionáveis.

**Objetivo central:**
> Identificar perdas financeiras e orientar ações diretas para aumento de eficiência e faturamento.

---

## 🚨 Problema

Sistemas atuais:
- Exibem dados, mas não decisões
- Dependem de interpretação manual
- Não priorizam problemas críticos

Consequência:
- Faltas não tratadas
- Receita perdida
- Gestão reativa

---

## 💡 Solução

O Valora atua como uma camada de inteligência sobre os dados da clínica:

```
Dados → Processamento → Análise → Recomendação
```

Entrega:
- Diagnóstico claro
- Impacto financeiro
- Ações práticas

---

## 🚀 Funcionalidades (MVP)

- Upload de planilhas (.xlsx, .xls, .csv)
- Processamento automático de dados
- Cálculo de métricas operacionais
- Análise interpretativa com IA
- Interface web funcional

---

## 🧱 Arquitetura

### 🔙 Back-end

- FastAPI
- Arquitetura modular
- Autenticação via JWT (Access + Refresh Token)
- Proteção de rotas com Bearer Token

#### Principais rotas:

**Autenticação**
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout

**Clínica**
- POST /api/v1/clinica/criar-clinica

**Assinatura**
- GET /api/v1/assinatura/status
- POST /api/v1/assinatura/renovar

**Análise**
- POST /api/v1/analise/upload-analise

---

### 🔐 Segurança

- JWT com expiração
- Refresh token
- Estrutura preparada para blocklist (Redis)
- Rate limit (login)

---

### 🎨 Front-end

Foco em:
- Simplicidade
- UX direta
- Fluxo sem fricção

Fluxo principal:
1. Upload de planilha
2. Processamento
3. Resultado interpretado

---

## 📊 Status do Projeto

| Componente | Status |
|-----------|--------|
| MVP | ✅ Publicado |
| API | ✅ Estável |
| Front-end | 🔄 Evolução |
| Inteligência | 🔄 Refinamento |
| Escala | ⏳ Planejado |

---

## 🎯 Roadmap

### Fase 2
- Automação de ações (lembretes, follow-up)
- Integração com WhatsApp

### Fase 3
- Alertas proativos
- Inteligência contínua
- Benchmark entre clínicas

---

## ⚠️ Observação

Este projeto foi desenvolvido com foco em:
- Estudo
- Evolução técnica
- Validação de produto

Não representa ainda uma versão final comercial.

---

## 👨‍💻 Autor

Renan Alves  
Backend Developer | Python | APIs | IA  

LinkedIn: https://www.linkedin.com/in/renanalves433/

---

## 📌 Conclusão

O Valora não é apenas um sistema de gestão.

É uma proposta de mudança:

> De dados para decisão  
> De análise para ação  
> De operação para inteligência  
