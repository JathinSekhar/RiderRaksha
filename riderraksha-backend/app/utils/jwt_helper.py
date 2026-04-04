from flask_jwt_extended import get_jwt_identity
from app.models.worker import Worker

def get_current_worker():
    worker_id = get_jwt_identity()

    if not worker_id:
        return None

    try:
        worker_id = int(worker_id)
    except:
        return None

    return Worker.query.get(worker_id)