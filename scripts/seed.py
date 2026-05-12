"""
Dev seed script — creates sample data for local development.
Run: python scripts/seed.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "api"))

from app.database import AsyncSessionLocal, engine, Base
from app.models import *  # noqa
from app.core.security import hash_password


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        from app.models.company import Company
        from app.models.user import User

        company = Company(
            name="TechCorp Demo",
            slug="techcorp",
            plan="professional",
        )
        db.add(company)
        await db.flush()

        admin = User(
            email="admin@techcorp.com",
            hashed_password=hash_password("admin123"),
            full_name="Admin TechCorp",
            role="admin",
            company_id=company.id,
            is_verified=True,
        )
        recruiter = User(
            email="recruiter@techcorp.com",
            hashed_password=hash_password("recruiter123"),
            full_name="Ana Recruiter",
            role="recruiter",
            company_id=company.id,
            is_verified=True,
        )
        candidate = User(
            email="candidate@example.com",
            hashed_password=hash_password("candidate123"),
            full_name="João Candidato",
            role="candidate",
            is_verified=True,
        )

        db.add_all([admin, recruiter, candidate])
        await db.commit()

        print("Seed complete!")
        print("  admin@techcorp.com / admin123")
        print("  recruiter@techcorp.com / recruiter123")
        print("  candidate@example.com / candidate123")


if __name__ == "__main__":
    asyncio.run(seed())
