"""
Full dev seed — jobs, candidates, applications, assessments.
Run: PYTHONPATH=/app python /tmp/seed_full.py
"""
import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta
import random

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "api"))

from app.database import AsyncSessionLocal, engine, Base
from app.models import *  # noqa
from app.core.security import hash_password


def dt(days_ago: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days_ago)


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        from app.models.company import Company
        from app.models.user import User
        from app.models.job import Job
        from app.models.candidate import Candidate
        from app.models.application import Application
        from app.models.assessment import Assessment, Question
        from sqlalchemy import select

        # ── Check existing ──────────────────────────────────────────────
        existing = await db.execute(select(Company).where(Company.slug == "techcorp"))
        company = existing.scalar_one_or_none()

        if not company:
            company = Company(name="TechCorp Demo", slug="techcorp", plan="professional")
            db.add(company)
            await db.flush()

        existing_admin = await db.execute(select(User).where(User.email == "admin@techcorp.com"))
        admin = existing_admin.scalar_one_or_none()
        if not admin:
            admin = User(email="admin@techcorp.com", hashed_password=hash_password("admin123"),
                         full_name="Admin TechCorp", role="admin", company_id=company.id, is_verified=True)
            db.add(admin)

        existing_rec = await db.execute(select(User).where(User.email == "recruiter@techcorp.com"))
        recruiter = existing_rec.scalar_one_or_none()
        if not recruiter:
            recruiter = User(email="recruiter@techcorp.com", hashed_password=hash_password("recruiter123"),
                             full_name="Ana Recruiter", role="recruiter", company_id=company.id, is_verified=True)
            db.add(recruiter)

        await db.flush()

        # ── Jobs ────────────────────────────────────────────────────────
        existing_jobs = await db.execute(select(Job).where(Job.company_id == company.id))
        if not existing_jobs.scalars().all():
            jobs_data = [
                dict(title="Engenheiro Backend Sênior",      slug="engenheiro-backend-senior",
                     description="Buscamos Engenheiro Backend sênior com experiência em sistemas distribuídos, Node.js/Python, e AWS.",
                     requirements="5+ anos de experiência, Node.js ou Python, PostgreSQL, Redis, AWS, microsserviços.",
                     location="Remoto", job_type="full_time", modality="remote",
                     salary_min=12000, salary_max=20000, status="published",
                     tags=["Node.js", "Python", "AWS", "PostgreSQL", "Redis"]),
                dict(title="Desenvolvedor Frontend",         slug="desenvolvedor-frontend",
                     description="Vaga para Desenvolvedor Frontend com React e TypeScript para projetos de alta escala.",
                     requirements="3+ anos com React, TypeScript, Next.js, CSS avançado.",
                     location="São Paulo, SP", job_type="full_time", modality="hybrid",
                     salary_min=8000, salary_max=14000, status="published",
                     tags=["React", "TypeScript", "Next.js", "Tailwind"]),
                dict(title="Analista de Dados",              slug="analista-de-dados",
                     description="Transforme dados complexos em insights para decisões estratégicas do negócio.",
                     requirements="Python, SQL avançado, Power BI ou Tableau, experiência com ML.",
                     location="São Paulo, SP (híbrido)", job_type="full_time", modality="hybrid",
                     salary_min=7000, salary_max=12000, status="published",
                     tags=["Python", "SQL", "Power BI", "Machine Learning"]),
                dict(title="Product Designer",               slug="product-designer",
                     description="Oportunidade para Product Designer criar experiências digitais centradas no usuário.",
                     requirements="Figma avançado, portfólio com casos de UX, experiência em design systems.",
                     location="São Paulo, SP", job_type="full_time", modality="onsite",
                     salary_min=7000, salary_max=11000, status="published",
                     tags=["Figma", "UX", "Design System", "Prototyping"]),
                dict(title="Gerente de Projetos",            slug="gerente-de-projetos",
                     description="Lidere projetos de tecnologia com equipes multidisciplinares usando metodologias ágeis.",
                     requirements="Certificação PMP ou PMI-ACP, 5+ anos de gestão, Jira, stakeholder management.",
                     location="São Paulo, SP", job_type="full_time", modality="hybrid",
                     salary_min=10000, salary_max=16000, status="published",
                     tags=["Scrum", "Kanban", "Jira", "PMP"]),
                dict(title="Estágio em Desenvolvimento",     slug="estagio-desenvolvimento",
                     description="Oportunidade de estágio para estudantes de Ciência da Computação ou áreas afins.",
                     requirements="Cursando graduação em CC, SI ou Engenharia. Conhecimento básico de Python ou JavaScript.",
                     location="São Paulo, SP", job_type="internship", modality="hybrid",
                     salary_min=2000, salary_max=3000, status="published",
                     tags=["Python", "JavaScript", "Git"]),
                dict(title="DevOps Engineer",                slug="devops-engineer",
                     description="Responsável pela infraestrutura cloud, CI/CD e cultura DevOps da empresa.",
                     requirements="AWS/GCP, Kubernetes, Terraform, Docker, CI/CD pipelines.",
                     location="Remoto", job_type="full_time", modality="remote",
                     salary_min=11000, salary_max=18000, status="draft",
                     tags=["AWS", "Kubernetes", "Terraform", "Docker"]),
            ]
            jobs = []
            for jd in jobs_data:
                j = Job(company_id=company.id, created_by=admin.id, **jd)
                db.add(j)
                jobs.append(j)
            await db.flush()
        else:
            jobs_result = await db.execute(select(Job).where(Job.company_id == company.id))
            jobs = jobs_result.scalars().all()

        # ── Candidates ──────────────────────────────────────────────────
        existing_cands = await db.execute(select(Candidate))
        if not existing_cands.scalars().all():
            candidates_data = [
                dict(email="lucas.ferreira@gmail.com",  full_name="Lucas Ferreira",  phone="(11) 91234-5678",
                     location="São Paulo, SP", skills=["Node.js", "Python", "AWS", "PostgreSQL", "Redis"],
                     experience_years=6, source="LinkedIn"),
                dict(email="mariana.costa@gmail.com",   full_name="Mariana Costa",   phone="(11) 98765-4321",
                     location="São Paulo, SP", skills=["Figma", "UX Research", "Design System", "Prototyping"],
                     experience_years=4, source="Indicação"),
                dict(email="rafael.souza@gmail.com",    full_name="Rafael Souza",    phone="(21) 97654-3210",
                     location="Rio de Janeiro, RJ", skills=["Python", "Django", "Redis", "SQL"],
                     experience_years=3, source="LinkedIn"),
                dict(email="camila.alves@gmail.com",    full_name="Camila Alves",    phone="(11) 96543-2109",
                     location="São Paulo, SP", skills=["Python", "SQL", "Power BI", "Machine Learning", "R"],
                     experience_years=5, source="Site da empresa"),
                dict(email="thiago.lima@gmail.com",     full_name="Thiago Lima",     phone="(31) 95432-1098",
                     location="Belo Horizonte, MG", skills=["React", "JavaScript", "CSS"],
                     experience_years=1, source="Indeed"),
                dict(email="fernanda.rocha@gmail.com",  full_name="Fernanda Rocha",  phone="(11) 94321-0987",
                     location="São Paulo, SP", skills=["Scrum", "Jira", "PMP", "Stakeholder Management", "OKRs"],
                     experience_years=7, source="LinkedIn"),
                dict(email="pedro.oliveira@gmail.com",  full_name="Pedro Oliveira",  phone="(11) 93210-9876",
                     location="Campinas, SP", skills=["React", "TypeScript", "Next.js", "Tailwind", "Jest"],
                     experience_years=4, source="LinkedIn"),
                dict(email="julia.santos@gmail.com",    full_name="Júlia Santos",    phone="(41) 92109-8765",
                     location="Curitiba, PR", skills=["Python", "SQL", "Tableau", "Pandas", "Scikit-learn"],
                     experience_years=3, source="Site da empresa"),
                dict(email="gabriel.mendes@gmail.com",  full_name="Gabriel Mendes",  phone="(11) 91098-7654",
                     location="São Paulo, SP", skills=["AWS", "Kubernetes", "Terraform", "Docker", "Jenkins"],
                     experience_years=5, source="Indicação"),
                dict(email="amanda.lima@gmail.com",     full_name="Amanda Lima",     phone="(85) 90987-6543",
                     location="Fortaleza, CE", skills=["Node.js", "TypeScript", "MongoDB", "Redis"],
                     experience_years=3, source="LinkedIn"),
                dict(email="bruno.carvalho@gmail.com",  full_name="Bruno Carvalho",  phone="(11) 99876-5432",
                     location="São Paulo, SP", skills=["React", "Vue.js", "JavaScript", "TypeScript"],
                     experience_years=5, source="LinkedIn"),
                dict(email="leticia.gomes@gmail.com",   full_name="Letícia Gomes",   phone="(48) 98765-4321",
                     location="Florianópolis, SC", skills=["Figma", "Adobe XD", "UX Writing", "Pesquisa"],
                     experience_years=2, source="Instagram"),
                dict(email="diego.nascimento@gmail.com",full_name="Diego Nascimento",phone="(71) 97654-3210",
                     location="Salvador, BA", skills=["Python", "Machine Learning", "TensorFlow", "NLP"],
                     experience_years=4, source="LinkedIn"),
                dict(email="patricia.silva@gmail.com",  full_name="Patrícia Silva",  phone="(11) 96543-2109",
                     location="São Paulo, SP", skills=["Scrum Master", "Kanban", "Jira", "Confluence"],
                     experience_years=6, source="Indicação"),
                dict(email="rodrigo.freitas@gmail.com", full_name="Rodrigo Freitas", phone="(19) 95432-1098",
                     location="Campinas, SP", skills=["Java", "Spring Boot", "Microservices", "Kafka"],
                     experience_years=8, source="LinkedIn"),
            ]
            candidates = []
            for cd in candidates_data:
                c = Candidate(gdpr_consent=True, gdpr_consent_at=dt(30), **cd)
                db.add(c)
                candidates.append(c)
            await db.flush()
        else:
            cands_result = await db.execute(select(Candidate))
            candidates = cands_result.scalars().all()

        # ── Applications ────────────────────────────────────────────────
        existing_apps = await db.execute(select(Application))
        if not existing_apps.scalars().all():
            published_jobs = [j for j in jobs if j.status == "published"]
            statuses = ["submitted", "screening", "assessment", "interview", "offer", "hired", "rejected", "screening"]
            pairs = set()
            apps_created = 0
            for i, candidate in enumerate(candidates):
                n_apps = random.randint(1, 3)
                job_pool = random.sample(published_jobs, min(n_apps, len(published_jobs)))
                for job in job_pool:
                    key = (job.id, candidate.id)
                    if key in pairs:
                        continue
                    pairs.add(key)
                    status = statuses[apps_created % len(statuses)]
                    app = Application(
                        job_id=job.id,
                        candidate_id=candidate.id,
                        company_id=company.id,
                        status=status,
                        applied_at=dt(random.randint(1, 45)),
                        source=candidate.source,
                    )
                    db.add(app)
                    apps_created += 1
            await db.flush()

        # ── Assessments ─────────────────────────────────────────────────
        existing_assess = await db.execute(select(Assessment).where(Assessment.company_id == company.id))
        if not existing_assess.scalars().all():
            assessments_data = [
                dict(title="Lógica de Programação", type="technical", status="active",
                     time_limit_minutes=60, passing_score=70,
                     description="Avalie conhecimentos de lógica e algoritmos."),
                dict(title="Raciocínio Lógico Geral", type="quiz", status="active",
                     time_limit_minutes=30, passing_score=60,
                     description="Teste de raciocínio lógico para todas as vagas."),
                dict(title="Desafio React + TypeScript", type="coding", status="active",
                     time_limit_minutes=90, passing_score=75,
                     description="Implemente um componente React com TypeScript."),
            ]
            for ad in assessments_data:
                a = Assessment(company_id=company.id, created_by=admin.id, **ad)
                db.add(a)
                await db.flush()
                q = Question(
                    assessment_id=a.id, order_index=1,
                    type="multiple_choice",
                    content="Qual a complexidade de tempo do algoritmo de busca binária?",
                    points=2,
                    options={"choices": ["O(1)", "O(log n)", "O(n)", "O(n²)"]},
                    correct_answer="1",
                )
                db.add(q)

        await db.commit()

        print("\n✅ Seed completo!")
        print(f"   Empresa:      TechCorp Demo")
        print(f"   Vagas:        {len(jobs)}")
        print(f"   Candidatos:   {len(candidates)}")
        print(f"\nCredenciais:")
        print("   admin@techcorp.com     / admin123")
        print("   recruiter@techcorp.com / recruiter123")
        print("   candidate@example.com  / candidate123")


if __name__ == "__main__":
    asyncio.run(seed())
