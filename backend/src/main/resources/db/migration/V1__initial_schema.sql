-- EduConnect initial schema.
-- Kept to portable SQL so it runs on MySQL 8 (production) and H2 in MySQL mode (tests).

CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(190) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME(6)  NOT NULL,
    updated_at    DATETIME(6)  NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE courses (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    summary     VARCHAR(500),
    description TEXT,
    category    VARCHAR(100),
    published   BOOLEAN      NOT NULL DEFAULT FALSE,
    position    INT          NOT NULL DEFAULT 0,
    teacher_id  BIGINT,
    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6)  NOT NULL,
    CONSTRAINT fk_courses_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE chapters (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id  BIGINT       NOT NULL,
    title      VARCHAR(200) NOT NULL,
    content    MEDIUMTEXT,
    position   INT          NOT NULL DEFAULT 0,
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6)  NOT NULL,
    CONSTRAINT fk_chapters_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
);

CREATE TABLE exercises (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    chapter_id BIGINT       NOT NULL,
    question   TEXT         NOT NULL,
    answer     VARCHAR(500) NOT NULL,
    hint       VARCHAR(500),
    position   INT          NOT NULL DEFAULT 0,
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6)  NOT NULL,
    CONSTRAINT fk_exercises_chapter FOREIGN KEY (chapter_id) REFERENCES chapters (id) ON DELETE CASCADE
);

CREATE TABLE exercise_completions (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT      NOT NULL,
    exercise_id  BIGINT      NOT NULL,
    created_at   DATETIME(6) NOT NULL,
    updated_at   DATETIME(6) NOT NULL,
    CONSTRAINT uk_completion_user_exercise UNIQUE (user_id, exercise_id),
    CONSTRAINT fk_completion_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_completion_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
);

CREATE TABLE resources (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    title             VARCHAR(200)  NOT NULL,
    description       VARCHAR(1000),
    original_filename VARCHAR(255)  NOT NULL,
    stored_filename   VARCHAR(100)  NOT NULL,
    content_type      VARCHAR(150)  NOT NULL,
    size_bytes        BIGINT        NOT NULL,
    course_id         BIGINT,
    uploaded_by_id    BIGINT,
    created_at        DATETIME(6)   NOT NULL,
    updated_at        DATETIME(6)   NOT NULL,
    CONSTRAINT uk_resources_stored_filename UNIQUE (stored_filename),
    CONSTRAINT fk_resources_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE SET NULL,
    CONSTRAINT fk_resources_uploader FOREIGN KEY (uploaded_by_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE news_articles (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    summary      VARCHAR(500),
    content      MEDIUMTEXT,
    published    BOOLEAN      NOT NULL DEFAULT FALSE,
    published_at DATETIME(6),
    author_id    BIGINT,
    created_at   DATETIME(6)  NOT NULL,
    updated_at   DATETIME(6)  NOT NULL,
    CONSTRAINT fk_news_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_news_published ON news_articles (published, published_at);

CREATE TABLE site_settings (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    short_name    VARCHAR(50)  NOT NULL,
    tagline       VARCHAR(255),
    about         TEXT,
    email         VARCHAR(190),
    phone         VARCHAR(50),
    address       VARCHAR(255),
    website       VARCHAR(255),
    primary_color VARCHAR(7)   NOT NULL,
    logo_filename VARCHAR(100),
    facebook_url  VARCHAR(255),
    linkedin_url  VARCHAR(255),
    x_url         VARCHAR(255),
    youtube_url   VARCHAR(255),
    created_at    DATETIME(6)  NOT NULL,
    updated_at    DATETIME(6)  NOT NULL
);

CREATE TABLE contact_messages (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(150)  NOT NULL,
    email      VARCHAR(190)  NOT NULL,
    subject    VARCHAR(200)  NOT NULL,
    message    TEXT          NOT NULL,
    is_read    BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at DATETIME(6)   NOT NULL,
    updated_at DATETIME(6)   NOT NULL
);

CREATE TABLE chat_messages (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    room        VARCHAR(100)  NOT NULL,
    sender_id   BIGINT,
    sender_name VARCHAR(150)  NOT NULL,
    sender_role VARCHAR(20)   NOT NULL,
    content     VARCHAR(2000) NOT NULL,
    created_at  DATETIME(6)   NOT NULL,
    updated_at  DATETIME(6)   NOT NULL,
    CONSTRAINT fk_chat_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_chat_room_created ON chat_messages (room, created_at);
