import pandas as pd
import os

# Use BASE_DIR as project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_FILE = os.path.join(BASE_DIR, "combined_knowledge.csv")

def preprocess():
    print(f"[INFO] Loading CSVs from: {DATA_DIR}")
    
    sections = pd.read_csv(os.path.join(DATA_DIR, "section.csv"))
    acts = pd.read_csv(os.path.join(DATA_DIR, "acts.csv"))
    terms = pd.read_csv(os.path.join(DATA_DIR, "legal_terms.csv"))
    faqs = pd.read_csv(os.path.join(DATA_DIR, "faqs.csv"))
    procedures = pd.read_csv(os.path.join(DATA_DIR, "procedure.csv"))

    kb = []

    for _, row in sections.iterrows():
        kb.append({
            "type": "section",
            "title": f"Section {row['section_number']} - {row['section_title']}",
            "content": f"{row['description']}. Punishment: {row['punishment']}"
        })

    for _, row in acts.iterrows():
        kb.append({
            "type": "act",
            "title": row['act_name'],
            "content": f"{row['description']}. Important Sections: {row['important_sections']}"
        })

    for _, row in terms.iterrows():
        kb.append({
            "type": "legal_term",
            "title": row['term'],
            "content": f"{row['definition']}. Example: {row['example']}"
        })

    for _, row in faqs.iterrows():
        kb.append({
            "type": "faq",
            "title": row['question'],
            "content": row['answer']
        })

    for _, row in procedures.iterrows():
        kb.append({
            "type": "procedure",
            "title": row['process_name'],
            "content": f"{row['description']}\nSteps: {row['step_by_step']}\nTips: {row['tips']}"
        })

    df = pd.DataFrame(kb)
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"[INFO] Combined knowledge base saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    preprocess()
