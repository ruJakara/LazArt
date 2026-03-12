# Integration Spec Template

## Integration
Какие системы сшиваются.

## Objective
Что должно работать сквозным сценарием.

## Systems and Ownership
- Система:
  - Владелец:
  - Ответственность в цепочке:

## Contracts
- Endpoint/event:
  - Request/input:
  - Response/output:
  - Error format:

## Main Integration Flow
1. 
2. 
3. 

## Retries, Timeouts, Idempotency
- Retry policy:
- Timeout limits:
- Idempotency key/rule:

## Failure Modes
- Сбой:
  - Как обнаруживаем:
  - Как деградируем:
  - Как восстанавливаем:

## Security and Secrets
- Какие секреты нужны.
- Где и как хранятся.

## Observability
- Логи:
- Метрики:
- Correlation ID:

## Acceptance Criteria
- [ ] Happy-path проходит end-to-end.
- [ ] Failure-path обрабатывается предсказуемо.
- [ ] Контракты и конфиги задокументированы.
