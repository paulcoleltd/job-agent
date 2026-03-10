from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Document
import aiofiles
import os
import uuid

router = APIRouter()
UPLOAD_DIR = "/tmp/job-agent-docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = "resume",
    db: AsyncSession = Depends(get_db)
):
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    doc = Document(
        type=doc_type,
        name=file.filename,
        file_path=file_path,
        doc_metadata={"original_name": file.filename, "size": len(content)}
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # If CV, extract text and update profile
    if doc_type == "resume" and file.filename.endswith(".pdf"):
        try:
            import PyPDF2
            import io
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            cv_text = " ".join(page.extract_text() for page in reader.pages)
            from models import UserProfile
            result = await db.execute(select(UserProfile))
            profile = result.scalar_one_or_none()
            if not profile:
                profile = UserProfile(cv_text=cv_text)
                db.add(profile)
            else:
                profile.cv_text = cv_text
            await db.commit()
        except Exception:
            pass

    return {"id": str(doc.id), "name": doc.name, "type": doc.type}
