"""Seed script — loads medical knowledge documents into ChromaDB.

Python port of the original Node `seedMedical.js`.

Run as a script:   python -m app.seed
Or via the API:    POST /seed
"""

from __future__ import annotations

import uuid
from typing import Dict, List

from .config import logger
from .rag_service import add_documents

MEDICAL_DOCS: List[Dict[str, str]] = [
    {
        "source": "WHO",
        "category": "infectious_disease",
        "text": "Influenza (flu) is an acute respiratory illness caused by influenza A or B viruses. Symptoms include fever (38–40°C), chills, headache, myalgia, malaise, non-productive cough, sore throat, and rhinitis. Onset is sudden. High-risk groups include the elderly, young children, pregnant women, and immunocompromised individuals. Annual vaccination is the primary prevention strategy.",
    },
    {
        "source": "CDC",
        "category": "infectious_disease",
        "text": "COVID-19 is caused by SARS-CoV-2. Common symptoms: fever, cough, shortness of breath, fatigue, loss of taste or smell, body aches, headache, sore throat, runny nose, nausea, diarrhea. Severe disease can cause pneumonia, ARDS, and multi-organ failure. Vaccination, masking, and ventilation reduce transmission.",
    },
    {
        "source": "Mayo Clinic",
        "category": "respiratory",
        "text": "Pneumonia is an infection that inflames air sacs in one or both lungs. Symptoms: cough with phlegm, fever, chills, difficulty breathing, chest pain. Bacterial pneumonia (most common: Streptococcus pneumoniae) is treated with antibiotics. Viral pneumonia may be treated with antivirals. Hospitalization required for severe cases.",
    },
    {
        "source": "Mayo Clinic",
        "category": "cardiovascular",
        "text": "Heart attack (myocardial infarction) symptoms: chest pain or pressure, pain radiating to arm/jaw/neck/back, shortness of breath, cold sweat, nausea, lightheadedness. This is a medical emergency. Call 911 immediately. Time to treatment is critical. Aspirin 325mg may be given if not allergic.",
    },
    {
        "source": "CDC",
        "category": "infectious_disease",
        "text": "Common cold is caused by rhinoviruses. Symptoms: runny nose, sore throat, cough, congestion, mild headache, low-grade fever. Symptoms typically resolve in 7–10 days. Treatment is symptomatic (rest, fluids, decongestants). Antibiotics are ineffective against viral colds.",
    },
    {
        "source": "MedlinePlus",
        "category": "gastrointestinal",
        "text": "Gastroenteritis (stomach flu) causes inflammation of the stomach and intestines. Symptoms: diarrhea, nausea, vomiting, stomach cramps, low-grade fever. Usually caused by norovirus or rotavirus. Treatment: hydration, electrolyte replacement, bland diet. Seek care if severe dehydration, bloody stools, or symptoms >72h.",
    },
    {
        "source": "WHO",
        "category": "neurological",
        "text": "Migraine headaches cause severe throbbing pain, usually one-sided. Associated symptoms: nausea, vomiting, sensitivity to light and sound, visual aura. Triggers: stress, hormonal changes, certain foods, sleep disruption. Treatment: triptans, NSAIDs, antiemetics. Preventive: beta-blockers, topiramate.",
    },
    {
        "source": "CDC",
        "category": "emergency",
        "text": "Stroke warning signs (FAST): Face drooping, Arm weakness, Speech difficulty, Time to call 911. Other symptoms: sudden numbness, confusion, trouble seeing, severe headache. Ischemic stroke treated with tPA within 4.5 hours. Every minute without treatment: 1.9 million neurons die. Immediate emergency care is essential.",
    },
    {
        "source": "MedlinePlus",
        "category": "allergic",
        "text": "Allergic reaction symptoms range from mild (hives, itching, runny nose) to severe anaphylaxis (throat swelling, difficulty breathing, severe drop in blood pressure). Anaphylaxis requires immediate epinephrine (EpiPen) injection and emergency care. Common triggers: foods, medications, insect stings, latex.",
    },
    {
        "source": "Mayo Clinic",
        "category": "metabolic",
        "text": "Diabetes mellitus symptoms: frequent urination, excessive thirst, unexplained weight loss, blurred vision, fatigue, slow healing wounds. Type 1: autoimmune destruction of beta cells — requires insulin. Type 2: insulin resistance — managed with lifestyle, metformin, other medications. Regular HbA1c monitoring essential.",
    },
    {
        "source": "CDC",
        "category": "respiratory",
        "text": "Asthma is a chronic inflammatory airway disease. Symptoms: wheezing, shortness of breath, chest tightness, coughing (especially at night). Triggers: allergens, exercise, cold air, respiratory infections. Treatment: inhaled corticosteroids (controller), short-acting beta-agonists (rescue). Severe attacks require emergency care.",
    },
    {
        "source": "WHO",
        "category": "infectious_disease",
        "text": "Urinary tract infection (UTI) symptoms: burning urination, frequent urge to urinate, cloudy urine, pelvic pain. More common in women. Upper UTI (pyelonephritis): fever, flank pain, nausea. Treatment: antibiotics (trimethoprim-sulfamethoxazole, nitrofurantoin for uncomplicated). Increase fluid intake.",
    },
]


def seed() -> int:
    """Seed all medical documents. Returns the number of documents added."""
    logger.info("Starting medical knowledge seed...")

    docs = [
        {
            "id": str(uuid.uuid4()),
            "text": d["text"],
            "source": d["source"],
            "category": d["category"],
        }
        for d in MEDICAL_DOCS
    ]

    add_documents(docs)
    logger.info("✓ Seeded %d medical documents into ChromaDB", len(docs))
    return len(docs)


if __name__ == "__main__":
    try:
        seed()
    except Exception as err:  # noqa: BLE001
        logger.error("Seed failed: %s", err)
        logger.warning(
            "Make sure ChromaDB is running: docker run -p 8000:8000 chromadb/chroma"
        )
        raise SystemExit(1)
    raise SystemExit(0)
