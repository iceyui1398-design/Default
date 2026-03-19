#!/bin/sh
# =========================================================
# FootballIQ — iSH Setup Script
# הרץ את זה ב-iSH פעם אחת, ואחר כך רק "node server/src/index.js"
# =========================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "${GREEN}=== FootballIQ iSH Setup ===${NC}"

# ── 1. System packages ────────────────────────────────────
echo "${YELLOW}[1/4] מתקין חבילות מערכת...${NC}"
apk update -q
apk add -q nodejs npm git

# ── 2. Clone repo ─────────────────────────────────────────
REPO="https://github.com/iceyui1398-design/Default.git"
BRANCH="claude/football-betting-pwa-K9pcG"

if [ -d "Default" ]; then
  echo "${YELLOW}[2/4] מעדכן ריפו קיים...${NC}"
  cd Default
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  echo "${YELLOW}[2/4] מוריד את הקוד מ-GitHub...${NC}"
  git clone --branch "$BRANCH" --single-branch "$REPO"
  cd Default
fi

# ── 3. Install server dependencies ───────────────────────
echo "${YELLOW}[3/4] מתקין תלויות שרת...${NC}"
cd server
npm install --omit=dev -q
cd ..

# ── 4. Create .env if missing ─────────────────────────────
if [ ! -f server/.env ]; then
  echo "${YELLOW}[4/4] יוצר קובץ הגדרות...${NC}"
  cat > server/.env << 'ENVFILE'
PORT=3001
RAPIDAPI_KEY=הכנס_כאן
ODDS_API_KEY=הכנס_כאן
ANTHROPIC_API_KEY=הכנס_כאן
CLIENT_URL=http://localhost:3001
ENVFILE
  echo ""
  echo "${GREEN}=====================================================${NC}"
  echo "  נוצר קובץ server/.env"
  echo "  ערוך אותו והכנס את המפתחות שלך:"
  echo ""
  echo "  vi server/.env"
  echo ""
  echo "  אחר כך הרץ:"
  echo "  node server/src/index.js"
  echo "${GREEN}=====================================================${NC}"
else
  echo ""
  echo "${GREEN}=====================================================${NC}"
  echo "  ההתקנה הושלמה!"
  echo "  להפעלה:"
  echo "    node server/src/index.js"
  echo ""
  echo "  ואז פתח בספארי:"
  echo "    http://localhost:3001"
  echo "${GREEN}=====================================================${NC}"
fi
