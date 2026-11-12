"""
/agenda-categories, /categorise-agendas and /proceedings-pdf.

The model is faked so the tests pin exactly what our code guarantees: the
category enum, the column catalogue, the audit of statutory items and the PDF
envelope, regardless of which LLM sits behind LLM_MODEL_NAME.
"""
import json

import pytest

import gram_panchayat_api.proceedings.categorise as cat_mod
import gram_panchayat_api.proceedings.pdf as pdf_mod
from gram_panchayat_api.models import CategoriseResponse, CategoryCatalogueResponse
from gram_panchayat_api.proceedings.catalogue import CATALOGUE, STATUTORY_COUNT
from gram_panchayat_api.prompts import CATEGORIES

COLUMN_KEYS = {"key", "label_kn", "label_en", "width_pct", "kind"}

CUSTOM = [
    {"id": "c1", "title": "Ward 3 street lights not working", "description": "Six lights out for two months."},
    {"id": "c2", "title": "ಗ್ರಾಮ ಉತ್ಸವ ಸಿದ್ಧತೆ", "description": "ಸಿದ್ಧತೆ ಮತ್ತು ಸಮಿತಿ ರಚನೆ."},
]


def fake_llm(payload, seen=None):
    async def _generate(prompt, **kwargs):
        if seen is not None:
            seen["prompt"] = prompt
            seen.update(kwargs)
        return payload if isinstance(payload, str) else json.dumps(payload)
    return _generate


def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------- catalogue

def test_catalogue_requires_token(client):
    assert client.get("/agenda-categories").status_code == 401


def test_catalogue_shape(client, token):
    data = client.get("/agenda-categories", headers=auth(token)).json()
    CategoryCatalogueResponse.model_validate(data)
    assert [c["category"] for c in data["categories"]] == CATEGORIES
    for sheet in data["categories"]:
        assert set(sheet) == {"category", "title_kn", "title_en", "columns"}
        assert sum(c["width_pct"] for c in sheet["columns"]) == 100
        assert sheet["columns"][0]["kind"] == "serial"
        for col in sheet["columns"]:
            assert set(col) == COLUMN_KEYS


# --------------------------------------------------------------- categorise

def test_categorise_shape_and_model_isolation(client, token, monkeypatch):
    seen = {}
    monkeypatch.setattr(cat_mod, "generate_text", fake_llm({
        "items": [
            {"id": "c1", "category": "Issue / Grievance", "reason": "complaint"},
            {"id": "c2", "category": "Planning / Preparatory", "reason": "event prep"},
        ]
    }, seen))
    r = client.post("/categorise-agendas", json={"agendas": CUSTOM}, headers=auth(token))
    assert r.status_code == 200
    data = r.json()
    CategoriseResponse.model_validate(data)
    assert [a["id"] for a in data["agendas"]] == [a["id"] for a in CUSTOM]
    by_id = {a["id"]: a for a in data["agendas"]}
    assert by_id["c1"]["category"] == "Issue / Grievance"
    assert by_id["c2"]["category"] == "Planning / Preparatory"
    # Columns are attached from the catalogue, never from the model.
    assert by_id["c1"]["columns"] == CATALOGUE["Issue / Grievance"]["columns"]
    assert "reason" not in by_id["c1"], "reason is audit-only"
    assert '"c1"' in seen["prompt"]
    assert seen["generation_config"]["responseSchema"]["properties"]["items"]["items"]["properties"]["category"]["enum"] == CATEGORIES


def test_pdf_without_custom_agendas_skips_the_model(client, token, monkeypatch):
    async def boom(*a, **k):
        raise AssertionError("model must not be called")
    monkeypatch.setattr(cat_mod, "generate_text", boom)
    import gram_panchayat_api.main as main_mod
    captured = {}
    async def fake_render(html):
        captured["html"] = html
        return b"%PDF-1.7"
    monkeypatch.setattr(main_mod, "render_pdf", fake_render)
    r = client.post("/proceedings-pdf", json={"meeting": {"title": "Sabha"}}, headers=auth(token))
    assert r.status_code == 200
    assert captured["html"].count("<section") == STATUTORY_COUNT == 13, "the thirteen statutory sheets always print"


@pytest.mark.parametrize("raw", [
    '{"items": [{"id": "c1", "category": "Brand New Category"}, {"id": "c2", "category": "Review / Status"}]}',
    '{"items": [{"id": "c2", "category": "Review / Status"}]}',  # c1 dropped by the model
    '```json\n{"items": [{"id": "c1", "category": "Issue / Grievance"}, {"id": "c2", "category": "Other / Can\'t Categorize"}]}\n```',
])
def test_model_misbehaviour_keeps_contract(client, token, monkeypatch, raw):
    monkeypatch.setattr(cat_mod, "generate_text", fake_llm(raw))
    r = client.post("/categorise-agendas", json={"agendas": CUSTOM}, headers=auth(token))
    assert r.status_code == 200
    data = r.json()
    CategoriseResponse.model_validate(data)
    for a in data["agendas"]:
        assert a["category"] in CATEGORIES
        assert a["columns"] == CATALOGUE[a["category"]]["columns"]


def test_model_failure_is_502(client, token, monkeypatch):
    monkeypatch.setattr(cat_mod, "generate_text", fake_llm("not json"))
    assert client.post("/categorise-agendas", json={"agendas": CUSTOM}, headers=auth(token)).status_code == 502


def test_categorise_validation(client, token):
    assert client.post("/categorise-agendas", json={"agendas": []}, headers=auth(token)).status_code == 422
    assert client.post("/categorise-agendas", json={"agendas": [{"id": "x", "title": "  "}]}, headers=auth(token)).status_code == 422
    assert client.post("/categorise-agendas", json={"agendas": [{"id": "x", "title": "a"}, {"id": "x", "title": "b"}]}, headers=auth(token)).status_code == 422
    assert client.post("/categorise-agendas", json={"agendas": CUSTOM}).status_code == 401


# ---------------------------------------------------------------------- pdf

PDF_BODY = {
    "meeting": {"title": "GP General Body Meeting - Ordinary", "date": "15/11/2026", "time": "11:00 AM"},
    "agendas": CUSTOM,
}


def test_pdf_envelope(client, token, monkeypatch):
    monkeypatch.setattr(cat_mod, "generate_text", fake_llm({"items": [
        {"id": "c1", "category": "Issue / Grievance"}, {"id": "c2", "category": "Planning / Preparatory"}]}))
    captured = {}
    async def fake_render(html):
        captured["html"] = html
        return b"%PDF-1.7 fake"
    monkeypatch.setattr(pdf_mod, "render_pdf", fake_render)
    import gram_panchayat_api.main as main_mod
    monkeypatch.setattr(main_mod, "render_pdf", fake_render)

    r = client.post("/proceedings-pdf", json=PDF_BODY, headers=auth(token))
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.headers["content-disposition"] == 'attachment; filename="proceedings-gp-general-body-meeting-ordinary.pdf"'
    assert r.content.startswith(b"%PDF")
    html = captured["html"]
    assert "size: A4 landscape" in html
    assert html.count("<section") == STATUTORY_COUNT + 2  # 13 statutory + 2 custom
    assert "Ward 3 street lights not working" in html
    assert "ಗ್ರಾಮ ಉತ್ಸವ ಸಿದ್ಧತೆ" in html
    assert "Final / Subject to approval" in html  # planning sheet placeholder
    assert "{{" not in html


def test_html_format_returns_same_document(client, token, monkeypatch):
    monkeypatch.setattr(cat_mod, "generate_text", fake_llm({"items": [
        {"id": "c1", "category": "Issue / Grievance"}, {"id": "c2", "category": "Planning / Preparatory"}]}))
    async def boom(html):
        raise AssertionError("html format must not render a PDF")
    import gram_panchayat_api.main as main_mod
    monkeypatch.setattr(main_mod, "render_pdf", boom)
    r = client.post("/proceedings-pdf?format=html", json=PDF_BODY, headers=auth(token))
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/html")
    assert r.text.count("<section") == STATUTORY_COUNT + 2
    assert "fonts.googleapis.com" in r.text and "file://" not in r.text
    assert "ಅಧ್ಯಕ್ಷರ ಅಪ್ಪಣೆ ಮೇರೆಗೆ" in r.text  # statutory sheet 13
    assert client.post("/proceedings-pdf?format=docx", json=PDF_BODY, headers=auth(token)).status_code == 422


def test_pdf_portrait_and_validation(client, token, monkeypatch):
    monkeypatch.setattr(cat_mod, "generate_text", fake_llm({"items": []}))
    import gram_panchayat_api.main as main_mod
    captured = {}
    async def fake_render(html):
        captured["html"] = html
        return b"%PDF-1.7"
    monkeypatch.setattr(main_mod, "render_pdf", fake_render)
    body = {"meeting": {"title": "Sabha"}, "agendas": [], "orientation": "portrait"}
    assert client.post("/proceedings-pdf", json=body, headers=auth(token)).status_code == 200
    assert "size: A4 portrait" in captured["html"]
    assert client.post("/proceedings-pdf", json={"meeting": {"title": ""}}, headers=auth(token)).status_code == 422
    assert client.post("/proceedings-pdf", json=PDF_BODY).status_code == 401


def test_real_render_produces_pdf():
    """Exercises WeasyPrint with the bundled fonts (skipped where Pango is missing)."""
    pytest.importorskip("weasyprint")
    from gram_panchayat_api.proceedings.pdf import MeetingHeader, SheetSpec, render_html, _html_to_pdf
    html = render_html(MeetingHeader(title="Test"), [
        SheetSpec(title="x", statutory_no=1),
        SheetSpec(title="ಪರೀಕ್ಷೆ", category="Review / Status", subtitle="desc"),
    ])
    pdf = _html_to_pdf(html)
    assert pdf.startswith(b"%PDF") and len(pdf) > 10_000
