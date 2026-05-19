CREATE TABLE IF NOT EXISTS person (
  person_id   BIGINT PRIMARY KEY,
  cpf         VARCHAR(11)    UNIQUE NOT NULL,
  name        TEXT           NOT NULL,
  email       TEXT           UNIQUE NOT NULL,
  gender      CHAR(1)        NOT NULL,
  birth_date  DATE           NOT NULL,
  address     TEXT           NOT NULL,
  salary      DECIMAL(12, 2) NOT NULL,
  event_time  TIMESTAMPTZ    NOT NULL,
  created_at  TIMESTAMPTZ    DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account (
  account_id        BIGINT PRIMARY KEY,
  person_id         BIGINT         NOT NULL,
  status_id         INT            NOT NULL,
  due_day           INT            NOT NULL,
  balance           DECIMAL(12, 2) NOT NULL,
  available_balance DECIMAL(12, 2) NOT NULL,
  event_time        TIMESTAMPTZ    NOT NULL,
  created_at        TIMESTAMPTZ    DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS card (
  card_id         BIGINT PRIMARY KEY,
  card_number     VARCHAR(20)    NOT NULL,
  account_id      BIGINT         NOT NULL,
  status_id       INT            NOT NULL,
  credit_limit    DECIMAL(12, 2) NOT NULL,
  expiration_date VARCHAR(10)    NOT NULL,
  event_time      TIMESTAMPTZ    NOT NULL,
  created_at      TIMESTAMPTZ    DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    DEFAULT NOW()
);
