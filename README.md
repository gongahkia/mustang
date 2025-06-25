[![](https://img.shields.io/badge/mustang_1.0.0-passing-green)](https://github.com/gongahkia/mustang/releases/tag/1.0.0) 

# `Mustang` 🔥

Cryptographically-secure Communication Platform with [Auto-destructing messages](./client/src/utils/purgeService.js), [Client-side Encryption](./client/src/crypto/) and [Hash Chaining](./server/src/chain/).

## Stack

* *Frontend*: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)
* *Backend*: [Flask](https://flask.palletsprojects.com/en/stable/), [Python](https://www.python.org/), [Gunicorn](https://gunicorn.org/), [Heroku](https://www.heroku.com/)
* *Package*: [Docker](https://www.docker.com/)
* *Cache*: [Redis](https://redis.io/about/)
* *DB*: [Firebase Firestore](https://firebase.google.com/docs/firestore)
* *Auth*: [Firebase Auth](https://firebase.google.com/docs/auth), [WebAuthn](https://webauthn.io/), [JWT](https://jwt.io/)
* *CI/CD*: [Github Actions](https://github.com/features/actions)

## Rationale

Ever since learning about the tech behind [classic blockchain systems](https://en.wikipedia.org/wiki/Blockchain), I couldn't shake the feeling that its [immutable, tamper-resistant](https://log-locker.com/en/blog/the-importance-of-immutable-and-tamper-proof-data-in-compliance) properties would be beneficial for developing a secure, zero-trust communication tool. 

With that in mind, I threw together `Mustang`.

`Mustang` is a Security-first Communication Platform-as-Framework designed to provide [Zero-trust](https://www.cloudflare.com/learning/security/glossary/what-is-zero-trust/), [TTL-based](https://en.wikipedia.org/wiki/Time_to_live) temporal messaging. It achieves this by integrating Client-side [AES-256-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode) with [ECDH key exchange](https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman), reinforced by [Cryptographic hash chaining](https://en.wikipedia.org/wiki/Hash_chain) and Redis' [Ephemeral storage](https://redis.io/docs/latest/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage/) to guarantee [Message integrity](https://www.geeksforgeeks.org/computer-networks/message-integrity-in-cryptography/) and zero [Plaintext persistence](https://en.wikipedia.org/wiki/Persistence_(computer_science)) even over Server-facilitated transmission.

`Mustang` also acts as my [second](https://github.com/gongahkia/kiwi) official foray into the Cyber Security space, so there's much I still have to learn. Please [***open an issue***](https://github.com/gongahkia/mustang/issues) to help improve `Mustang`. I appreciate any guidance I can get.

## Usage

The below instructions are for locally hosting `Mustang`.

1. First execute the below.

```console
$ git clone https://github.com/gongahkia/mustang && cd mustang
```

2. Then run the below to start up the [Frontend](./client/) and [Backend](./server/).

```console
$ docker run -d -p 6379:6379 --name mustang-redis redis:7-alpine
$ cd server && python app.py & SERVER_PID=$! && cd ..
$ cd client && npm run dev
```

3. Alternatively, run the below to run [unit tests](./tests/).

```console
$ npm --prefix client test
$ cd server && pytest && cd ..
```

4. Run the below to run [load tests](./tests/).

```console
$ cd server && gunicorn --config config/gunicorn.conf.py wsgi:app & SERVER_PID=$! && cd ..
$ k6 run tests/load/api_load_test.js
$ k6 run tests/load/crypto_benchmark.js
$ k6 run tests/load/websocket_test.js
$ kill $SERVER_PID
```

5. Run the below to run [security and fuzz tests](./tests/).

```console
$ python -m unittest tests/fuzz/api_security_test.py
$ zap.sh -cmd -config tests/fuzz/zap_baseline.conf
$ zap.sh -cmd -config tests/fuzz/zap_full_scan.conf
```

## Architecture

### Overview

```mermaid
sequenceDiagram
    Actor User as User
    participant FE as Frontend (React)
    participant BE as Backend (Flask)
    participant FA as Firebase Auth
    participant FS as Firestore
    participant RD as Redis
    participant AWS as AWS KMS
    participant Prom as Prometheus
    participant Audit as Audit System

    User->>FE: 1. Login with WebAuthn
    FE->>FA: 2. Initiate authentication
    FA->>FS: 3. Retrieve user public key
    FS-->>FA: 4. Return public key
    FA-->>FE: 5. Authentication success
    FE->>BE: 6. Request JWT with public key
    BE->>AWS: 7. Sign JWT with HSM
    AWS-->>BE: 8. Signed JWT
    BE-->>FE: 9. Return JWT token

    User->>FE: 10. Send encrypted message
    FE->>BE: 11. POST /relay/send (JWT + encrypted payload)
    BE->>FA: 12. Verify JWT
    FA-->>BE: 13. Token valid
    BE->>RD: 14. Retrieve previous chain link
    RD-->>BE: 15. Previous hash
    BE->>BE: 16. Verify: SHA-256(prev_hash + current_hash) == chain_hash
    alt Verification passed
        BE->>RD: 17. Store message (TTL=60s)
        RD-->>BE: 18. Storage confirmation
        BE->>Audit: 19. Log chain verification
        Audit->>FS: 20. Store encrypted audit log
        BE->>Prom: 21. Report chain integrity metric
        BE-->>FE: 22. 201 Created (message_id)
        FE->>FE: 23. Start 55s purge countdown
    else Verification failed
        BE->>Audit: 24. Log chain violation
        BE-->>FE: 25. 400 Bad Request
    end

    User->>FE: 26. Retrieve message
    FE->>BE: 27. GET /relay/receive/:id (JWT)
    BE->>RD: 28. Retrieve encrypted message
    RD-->>BE: 29. Encrypted data + TTL
    BE->>BE: 30. Verify recipient access
    BE-->>FE: 31. Encrypted payload
    FE->>FE: 32. Decrypt message (Web Worker)
    FE->>User: 33. Display decrypted message

    loop Auto-Purge System
        FE->>FE: 34. Monitor TTL (55s/60s)
        FE->>BE: 35. Confirm purge (55s)
        BE->>RD: 36. Early deletion
        BE->>Audit: 37. Log purge event
    end

    Note over FE,BE: Security Enforcement
    BE->>Prom: 38. Regular health checks
    Prom->>BE: 39. Alert on anomalies
    BE->>AWS: 40. Quarterly key rotation
```

### Frontend

```mermaid
flowchart TD
    subgraph Frontend Architecture
        A[React App] --> B[AuthContext]
        A --> C[CryptoContext]
        A --> D[ProtectedRoute]
        A --> E[Dashboard]

        B --> F[Firebase Auth]
        B --> G[WebAuthn Hardware Auth]

        C --> H[Web Workers]
        H --> I["AES-256-GCM Encryption"]
        H --> J["ECDH Key Exchange"]
        H --> K["Hash Chain Builder"]
        H --> L["Zeroization Utilities"]

        E --> M[MessageComposer]
        E --> N[ChainMonitor]
        E --> O[AutoPurgeNotifier]

        M --> C
        N --> C
        O --> C

        C --> P[API Client]
        P --> Q[Python Backend]
        
        style A fill:#2ecc71,stroke:#27ae60
        style H fill:#3498db,stroke:#2980b9
        style I,J,K,L fill:#9b59b6,stroke:#8e44ad
    end

    subgraph Security Utilities
        R["Memory Zeroization"] --> S["crypto.subtle.zeroize()"]
        T["TTL Enforcement"] --> U["55s/60s Countdown"]
        V["Content Security"] --> W["Strict CSP Headers"]
        X["Key Management"] --> Y["Web Crypto API"]
    end

    H --> R
    O --> T
    A --> V
    C --> X
```

### Backend

```mermaid
flowchart TD
    subgraph Backend Architecture
        A[Flask App] --> B[Request Entry]
        B --> C{Auth Required?}
        C -->|Yes| D[Firebase Auth]
        C -->|No| E[Process Request]
        
        D --> F[Verify ID Token]
        F -->|Valid| G[Get User Public Key]
        F -->|Invalid| H[401 Unauthorized]
        
        E --> I[Message Processing]
        I --> J[Relay Request]
        
        J --> K[Chain Verifier]
        K --> L[Verify Hash Chain]
        L --> M[Check: SHA-256 + current_hash]
        M -->|Valid| N[Store in Redis]
        M -->|Invalid| O[400 Bad Request]
        
        N --> P[Set 60s TTL]
        N --> Q[Return Message ID]
        
        subgraph Data Stores
            R[(Redis)] -->|Store| S["{ciphertext, iv, chain_hash}<br>TTL=60s"]
            T[(Firestore)] --> U[User Public Keys]
        end
        
        D --> T
        N --> R
        G --> T
        
        style A fill:#2ecc71,stroke:#27ae60
        style K fill:#3498db,stroke:#2980b9
        style M fill:#9b59b6,stroke:#8e44ad
    end
```

### DB

```mermaid
erDiagram
    USERS ||--o{ MESSAGES : "1:N"
    USERS ||--o{ PUBLIC_KEYS : "1:1"
    MESSAGES ||--o{ CHAIN_LINKS : "1:N"
    AUDIT_LOGS }|--|| USERS : "N:1"
    COMPLIANCE_REPORTS }|--|| USERS : "N:1"

    USERS {
        string user_id PK "UID from Firebase Auth"
        string email
        timestamp created_at
        timestamp last_login
    }
    
    PUBLIC_KEYS {
        string user_id FK "References USERS.user_id"
        string public_key "PEM format"
        timestamp generated_at
        timestamp expires_at
        bool is_active
    }
    
    MESSAGES {
        string message_id PK "UUIDv4"
        string sender_id FK "References USERS.user_id"
        string recipient_id FK "References USERS.user_id"
        timestamp sent_at
        timestamp expires_at "TTL timestamp"
        string status "SENT/DELIVERED/READ/PURGED"
    }
    
    CHAIN_LINKS {
        string link_id PK "Composite: message_id + sequence"
        string message_id FK "References MESSAGES.message_id"
        int sequence
        bytes previous_hash "SHA-256"
        bytes current_hash "SHA-256(prev_hash + current_hash)"
        bytes iv "12-byte IV"
        bytes ciphertext "AES-256-GCM encrypted"
    }
    
    AUDIT_LOGS {
        string event_id PK "UUIDv4"
        string user_id FK "References USERS.user_id"
        string event_type "PURGE/CHAIN_ALERT/LOGIN"
        string message_id FK "Nullable, References MESSAGES.message_id"
        json details
        timestamp occurred_at
    }
    
    COMPLIANCE_REPORTS {
        string report_id PK "UUIDv4"
        string user_id FK "References USERS.user_id"
        string report_type "SOC2/FIPS/HSM"
        timestamp generated_at
        string storage_path "Encrypted in GCS"
        string checksum "SHA-256 of report"
    }
```

## Reference

The name `Mustang` is in reference to [Roy Mustang](https://fma.fandom.com/wiki/Roy_Mustang) (ロイ・マスタング), (also referred to as the [Flame Alchemist](https://angel-bazethiel.tumblr.com/post/628930233049006080/what-how-why-is-flame-alchemy)), a [State Alchemist](https://fma.fandom.com/wiki/Alchemist#State_Alchemist) and [Officer](https://fma.fandom.com/wiki/Military_Ranks) of the [Amestris](https://fma.fandom.com/wiki/Amestris) [State Military](https://fma.fandom.com/wiki/State_Military). Roy is generally recognised as the tritagonist of the completed manga series [Fullmetal Alchemist](https://fma.fandom.com/wiki/Fullmetal_Alchemist_(Franchise)).

<div align="center">
    <img src="./asset/logo/mustang.png" width="55%">
</div>

## Research

...