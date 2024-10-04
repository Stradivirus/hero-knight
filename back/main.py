# back/main.py
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, inspect, desc, or_, text
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.types import String
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
from sshtunnel import SSHTunnelForwarder
from pathlib import Path
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 현재 파일(main.py)의 디렉토리 경로
CURRENT_DIR = Path(__file__).resolve().parent

# .env 파일 로드
load_dotenv(CURRENT_DIR / ".env")

app = FastAPI()

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 환경 변수 로드
SSH_HOST = os.getenv('SSH_HOST')
SSH_USER = os.getenv('SSH_USER')
SSH_PKEY = os.getenv('SSH_PKEY')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = int(os.getenv('DB_PORT'))
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_NAME = os.getenv('DB_NAME')

# SSH 키 파일 경로 처리
ssh_key_path = CURRENT_DIR / SSH_PKEY
if not ssh_key_path.exists():
    raise FileNotFoundError(f"SSH key file not found: {ssh_key_path}")

# SSH 터널 설정
try:
    ssh_tunnel = SSHTunnelForwarder(
        (SSH_HOST, 22),
        ssh_username=SSH_USER,
        ssh_pkey=str(ssh_key_path),
        remote_bind_address=(DB_HOST, DB_PORT)
    )
    ssh_tunnel.start()
except Exception as e:
    logger.error(f"Failed to establish SSH tunnel: {str(e)}")
    raise

# 데이터베이스 연결 설정
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@127.0.0.1:{ssh_tunnel.local_bind_port}/{DB_NAME}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 자동 매핑을 위한 Base 설정
Base = automap_base()
Base.prepare(autoload_with=engine)

# Pydantic 모델
class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str

class TableInfo(BaseModel):
    name: str
    record_count: int

# 의존성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# 유틸리티 함수
def get_table_names_with_records(db: Session):
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    tables_with_records = []
    for table_name in table_names:
        count = db.execute(text(f"SELECT COUNT(*) FROM `{table_name}`")).scalar()
        if count > 0:
            tables_with_records.append({"name": table_name, "record_count": count})
    return tables_with_records

# 라우트
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Base.classes.sys_user).filter(Base.classes.sys_user.username == form_data.username).first()
    if not user or user.password != form_data.password:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    return {"access_token": user.username, "token_type": "bearer"}

@app.get("/users/me", response_model=UserOut)
async def read_users_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = db.query(Base.classes.sys_user).filter(Base.classes.sys_user.username == token).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "username": user.username}

@app.get("/tables", response_model=List[TableInfo])
async def get_tables(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return get_table_names_with_records(db)

@app.get("/table/{table_name}", response_model=Dict[str, Any])
async def get_table_data(
    table_name: str,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    search_term: Optional[str] = Query(None),
    column: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100)
):
    if table_name not in Base.classes:
        raise HTTPException(status_code=404, detail="Table not found")
    
    table = Base.classes[table_name]
    query = db.query(table)
    
    if search_term and column:
        column_obj = getattr(table, column, None)
        if column_obj is not None:
            if isinstance(column_obj.type, String):
                query = query.filter(column_obj.ilike(f"%{search_term}%"))
            else:
                query = query.filter(column_obj == search_term)
    
    total = query.count()
    
    # 가장 최근 데이터를 먼저 가져오도록 정렬
    if 'id' in table.__table__.columns:
        query = query.order_by(desc(table.id))
    
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    results = []
    for row in query:
        row_dict = {column.name: getattr(row, column.name) for column in row.__table__.columns}
        results.append(row_dict)
    
    # 디버깅을 위한 로그 추가
    print(f"Table: {table_name}, Search Term: {search_term}, Column: {column}")
    print(f"Total results: {total}, Page: {page}, Results returned: {len(results)}")
    
    return {
        "data": results,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }

@app.get("/table/{table_name}/columns")
async def get_table_columns(
    table_name: str,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    if table_name not in Base.classes:
        raise HTTPException(status_code=404, detail="Table not found")
    
    table = Base.classes[table_name]
    columns = [column.name for column in table.__table__.columns]
    return {"columns": columns}

@app.on_event("shutdown")
def shutdown_event():
    ssh_tunnel.stop()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)