# صادر — STEP Protocol Demo

**Saudi Trade Export Protocol** — نظام تفاوض متعدد الوكلاء لتصدير المنتجات السعودية

مشروع Agenticthon 2026 | محور Agent-to-Agent (A2A)

---

## الفكرة

٥ وكلاء ذكاء اصطناعي يتواصلون بلغة موحدة (STEP Protocol / JSON-LD) لإيجاد أفضل وجهة تصدير لتمور سكري من القصيم:

```
MarketAgent ──→ ComplianceAgent  →  CONSTRAINT_WARNING (JAKIM 14 يوم)
            ──→ LogisticsAgent   →  LOGISTICS_ESTIMATED
DocumentAgent  →  TIMELINE_RISK
MarketAgent    →  PROPOSE_ALTERNATIVE (الإمارات)
ConsensusEngine → CALL_FOR_VOTE → 4× CAST_VOTE → DECISION_REACHED (إجماع تام)
DocumentAgent  →  DOCUMENT_GENERATED (فاتورة تجارية)
```

---

## المتطلبات

| الأداة | الإصدار |
|--------|---------|
| .NET SDK | 9.0+ |
| Node.js | 18+ |
| Anthropic API Key | claude-sonnet-4-6 |

---

## التشغيل

### 1. إعداد المفتاح

```bash
# src/Sader.Api/appsettings.Development.json
{
  "CLAUDE_API_KEY": "sk-ant-..."
}
```

أو عبر متغير البيئة:
```bash
export CLAUDE_API_KEY=sk-ant-...
```

### 2. تشغيل الـ Backend

```bash
cd src/Sader.Api
dotnet run
# API يعمل على http://localhost:5172
```

### 3. تشغيل الـ Frontend

```bash
cd src/sadr-ui
npm install
npm run dev
# UI يعمل على http://localhost:3000
```

### 4. الـ Demo

افتح [http://localhost:3000](http://localhost:3000) واضغط **"▶ ابدأ استشارة التصدير"**

---

## البنية التقنية

```
Sader/
├── src/
│   ├── Step.Protocol/          # STEP Protocol types (JSON-LD)
│   │   ├── StepMessage.cs      # Message envelope record
│   │   ├── StepIntent.cs       # 13 intent types
│   │   ├── Payloads.cs         # Payload types
│   │   └── StepJsonContext.cs  # JSON serialization helpers
│   │
│   ├── Sader.Agents/           # AI Agents
│   │   ├── MarketAgent.cs      # Market analysis + alternative proposals
│   │   ├── ComplianceAgent.cs  # Regulatory requirements checker
│   │   ├── DocumentAgent.cs    # Document generation + timeline risk
│   │   ├── LogisticsAgent.cs   # Freight cost + transit time
│   │   ├── ConsensusEngine.cs  # Vote orchestration + decision making
│   │   ├── StepOrchestrator.cs # Pipeline coordinator
│   │   └── ClaudeService.cs    # Anthropic SDK wrapper
│   │
│   ├── Sader.Api/              # ASP.NET Core 9 Web API
│   │   ├── Controllers/        # REST endpoints
│   │   ├── Hubs/               # SignalR real-time streaming
│   │   └── Data/               # EF Core + SQLite
│   │
│   └── sadr-ui/                # React 18 + Vite + Tailwind (RTL)
│       └── src/
│           ├── components/     # ConversationTimeline, AgentStatusPanel, ...
│           ├── hooks/          # useStepConversation (SignalR)
│           └── types/          # TypeScript types
│
└── seeds/
    ├── compliance_rules.json   # بيانات الامتثال (ماليزيا / الإمارات)
    └── market_data.json        # بيانات السوق
```

---

## STEP Protocol

كل رسالة بين الوكلاء تتبع هذا الـ schema:

```json
{
  "@context": "https://stepprotocol.trade/ontology/v0.1#",
  "@type": "StepMessage",
  "messageId": "uuid",
  "intent": "constraintWarning",
  "sender": "complianceAgent",
  "receiver": "marketAgent",
  "conversationId": "uuid",
  "timestamp": "2026-04-13T09:14:33Z",
  "confidence": 0.95,
  "payload": { ... }
}
```

---

## API Endpoints

| Method | Path | الوظيفة |
|--------|------|---------|
| `POST` | `/api/conversations` | بدء محادثة جديدة |
| `GET`  | `/api/conversations/{id}` | جلب محادثة + رسائلها |
| `GET`  | `/api/conversations` | قائمة آخر 20 محادثة |
| WS     | `/hubs/step` | SignalR real-time stream |

---

## الفريق

**صادر** — Agenticthon 2026
