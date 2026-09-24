from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def create_user(
    db,
    name,
    email,
    password,
    role,
):
    existing = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing:
        print(f"{email} already exists.")
        return existing

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role=role,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    print(f"Created {role}: {email}")

    return user


def main():
    db = SessionLocal()

    try:
        create_user(
            db=db,
            name="CampusONE Admin",
            email="admin@campusone.com",
            password="Admin@12345",
            role="admin",
        )

        create_user(
            db=db,
            name="CampusONE Staff",
            email="staff@campusone.com",
            password="Staff@12345",
            role="staff",
        )

    finally:
        db.close()


if __name__ == "__main__":
    main()