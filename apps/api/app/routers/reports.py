from fastapi import APIRouter, Depends

from app.models.user import User
from app.core.rbac import require_recruiter

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("")
async def list_reports(_: User = Depends(require_recruiter)):
    return {"reports": [], "message": "Report generation coming soon"}
