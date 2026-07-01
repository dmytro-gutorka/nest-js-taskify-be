CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "auth_provider_enum" AS ENUM ('local', 'google');

-- CreateEnum
CREATE TYPE "media_type_enum" AS ENUM ('image');

-- CreateEnum
CREATE TYPE "media_storage_provider_enum" AS ENUM ('cloudinary');

-- CreateEnum
CREATE TYPE "email_outbox_status_enum" AS ENUM ('pending', 'queued', 'processing', 'sent', 'failed', 'exceeded_max_attempts');

-- CreateEnum
CREATE TYPE "role_name_enum" AS ENUM ('user', 'admin', 'guest');

-- CreateEnum
CREATE TYPE "permission_action_enum" AS ENUM ('create', 'read', 'update', 'delete');

-- CreateEnum
CREATE TYPE "permission_resource_enum" AS ENUM ('tasks', 'users', 'rbac');

-- CreateEnum
CREATE TYPE "role_permission_rule_effect" AS ENUM ('allow', 'deny');

-- CreateEnum
CREATE TYPE "role_permission_rule_type" AS ENUM ('conditional', 'full_access');

-- CreateEnum
CREATE TYPE "tasks_status_enum" AS ENUM ('todo', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "tasks_priority_enum" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "auth" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "password" TEXT,
    "provider" "auth_provider_enum" NOT NULL,
    "provider_account_id" VARCHAR(255),
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "auth_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" SERIAL NOT NULL,
    "mediaType" "media_type_enum" NOT NULL,
    "public_url" TEXT NOT NULL,
    "storageProvider" "media_storage_provider_enum" NOT NULL,
    "storage_public_id" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" SERIAL NOT NULL,
    "recipient_email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "html_body" TEXT NOT NULL,
    "text_body" TEXT,
    "provider" VARCHAR(50) NOT NULL DEFAULT 'resend',
    "provider_message_id" VARCHAR(255),
    "status" "email_outbox_status_enum" NOT NULL DEFAULT 'pending',
    "queued_at" TIMESTAMPTZ,
    "processing_at" TIMESTAMPTZ,
    "sent_at" TIMESTAMPTZ,
    "failed_at" TIMESTAMPTZ,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" "role_name_enum" NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "resource" "permission_resource_enum" NOT NULL,
    "action" "permission_action_enum" NOT NULL,
    "key" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_roles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission_rules" (
    "id" SERIAL NOT NULL,
    "role_permission_id" INTEGER NOT NULL,
    "effect" "role_permission_rule_effect" NOT NULL DEFAULT 'allow',
    "type" "role_permission_rule_type" NOT NULL DEFAULT 'conditional',
    "conditions" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "role_permission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "tasks_status_enum" NOT NULL DEFAULT 'todo',
    "priority" "tasks_priority_enum" NOT NULL DEFAULT 'medium',
    "deadline" TIMESTAMPTZ,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location" geography(Point, 4326),
    "author_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "name" VARCHAR(50),
    "surname" VARCHAR(50),
    "birthday" DATE,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "language" VARCHAR NOT NULL DEFAULT 'en',
    "theme" VARCHAR NOT NULL DEFAULT 'system',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_avatars" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_avatars_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tasks_latitude_longitude_idx"
    ON "tasks" ("latitude", "longitude");

CREATE INDEX "tasks_location_gist_idx"
    ON "tasks"
    USING GIST ("location");

-- CreateIndex
CREATE UNIQUE INDEX "auth_email_provider_key" ON "auth"("email", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "users_roles_user_id_role_id_key" ON "users_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_permissions_role_id_permission_id_key" ON "roles_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_user_avatars_user_id" ON "user_avatars"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_user_avatars_media_id" ON "user_avatars"("media_id");

-- AddForeignKey
ALTER TABLE "auth" ADD CONSTRAINT "auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permissions" ADD CONSTRAINT "roles_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permissions" ADD CONSTRAINT "roles_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission_rules" ADD CONSTRAINT "role_permission_rules_role_permission_id_fkey" FOREIGN KEY ("role_permission_id") REFERENCES "roles_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
