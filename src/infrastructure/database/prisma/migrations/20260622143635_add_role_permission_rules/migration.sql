-- CreateTable
CREATE TABLE "role_permission_rules" (
    "id" SERIAL NOT NULL,
    "role_permission_id" INTEGER NOT NULL,
    "inverted" BOOLEAN NOT NULL DEFAULT false,
    "conditions" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "role_permission_rules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "role_permission_rules" ADD CONSTRAINT "role_permission_rules_role_permission_id_fkey" FOREIGN KEY ("role_permission_id") REFERENCES "roles_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
