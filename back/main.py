from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.types import String
from typing import List, Dict, Any, Optional
import uvicorn
from database import get_db, Base, engine
from models import UserLogin, UserOut, TableInfo
from database_manager import db_manager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

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
    try:
        specific_tables = [
            "account", "cdktype", "charge", "chatlog", "gamenotice",
            "sendmail", "serverinfo", "statserverdaily"
        ]
        tables = []
        for table_name in specific_tables:
            query = text(f"SELECT COUNT(*) FROM {table_name}")
            result = db.execute(query)
            count = result.scalar()
            tables.append({"name": table_name, "record_count": count})
        return tables
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tables: {str(e)}")

@app.get("/servers")
async def get_servers(token: str = Depends(oauth2_scheme)):
    try:
        servers = db_manager.get_servers()
        return servers
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch servers: {str(e)}")

@app.get("/player/columns/{db_name}")
async def get_player_columns(db_name: str, token: str = Depends(oauth2_scheme)):
    try:
        columns = db_manager.get_table_columns(db_name, 'player')
        return {"columns": columns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch player columns: {str(e)}")

@app.get("/player/{db_name}")
async def search_players(
    db_name: str,
    search_column: str = Query(..., description="Column to search"),
    search_term: str = Query(..., description="Search term"),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    token: str = Depends(oauth2_scheme)
):
    try:
        result = db_manager.search_table(db_name, 'player', search_column, search_term, page, page_size)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search players: {str(e)}")

@app.get("/backpack/columns/{db_name}")
async def get_backpack_columns(db_name: str, token: str = Depends(oauth2_scheme)):
    try:
        columns = db_manager.get_table_columns(db_name, 'backpack')
        return {"columns": columns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch backpack columns: {str(e)}")

@app.get("/backpack/{db_name}")
async def search_backpack(
    db_name: str,
    search_column: str = Query(..., description="Column to search"),
    search_term: str = Query(..., description="Search term"),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    token: str = Depends(oauth2_scheme)
):
    try:
        result = db_manager.search_table(db_name, 'backpack', search_column, search_term, page, page_size)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search backpack: {str(e)}")

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
    
    if 'id' in table.__table__.columns:
        query = query.order_by(table.id.desc())
    
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    results = []
    for row in query:
        row_dict = {column.name: getattr(row, column.name) for column in row.__table__.columns}
        results.append(row_dict)
    
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)