"""kpi fields for strategic indicators dashboard

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-02 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enums — idempotent via DO block
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE seniority_level AS ENUM (
                'estagio', 'assistente', 'junior', 'pleno', 'senior',
                'coordenador', 'consultor', 'executivo', 'socio', 'diretoria'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE nps_rating AS ENUM ('otimo', 'bom', 'regular', 'ruim');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    # jobs — new columns
    op.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE")
    op.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS seniority_level seniority_level")

    # applications — new columns
    op.execute("ALTER TABLE applications ADD COLUMN IF NOT EXISTS offer_sent_at TIMESTAMP WITH TIME ZONE")
    op.execute("ALTER TABLE applications ADD COLUMN IF NOT EXISTS offer_accepted_at TIMESTAMP WITH TIME ZONE")
    op.execute("ALTER TABLE applications ADD COLUMN IF NOT EXISTS hired_at TIMESTAMP WITH TIME ZONE")

    # candidates — new columns
    op.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_pcd BOOLEAN NOT NULL DEFAULT FALSE")
    op.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_young_apprentice BOOLEAN NOT NULL DEFAULT FALSE")

    # manager_nps table — idempotent
    op.execute("""
        CREATE TABLE IF NOT EXISTS manager_nps (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            job_id VARCHAR(36) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
            manager_name VARCHAR(255) NOT NULL,
            manager_email VARCHAR(255),
            profile_adherence nps_rating NOT NULL,
            analyst_satisfaction nps_rating NOT NULL,
            communication nps_rating NOT NULL,
            experience nps_rating NOT NULL,
            comments TEXT
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_manager_nps_job_id ON manager_nps (job_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS manager_nps")
    op.execute("ALTER TABLE candidates DROP COLUMN IF EXISTS is_young_apprentice")
    op.execute("ALTER TABLE candidates DROP COLUMN IF EXISTS is_pcd")
    op.execute("ALTER TABLE applications DROP COLUMN IF EXISTS hired_at")
    op.execute("ALTER TABLE applications DROP COLUMN IF EXISTS offer_accepted_at")
    op.execute("ALTER TABLE applications DROP COLUMN IF EXISTS offer_sent_at")
    op.execute("ALTER TABLE jobs DROP COLUMN IF EXISTS seniority_level")
    op.execute("ALTER TABLE jobs DROP COLUMN IF EXISTS closed_at")
    op.execute("DROP TYPE IF EXISTS nps_rating")
    op.execute("DROP TYPE IF EXISTS seniority_level")
