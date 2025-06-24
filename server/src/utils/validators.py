import base64
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

class ValidationError(Exception):
    pass

def validate_request_data(data: dict, schema: dict) -> list:
    errors = []
    
    for field, rules in schema.items():
        if rules.get('required') and field not in data:
            errors.append(f"Missing required field: {field}")
            continue
            
        if field in data:
            value = data[field]
            try:
                if 'type' in rules:
                    if rules['type'] == 'string':
                        validate_string(value, rules)
                    elif rules['type'] == 'integer':
                        validate_integer(value, rules)
                    elif rules['type'] == 'boolean':
                        validate_boolean(value, rules)
                    elif rules['type'] == 'base64':
                        validate_base64(value, rules)
                
                if 'custom' in rules:
                    rules['custom'](value)
                    
            except ValidationError as e:
                errors.append(str(e))
                
    return errors

def validate_string(value: Any, rules: dict):
    if not isinstance(value, str):
        raise ValidationError(f"Expected string, got {type(value).__name__}")
        
    if 'minlength' in rules and len(value) < rules['minlength']:
        raise ValidationError(f"Minimum length {rules['minlength']}, got {len(value)}")
        
    if 'maxlength' in rules and len(value) > rules['maxlength']:
        raise ValidationError(f"Maximum length {rules['maxlength']}, got {len(value)}")
        
    if 'regex' in rules and not re.match(rules['regex'], value):
        raise ValidationError(f"Value does not match pattern: {rules['regex']}")

def validate_base64(value: str, rules: dict):
    validate_string(value, rules)
    try:
        decoded = base64.b64decode(value)
        if 'minlength_bytes' in rules and len(decoded) < rules['minlength_bytes']:
            raise ValidationError(f"Minimum {rules['minlength_bytes']} bytes after decoding")
        if 'maxlength_bytes' in rules and len(decoded) > rules['maxlength_bytes']:
            raise ValidationError(f"Maximum {rules['maxlength_bytes']} bytes after decoding")
    except (base64.binascii.Error, ValueError):
        raise ValidationError("Invalid base64 encoding")

def validate_integer(value: Any, rules: dict):
    if not isinstance(value, int):
        raise ValidationError(f"Expected integer, got {type(value).__name__}")
        
    if 'min' in rules and value < rules['min']:
        raise ValidationError(f"Minimum value {rules['min']}, got {value}")
        
    if 'max' in rules and value > rules['max']:
        raise ValidationError(f"Maximum value {rules['max']}, got {value}")

def validate_boolean(value: Any, rules: dict):
    if not isinstance(value, bool):
        raise ValidationError(f"Expected boolean, got {type(value).__name__}")

def validate_timestamp(value: str):
    try:
        datetime.fromisoformat(value)
    except ValueError:
        raise ValidationError("Invalid ISO 8601 timestamp")