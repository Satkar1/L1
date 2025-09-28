import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import json

class CriminalMatcher:
    def __init__(self):
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        self.criminal_profiles = self._load_criminal_profiles()
    
    def _load_criminal_profiles(self):
        """Load criminal profiles (can be enhanced with real data)"""
        return [
            {
                'id': 1,
                'name': 'Unknown Suspect A',
                'modus_operandi': 'Uses motorcycle for quick getaways, targets isolated areas',
                'preferred_locations': ['Commercial areas', 'Parking lots'],
                'crime_types': ['Robbery', 'Theft'],
                'physical_description': 'Medium build, helmet always used',
                'active': True,
                'match_confidence': 0.0
            },
            {
                'id': 2,
                'name': 'Unknown Suspect B', 
                'modus_operandi': 'Online fraud, targets elderly people',
                'preferred_locations': ['Online', 'Residential areas'],
                'crime_types': ['Fraud', 'Cybercrime'],
                'physical_description': 'Unknown - operates online',
                'active': True,
                'match_confidence': 0.0
            },
            {
                'id': 3,
                'name': 'Unknown Suspect C',
                'modus_operandi': 'Violent assaults during night hours',
                'preferred_locations': ['Dark alleys', 'Parks after dark'],
                'crime_types': ['Assault', 'Robbery'],
                'physical_description': 'Tall, athletic build, wears dark clothing',
                'active': True,
                'match_confidence': 0.0
            }
        ]
    
    def find_similar_cases(self, case_description, suspect_details):
        """Find similar criminal patterns"""
        try:
            matches = []
            
            for profile in self.criminal_profiles:
                # Calculate similarity based on modus operandi
                mo_similarity = self._calculate_similarity(
                    case_description, 
                    profile['modus_operandi']
                )
                
                # Check crime type match
                crime_match = any(crime.lower() in case_description.lower() 
                                for crime in profile['crime_types'])
                
                # Check location match
                location_match = any(loc.lower() in case_description.lower() 
                                   for loc in profile['preferred_locations'])
                
                similarity_score = (mo_similarity * 0.6 + 
                                  (1.0 if crime_match else 0.0) * 0.3 +
                                  (1.0 if location_match else 0.0) * 0.1)
                
                if similarity_score > 0.4:  # Threshold for potential match
                    match_info = profile.copy()
                    match_info['match_confidence'] = round(similarity_score * 100, 1)
                    match_info['matched_elements'] = {
                        'modus_operandi': round(mo_similarity * 100, 1),
                        'crime_type_match': crime_match,
                        'location_match': location_match
                    }
                    matches.append(match_info)
            
            # Sort by confidence
            matches.sort(key=lambda x: x['match_confidence'], reverse=True)
            return matches
            
        except Exception as e:
            return [{'error': f'Matching failed: {str(e)}'}]
    
    def _calculate_similarity(self, text1, text2):
        """Calculate semantic similarity between two texts"""
        if not text1 or not text2:
            return 0.0
        
        embeddings = self.embedder.encode([text1, text2])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return max(0.0, similarity)  # Ensure non-negative
    
    def get_criminal_profiles(self):
        """Get all criminal profiles"""
        return self.criminal_profiles
    
    def add_criminal_profile(self, profile_data):
        """Add a new criminal profile"""
        new_profile = {
            'id': len(self.criminal_profiles) + 1,
            **profile_data,
            'match_confidence': 0.0
        }
        self.criminal_profiles.append(new_profile)
        return new_profile
    
    def search_profiles(self, search_term):
        """Search criminal profiles by various criteria"""
        results = []
        search_term = search_term.lower()
        
        for profile in self.criminal_profiles:
            # Search in multiple fields
            search_fields = [
                profile.get('name', ''),
                profile.get('modus_operandi', ''),
                ' '.join(profile.get('crime_types', [])),
                ' '.join(profile.get('preferred_locations', [])),
                profile.get('physical_description', '')
            ]
            
            if any(search_term in field.lower() for field in search_fields):
                results.append(profile)
        
        return results