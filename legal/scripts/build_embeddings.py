import os
import pandas as pd
import numpy as np
from tqdm import tqdm
from sentence_transformers import SentenceTransformer
import pickle

# Paths
DATA_FILE = os.path.join("combined_knowledge.csv")
EMB_FILE = os.path.join("embeddings.pkl")

def build():
    print(f"[INFO] Loading {DATA_FILE}")
    df = pd.read_csv(DATA_FILE)

    # Auto-detect text column
    candidate_cols = ["chunk", "content", "text", "body"]
    text_column = None
    for col in candidate_cols:
        if col in df.columns:
            text_column = col
            break

    if text_column is None:
        raise ValueError(
            f"CSV must have one of these columns: {candidate_cols}. Found {list(df.columns)}"
        )

    texts = df[text_column].astype(str).tolist()
    print(f"[INFO] Using '{text_column}' column as text source")
    print(f"[INFO] Creating embeddings for {len(texts)} entries...")

    # Load SentenceTransformer model
    model = SentenceTransformer("all-MiniLM-L6-v2")  # 384-dim, ~90MB

    # Generate embeddings
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=True)

    # Save embeddings + dataframe
    with open(EMB_FILE, "wb") as f:
        pickle.dump((df, embeddings), f)

    print(f"[INFO] Saved embeddings to {EMB_FILE}")


if __name__ == "__main__":
    build()
