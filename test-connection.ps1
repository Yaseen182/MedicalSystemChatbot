# 🧪 اختبار التوصيل - MedAI (PowerShell)

Write-Host "🏥 اختبار MedAI Integration" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من Backend
Write-Host "🔍 التحقق من Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -ErrorAction Stop
    Write-Host "✅ Backend يعمل على port 4000" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend غير متاح" -ForegroundColor Red
    Write-Host "   يرجى التأكد من تشغيل: cd backend && npm start" -ForegroundColor Yellow
    exit 1
}

# التحقق من Frontend port
Write-Host ""
Write-Host "🔍 التحقق من Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction Stop
    Write-Host "✅ Frontend يعمل على port 3000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend قد لا يعمل بعد على port 3000" -ForegroundColor Yellow
    Write-Host "   يرجى التأكد من تشغيل: cd frontend && npm run dev" -ForegroundColor Yellow
}

# اختبار API endpoints
Write-Host ""
Write-Host "🔍 اختبار API Endpoints..." -ForegroundColor Yellow

$endpoints = @(
    "/health",
    "/api/auth/login",
    "/api/chat/session",
    "/api/dashboard/stats"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000$endpoint" -Method GET -ErrorAction SilentlyContinue
        $status = $response.StatusCode
    } catch {
        $status = $_.Exception.Response.StatusCode.Value
    }
    
    if ($status -eq 200 -or $status -eq 401 -or $status -eq 422) {
        Write-Host "✅ $endpoint (HTTP $status)" -ForegroundColor Green
    } else {
        Write-Host "❌ $endpoint (HTTP $status)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ الاختبار الأساسي مكتمل!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 الخطوة التالية:" -ForegroundColor Cyan
Write-Host "   1. افتح http://localhost:3000" -ForegroundColor White
Write-Host "   2. قم بالتسجيل" -ForegroundColor White
Write-Host "   3. ابدأ استخدام التطبيق" -ForegroundColor White
Write-Host ""
