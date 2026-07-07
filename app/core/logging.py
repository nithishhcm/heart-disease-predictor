import os
import logging
import json
from datetime import datetime
from logging.handlers import RotatingFileHandler

# Create logs directory in workspace root
LOG_DIR = os.path.join(os.getcwd(), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

class JSONFormatter(logging.Formatter):
    """Formats log records into JSON strings for machine parsing."""
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "name": record.name,
            "level": record.levelname,
            "message": record.getMessage(),
        }
        if hasattr(record, "extra") and isinstance(record.extra, dict):
            log_data.update(record.extra)
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)

def setup_logger(name: str, log_file: str, level=logging.INFO) -> logging.Logger:
    """Creates a logger with both console and rotating file output."""
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Avoid duplicate handlers if already configured
    if not logger.handlers:
        # File handler
        file_path = os.path.join(LOG_DIR, log_file)
        file_handler = RotatingFileHandler(
            file_path, maxBytes=10*1024*1024, backupCount=5, encoding="utf-8"
        )
        file_handler.setFormatter(JSONFormatter())
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_format = logging.Formatter(
            '[%(asctime)s] %(levelname)s [%(name)s]: %(message)s'
        )
        console_handler.setFormatter(console_format)
        
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
    return logger

# Individual structured loggers
auth_logger = setup_logger("authentication", "auth.log")
prediction_logger = setup_logger("prediction", "predictions.log")
api_logger = setup_logger("api", "api.log")
perf_logger = setup_logger("performance", "performance.log")
db_logger = setup_logger("database", "database.log")
exception_logger = setup_logger("exception", "exceptions.log")
audit_logger = setup_logger("audit", "audit.log")

def log_event(logger: logging.Logger, message: str, extra: dict = None, level: int = logging.INFO):
    """Helper to log an event with structured metadata."""
    if extra is None:
        extra = {}
    logger.log(level, message, extra={"extra": extra})
