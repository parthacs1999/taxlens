import pymupdf


class PDFExtractionError(Exception):
    pass


def extract_pdf_text(pdf_bytes: bytes) -> dict:
    """
    Extract text from a PDF and preserve page numbers.
    """

    try:
        documents = pymupdf.open(
            stream=pdf_bytes,
            filetype="pdf"
        )

    except Exception as exc:
        raise PDFExtractionError(
            "Unable to open PDF document."
        ) from exc

    pages = []

    try:
        if documents.page_count == 0:
            raise PDFExtractionError(
                "PDF contains no pages."
            )

        for page_number, page in enumerate(documents):
            text = page.get_text("text")

            pages.append({
                "page_number": page_number + 1,
                "text": text.strip()
            })

    except PDFExtractionError:
        raise

    except Exception as exc:
        raise PDFExtractionError(
            "Unable to extract text from PDF."
        ) from exc

    finally:
        documents.close()

    full_text = "\n\n".join(
        page["text"] for page in pages
    )

    if not full_text.strip():
        raise PDFExtractionError(
            "No extractable text found. "
            "The PDF may be scanned."
        )

    return {
        "page_count": len(pages),
        "pages": pages,
        "full_text": full_text
    }