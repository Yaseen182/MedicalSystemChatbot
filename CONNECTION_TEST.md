# ✅ التحقق من الاتصال - MedAI

بعد تثبيت Frontend و Backend، يمكنك اختبار الاتصال باستخدام:

## 🖥️ Windows (PowerShell)

```powershell
.\test-connection.ps1
```

أو يدويًا:
```powershell
# اختبار Backend
Invoke-WebRequest -Uri "http://localhost:4000/health"

# اختبر Frontend
Invoke-WebRequest -Uri "http://localhost:3000"
```

---

## 🐧 Linux / macOS (Bash)

```bash
chmod +x test-connection.sh
./test-connection.sh
```

أو يدويًا:
```bash
# اختبر Backend
curl http://localhost:4000/health

# اختبر Frontend
curl http://localhost:3000
```

---

## 📋 ما يتحقق منه الاختبار

✅ Backend يعمل على http://localhost:4000
✅ Frontend يعمل على http://localhost:3000
✅ CORS مفعل
✅ API Endpoints متاحة:
  - /health
  - /api/auth/login
  - /api/chat/session
  - /api/dashboard/stats

---

## 🚀 بعد نجاح الاختبار

1. افتح المتصفح على: http://localhost:3000
2. قم بالتسجيل أو الدخول
3. ابدأ باستخدام التطبيق

---

## ❌ إذا فشل الاختبار

### Backend غير متاح؟
```bash
cd backend
npm install
npm start
# يجب أن يعمل على port 4000
```

### Frontend غير متاح؟
```bash
cd frontend
npm install
npm run dev
# يجب أن يعمل على port 3000
```

### CORS معطل؟
تأكد من ملف `backend/src/app.js` يحتوي على:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
```

---

## 📊 الحالة الحالية

| الخدمة | Port | الحالة |
|------|------|--------|
| Backend | 4000 | ✅ جاهز للاختبار |
| Frontend | 3000 | ✅ جاهز للاختبار |
| Database | 5432 | ⚙️ يجب أن يكون مشغل |
| Redis | 6379 | ⚙️ اختياري |

---

## 🎯 الخطوات الموصى بها

1. **التحقق من الاتصال**
   ```bash
   # Windows
   .\test-connection.ps1
   
   # Linux/macOS
   ./test-connection.sh
   ```

2. **تسجيل حساب جديد**
   - Email: test@example.com
   - Password: Test@123

3. **اختبر الميزات**
   - Chat مع AI
   - عرض Dashboard
   - عرض History
   - عرض Reports
   - Admin Panel (إذا كنت admin)

4. **راقب Console**
   - تحقق من DevTools (F12)
   - لا يجب أن تظهر أخطاء API

---

## 🔍 أوامر مفيدة للتشخيص

### التحقق من Ports المستخدمة

**Windows:**
```powershell
netstat -ano | findstr ":4000"
netstat -ano | findstr ":3000"
```

**Linux/macOS:**
```bash
lsof -i :4000
lsof -i :3000
```

### التحقق من Services

**Windows:**
```powershell
Get-Process node  # قائمة Node processes
```

**Linux/macOS:**
```bash
ps aux | grep node
```

---

## 📝 ملاحظات مهمة

✅ تأكد من تشغيل الأوامر من الـ path الصحيح
✅ استخدم terminals منفصلة لـ backend و frontend
✅ لا تغلق terminals أثناء الاختبار
✅ تحقق من firewall لا يمنع الـ ports
✅ امسح cache المتصفح إذا واجهت مشاكل

---

## 🆘 للمساعدة

إذا واجهت مشاكل:

1. اقرأ ملف [RUNNING_GUIDE.md](./RUNNING_GUIDE.md)
2. اقرأ ملف [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
3. تحقق من console للأخطاء
4. جرّب إعادة البدء (Ctrl+C ثم npm start)

---

**🎉 نتمنى أن يعمل كل شيء بسلاسة!**
