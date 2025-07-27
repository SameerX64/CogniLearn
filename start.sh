#!/bin/bash

# CogniLearn - Full Stack Startup Script
# This script starts all services for the CogniLearn application

echo "🚀 Starting CogniLearn - AI-Powered Adaptive Learning Platform"
echo "============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i:$1 >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.8+ first.${NC}"
    exit 1
fi

if ! command_exists mongod; then
    echo -e "${YELLOW}⚠️  MongoDB is not installed or not in PATH. Please ensure MongoDB is running.${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check completed${NC}"

# Check if required ports are available
echo -e "${BLUE}Checking port availability...${NC}"

if port_in_use 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use (Frontend)${NC}"
fi

if port_in_use 3001; then
    echo -e "${YELLOW}⚠️  Port 3001 is already in use (Backend)${NC}"
fi

if port_in_use 8000; then
    echo -e "${YELLOW}⚠️  Port 8000 is already in use (AI Services)${NC}"
fi

# Create .env files if they don't exist
echo -e "${BLUE}Setting up environment files...${NC}"

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating backend/.env from example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}Please edit backend/.env with your actual configuration${NC}"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}Creating frontend/.env.local from example...${NC}"
    cp frontend/.env.example frontend/.env.local
    echo -e "${YELLOW}Please edit frontend/.env.local with your actual configuration${NC}"
fi

if [ ! -f "ai-services/.env" ]; then
    echo -e "${YELLOW}Creating ai-services/.env from example...${NC}"
    cp ai-services/.env.example ai-services/.env
    echo -e "${YELLOW}Please edit ai-services/.env with your actual configuration${NC}"
fi

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"

echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend && npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi
cd ..

echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd frontend && npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi
cd ..

echo -e "${BLUE}Installing AI services dependencies...${NC}"
cd ai-services
if [ ! -d "venv" ]; then
    echo -e "${BLUE}Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install AI services dependencies${NC}"
    exit 1
fi
cd ..

echo -e "${GREEN}✅ All dependencies installed successfully${NC}"

# Create log directory
mkdir -p logs

# Start services
echo -e "${BLUE}Starting services...${NC}"

# Start MongoDB if not running
if ! pgrep mongod > /dev/null; then
    echo -e "${BLUE}Starting MongoDB...${NC}"
    mongod --dbpath ./data/db --logpath ./logs/mongodb.log --fork
    sleep 3
fi

# Start AI Services
echo -e "${BLUE}Starting AI Services (Port 8000)...${NC}"
cd ai-services
source venv/bin/activate
nohup python main.py > ../logs/ai-services.log 2>&1 &
AI_PID=$!
echo $AI_PID > ../logs/ai-services.pid
cd ..
echo -e "${GREEN}✅ AI Services started (PID: $AI_PID)${NC}"

# Wait a moment for AI services to start
sleep 3

# Start Backend
echo -e "${BLUE}Starting Backend API (Port 3001)...${NC}"
cd backend
nohup npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..
echo -e "${GREEN}✅ Backend API started (PID: $BACKEND_PID)${NC}"

# Wait a moment for backend to start
sleep 3

# Start Frontend
echo -e "${BLUE}Starting Frontend (Port 3000)...${NC}"
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait for services to fully start
echo -e "${BLUE}Waiting for services to start...${NC}"
sleep 10

# Check service health
echo -e "${BLUE}Checking service health...${NC}"

if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ AI Services is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  AI Services health check failed${NC}"
fi

if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend API health check failed${NC}"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend health check failed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 CogniLearn is now running!${NC}"
echo "============================================================="
echo -e "${BLUE}📱 Frontend:${NC}     http://localhost:3000"
echo -e "${BLUE}🔧 Backend API:${NC}  http://localhost:3001"
echo -e "${BLUE}🤖 AI Services:${NC}  http://localhost:8000"
echo ""
echo -e "${BLUE}📋 Service Management:${NC}"
echo -e "  View logs:    tail -f logs/[service].log"
echo -e "  Stop all:     ./stop.sh"
echo -e "  Restart:      ./stop.sh && ./start.sh"
echo ""
echo -e "${BLUE}🔍 Monitoring:${NC}"
echo -e "  AI Services:  curl http://localhost:8000/health"
echo -e "  Backend:      curl http://localhost:3001/health"
echo -e "  Frontend:     curl http://localhost:3000"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "  1. Open http://localhost:3000 in your browser"
echo -e "  2. Create an account or login"
echo -e "  3. Explore the AI-powered learning features"
echo -e "  4. Configure your learning preferences"
echo ""
echo -e "${BLUE}💡 Features Available:${NC}"
echo -e "  ✅ Course Recommendations"
echo -e "  ✅ AI Quiz Generation"
echo -e "  ✅ Research Paper Analysis"
echo -e "  ✅ Performance Analytics"
echo -e "  ✅ Mentor Matching"
echo -e "  ✅ Adaptive Learning Paths"
echo ""
echo -e "${GREEN}Happy Learning! 🚀${NC}"
