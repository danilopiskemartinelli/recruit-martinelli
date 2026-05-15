"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-11 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    # companies
    op.create_table(
        "companies",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("domain", sa.String(255), nullable=True),
        sa.Column("logo_url", sa.Text, nullable=True),
        sa.Column("plan", sa.Enum("free", "starter", "professional", "enterprise", name="company_plan"), nullable=False, server_default="free"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("max_recruiters", sa.Integer, nullable=False, server_default="5"),
        sa.Column("max_jobs", sa.Integer, nullable=False, server_default="10"),
        sa.Column("settings", postgresql.JSON, nullable=False, server_default="{}"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_companies_slug", "companies", ["slug"])

    # users
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "recruiter", "candidate", name="user_role"), nullable=False),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("is_verified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("avatar_url", sa.Text, nullable=True),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # candidates
    op.create_table(
        "candidates",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("linkedin_url", sa.Text, nullable=True),
        sa.Column("resume_url", sa.Text, nullable=True),
        sa.Column("resume_text", sa.Text, nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("summary", sa.Text, nullable=True),
        sa.Column("skills", postgresql.JSON, nullable=False, server_default="[]"),
        sa.Column("experience_years", sa.SmallInteger, nullable=True),
        sa.Column("source", sa.String(100), nullable=True),
        sa.Column("gdpr_consent", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("gdpr_consent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_candidates_email", "candidates", ["email"])

    # jobs
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("requirements", sa.Text, nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("job_type", sa.Enum("full_time", "part_time", "contract", "internship", name="job_type"), nullable=True),
        sa.Column("modality", sa.Enum("remote", "hybrid", "onsite", name="job_modality"), nullable=True),
        sa.Column("salary_min", sa.Numeric(12, 2), nullable=True),
        sa.Column("salary_max", sa.Numeric(12, 2), nullable=True),
        sa.Column("salary_currency", sa.String(3), nullable=False, server_default="BRL"),
        sa.Column("status", sa.Enum("draft", "published", "paused", "closed", name="job_status"), nullable=False, server_default="draft"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closes_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tags", postgresql.JSON, nullable=False, server_default="[]"),
    )
    op.create_index("ix_jobs_company_id", "jobs", ["company_id"])

    # assessments
    op.create_table(
        "assessments",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("type", sa.Enum("quiz", "coding", "personality", "technical", "mixed", name="assessment_type"), nullable=False, server_default="quiz"),
        sa.Column("time_limit_minutes", sa.SmallInteger, nullable=True),
        sa.Column("passing_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("randomize_questions", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("show_results_to_candidate", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("instructions", sa.Text, nullable=True),
        sa.Column("status", sa.Enum("draft", "active", "archived", name="assessment_status"), nullable=False, server_default="draft"),
    )
    op.create_index("ix_assessments_company_id", "assessments", ["company_id"])

    # questions
    op.create_table(
        "questions",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("assessment_id", sa.String(36), sa.ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_index", sa.SmallInteger, nullable=False),
        sa.Column("type", sa.Enum("multiple_choice", "true_false", "open_text", "code", "rating_scale", "file_upload", name="question_type"), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("points", sa.Numeric(5, 2), nullable=False, server_default="1.0"),
        sa.Column("is_required", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("time_limit_seconds", sa.Integer, nullable=True),
        sa.Column("options", postgresql.JSON, nullable=True),
        sa.Column("correct_answer", sa.Text, nullable=True),
        sa.Column("explanation", sa.Text, nullable=True),
        sa.Column("media_url", sa.Text, nullable=True),
    )
    op.create_index("ix_questions_assessment_id", "questions", ["assessment_id"])

    # applications
    op.create_table(
        "applications",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("candidate_id", sa.String(36), sa.ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.Enum("submitted", "screening", "assessment", "interview", "offer", "hired", "rejected", "withdrawn", name="application_status"), nullable=False, server_default="submitted"),
        sa.Column("current_stage_index", sa.SmallInteger, nullable=False, server_default="0"),
        sa.Column("cover_letter", sa.Text, nullable=True),
        sa.Column("recruiter_notes", sa.Text, nullable=True),
        sa.Column("rejection_reason", sa.String(255), nullable=True),
        sa.Column("source", sa.String(100), nullable=True),
        sa.Column("referred_by", sa.String(255), nullable=True),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("job_id", "candidate_id"),
    )
    op.create_index("ix_applications_job_id", "applications", ["job_id"])
    op.create_index("ix_applications_candidate_id", "applications", ["candidate_id"])
    op.create_index("ix_applications_company_id", "applications", ["company_id"])

    # application_assessments
    op.create_table(
        "application_assessments",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("application_id", sa.String(36), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assessment_id", sa.String(36), sa.ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.Enum("pending", "invited", "in_progress", "completed", "expired", "skipped", name="app_assessment_status"), nullable=False, server_default="pending"),
        sa.Column("invitation_token", sa.String(255), unique=True, nullable=True),
        sa.Column("invitation_sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("score", sa.Numeric(5, 2), nullable=True),
        sa.Column("passed", sa.Boolean, nullable=True),
        sa.Column("time_taken_seconds", sa.Integer, nullable=True),
    )
    op.create_index("ix_application_assessments_application_id", "application_assessments", ["application_id"])

    # assessment_answers
    op.create_table(
        "assessment_answers",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("application_assessment_id", sa.String(36), sa.ForeignKey("application_assessments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_id", sa.String(36), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("answer_text", sa.Text, nullable=True),
        sa.Column("selected_options", postgresql.JSON, nullable=True),
        sa.Column("answer_boolean", sa.Boolean, nullable=True),
        sa.Column("rating_value", sa.SmallInteger, nullable=True),
        sa.Column("file_url", sa.Text, nullable=True),
        sa.Column("is_correct", sa.Boolean, nullable=True),
        sa.Column("points_earned", sa.Numeric(5, 2), nullable=True),
        sa.Column("ai_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("ai_feedback", sa.Text, nullable=True),
        sa.Column("answered_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_assessment_answers_application_assessment_id", "assessment_answers", ["application_assessment_id"])

    # notifications
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text, nullable=True),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", postgresql.JSON, nullable=False, server_default="{}"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    # digital_signatures
    op.create_table(
        "digital_signatures",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("application_id", sa.String(36), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("candidate_id", sa.String(36), sa.ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_type", sa.String(100), nullable=False),
        sa.Column("document_url", sa.Text, nullable=True),
        sa.Column("document_hash", sa.String(64), nullable=True),
        sa.Column("status", sa.Enum("pending", "signed", "rejected", "expired", name="signature_status"), nullable=False, server_default="pending"),
        sa.Column("signature_token", sa.String(255), unique=True, nullable=True),
        sa.Column("signed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
    )

    # signature_audit_logs
    op.create_table(
        "signature_audit_logs",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("signature_id", sa.String(36), sa.ForeignKey("digital_signatures.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event", sa.String(100), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("metadata", postgresql.JSON, nullable=False, server_default="{}"),
    )

    # ai_insights
    op.create_table(
        "ai_insights",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("application_id", sa.String(36), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("data", postgresql.JSON, nullable=False, server_default="{}"),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("tokens_used", sa.Integer, nullable=True),
    )
    op.create_index("ix_ai_insights_application_id", "ai_insights", ["application_id"])


def downgrade() -> None:
    op.drop_table("ai_insights")
    op.drop_table("signature_audit_logs")
    op.drop_table("digital_signatures")
    op.drop_table("notifications")
    op.drop_table("assessment_answers")
    op.drop_table("application_assessments")
    op.drop_table("applications")
    op.drop_table("questions")
    op.drop_table("assessments")
    op.drop_table("jobs")
    op.drop_table("candidates")
    op.drop_table("users")
    op.drop_table("companies")
    op.execute("DROP TYPE IF EXISTS company_plan")
    op.execute("DROP TYPE IF EXISTS user_role")
    op.execute("DROP TYPE IF EXISTS job_type")
    op.execute("DROP TYPE IF EXISTS job_modality")
    op.execute("DROP TYPE IF EXISTS job_status")
    op.execute("DROP TYPE IF EXISTS assessment_type")
    op.execute("DROP TYPE IF EXISTS assessment_status")
    op.execute("DROP TYPE IF EXISTS question_type")
    op.execute("DROP TYPE IF EXISTS application_status")
    op.execute("DROP TYPE IF EXISTS app_assessment_status")
    op.execute("DROP TYPE IF EXISTS signature_status")
