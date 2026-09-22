import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    db_path = os.getenv("DATABASE_PATH")
    if db_path:
        db_path = os.path.abspath(db_path)
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        DATABASE_URL = f"sqlite:///{db_path}"
    else:
        DATABASE_URL = f"sqlite:///{os.path.join(DATABASE_DIR, 'crm.db')}"
else:
    if DATABASE_URL.startswith("sqlite:///"):
        sqlite_file = DATABASE_URL.replace("sqlite:///", "")
        if sqlite_file and not sqlite_file.startswith(":memory:"):
            parent_dir = os.path.dirname(os.path.abspath(sqlite_file))
            if parent_dir:
                os.makedirs(parent_dir, exist_ok=True)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
