from pdfminer.high_level import extract_text

# Extract text from PDF file
def extract_text_from_pdf(pdf_path):
    try:
        pdf_text = extract_text(pdf_path)
        return pdf_text
    except Exception as e:
        print(f"Failed to parse PDF: {e}")
        return ""
    
