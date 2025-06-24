from app import create_app
from config.settings import config_dict
import os

environment = os.environ.get('FLASK_ENV', 'production')
app = create_app(config=config_dict[environment])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)