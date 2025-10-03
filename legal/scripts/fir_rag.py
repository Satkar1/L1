import os
import re
import pickle
import numpy as np
import ssl
import urllib.request
from sentence_transformers import SentenceTransformer
from google import genai
from google.genai.types import GenerateContentConfig
from dotenv import load_dotenv
import pandas as pd

# Fix SSL certificate issues
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Load .env
load_dotenv()

def make_json_safe(record: dict):
    """Convert numpy types to native Python types for JSON serialization"""
    safe_record = {}
    for k, v in record.items():
        if isinstance(v, (np.int32, np.int64)):
            safe_record[k] = int(v)
        elif isinstance(v, (np.float32, np.float64)):
            safe_record[k] = float(v)
        else:
            safe_record[k] = v
    return safe_record

class FIRRAGModel:
    def __init__(self, sections_csv_path):
        self.sections_df = pd.read_csv(sections_csv_path)
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        
        # Initialize Gemini client with error handling
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
            
            self.client = genai.Client(api_key=api_key)
            self.gemini_available = True
            print("✅ Gemini client initialized successfully")
        except Exception as e:
            print(f"❌ Gemini initialization failed: {e}")
            self.client = None
            self.gemini_available = False
        
        self.embeddings = None
        self.knowledge_base = None
        
    def prepare_knowledge_base(self):
        """Create a comprehensive knowledge base from sections data"""
        knowledge_items = []
        
        for _, row in self.sections_df.iterrows():
            # Create multiple context variations for better matching
            item1 = f"IPC Section {row['section_number']}: {row['section_title']}. Description: {row['description']}"
            item2 = f"Punishment: {row['punishment']}. Use cases: {row['example_use_cases']}"
            item3 = f"Legal section {row['section_number']} applies to {row['example_use_cases']}"
            
            knowledge_items.extend([item1, item2, item3])
        
        self.knowledge_base = knowledge_items
        return knowledge_items
    
    def train_embeddings(self, save_path="models/fir_embeddings.pkl"):
        """Train and save embeddings"""
        if self.knowledge_base is None:
            self.prepare_knowledge_base()
        
        print("Training FIR embeddings...")
        self.embeddings = self.embedder.encode(self.knowledge_base, convert_to_numpy=True)
        
        # Save embeddings and knowledge base
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, 'wb') as f:
            pickle.dump((self.knowledge_base, self.embeddings), f)
        
        print(f"FIR embeddings trained and saved to {save_path}")
        return self.embeddings
    
    def load_embeddings(self, embeddings_path="models/fir_embeddings.pkl"):
        """Load pre-trained embeddings"""
        try:
            with open(embeddings_path, 'rb') as f:
                self.knowledge_base, self.embeddings = pickle.load(f)
            print("✅ FIR embeddings loaded successfully!")
            return True
        except FileNotFoundError:
            print("❌ FIR embeddings not found. Please train first.")
            return False
    
    def search_sections(self, incident_description, top_k=3, threshold=0.4):
        """Search for relevant IPC sections based on incident description"""
        if self.embeddings is None:
            if not self.load_embeddings():
                return []
        
        query_embedding = self.embedder.encode([incident_description], convert_to_numpy=True)[0]
        
        # Calculate cosine similarities
        similarities = np.dot(self.embeddings, query_embedding) / (
            np.linalg.norm(self.embeddings, axis=1) * np.linalg.norm(query_embedding)
        )
        
        # Get top matches
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            if similarities[idx] > threshold:
                # Extract section number from knowledge text
                knowledge_text = self.knowledge_base[idx]
                section_match = re.search(r'Section\s+(\d+[A-Z]*)', knowledge_text)
                section_num = section_match.group(1) if section_match else "Unknown"
                
                # Get section details from CSV
                section_details = self.get_section_details([section_num])
                if section_details:
                    record = {
                        'section_number': section_num,
                        'section_title': section_details[0]['section_title'],
                        'description': section_details[0]['description'],
                        'punishment': section_details[0]['punishment'],
                        'confidence': float(similarities[idx]),
                        'source_index': int(idx)
                    }
                    results.append(make_json_safe(record))
        
        return results
    
    def get_section_details(self, section_numbers):
        """Get detailed information for specific section numbers"""
        details = []
        for section_num in section_numbers:
            section_data = self.sections_df[
                self.sections_df['section_number'].astype(str) == str(section_num)
            ]
            if not section_data.empty:
                record = section_data.iloc[0].to_dict()
                details.append(make_json_safe(record))
        return details
    
    def direct_keyword_matching(self, incident_description):
        """Direct keyword matching for common crimes"""
        keywords_to_sections = {
            'theft': ['378', '379'],
            'robbery': ['390', '392'],
            'murder': ['300', '302'],
            'assault': ['351', '352'],
            'cheating': ['415', '420'],
            'fraud': ['415', '420'],
            'rape': ['375', '376'],
            'kidnapping': ['359', '363'],
            'cyber crime': ['66C', '66D'],
            'bribery': ['171E', '171F'],
            'threat': ['503', '506'],
            'harassment': ['354', '509'],
            'burglary': ['445', '447'],
            'forgery': ['463', '465'],
            'extortion': ['383', '384']
        }
        
        incident_lower = incident_description.lower()
        matched_sections = []
        
        for keyword, sections in keywords_to_sections.items():
            if keyword in incident_lower:
                for section_num in sections:
                    section_details = self.get_section_details([section_num])
                    if section_details:
                        record = make_json_safe(section_details[0])
                        record['confidence'] = 0.9  # High confidence for direct match
                        matched_sections.append(record)
        
        return matched_sections
    
    def suggest_sections(self, incident_description):
        """Main function to suggest IPC sections for an incident"""
        # First, try direct keyword matching
        direct_matches = self.direct_keyword_matching(incident_description)
        if direct_matches:
            return direct_matches
        
        # Then use semantic search
        search_results = self.search_sections(incident_description, top_k=5, threshold=0.3)
        
        # Remove duplicates and sort by confidence
        unique_sections = {}
        for section in search_results:
            section_num = section['section_number']
            if section_num not in unique_sections or section['confidence'] > unique_sections[section_num]['confidence']:
                unique_sections[section_num] = section
        
        return list(unique_sections.values())
    
    def gemini_fallback(self, incident_description):
        """Fallback to Gemini if RAG doesn't find good matches"""
        if not self.gemini_available:
            return "AI service temporarily unavailable. Please try basic keyword search or consult legal resources."
        
        prompt = f"""
        You are a legal expert. Based on this incident description, suggest appropriate IPC sections:
        
        Incident: {incident_description}
        
        Provide response in this format:
        Section XXXX: [Title] - [Brief explanation why it applies]
        Section YYYY: [Title] - [Brief explanation why it applies]
        
        Suggest 2-3 most relevant sections. Be concise and accurate.
        """
        
        try:
            response = self.client.models.generate_content(
                model="models/gemini-2.5-flash",
                contents=prompt,
                config=GenerateContentConfig(temperature=0.2),
            )
            return response.text
        except Exception as e:
            return f"AI service error: {str(e)}. Please try basic keyword search or consult legal resources."

# Simple test function
def test_model():
    """Test the FIR RAG model"""
    rag_model = FIRRAGModel("data/section.csv")
    
    # Load or train embeddings
    if not rag_model.load_embeddings():
        print("Training new embeddings...")
        rag_model.train_embeddings()
    
    # Test queries
    test_queries = [
        "Someone stole my phone",
        "A person threatened me with a knife",
        "I received a fake job offer"
    ]
    
    for query in test_queries:
        print(f"\n🔍 Query: {query}")
        suggestions = rag_model.suggest_sections(query)
        if suggestions:
            for section in suggestions[:3]:  # Show top 3
                print(f"✅ Section {section['section_number']}: {section['section_title']} (Confidence: {section.get('confidence', 0):.2f})")
        else:
            print("❌ No sections found. Using fallback...")
            fallback = rag_model.gemini_fallback(query)
            print(f"🤖 {fallback}")

if __name__ == "__main__":
    test_model()
