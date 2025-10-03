import os
import re
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from google import genai
from google.genai.types import GenerateContentConfig
from dotenv import load_dotenv

# Load .env (for GEMINI_API_KEY)
load_dotenv()

# Paths
EMB_FILE = os.path.join("embeddings.pkl")

# Load data + embeddings
with open(EMB_FILE, "rb") as f:
    df, embeddings = pickle.load(f)

# Load same embedding model for query encoding
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# -------------------------
# 🔎 Direct Section Lookup
# -------------------------
def direct_section_lookup(query):
    """Extract IPC/Section number from query and fetch directly from CSV if available."""
    match = re.search(r"(ipc|section)\s*(\d+)", query.lower())
    if match:
        sec_num = match.group(2)
        hits = df[df["title"].str.contains(
            rf"(^|\b)(Section|IPC)\s*{sec_num}(\b|$)",
            case=False, na=False, regex=True
        )]
        if not hits.empty:
            return "\n\n".join(hits["title"] + " - " + hits["content"])
    return None

# -------------------------
# 🔎 Embedding Search
# -------------------------
def search(query, top_k=5):
    """Search embeddings across ALL types (sections, faq, procedure, legalterm, act)."""
    q_emb = embedder.encode([query], convert_to_numpy=True)[0]
    scores = np.dot(embeddings, q_emb) / (
        np.linalg.norm(embeddings, axis=1) * np.linalg.norm(q_emb)
    )
    top_idx = np.argsort(scores)[::-1][:top_k]
    results = [(df.iloc[i]["title"], df.iloc[i]["content"], scores[i]) for i in top_idx]
    return results

# -------------------------
# 🌐 Gemini Fallback
# -------------------------
def web_fallback(query):
    prompt = f"""
You are a legal assistant. 
The knowledge base did not contain the answer.
Determine if the query is about law, rights, procedures, legal terms, or courts.

- If it is NOT legal → reply exactly: "Not a legal question."
- If it IS legal → provide a clear and correct explanation, using your own legal knowledge and, if needed, search the internet.

Query:
{query}
"""
    resp = client.models.generate_content(
        model="models/gemini-1.5-flash",
        contents=prompt,
        config=GenerateContentConfig(temperature=0.3),
    )
    return resp.text

# -------------------------
# 🧠 Main Answer Logic
# -------------------------
def answer_query(query):
    # 1️⃣ Try direct section lookup
    direct_context = direct_section_lookup(query)
    if direct_context:
        context = direct_context
    else:
        # 2️⃣ Embedding search across all entries
        results = search(query, top_k=5)
        best_title, best_match, best_score = results[0]

        if best_score < 0.40:  # threshold
            return web_fallback(query)

        context = "\n\n".join([f"{r[0]} - {r[1]}" for r in results])

    # 3️⃣ Build prompt for Gemini (KB mode)
    prompt = f"""
You are a legal assistant. Use the knowledge base context provided below.

Rules:
- If the context contains a legal answer, explain it clearly.
- If context is EMPTY, reply exactly: "Not found in knowledge base."
- Do NOT say "I will search", just use the context to explain.

Context:
{context}

Query:
{query}
"""
    resp = client.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=prompt,
        config=GenerateContentConfig(temperature=0.2),
    )
    return resp.text

# -------------------------
# 🔄 CLI Loop
# -------------------------
if __name__ == "__main__":
    while True:
        q = input("\nAsk a legal question (or 'quit'): ")
        if q.lower() in ["quit", "exit"]:
            break
        print("\n[ANSWER]:", answer_query(q))
