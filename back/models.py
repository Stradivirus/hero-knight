# models.py
from pydantic import BaseModel
from typing import List, Dict, Any

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str

class TableInfo(BaseModel):
    name: str
    record_count: int

class TableData(BaseModel):
    data: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int
    total_pages: int

class ColumnList(BaseModel):
    columns: List[str]