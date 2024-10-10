import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
import os
from dotenv import load_dotenv
from database import ssh_tunnel, get_db

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

class DatabaseManager:
    def __init__(self):
        self.db_connections = {}
        self.create_db_connections()

    def create_db_connections(self):
        GAME_DB_HOST = os.getenv('GAME_DB_HOST')
        GAME_DB_PORT = os.getenv('GAME_DB_PORT')
        GAME_DB_USER = os.getenv('GAME_DB_USER')
        GAME_DB_PASSWORD = os.getenv('GAME_DB_PASSWORD')
        GAME_DB_PREFIX = os.getenv('GAME_DB_PREFIX')

        local_port = ssh_tunnel.local_bind_port

        for i in range(101, 121):  # fe_game_101 to fe_game_120
            db_name = f'{GAME_DB_PREFIX}{i}'
            db_url = f"mysql+pymysql://{GAME_DB_USER}:{GAME_DB_PASSWORD}@{GAME_DB_HOST}:{local_port}/{db_name}"
            try:
                engine = create_engine(db_url)
                self.db_connections[db_name] = sessionmaker(bind=engine)
                logger.info(f"Successfully connected to {db_name}")
                self.test_connection(db_name)
            except Exception as e:
                logger.error(f"Failed to connect to {db_name}: {str(e)}")

    @contextmanager
    def get_db_session(self, db_name):
        if db_name not in self.db_connections:
            raise ValueError(f"Database {db_name} not found")
        
        session = self.db_connections[db_name]()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Error in database session for {db_name}: {str(e)}")
            raise
        finally:
            session.close()

    def test_connection(self, db_name):
        with self.get_db_session(db_name) as session:
            result = session.execute(text("SELECT 1"))
            logger.info(f"Connection test for {db_name}: {result.scalar()}")

    def get_servers(self):
        fe_login_db = next(get_db())
        try:
            result = fe_login_db.execute(text("SELECT id, name FROM serverinfo"))
            servers = [{"id": row.id, "name": row.name, "db_name": f"fe_game_{row.id}"} for row in result]
            return servers
        except Exception as e:
            logger.error(f"Error fetching server info: {str(e)}")
            return []
        finally:
            fe_login_db.close()

    def get_table_columns(self, db_name, table_name):
        with self.get_db_session(db_name) as session:
            columns_query = text(f"SHOW COLUMNS FROM {table_name}")
            columns = [row[0] for row in session.execute(columns_query)]
            return columns

    def search_table(self, db_name, table_name, search_column, search_term, page=1, page_size=30):
        try:
            with self.get_db_session(db_name) as session:
                columns = self.get_table_columns(db_name, table_name)
                logger.debug(f"Columns for {db_name}.{table_name}: {columns}")

                offset = (page - 1) * page_size
                query = text(f"""
                    SELECT * FROM {table_name} 
                    WHERE CAST({search_column} AS CHAR) LIKE :search_term
                    LIMIT :limit OFFSET :offset
                """)
                params = {
                    "search_term": f"%{search_term}%",
                    "limit": page_size,
                    "offset": offset
                }
                logger.debug(f"Executing query: {query}")
                logger.debug(f"Query parameters: {params}")
                
                result = session.execute(query, params)
                
                logger.debug(f"Result type: {type(result)}")
                
                try:
                    items = []
                    for row in result:
                        item = {}
                        for column in columns:
                            item[column] = getattr(row, column, None)
                        items.append(item)
                except Exception as e:
                    logger.error(f"Error processing row: {e}")
                    logger.error(f"Row content: {row}")
                    raise

                logger.debug(f"Query result: {items}")

                count_query = text(f"SELECT COUNT(*) FROM {table_name} WHERE CAST({search_column} AS CHAR) LIKE :search_term")
                count_params = {"search_term": f"%{search_term}%"}
                logger.debug(f"Executing count query: {count_query}")
                logger.debug(f"Count query parameters: {count_params}")
                
                total_count = session.execute(count_query, count_params).scalar()
                logger.debug(f"Total count: {total_count}")

                total_pages = (total_count + page_size - 1) // page_size

                return {
                    "columns": columns,
                    "data": items,
                    "total_pages": total_pages,
                    "current_page": page,
                    "total_count": total_count
                }
        except Exception as e:
            logger.error(f"Error in search_table: {str(e)}", exc_info=True)
            raise

db_manager = DatabaseManager()