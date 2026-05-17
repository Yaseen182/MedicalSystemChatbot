# 🚀 دليل التشغيل - MedAI

## بدء التطبيق

### 1️⃣ تشغيل Backend

```bash
# انتقل إلى مجلد Backend
cd backend

# تثبيت المكتبات
npm install

# تشغيل الخادم
npm start
```

**سيعمل على**: `http://localhost:4000`

### 2️⃣ تشغيل Frontend

```bash
# في نافذة terminal جديدة، انتقل إلى مجلد Frontend
cd frontend

# تثبيت المكتبات
npm install

# تشغيل التطبيق
npm run dev
```

**سيعمل على**: `http://localhost:3000` (أو port آخر)

---

## 🧪 اختبار التطبيق

### خطوات الاختبار:

1. **اذهب إلى الصفحة الرئيسية**
   ```
   http://localhost:3000
   ```

2. **اضغط على "Get Started"**

3. **اختر "Sign Up" لإنشاء حساب جديد**
   ```
   Email: test@example.com
   Password: Password123 (أو أي كلمة مرور ≥ 8 أحرف)
   ```

4. **بعد التسجيل، سيتم نقلك إلى صفحة Chat**

5. **اختبر المحادثة**
   ```
   أكتب: "I have a fever and headache"
   ```

6. **استعرض Dashboard و History و Reports**

7. **إذا كنت Admin، اذهب إلى Admin Panel**
   ```
   استخدم email يحتوي على "admin"
   مثال: admin@example.com
   ```

---

## 📊 ملخص التكامل

### API Endpoints

#### Auth (`/api/auth`)
- ✅ `POST /register` - تسجيل مستخدم
- ✅ `POST /login` - تسجيل دخول
- ✅ `GET /me` - بيانات المستخدم

#### Chat (`/api/chat`)
- ✅ `POST /session` - إنشاء جلسة
- ✅ `POST /message` - إرسال رسالة
- ✅ `GET /sessions` - قائمة الجلسات

#### Dashboard (`/api/dashboard`)
- ✅ `GET /stats` - الإحصائيات
- ✅ `GET /sessions` - جلسات المستخدم

#### Reports (`/api/dashboard/reports`)
- ✅ `GET /` - التقارير
- ✅ `GET /:id` - تقرير محدد

#### Admin (`/api/admin`)
- ✅ `GET /analytics` - بيانات النظام
- ✅ `GET /flagged-sessions` - جلسات الطوارئ

---

## 🔧 مشاكل شائعة وحلولها

### ❌ Backend not connecting
```
✅ تأكد من:
- Backend يعمل على http://localhost:4000
- CORS مفعل في Backend
- لا توجد firewall تمنع الوصول
```

### ❌ Token not saving
```
✅ حقق في:
- localStorage مفعل في المتصفح
- DevTools > Application > Cookies/Storage
```

### ❌ 401 Unauthorized errors
```
✅ تحقق من:
- التوكن محفوظ في localStorage
- التوكن لم ينتهِ صلاحيته
- هيدر Authorization صحيح
```

---

## 📁 بنية المشروع

```
MedAI/
├── backend/
│   ├── src/
│   │   ├── app.js              # تطبيق Express
│   │   ├── server.js           # خادم Node
│   │   ├── config/             # متغيرات البيئة
│   │   ├── routes/             # مسارات API
│   │   ├── services/           # منطق الأعمال
│   │   ├── middleware/         # middlewares
│   │   ├── ai/                 # AI orchestration
│   │   ├── rag/                # RAG service
│   │   └── utils/              # مساعدات
│   ├── docker-compose.yml      # Docker setup
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # التطبيق الرئيسي
│   │   ├── main.jsx            # نقطة الدخول
│   │   ├── utils/
│   │   │   └── api.js          # API client ✨ جديد
│   │   ├── pages/              # صفحات التطبيق
│   │   ├── components/         # مكونات React
│   │   └── styles/             # CSS global
│   ├── .env                    # متغيرات البيئة ✨ جديد
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── INTEGRATION_GUIDE.md        # دليل التكامل ✨ جديد
└── RUNNING_GUIDE.md            # دليل التشغيل (هذا الملف)
```

---

## 🌐 متغيرات البيئة

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000/api
```

### Backend (.env)
```env
PORT=4000
NODE_ENV=development
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
```

---

## 🎯 المميزات المطبقة

✨ **ربط كامل Frontend ↔ Backend**
- ✅ نظام المصادقة (Auth)
- ✅ إدارة الجلسات (Sessions)
- ✅ إرسال الرسائل (Chat)
- ✅ جلب البيانات (Dashboard)
- ✅ إدارة التقارير (Reports)
- ✅ لوحة التحكم (Admin)

🔐 **إدارة التوكن**
- ✅ حفظ التوكن في localStorage
- ✅ إرسال التوكن مع كل طلب
- ✅ معالجة انتهاء الصلاحية
- ✅ استعادة المستخدم عند تحميل الصفحة

🛡️ **معالجة الأخطاء**
- ✅ Try/catch في جميع API calls
- ✅ رسائل خطأ واضحة للمستخدم
- ✅ Fallback data للـ demo
- ✅ Logging للأخطاء

---

## 📝 ملاحظات مهمة

1. **تأكد من وجود Base de Données**
   - PostgreSQL يجب أن يكون مثبت وجاهز

2. **Redis (اختياري)**
   - مفيد لـ caching و sessions

3. **API Keys**
   - تأكد من وضع GROQ_API_KEY أو API الخاص بك

4. **CORS Settings**
   - تأكد أن Backend يسمح بـ CORS من Frontend

---

## 🆘 للمساعدة

إذا واجهت مشكلة:

1. تحقق من console للأخطاء
2. اقرأ سجل Backend في الـ terminal
3. تأكد من اتصالك بـ localhost:4000
4. تحقق من localStorage (DevTools > Application)
5. جرّب بتصفية المتصفح (Incognito/Private)

---

## ✅ قائمة التحقق

قبل تشغيل التطبيق:

- [ ] تم تثبيت Node.js
- [ ] تم تثبيت npm
- [ ] تم تثبيت PostgreSQL
- [ ] تم تشغيل Backend
- [ ] تم تشغيل Frontend
- [ ] localhost:4000 يعمل
- [ ] localStorage مفعل

---

**🎉 تم التكامل بنجاح! استمتع بـ MedAI** 🏥✨
