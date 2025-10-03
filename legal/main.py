from scripts.query import answer_query

if __name__ == "__main__":
    print("🔎 Legal Chatbot (type 'exit' to quit)")
    while True:
        q = input("\nQuestion: ")
        if q.lower() in ["exit", "quit"]:
            break
        print("\nAnswer:", answer_query(q))
