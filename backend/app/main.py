"""
Tata Motors Dealership CRM – FastAPI Application Entry Point
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routes import router
from app.core.config import get_settings
from app.db.session import Base, engine

settings = get_settings()

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists
os.makedirs(settings.upload_dir, exist_ok=True)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Production CRM for Tata Motors Authorized Dealership – Jaipur. "
        "Manages the complete customer journey from lead capture to post-delivery follow-up."
    ),
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.api_prefix)

# Serve uploaded files statically
if os.path.exists(settings.upload_dir):
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
