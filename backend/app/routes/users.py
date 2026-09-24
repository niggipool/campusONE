from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User


router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


@router.get("")
def get_users(
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at,
        }
        for user in users
    ]


@router.get("/staff")
def get_staff(
    current_user: User = Depends(
        require_roles("staff", "admin")
    ),
    db: Session = Depends(get_db),
):
    staff = (
        db.query(User)
        .filter(
            User.role.in_(["staff", "admin"])
        )
        .order_by(User.name.asc())
        .all()
    )

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        }
        for user in staff
    ]


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    if role not in {"student", "staff", "admin"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid role",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # Prevent admin from accidentally removing their
    # own admin privileges.
    if (
        user.id == current_user.id
        and role != "admin"
    ):
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own admin role",
        )

    user.role = role

    db.commit()
    db.refresh(user)

    return {
        "message": "User role updated",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            
        },
    }