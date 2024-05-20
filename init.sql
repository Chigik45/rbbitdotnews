create database mydb;
\c mydb;

create table auth_user (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(30),
    password VARCHAR(30)
    );
create table tag (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE
    );
create table newspaper (
    newspaper_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE
    );
create table article (
    article_id SERIAL PRIMARY KEY,
    name TEXT,
    url TEXT,
    newspaper INTEGER,
    FOREIGN KEY (newspaper) REFERENCES newspaper (newspaper_id) ON DELETE CASCADE
    );

create table user_preference (
    tag_id INTEGER,
    user_id INTEGER,
    frequency INTEGER,
    FOREIGN KEY (tag_id) REFERENCES tag (tag_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES auth_user (user_id) ON DELETE CASCADE
    );

create table article_tag_assotiation (
    tag_id INTEGER,
    article_id INTEGER,
    FOREIGN KEY (tag_id) REFERENCES tag (tag_id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES article (article_id) ON DELETE CASCADE
    );