from flask import Flask
from src.routes import register_blueprints
from config.settings import Config
from src.firebase.admin import init_firebase

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    from src.firebase.admin import init_firebase
    init_firebase(app)
    
    register_blueprints(app)
    
    @app.after_request
    def add_security_headers(response):
        response.headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'none';"
        return response
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000)