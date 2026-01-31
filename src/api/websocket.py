"""WebSocket endpoint for real-time cascade alerts."""

from fastapi import WebSocket
from typing import List
import json


class ConnectionManager:
    """Manages WebSocket connections for broadcasting alerts."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        self.active_connections.remove(websocket)
        print(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to connection: {e}")
                disconnected.append(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            try:
                self.active_connections.remove(conn)
            except ValueError:
                pass


# Global connection manager instance
manager = ConnectionManager()


async def broadcast_cascade_alert(alert_data: dict):
    """
    Broadcast a cascade alert to all connected clients.

    Args:
        alert_data: Dictionary containing event and cascade information
    """
    await manager.broadcast({
        'type': 'cascade_alert',
        'data': alert_data
    })
