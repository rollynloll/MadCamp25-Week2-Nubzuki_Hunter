from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["summary"])

TEMPLATE_PATH = Path(__file__).with_name("template.html")


@router.get("/summary", response_class=HTMLResponse)
async def summary():
    html = TEMPLATE_PATH.read_text(encoding="utf-8")
    return HTMLResponse(content=html)
