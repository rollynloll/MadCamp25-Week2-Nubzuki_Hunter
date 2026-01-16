from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import quote, unquote

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.templating import Jinja2Templates
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db

router = APIRouter(tags=["summary"])

TEMPLATES = Jinja2Templates(directory=Path(__file__).with_name("templates"))
TABLE_NAME_RE = re.compile(r"^[a-zA-Z0-9_]+$")


def build_endpoint_index(openapi: dict) -> list[dict]:
    grouped: dict[str, list[dict]] = {}
    paths = openapi.get("paths", {})
    for path, methods in paths.items():
        for method, spec in methods.items():
            if method.lower() not in {"get", "post", "put", "patch", "delete", "options", "head"}:
                continue
            tags = spec.get("tags", [])
            if "summary" in tags or path.startswith("/summary"):
                continue
            name = f"{method.upper()}:{path}"
            tag = tags[0] if tags else "other"
            grouped.setdefault(tag, []).append(
                {
                    "method": method.upper(),
                    "path": path,
                    "summary": spec.get("summary") or "",
                    "slug": quote(name, safe=""),
                }
            )

    groups = []
    for tag, items in grouped.items():
        items.sort(key=lambda item: (item["path"], item["method"]))
        groups.append({"tag": tag, "endpoints": items})
    groups.sort(key=lambda item: item["tag"])
    return groups


def extract_endpoint_detail(openapi: dict, endpoint_name: str) -> dict:
    decoded = unquote(endpoint_name)
    if ":" not in decoded:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endpoint not found")
    method, path = decoded.split(":", 1)
    spec = openapi.get("paths", {}).get(path, {}).get(method.lower())
    if not spec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endpoint not found")

    parameters = []
    for param in spec.get("parameters", []):
        schema = param.get("schema", {})
        parameters.append(
            {
                "name": param.get("name"),
                "location": param.get("in"),
                "required": bool(param.get("required")),
                "type": schema.get("type") or schema.get("format") or "-",
            }
        )

    request_body = spec.get("requestBody")
    request_body_json = json.dumps(request_body, indent=2) if request_body else ""
    responses = spec.get("responses") or {}
    responses_json = json.dumps(responses, indent=2) if responses else ""

    return {
        "method": method.upper(),
        "path": path,
        "summary": spec.get("summary") or "",
        "description": spec.get("description") or "",
        "parameters": parameters,
        "request_body": request_body_json,
        "responses": responses_json,
    }


async def fetch_table_names(db: AsyncSession) -> list[str]:
    result = await db.execute(
        text(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
            """
        )
    )
    return [row["table_name"] for row in result.mappings().all()]


@router.get("/summary")
async def summary_index(request: Request, db: AsyncSession = Depends(get_db)):
    openapi = request.app.openapi()
    endpoint_groups = build_endpoint_index(openapi)

    tables = []
    table_error = ""
    try:
        table_names = await fetch_table_names(db)
        tables = [{"name": name} for name in table_names]
    except Exception as exc:  # pragma: no cover - runtime DB failures
        table_error = f"DB error: {exc}"

    return TEMPLATES.TemplateResponse(
        "summary_index.html",
        {
            "request": request,
            "title": "Summary",
            "header_title": "Nupzuki Hunter Summary",
            "endpoint_groups": endpoint_groups,
            "tables": tables,
            "table_error": table_error,
        },
    )


@router.get("/summary/endpoint/{endpoint_name:path}")
async def endpoint_detail(request: Request, endpoint_name: str):
    openapi = request.app.openapi()
    detail = extract_endpoint_detail(openapi, endpoint_name)
    return TEMPLATES.TemplateResponse(
        "endpoint_detail.html",
        {
            "request": request,
            "title": "Endpoint Detail",
            "header_title": "API Endpoint Detail",
            **detail,
        },
    )


@router.get("/summary/tables/{table_name}")
async def table_detail(
    request: Request, table_name: str, db: AsyncSession = Depends(get_db)
):
    if not TABLE_NAME_RE.match(table_name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")

    table_names = await fetch_table_names(db)
    if table_name not in table_names:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")

    columns_result = await db.execute(
        text(
            """
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = :table_name
            ORDER BY ordinal_position
            """
        ),
        {"table_name": table_name},
    )
    columns = [
        {
            "name": row["column_name"],
            "type": row["data_type"],
            "nullable": row["is_nullable"],
        }
        for row in columns_result.mappings().all()
    ]

    count_result = await db.execute(
        text(f'SELECT COUNT(*) AS count FROM public."{table_name}"')
    )
    row_count = count_result.scalar_one()

    row_limit = 50
    rows_result = await db.execute(
        text(f'SELECT * FROM public."{table_name}" LIMIT :limit'),
        {"limit": row_limit},
    )
    rows = rows_result.mappings().all()
    row_keys = list(rows[0].keys()) if rows else [column["name"] for column in columns]

    return TEMPLATES.TemplateResponse(
        "table_detail.html",
        {
            "request": request,
            "title": f"Table: {table_name}",
            "header_title": "DB Table Detail",
            "table_name": table_name,
            "row_count": row_count,
            "row_limit": row_limit,
            "columns": columns,
            "rows": rows,
            "row_keys": row_keys,
        },
    )
