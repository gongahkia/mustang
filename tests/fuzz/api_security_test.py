import unittest
from app import create_app
from config.settings import config_dict

class APISecurityTest(unittest.TestCase):
    def setUp(self):
        self.app = create_app(config=config_dict['testing']).test_client()
        self.auth_header = {'Authorization': 'Bearer test_token'}

    def test_authentication_required(self):
        endpoints = [
            ('/relay/send', 'POST'),
            ('/relay/receive/123', 'GET'),
            ('/auth/exchange-key', 'POST')
        ]
        
        for endpoint, method in endpoints:
            with self.subTest(endpoint=endpoint):
                if method == 'POST':
                    response = self.app.post(endpoint, json={})
                else:
                    response = self.app.get(endpoint)
                self.assertEqual(response.status_code, 401)

    def test_rate_limiting(self):
        for i in range(11):
            response = self.app.post('/relay/send', 
                json={},
                headers=self.auth_header
            )
            if i == 10:  
                self.assertEqual(response.status_code, 429)

    def test_invalid_payload(self):
        invalid_payloads = [
            {'ciphertext': 'a'*10000},  
            {'iv': 'invalid_iv'}, 
            {'chain_hash': 'short'},     
            {}                        
        ]
        
        for payload in invalid_payloads:
            response = self.app.post('/relay/send', 
                json=payload,
                headers=self.auth_header
            )
            self.assertEqual(response.status_code, 400)

    def test_message_retrieval_security(self):
        response = self.app.get('/relay/receive/valid_id', headers=self.auth_header)
        self.assertIn(response.status_code, [200, 404])
        
        response = self.app.get('/relay/receive/invalid_id', headers=self.auth_header)
        self.assertEqual(response.status_code, 403)
        
        for i in range(100):
            response = self.app.get(f'/relay/receive/attempt_{i}', headers=self.auth_header)
            if response.status_code == 429:
                break
        else:
            self.fail("Brute-force protection not triggered")

if __name__ == '__main__':
    unittest.main()