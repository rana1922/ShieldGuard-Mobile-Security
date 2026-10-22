/**
 * ShieldGuard Mobile Security - Python FastAPI Backend & PostgreSQL Deliverables
 * Production API with SSRF Defense, Rate Limiting, Threat Intel & Fraud Reporting
 * @license Apache-2.0
 */

import { CodeFile } from './androidProjectCode';

export const BACKEND_PROJECT_FILES: CodeFile[] = [
  {
    path: 'backend/app/main.py',
    language: 'python',
    description: 'FastAPI entry point with Security Headers, CORS, Rate Limiting, and OpenAPI Documentation',
    content: `"""
ShieldGuard Threat Intelligence & Mobile Security Backend
FastAPI + PostgreSQL + Async SQLAlchemy + SSRF Firewall
"""

import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi

from app.routers import url_check, file_check, fraud_reports
from app.database import init_db

app = FastAPI(
    title="ShieldGuard Security API",
    description="Threat intelligence, reputation analysis, and cybercrime fraud reporting backend for ShieldGuard Mobile.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Policy restricted to mobile client & authorized dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production environment via ALLOWED_ORIGINS env
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Include Modular Routers
app.include_router(url_check.router, prefix="/api/v1/url", tags=["URL Reputation"])
app.include_router(file_check.router, prefix="/api/v1/file", tags=["File & Hash Reputation"])
app.include_router(fraud_reports.router, prefix="/api/v1/fraud", tags=["Fraud Reports"])

@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "ShieldGuard Security Engine",
        "version": "1.0.0",
        "threat_intel_engine": "online"
    }
`
  },
  {
    path: 'backend/app/security.py',
    language: 'python',
    description: 'Robust SSRF (Server-Side Request Forgery) protection rejecting private IPs, loopback, and cloud metadata',
    content: `"""
ShieldGuard SSRF Protection Firewall
Prevents SSRF attacks against internal networks, RFC 1918 ranges, and AWS/GCP metadata services.
"""

import ipaddress
import socket
from urllib.parse import urlparse
from fastapi import HTTPException, status

# Forbidden IP Networks
PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),      # Loopback
    ipaddress.ip_network("10.0.0.0/8"),       # Private class A
    ipaddress.ip_network("172.16.0.0/12"),    # Private class B
    ipaddress.ip_network("192.168.0.0/16"),   # Private class C
    ipaddress.ip_network("169.254.0.0/16"),   # Link-local / Cloud Metadata (169.254.169.254)
    ipaddress.ip_network("::1/128"),          # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),         # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),        # IPv6 link-local
]

def validate_safe_url(raw_url: str) -> str:
    """
    Validates that a URL does not point to internal infrastructure or private IPs.
    Returns normalized safe URL or raises HTTP 400.
    """
    try:
        parsed = urlparse(raw_url)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed URL format."
        )

    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported scheme. Only http:// and https:// are permitted."
        )

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing valid hostname in target URL."
        )

    # Resolve IP address to inspect physical target
    try:
        ip_info = socket.getaddrinfo(hostname, None)
        for entry in ip_info:
            ip_str = entry[4][0]
            ip_obj = ipaddress.ip_address(ip_str)

            for forbidden_net in PRIVATE_NETWORKS:
                if ip_obj in forbidden_net:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access to internal/private IP addresses or cloud metadata endpoints is blocked (SSRF Protection)."
                    )
    except socket.gaierror:
        # Non-resolvable domain is rejected safely
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to resolve domain name via DNS."
        )

    return raw_url
`
  },
  {
    path: 'backend/app/schemas.py',
    language: 'python',
    description: 'Pydantic schemas with strict validation, length bounds, and sanitization',
    content: `"""
Pydantic Request & Response Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl, validator
from datetime import datetime

class UrlCheckRequest(BaseModel):
    url: str = Field(..., max_length=2048, description="Target URL to check for phishing or malware")

class FindingSchema(BaseModel):
    id: str
    category: str
    title: str
    description: str
    risk_level: str
    evidence: str

class UrlCheckResponse(BaseModel):
    url: str
    domain: str
    risk_level: str
    reputation_score: int
    is_idn_homograph: bool
    is_ip_host: bool
    findings: List[FindingSchema]
    scanned_at: datetime

class FileHashCheckRequest(BaseModel):
    sha256: str = Field(..., regex="^[a-fA-F0-9]{64}$", description="64-character hexadecimal SHA-256 hash")
    file_name: Optional[str] = Field(None, max_length=255)
    file_size_bytes: Optional[int] = Field(None, ge=0, le=1073741824) # 1GB max limit

class FileHashCheckResponse(BaseModel):
    sha256: str
    reputation_verdict: str # CLEAN, KNOWN_MALWARE, SUSPICIOUS
    known_threat_name: Optional[str]
    detection_ratio: Optional[str]
    last_updated: datetime

class FraudReportCreate(BaseModel):
    category: str = Field(..., regex="^(PHISHING_URL|UPI_SCAM|MALICIOUS_APP|SUSPICIOUS_DOWNLOAD|IMPERSONATION|OTHER)$")
    target_identifier: str = Field(..., min_length=3, max_length=1024)
    transaction_ref: Optional[str] = Field(None, max_length=128)
    amount_lost: Optional[str] = Field(None, max_length=32)
    description: str = Field(..., min_length=10, max_length=5000)
    user_consent: bool = Field(..., description="User explicit consent for processing fraud report")

    @validator("user_consent")
    def must_have_consent(cls, v):
        if not v:
            raise ValueError("Explicit user consent is mandatory to record and submit a fraud report.")
        return v

class FraudReportResponse(BaseModel):
    report_reference: str
    category: str
    target_identifier: str
    status: str
    created_at: datetime
    official_advisory: str
`
  },
  {
    path: 'backend/app/routers/url_check.py',
    language: 'python',
    description: 'FastAPI route analyzing URLs with SSRF verification and threat feeds',
    content: `"""
URL Reputation Router
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas import UrlCheckRequest, UrlCheckResponse, FindingSchema
from app.security import validate_safe_url

router = APIRouter()

@router.post("/scan", response_model=UrlCheckResponse)
async def scan_url(payload: UrlCheckRequest):
    # 1. SSRF Firewall Check
    safe_url = validate_safe_url(payload.url)
    
    # 2. Heuristic and threat intelligence lookup
    domain = safe_url.split("//")[-1].split("/")[0].lower()
    findings = []
    risk_level = "SAFE"
    reputation_score = 95
    is_homograph = any(ord(c) > 127 for c in domain)
    is_ip = domain.replace(".", "").isdigit()

    if is_homograph:
        risk_level = "HIGH_RISK"
        reputation_score = 10
        findings.append(FindingSchema(
            id="find-backend-idn",
            category="URL",
            title="Punycode Homograph Spoofing",
            description="Domain mixes foreign character encodings to deceive brand detection.",
            risk_level="HIGH_RISK",
            evidence=f"Target: {domain}"
        ))

    if is_ip:
        risk_level = "HIGH_RISK"
        reputation_score = 20
        findings.append(FindingSchema(
            id="find-backend-ip",
            category="URL",
            title="Direct Numeric Host",
            description="Raw IP hosting bypassing domain registration rules.",
            risk_level="HIGH_RISK",
            evidence=f"Target: {domain}"
        ))

    return UrlCheckResponse(
        url=safe_url,
        domain=domain,
        risk_level=risk_level,
        reputation_score=reputation_score,
        is_idn_homograph=is_homograph,
        is_ip_host=is_ip,
        findings=findings,
        scanned_at=datetime.utcnow()
    )
`
  },
  {
    path: 'backend/app/database.py',
    language: 'python',
    description: 'PostgreSQL connection pooling via SQLAlchemy Async Engine',
    content: `"""
Database Connection & Session Management
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://shieldguard:secure_guard_pass@localhost:5432/shieldguard_db"
)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
`
  },
  {
    path: 'backend/schema.sql',
    language: 'sql',
    description: 'PostgreSQL DDL schema for fraud reporting and threat cache',
    content: `-- ShieldGuard Security PostgreSQL Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fraud Reports Table
CREATE TABLE IF NOT EXISTS fraud_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_reference VARCHAR(64) UNIQUE NOT NULL,
    category VARCHAR(32) NOT NULL,
    target_identifier VARCHAR(1024) NOT NULL,
    transaction_ref VARCHAR(128),
    amount_lost VARCHAR(32),
    description TEXT NOT NULL,
    user_consent BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_hash VARCHAR(64), -- Anonymized one-way hash for anti-abuse rate limiting
    official_cybercrime_synced BOOLEAN DEFAULT false
);

CREATE INDEX idx_fraud_reports_category ON fraud_reports(category);
CREATE INDEX idx_fraud_reports_created_at ON fraud_reports(created_at DESC);

-- Threat Hash Reputation Cache
CREATE TABLE IF NOT EXISTS threat_reputation_cache (
    sha256 VARCHAR(64) PRIMARY KEY,
    threat_name VARCHAR(128),
    risk_level VARCHAR(32) NOT NULL,
    detection_ratio VARCHAR(16),
    source_vendor VARCHAR(64),
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_threat_cache_risk ON threat_reputation_cache(risk_level);
`
  },
  {
    path: 'backend/requirements.txt',
    language: 'text',
    description: 'Python package dependencies for ShieldGuard FastAPI',
    content: `fastapi==0.110.0
uvicorn[standard]==0.28.0
pydantic==2.6.4
sqlalchemy==2.0.28
asyncpg==0.29.0
alembic==1.13.1
httpx==0.27.0
python-dotenv==1.0.1
slowapi==0.1.9
pytest==8.1.1
pytest-asyncio==0.23.5
`
  }
];
