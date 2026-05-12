from fastapi import Depends, HTTPException, status
from app.dependencies import get_current_user
from app.models.user import User


def require_roles(*allowed_roles: str):
    async def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {list(allowed_roles)}",
            )
        return current_user
    return checker


require_admin = require_roles("admin")
require_recruiter = require_roles("admin", "recruiter")
require_candidate = require_roles("candidate")
require_any = require_roles("admin", "recruiter", "candidate")
