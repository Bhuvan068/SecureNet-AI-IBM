from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.routes import router
from app.routers import ingestion, cases, threat_hunting, export, websocket, demo, copilot
from app.live_monitor import generate_live_event
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    from app.database import AsyncSessionLocal
    from app.services.demo_data import init_demo_data
    async with AsyncSessionLocal() as db:
        await init_demo_data(db)
    task = asyncio.create_task(generate_live_event())
    yield
    task.cancel()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-Agent Network Intrusion Detection and Autonomous Response System",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")
app.include_router(ingestion.router)
app.include_router(cases.router)
app.include_router(threat_hunting.router)
app.include_router(export.router)
app.include_router(websocket.router)
app.include_router(demo.router)
app.include_router(copilot.router)
from app.routers import analytics
app.include_router(analytics.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs":    "/docs",
        "api":     "/api/v1",
    }
