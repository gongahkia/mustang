import unittest
from unittest.mock import patch, MagicMock
from src.firebase.auth import verify_firebase_token, firebase_auth_required
from flask import Flask, request

class TestAuth(unittest.TestCase):
    @patch('src.firebase.auth.auth')
    def test_verify_token_success(self, mock_auth):
        mock_auth.verify_id_token.return_value = {'sub': 'user123', 'email_verified': True}
        token = "valid_token"
        claims = verify_firebase_token(token)
        self.assertEqual(claims['sub'], 'user123')
    
    @patch('src.firebase.auth.auth')
    def test_verify_token_failure(self, mock_auth):
        mock_auth.verify_id_token.side_effect = ValueError("Invalid token")
        with self.assertRaises(ValueError):
            verify_firebase_token("invalid_token")
    
    @patch('src.firebase.auth.verify_firebase_token')
    def test_auth_decorator_success(self, mock_verify):
        mock_verify.return_value = {'user_id': 'test-user'}
        
        app = Flask(__name__)
        @app.route('/protected')
        @firebase_auth_required
        def protected_route():
            return "OK"
        
        with app.test_client() as client:
            response = client.get(
                '/protected',
                headers={'Authorization': 'Bearer valid_token'}
            )
            self.assertEqual(response.status_code, 200)
    
    @patch('src.firebase.auth.verify_firebase_token')
    def test_auth_decorator_failure(self, mock_verify):
        mock_verify.side_effect = ValueError("Invalid token")
        
        app = Flask(__name__)
        @app.route('/protected')
        @firebase_auth_required
        def protected_route():
            return "OK"
        
        with app.test_client() as client:
            response = client.get(
                '/protected',
                headers={'Authorization': 'Bearer invalid_token'}
            )
            self.assertEqual(response.status_code, 401)

if __name__ == '__main__':
    unittest.main()