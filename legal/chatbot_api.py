from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Import your existing RAG system
try:
    from scripts.query import answer_query
    print("✅ RAG system loaded successfully!")
except ImportError as e:
    print(f"❌ Error importing RAG system: {e}")
    answer_query = None

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({
                'success': False,
                'error': 'Empty message'
            }), 400
        
        print(f"📨 Received message: {user_message}")
        
        # Use your RAG model
        if answer_query:
            try:
                rag_response = answer_query(user_message)
                print("✅ Using RAG response")
                return jsonify({
                    'success': True,
                    'response': rag_response,
                    'source': 'rag'
                })
            except Exception as rag_error:
                print(f"❌ RAG error: {rag_error}")
                return jsonify({
                    'success': False,
                    'error': str(rag_error),
                    'response': 'Sorry, our legal database is currently unavailable. Please try again later.'
                }), 500
        else:
            return jsonify({
                'success': False,
                'error': 'RAG system not loaded',
                'response': 'System error: Legal database not available.'
            }), 500
        
    except Exception as e:
        print(f"💥 Server error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'response': 'Sorry, I encountered a server error. Please try again.'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'rag_loaded': answer_query is not None,
        'service': 'Legal Chatbot API'
    })

if __name__ == '__main__':
    print("🚀 Starting Legal Chatbot API...")
    print("📊 Endpoints:")
    print("   - POST http://localhost:5000/api/chat")
    print("   - GET  http://localhost:5000/api/health")
    app.run(debug=True, port=5000, host='0.0.0.0')