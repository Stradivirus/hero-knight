# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import sessionmaker
from sshtunnel import SSHTunnelForwarder
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 현재 파일의 디렉토리 경로
CURRENT_DIR = Path(__file__).resolve().parent

# 프로젝트 루트 디렉토리 경로 (back 폴더의 상위 디렉토리)
PROJECT_ROOT = CURRENT_DIR.parent

# .env 파일 로드
load_dotenv(CURRENT_DIR / ".env")

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
ssh_key_path = PROJECT_ROOT / SSH_PKEY
if not ssh_key_path.exists():
    raise FileNotFoundError(f"SSH key file not found: {ssh_key_path}")

logger.info(f"SSH key path: {ssh_key_path}")

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

# 데이터베이스 세션 의존성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 애플리케이션 종료 시 SSH 터널 닫기
def close_ssh_tunnel():
    ssh_tunnel.stop()

# 이 부분은 main.py에서 실행될 때 사용됩니다
if __name__ == "__main__":
    # 데이터베이스 연결 테스트
    with SessionLocal() as session:
        result = session.execute("SELECT 1")
        print(f"Database connection test result: {result.scalar()}")