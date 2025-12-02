import json
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(root_path="/api")


# --- IPFS 配置 ---
# 在 Docker Compose 网络中，服务名称 'ipfs' 会被解析为 IPFS 容器的内部 IP
IPFS_API_URL = "http://ipfs:5001/api/v0/add"

evidence_router = APIRouter(prefix="/v1/evidence", tags=["evidence"])


# --- Pydantic 模型 ---
class EvidenceRequest(BaseModel):
    content: str


@evidence_router.post("/")
async def prepare_evidence(request: EvidenceRequest):
    # 1. 构建证据 JSON 对象
    evidence_data = {
        "content": request.content,
        "metadata": {
            "timestamp": datetime.now(timezone.utc),
            "version": "1.0",
        },
    }

    # 2. 将证据异步上传到 IPFS
    try:
        # IPFS API 期望文件作为 multipart/form-data
        files = {"file": json.dumps(evidence_data)}

        # 使用 httpx.AsyncClient 进行异步请求
        async with httpx.AsyncClient() as client:
            response = await client.post(IPFS_API_URL, files=files, timeout=30.0)
            response.raise_for_status()

        ipfs_result = response.json()
        cid = ipfs_result.get("Hash")
        if not cid:
            raise HTTPException(
                status_code=500, detail="Failed to get CID from IPFS response."
            )

    except httpx.RequestError as e:
        # 捕获 httpx 相关的连接或请求错误
        raise HTTPException(
            status_code=500, detail=f"Could not connect to IPFS or request failed: {e}"
        )
    except Exception as e:
        # 捕获其他意外错误
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {e}"
        )

    # 3. 返回 IPFS CID
    return {"cid": cid}


app.include_router(evidence_router)


@app.get("/api/health-check")
async def health_check():
    return {"status": "ok"}
