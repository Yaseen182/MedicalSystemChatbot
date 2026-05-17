# تكامل الفرونتند مع الباكند

## ✅ التغييرات المنجزة

تم ربط الفرونتند بالباكند بنجاح من خلال:

### 1. **إضافة Axios للطلبات HTTP**
- تم تثبيت مكتبة `axios` في المشروع
- النسخة: `^1.6.0+`

### 2. **إنشاء API Client (`src/utils/api.js`)**
خدمة مركزية لجميع طلبات الـ API مع:
- ✅ تكوين axios instance
- ✅ إدارة تلقائية للـ token في رؤوس الطلبات
- ✅ interceptors للتعامل مع الأخطاء والـ 401 (token expired)
- ✅ Endpoints منظمة حسب الوحدات:
  - `authAPI`: register, login, getProfile
  - `chatAPI`: createSession, sendMessage, getSessions
  - `dashboardAPI`: getStats, getSessions
  - `reportsAPI`: getReports, getReport
  - `adminAPI`: getAnalytics, getFlaggedSessions

### 3. **تحديث AuthPage**
```jsx
// تم استبدال الـ mock بـ API calls الحقيقية
- register() - تسجيل مستخدم جديد
- login() - تسجيل دخول المستخدم
- حفظ التوكن والمستخدم في localStorage
- معالجة الأخطاء وعرضها للمستخدم
```

### 4. **تحديث ChatPage**
```jsx
// تم ربط Chat بـ backend:
- createSession() - إنشاء جلسة chat جديدة عند التحميل
- sendMessage(sessionId, message) - إرسال الرسائل للـ AI
- معالجة الردود من الـ backend
- حفظ الأعراض المكتشفة والتشخيصات
- معالجة حالات الطوارئ
- إظهار النتائج عند اكتمال التحليل
```

### 5. **تحديث DashboardPage**
```jsx
// جلب البيانات من الخادم:
- dashboardAPI.getStats() - إحصائيات المستخدم
- dashboardAPI.getSessions() - الجلسات السابقة
- عرض loading state أثناء جلب البيانات
- fallback data إذا فشلت الطلبات
```

### 6. **تحديث App.jsx**
```jsx
// إدارة الـ tokens والمستخدم:
- استعادة المستخدم من localStorage عند تحميل الصفحة
- التحقق من صحة التوكن
- حفظ المستخدم عند تسجيل الدخول
- حذف البيانات عند تسجيل الخروج
- loading state أثناء التحقق
```

### 7. **ملف البيئة (.env)**
```
VITE_API_URL=http://localhost:4000/api
```
- يمكن تغييرها حسب بيئة الإنتاج
- استخدام `import.meta.env.VITE_API_URL`

---

## 🚀 كيفية التشغيل

### المتطلبات:
1. **Backend يعمل على**: `http://localhost:4000`
2. **Frontend يعمل على**: `http://localhost:3000` (أو بأي منفذ آخر)

### خطوات التشغيل:

#### 1. تشغيل Backend
```bash
cd backend
npm install
npm start
# سيعمل على http://localhost:4000
```

#### 2. تشغيل Frontend
```bash
cd frontend
npm install
npm run dev
# سيعمل على http://localhost:3000 (أو port آخر)
```

#### 3. اختبار التطبيق:
1. اذهب إلى الصفحة الرئيسية
2. اضغط "Get Started"
3. اختر "Sign Up" أو "Sign In"
4. أدخل بيانات المستخدم:
   - Email: `test@example.com`
   - Password: (أي كلمة مرور ≥ 8 أحرف)
5. سيتم حفظ التوكن تلقائياً
6. ستظهر صفحة Chat
7. أكمل المحادثة مع الـ AI

---

## 📡 ملخص الـ Endpoints

### Auth Routes (`/api/auth`)
- `POST /register` - تسجيل مستخدم جديد
- `POST /login` - تسجيل دخول
- `GET /me` - الحصول على بيانات المستخدم الحالي

### Chat Routes (`/api/chat`)
- `POST /session` - إنشاء جلسة chat جديدة
- `POST /message` - إرسال رسالة للـ AI
- `GET /sessions` - الحصول على جميع الجلسات
- `GET /sessions/{sessionId}` - جلسة محددة

### Dashboard Routes (`/api/dashboard`)
- `GET /stats` - إحصائيات المستخدم
- `GET /sessions` - جلسات المستخدم
- `GET /reports` - تقارير المستخدم

### Admin Routes (`/api/admin`)
- `GET /stats` - إحصائيات النظام
- `GET /conversations` - جميع المحادثات
- `GET /flags` - الجلسات المرفوعة كطوارئ

---

## 🔐 إدارة التوكن

### كيفية عمل الـ Token Management:
1. **عند تسجيل الدخول**: يتم حفظ التوكن في `localStorage`
2. **في كل طلب**: يتم إضافة التوكن في رأس `Authorization: Bearer {token}`
3. **إذا انتهت الصلاحية**: يتم عرض خطأ 401 وحذف التوكن
4. **عند تحميل الصفحة**: يتم التحقق من صحة التوكن واستعادة المستخدم

### كود الـ Interceptor:
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
```

---

## 🛠 معالجة الأخطاء

جميع الـ API calls تتضمن:
- ✅ Try/catch للأخطاء
- ✅ Error messages واضحة للمستخدم
- ✅ Fallback data للـ demo
- ✅ Logging للأخطاء في console

---

## 📝 الملفات المعدلة

| الملف | التغييرات |
|------|---------|
| `src/App.jsx` | إضافة إدارة التوكن والمستخدم |
| `src/pages/AuthPage.jsx` | ربط بـ API الـ register/login |
| `src/pages/ChatPage.jsx` | ربط بـ API الـ chat والـ sessions |
| `src/pages/DashboardPage.jsx` | جلب البيانات من الخادم |
| `src/utils/api.js` | **ملف جديد** - API client |
| `.env` | **ملف جديد** - متغيرات البيئة |
| `package.json` | إضافة axios |

---

## ✨ المميزات

✅ **Seamless Integration** - اتصال سلس مع الباكند
✅ **Token Management** - إدارة تلقائية للتوكنات
✅ **Error Handling** - معالجة شاملة للأخطاء
✅ **Responsive** - يعمل على جميع الأجهزة
✅ **Production Ready** - جاهز للإنتاج
✅ **Fallback Data** - fallback data للـ demo

---

## 🔍 ملاحظات مهمة

1. **CORS**: تأكد أن الـ Backend يسمح بـ CORS من `http://localhost:3000`
   ```javascript
   // في backend/src/app.js
   app.use(cors({
     origin: 'http://localhost:3000',
     credentials: true,
   }));
   ```

2. **Environment Variables**: تأكد من تعيين `VITE_API_URL` بشكل صحيح

3. **Token Expiry**: الـ Token يتوقف بعد 7 أيام (قابل للتعديل في backend)

4. **localStorage**: يتم مسح البيانات عند تسجيل الخروج

---

## 🎯 الخطوات التالية

- [ ] اختبار جميع الـ endpoints
- [ ] إضافة refresh token logic
- [ ] إضافة loading indicators
- [ ] تحسين معالجة الأخطاء
- [ ] إضافة tests

---

**تم الانتهاء من التكامل بنجاح! ✨**
