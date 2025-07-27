#!/usr/bin/env python3
"""
CogniLearn AI Services - FastAPI Application
Simple health check and API structure for now
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
import os

# Create FastAPI app
app = FastAPI(
    title="CogniLearn AI Services",
    description="AI-powered services for adaptive learning platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CogniLearn AI Services",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-services",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    return {
        "api": "CogniLearn AI Services",
        "status": "operational",
        "endpoints": [
            "/health",
            "/api/status",
            "/docs"
        ],
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    print("🚀 Starting CogniLearn AI Services...")
    print("📍 Service will be available at: http://localhost:8000")
    print("📊 API documentation at: http://localhost:8000/docs")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
