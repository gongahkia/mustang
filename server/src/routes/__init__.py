from .auth import auth_bp
from .health import health_bp
from .relay import relay_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(health_bp, url_prefix='/health')
    app.register_blueprint(relay_bp, url_prefix='/relay')
    from ..utils.decorators import limiter
    limiter.init_app(app)