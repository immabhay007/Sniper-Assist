"""FastAPI application entry point."""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware
from app.db.session import get_engine
from sqlalchemy import text
from app.api.v1.router import api_router
from app.core.initialize_environment import load_environment, settings

logger = logging.getLogger(__name__)

load_environment()

app = FastAPI(
    title="Sniper care API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ---- ADD THIS MIDDLEWARE ----
class ForceHTTPSchemeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Azure sends the original protocol in this header
        forwarded_proto = request.headers.get("x-forwarded-proto")
        if forwarded_proto == "https":
            # Override the request's scheme so FastAPI generates https:// redirects
            request.scope["scheme"] = "https"
        return await call_next(request)

app.add_middleware(ForceHTTPSchemeMiddleware)
# ------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(_request: Request, exc: SQLAlchemyError):
    logger.exception("Database error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "We could not complete your request. Please try again in a moment.",
        },
    )


@app.get("/")
def root():
    """Landing page when the App Service hostname is opened in a browser."""
    return {
        "service": "Sniper Assist API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/api/health",
        "api": "/api/v1",
    }


@app.get("/api/health")
@app.get("/api/v1/health")
def health():
    return {
        "status": "ok",
        "env": settings.env,
        "database": settings.db_name,
    }

@app.get("/api/debug/database")
def debug_database():
    with get_engine().connect() as connection:
        database = connection.execute(
            text("SELECT current_database()")
        ).scalar_one()

    logger.info("Actual connected database: %s", database)

    return {"database": database}