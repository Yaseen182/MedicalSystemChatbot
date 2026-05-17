#!/bin/bash
# 🧪 اختبار التوصيل - MedAI

echo "🏥 اختبار MedAI Integration"
echo "================================"
echo ""

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# التحقق من Backend
echo "🔍 التحقق من Backend..."
if curl -s http://localhost:4000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend يعمل على port 4000${NC}"
else
    echo -e "${RED}❌ Backend غير متاح${NC}"
    echo "   يرجى التأكد من تشغيل: cd backend && npm start"
    exit 1
fi

# التحقق من Frontend port
echo ""
echo "🔍 التحقق من Frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend يعمل على port 3000${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend قد لا يعمل بعد على port 3000${NC}"
    echo "   يرجى التأكد من تشغيل: cd frontend && npm run dev"
fi

# التحقق من CORS
echo ""
echo "🔍 التحقق من CORS..."
response=$(curl -s -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -X OPTIONS http://localhost:4000/health -w "%{http_code}")

if [[ $response == *"200"* ]]; then
    echo -e "${GREEN}✅ CORS مفعل${NC}"
else
    echo -e "${RED}❌ CORS قد يكون معطل${NC}"
fi

# التحقق من API endpoints
echo ""
echo "🔍 اختبار API Endpoints..."

endpoints=(
    "/health"
    "/api/auth/login"
    "/api/chat/session"
    "/api/dashboard/stats"
)

for endpoint in "${endpoints[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000$endpoint)
    if [[ $status == "200" || $status == "401" || $status == "422" ]]; then
        echo -e "${GREEN}✅ $endpoint (HTTP $status)${NC}"
    else
        echo -e "${RED}❌ $endpoint (HTTP $status)${NC}"
    fi
done

echo ""
echo "================================"
echo -e "${GREEN}✅ الاختبار الأساسي مكتمل!${NC}"
echo ""
echo "📝 الخطوة التالية:"
echo "   1. افتح http://localhost:3000"
echo "   2. قم بالتسجيل"
echo "   3. ابدأ استخدام التطبيق"
echo ""
