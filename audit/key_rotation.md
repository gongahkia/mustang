# Key Rotation Policy

## Purpose

To ensure cryptographic key security and compliance, Mustang implements a strict key rotation policy.

## Rotation Schedule

- JWT signing keys are rotated every 90 days.
- Grace period of 7 days for key transition.
- Old keys are retired 30 days after rotation.

## Rotation Process

1. Generate new key pair in HSM or secure environment.
2. Publish new public key to JWK endpoint.
3. Clients fetch updated keys automatically.
4. Monitor key usage and audit logs.

## Compliance

- Aligns with NIST SP 800-57 recommendations.
- Supports SOC2 and FIPS 140-2 audit requirements.

## Incident Handling

- Immediate key revocation on compromise.
- Emergency rotation procedures documented.

## References

- NIST SP 800-57
- SOC2 Key Management Guidelines