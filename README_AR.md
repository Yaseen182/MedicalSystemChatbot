# 🏥 MedAI - نظام استشارة طبية ذكي

## 📖 نظرة عامة

تطبيق ويب شامل لاستشارات طبية ذكية باستخدام:
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **AI**: Claude API + RAG (Retrieval Augmented Generation)
- **Database**: PostgreSQL
- **Cache**: Redis

---

## ✨ المميزات

### 👥 للمستخدمين
- 🔐 نظام تسجيل وتسجيل دخول آمن
- 💬 محادثة ذكية مع AI طبي
- 📊 لوحة تحكم شخصية مع الإحصائيات
- 📝 سجل كامل للجلسات السابقة
- 📋 تقارير طبية مفصلة
- ⚠️ كشف حالات الطوارئ

### 👨‍💼 للمسؤولين
- 📈 لوحة تحكم إدارية
- 👀 مراقبة المحادثات الحية
- 🚨 إدارة الحالات الحرجة
- 📚 إدارة قاعدة المعرفة الطبية
- 📊 تحليلات النظام

---

## 🚀 البدء السريع

### المتطلبات
- Node.js (v16+)
- npm أو yarn
- PostgreSQL
- Redis (اختياري)

### التثبيت والتشغيل

#### 1. Backend
```bash
cd backend
npm install
npm start
# سيعمل على http://localhost:4000
```

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# سيعمل على http://localhost:3000
```

### الوصول
- 🌐 اذهب إلى `http://localhost:3000`
- 📝 قم بالتسجيل أو الدخول
- 💬 ابدأ المحادثة مع الـ AI

---

## 📁 هيكل المشروع

```
MedAI/
├── backend/
│   ├── src/
│   │   ├── app.js              # تطبيق Express
│   │   ├── server.js           # خادم Node
│   │   ├── config/
│   │   │   ├── index.js        # متغيرات البيئة
│   │   │   ├── database.js     # PostgreSQL
│   │   │   ├── redis.js        # Redis
│   │   │   └── schema.sql      # قاعدة البيانات
│   │   ├── routes/
│   │   │   ├── auth.js         # مسارات المصادقة
│   │   │   ├── chat.js         # مسارات Chat
│   │   │   ├── dashboard.js    # مسارات Dashboard
│   │   │   └── admin.js        # مسارات Admin
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── sessionService.js
│   │   │   └── reportService.js
│   │   ├── ai/
│   │   │   ├── orchestrator.js
│   │   │   ├── claudeClient.js
│   │   │   └── prompts.js
│   │   ├── rag/
│   │   │   └── ragService.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   └── utils/
│   │       └── logger.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── utils/
│   │   │   └── api.js          # ✨ API client
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   ├── AdminPage.jsx
│   │   │   └── LandingPage.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── UI.jsx
│   │   │   └── Icon.jsx
│   │   └── styles/
│   │       └── GlobalStyles.jsx
│   ├── .env                    # ✨ متغيرات البيئة
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── CHANGELOG.md                # ✨ سجل التغييرات
├── INTEGRATION_GUIDE.md        # ✨ دليل التكامل
├── RUNNING_GUIDE.md            # ✨ دليل التشغيل
└── README.md                   # هذا الملف
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register      - تسجيل مستخدم جديد
POST   /api/auth/login         - تسجيل دخول
GET    /api/auth/me            - بيانات المستخدم الحالي
```

### Chat
```
POST   /api/chat/session       - إنشاء جلسة جديدة
POST   /api/chat/message       - إرسال رسالة
GET    /api/chat/sessions      - الحصول على الجلسات
GET    /api/chat/sessions/:id  - جلسة محددة
```

### Dashboard
```
GET    /api/dashboard/stats    - إحصائيات المستخدم
GET    /api/dashboard/sessions - جلسات المستخدم
GET    /api/dashboard/reports  - التقارير
```

### Admin
```
GET    /api/admin/stats        - إحصائيات النظام
GET    /api/admin/conversations - المحادثات الحية
GET    /api/admin/flags        - الحالات المرفوعة
GET    /api/admin/users        - المستخدمين
```

---

## 🔐 الأمان

✅ **المصادقة**: JWT tokens
✅ **التشفير**: Password hashing مع bcrypt
✅ **CORS**: مفعل وآمن
✅ **Rate Limiting**: حماية من الإساءة
✅ **Input Validation**: تحقق من جميع الـ inputs
✅ **Token Management**: إدارة تلقائية للتوكنات

---

## 🛠 التكنولوجيات

### Frontend
- **React 18** - مكتبة UI
- **Vite** - أداة البناء
- **Axios** - HTTP client
- **CSS3** - التصميم

### Backend
- **Express.js** - web framework
- **PostgreSQL** - قاعدة البيانات
- **Redis** - caching
- **JWT** - المصادقة
- **Claude API** - AI

### DevOps
- **Docker** - containerization
- **Docker Compose** - orchestration

---

## 📝 مثال على الاستخدام

```jsx
// استيراد API client
import { authAPI, chatAPI, dashboardAPI } from './utils/api';

// تسجيل الدخول
const response = await authAPI.login({
  email: 'user@example.com',
  password: 'password123'
});

// حفظ التوكن
localStorage.setItem('authToken', response.data.token);

// إرسال رسالة
const chatResponse = await chatAPI.sendMessage(sessionId, 'I have a fever');

// الحصول على الإحصائيات
const stats = await dashboardAPI.getStats();
```

---

## 🚀 التطوير

### إضافة ميزة جديدة

1. **Backend**:
   ```bash
   cd backend
   # أضف endpoint في src/routes/
   # أضف logic في src/services/
   # test مع Postman
   ```

2. **Frontend**:
   ```bash
   cd frontend
   # أضف method في src/utils/api.js
   # أضف component أو page جديدة
   # استدعِ API من Component
   ```

### الاختبار

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

---

## 📊 معلومات إضافية

### متغيرات البيئة

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:4000/api
```

**Backend (.env)**:
```env
PORT=4000
NODE_ENV=development
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost:5432/medai
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=your-groq-key
FRONTEND_URL=http://localhost:3000
```

---

## 🆘 استكشاف الأخطاء

### المشكلة: Backend لا يتصل
**الحل**:
- تأكد من تشغيل Backend على port 4000
- تحقق من CORS settings
- تحقق من firewall

### المشكلة: Token لا يحفظ
**الحل**:
- تأكد من localStorage مفعل
- تحقق من DevTools > Application
- امسح cache وحاول مرة أخرى

### المشكلة: Database connection error
**الحل**:
- تأكد من PostgreSQL يعمل
- تحقق من DATABASE_URL
- تأكد من وجود قاعدة البيانات

---

## 📚 الموارد

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [JWT Guide](https://jwt.io)
- [Vite Guide](https://vitejs.dev)

---

## 📄 الملفات المهمة

- ✅ **INTEGRATION_GUIDE.md** - دليل تفصيلي للتكامل
- ✅ **RUNNING_GUIDE.md** - خطوات التشغيل والاختبار
- ✅ **CHANGELOG.md** - سجل جميع التغييرات
- ✅ **README.md** - هذا الملف (نظرة عامة)

---

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:
1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push الفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

---

## 📧 التواصل

للأسئلة والاقتراحات:
- 📧 البريد: contact@medai.com
- 🐦 Twitter: @MedAI
- 💬 Discord: [رابط المجتمع]

---

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](./LICENSE)

---

## 🎉 شكراً!

شكراً لاستخدامك MedAI! نتمنى لك تجربة رائعة. 🏥✨

---

**آخر تحديث**: مايو 2026

**الإصدار**: 1.0.0

**الحالة**: ✅ جاهز للإنتاج
