from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from app.config import Config

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app)

    from app.routes.auth import auth_bp
    from app.routes.policy import policy_bp
    from app.routes.claims import claims_bp
    from app.routes.triggers import triggers_bp
    from app.routes.ml import ml_bp
    from app.routes.admin import admin_bp
    from app.routes.predict import predict_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(policy_bp, url_prefix='/api/policies')
    app.register_blueprint(claims_bp, url_prefix='/api/claims')
    app.register_blueprint(triggers_bp, url_prefix='/api/triggers')
    app.register_blueprint(ml_bp, url_prefix='/api/ml')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(predict_bp, url_prefix='/api/predict')

    return app