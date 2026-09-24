from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import SessionLocal
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

from app.models import Activity, Ticket, User
from app.routes import (
    auth,
    tickets,
    users,
    dashboard,
)




app = FastAPI(
    title="Student Support Ticket System",
    description="Backend API for the Student Support & Ticket Management System",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tickets.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {
        "message": "Student Support API is running"
    }


@app.get("/health")
def health():
    db = SessionLocal()

    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception:
        return {
            "status": "unhealthy",
            "database": "disconnected",
        }

    finally:
        db.close()