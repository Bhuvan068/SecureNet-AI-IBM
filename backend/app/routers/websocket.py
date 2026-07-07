from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

router = APIRouter(prefix="/ws", tags=["websocket"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # In a real app we'd process incoming commands if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)

import asyncio
from app.database import async_session_maker
from app.agents.analytics_agent import AnalyticsAgent

@router.websocket("/analytics")
async def analytics_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Fetch latest analytics
            async with async_session_maker() as db:
                analytics_data = await AnalyticsAgent.get_metrics(db)
                # Ensure we are not sending python objects directly if they contain pydantic models
                await websocket.send_json(analytics_data.model_dump(mode='json'))
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        pass
