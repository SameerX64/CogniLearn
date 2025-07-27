#!/bin/bash

# CogniLearn - Stop All Services Script
# This script stops all running CogniLearn services

echo "🛑 Stopping CogniLearn Services"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to kill process by PID file
kill_service() {
    local service_name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${BLUE}Stopping $service_name (PID: $pid)...${NC}"
            kill "$pid"
            sleep 2
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${YELLOW}Force stopping $service_name...${NC}"
                kill -9 "$pid"
            fi
            
            echo -e "${GREEN}✅ $service_name stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  $service_name was not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}⚠️  No PID file found for $service_name${NC}"
    fi
}

# Stop services in reverse order
echo -e "${BLUE}Stopping Frontend...${NC}"
kill_service "Frontend" "logs/frontend.pid"

echo -e "${BLUE}Stopping Backend API...${NC}"
kill_service "Backend API" "logs/backend.pid"

echo -e "${BLUE}Stopping AI Services...${NC}"
kill_service "AI Services" "logs/ai-services.pid"

# Kill any remaining processes on our ports
echo -e "${BLUE}Cleaning up any remaining processes...${NC}"

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo -e "${BLUE}Killing process on port $port (PID: $pid)...${NC}"
        kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null
    fi
}

kill_port 3000
kill_port 3001
kill_port 8000

# Stop MongoDB if we started it
if [ -f "logs/mongodb.pid" ]; then
    echo -e "${BLUE}Stopping MongoDB...${NC}"
    kill_service "MongoDB" "logs/mongodb.pid"
else
    # Try to stop MongoDB gracefully
    echo -e "${BLUE}Attempting to stop MongoDB...${NC}"
    mongod --shutdown --dbpath ./data/db 2>/dev/null || echo -e "${YELLOW}MongoDB may not have been started by this script${NC}"
fi

# Clean up any remaining Node.js processes for this project
echo -e "${BLUE}Cleaning up Node.js processes...${NC}"
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# Clean up Python processes
echo -e "${BLUE}Cleaning up Python processes...${NC}"
pkill -f "python main.py" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true

echo ""
echo -e "${GREEN}🎯 All CogniLearn services stopped successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Log files preserved in logs/ directory${NC}"
echo -e "${BLUE}🔄 To restart: ./start.sh${NC}"
echo ""
