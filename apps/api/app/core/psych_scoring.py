"""Scoring engine for the Martinelli psychological assessment."""
from app.core.psych_questions import BIG_FIVE_STRUCTURE


def calculate_scores(response) -> dict:
    scores: dict = {}

    # ── Big Five ─────────────────────────────────────────────────────────────
    # score = sum(answers) / (num_questions * 7)  →  0..1
    big_five: dict = {}
    for factor, sub_factors in BIG_FIVE_STRUCTURE.items():
        factor_q_nums: list[int] = []
        sub_scores: dict = {}
        for sub_factor, q_nums in sub_factors.items():
            answers = [int(response.big_five_answers.get(str(q), 0)) for q in q_nums]
            raw = sum(answers)
            max_val = len(q_nums) * 7
            sub_scores[sub_factor] = {
                "score": round(raw / max_val, 4) if max_val else 0,
                "raw": raw,
                "max": max_val,
            }
            factor_q_nums.extend(q_nums)

        factor_answers = [int(response.big_five_answers.get(str(q), 0)) for q in factor_q_nums]
        factor_raw = sum(factor_answers)
        factor_max = len(factor_q_nums) * 7
        big_five[factor] = {
            "score": round(factor_raw / factor_max, 4) if factor_max else 0,
            "raw": factor_raw,
            "max": factor_max,
            "sub_factors": sub_scores,
        }
    scores["big_five"] = big_five

    # ── Stress ────────────────────────────────────────────────────────────────
    # scale 0-4, 10 questions, max = 40
    stress_sum = sum(int(response.stress_answers.get(str(i), 0)) for i in range(1, 11))
    if stress_sum <= 13:
        stress_level = "Stress baixo"
    elif stress_sum <= 26:
        stress_level = "Stress moderado"
    else:
        stress_level = "Stress alto"
    scores["stress"] = {"score": stress_sum, "max": 40, "level": stress_level}

    # ── Depression ────────────────────────────────────────────────────────────
    # scale 0-3 per question, 10 questions (a-j), max = 30
    dep_keys = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]
    dep_sum = sum(int(response.depression_answers.get(k, 0)) for k in dep_keys)
    if dep_sum <= 10:
        dep_level = "Normal a leve"
    elif dep_sum <= 20:
        dep_level = "Sintomas depressivos persistentes"
    else:
        dep_level = "Quadro depressivo"
    scores["depression"] = {"score": dep_sum, "max": 30, "level": dep_level}

    # ── Motivators ────────────────────────────────────────────────────────────
    # scale 0-5, 10 questions per group, max = 50 per group
    motivators_ranges = {
        "DINHEIRO": range(1, 11),
        "SEGURANÇA": range(11, 21),
        "APRENDIZADO": range(21, 31),
        "APROVAÇÃO SOCIAL": range(31, 41),
        "AUTORREALIZAÇÃO": range(41, 51),
    }
    motivators: dict = {}
    for group, q_range in motivators_ranges.items():
        raw = sum(int(response.motivators_answers.get(str(i), 0)) for i in q_range)
        motivators[group] = {"score": raw, "max": 50, "pct": round(raw / 50, 4)}
    scores["motivators"] = motivators

    # ── DISC ──────────────────────────────────────────────────────────────────
    # scale 0-5 (2.5 = middle), 10 items per dimension, max = 50 per dimension
    disc_level_thresholds = [
        (0.20, "Baixíssima intensidade"),
        (0.40, "Baixa intensidade"),
        (0.60, "Média intensidade"),
        (0.80, "Alta intensidade"),
        (1.01, "Altíssima intensidade"),
    ]
    disc_names = {"D": "Dominância", "I": "Influência", "S": "Estabilidade", "C": "Conformidade"}
    disc: dict = {}
    for dim in ["D", "I", "S", "C"]:
        values = response.disc_answers.get(dim, [0] * 10)
        raw = sum(float(v) for v in values)
        pct = round(raw / 50, 4)
        level = next((lbl for threshold, lbl in disc_level_thresholds if pct <= threshold), "Altíssima intensidade")
        disc[dim] = {"name": disc_names[dim], "score": raw, "max": 50, "pct": pct, "level": level}
    scores["disc"] = disc

    # ── QA ────────────────────────────────────────────────────────────────────
    # scale 1-5, 20 questions, max = 100
    qa_sum = sum(int(response.qa_answers.get(str(i), 0)) for i in range(1, 21))
    qa_levels = [
        (39, "QA Muito baixo – dificuldade em lidar com crises e adversidades de forma geral."),
        (49, "QA Baixo – menor flexibilidade quando as situações saem do esperado."),
        (64, "QA Mediano – administra parcialmente as circunstâncias adversas."),
        (79, "QA Bom – costuma administrar bem as crises, na maior parte do tempo."),
        (100, "QA Superior – pessoa adaptável e flexível, com bom poder de criatividade e recuperação."),
    ]
    qa_level = next((lbl for threshold, lbl in qa_levels if qa_sum <= threshold), qa_levels[-1][1])
    scores["qa"] = {"score": qa_sum, "max": 100, "level": qa_level}

    return scores
