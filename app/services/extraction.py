"""Text extraction from PDF, DOCX, and TXT files."""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def extract_text(file_bytes: bytes, file_type: str) -> str:
    """Extract text from a file based on its type.

    Returns extracted text or an error message string on failure.
    """
    extractors = {
        "pdf": _extract_pdf,
        "docx": _extract_docx,
        "txt": _extract_txt,
    }
    extractor = extractors.get(file_type)
    if not extractor:
        return f"Unsupported file type: {file_type}. Supported: pdf, docx, txt."

    try:
        return extractor(file_bytes)
    except Exception as exc:
        logger.exception("Failed to extract text from %s file", file_type)
        return f"Failed to extract text: {exc}"


def _extract_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file using pypdf."""
    from io import BytesIO

    from pypdf import PdfReader

    reader = PdfReader(BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    if not pages:
        return "PDF appears to contain no extractable text (may be image-based)."
    return "\n\n".join(pages)


def _extract_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file using python-docx."""
    from io import BytesIO

    from docx import Document

    doc = Document(BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    if not paragraphs:
        return "DOCX file appears to be empty."
    return "\n\n".join(paragraphs)


def _extract_txt(file_bytes: bytes) -> str:
    """Extract text from a plain text file."""
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1")


def get_file_type(filename: str) -> str | None:
    """Determine file type from filename extension."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    supported = {"pdf": "pdf", "docx": "docx", "txt": "txt"}
    return supported.get(ext)