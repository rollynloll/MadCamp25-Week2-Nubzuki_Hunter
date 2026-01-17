import json
import re
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db

router = APIRouter(tags=["summary"])
templates = Jinja2Templates(directory=Path(__file__).with_name("templates"))

_ALLOWED_METHODS = {"get", "post", "put", "patch", "delete", "options", "head"}
_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return slug or "endpoint"


def _format_json(data: Any) -> str:
    return json.dumps(data, indent=2, ensure_ascii=True, sort_keys=True)


def _build_endpoint_index(schema: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = {}
    slug_map: dict[str, Any] = {}
    slug_counts: dict[str, int] = {}

    for path, path_item in schema.get("paths", {}).items():
        if not isinstance(path_item, dict):
            continue
        for method, info in path_item.items():
            if method not in _ALLOWED_METHODS or not isinstance(info, dict):
                continue

            tags = info.get("tags") or ["untagged"]
            tag = tags[0]
            base_slug = _slugify(f"{method}-{path}")
            slug_counts[base_slug] = slug_counts.get(base_slug, 0) + 1
            slug = base_slug
            if slug_counts[base_slug] > 1:
                slug = f"{base_slug}-{slug_counts[base_slug]}"

            endpoint = {
                "method": method.upper(),
                "path": path,
                "summary": info.get("summary"),
                "description": info.get("description"),
                "slug": slug,
                "info": info,
            }
            groups.setdefault(tag, []).append(endpoint)
            slug_map[slug] = endpoint

    endpoint_groups = [
        {"tag": tag, "endpoints": sorted(items, key=lambda item: item["path"])}
        for tag, items in sorted(groups.items(), key=lambda item: item[0])
    ]
    return endpoint_groups, slug_map


def _get_schema(request: Request) -> dict[str, Any]:
    return request.app.openapi()


@router.get("/summary", response_class=HTMLResponse)
async def summary(request: Request, db: AsyncSession = Depends(get_db)):
    schema = _get_schema(request)
    endpoint_groups, _ = _build_endpoint_index(schema)

    tables: list[dict[str, str]] = []
    table_error = None
    try:
        result = await db.execute(
            text(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
                """
            )
        )
        tables = [{"name": row[0]} for row in result.fetchall()]
    except Exception as exc:  # noqa: BLE001 - show error without failing the page
        table_error = f"DB lookup failed: {exc}"

    return templates.TemplateResponse(
        "summary_index.html",
        {
            "request": request,
            "endpoint_groups": endpoint_groups,
            "tables": tables,
            "table_error": table_error,
        },
    )


@router.get("/summary/endpoint/{slug}", response_class=HTMLResponse)
async def endpoint_detail(request: Request, slug: str):
    schema = _get_schema(request)
    _, slug_map = _build_endpoint_index(schema)
    endpoint = slug_map.get(slug)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found.")

    info = endpoint["info"]
    parameters = []
    for param in info.get("parameters", []) or []:
        schema_info = param.get("schema") or {}
        param_type = schema_info.get("type") or schema_info.get("$ref", "").split("/")[-1] or "unknown"
        parameters.append(
            {
                "name": param.get("name"),
                "location": param.get("in"),
                "required": param.get("required", False),
                "type": param_type,
            }
        )

    request_body = info.get("requestBody")
    request_body_payload = None
    if request_body:
        request_body_payload = _format_json(request_body.get("content", request_body))

    responses = info.get("responses")
    responses_payload = _format_json(responses) if responses else None

    return templates.TemplateResponse(
        "endpoint_detail.html",
        {
            "request": request,
            "method": endpoint["method"],
            "path": endpoint["path"],
            "summary": endpoint.get("summary"),
            "description": endpoint.get("description"),
            "parameters": parameters,
            "request_body": request_body_payload,
            "responses": responses_payload,
        },
    )


@router.get("/summary/tables/{table_name}", response_class=HTMLResponse)
async def table_detail(
    request: Request,
    table_name: str,
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    if not _IDENTIFIER_RE.match(table_name):
        raise HTTPException(status_code=400, detail="Invalid table name.")

    columns = []
    row_count = 0
    rows = []
    row_keys: list[str] = []

    column_result = await db.execute(
        text(
            """
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = :table_name
            ORDER BY ordinal_position
            """
        ),
        {"table_name": table_name},
    )
    columns = [
        {"name": row[0], "type": row[1], "nullable": row[2] == "YES"}
        for row in column_result.fetchall()
    ]

    count_result = await db.execute(
        text(f'SELECT COUNT(*) FROM public."{table_name}"')
    )
    row_count = count_result.scalar_one() or 0

    rows_result = await db.execute(
        text(f'SELECT * FROM public."{table_name}" LIMIT :limit'),
        {"limit": max(1, min(limit, 200))},
    )
    rows = rows_result.mappings().all()
    row_keys = list(rows_result.keys())

    return templates.TemplateResponse(
        "table_detail.html",
        {
            "request": request,
            "table_name": table_name,
            "row_count": row_count,
            "columns": columns,
            "rows": rows,
            "row_keys": row_keys,
            "row_limit": max(1, min(limit, 200)),
        },
    )
