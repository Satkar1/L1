import pandas as pd
from datetime import datetime, timedelta
import json
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.cluster import DBSCAN

class CaseAnalyzer:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
    
    def analyze_case(self, case_data):
        """Analyze a single case for priority and action items"""
        analysis = {
            'priority': 'medium',
            'needs_attention': False,
            'action_items': [],
            'risk_level': 'moderate'
        }
        
        # Priority based on incident type
        high_priority_types = ['murder', 'kidnapping', 'rape', 'terrorism']
        medium_priority_types = ['robbery', 'assault', 'fraud']
        
        incident_type = case_data.get('incident_type', '').lower()
        
        if incident_type in high_priority_types:
            analysis['priority'] = 'high'
            analysis['risk_level'] = 'high'
            analysis['needs_attention'] = True
        elif incident_type in medium_priority_types:
            analysis['priority'] = 'medium'
            analysis['risk_level'] = 'medium'
        
        # Check if case is old and needs follow-up
        created_at = case_data.get('created_at')
        if created_at:
            case_age = (datetime.now() - datetime.fromisoformat(created_at)).days
            if case_age > 7 and analysis['priority'] == 'high':
                analysis['needs_attention'] = True
                analysis['action_items'].append('Urgent follow-up required')
            elif case_age > 30:
                analysis['needs_attention'] = True
                analysis['action_items'].append('Case review needed')
        
        # Check for incomplete information
        if not case_data.get('investigating_officer'):
            analysis['action_items'].append('Assign investigating officer')
        
        if not case_data.get('ipc_sections') or case_data.get('ipc_sections') == '[]':
            analysis['action_items'].append('Review and apply IPC sections')
        
        return analysis
    
    def analyze_patterns(self, filters=None):
        """Analyze criminal patterns across cases"""
        try:
            # Get cases based on filters
            query = self.supabase.table("fir_records").select("*")
            
            if filters:
                if filters.get('time_range'):
                    start_date = (datetime.now() - timedelta(days=filters['time_range'])).strftime('%Y-%m-%d')
                    query = query.gte('incident_date', start_date)
            
            response = query.execute()
            cases = response.data
            
            if not cases:
                return {'patterns': [], 'insights': []}
            
            # Analyze patterns
            pattern_analysis = self._identify_patterns(cases)
            insights = self._generate_insights(pattern_analysis)
            
            return {
                'patterns': pattern_analysis,
                'insights': insights,
                'total_cases_analyzed': len(cases)
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def _identify_patterns(self, cases):
        """Identify patterns in criminal cases"""
        patterns = {
            'time_patterns': self._analyze_time_patterns(cases),
            'location_patterns': self._analyze_location_patterns(cases),
            'type_patterns': self._analyze_type_patterns(cases),
            'modus_operandi': self._analyze_mo_patterns(cases)
        }
        return patterns
    
    def _analyze_time_patterns(self, cases):
        """Analyze temporal patterns"""
        time_patterns = {
            'hourly_distribution': {},
            'daily_distribution': {},
            'weekly_pattern': {}
        }
        
        for case in cases:
            if case.get('incident_time'):
                hour = int(case['incident_time'].split(':')[0])
                time_patterns['hourly_distribution'][hour] = time_patterns['hourly_distribution'].get(hour, 0) + 1
            
            if case.get('incident_date'):
                date_obj = datetime.fromisoformat(case['incident_date'])
                day_name = date_obj.strftime('%A')
                time_patterns['daily_distribution'][day_name] = time_patterns['daily_distribution'].get(day_name, 0) + 1
        
        return time_patterns
    
    def _analyze_location_patterns(self, cases):
        """Analyze geographical patterns"""
        locations = {}
        for case in cases:
            location = case.get('incident_location', 'Unknown')
            locations[location] = locations.get(location, 0) + 1
        
        # Return top 10 locations
        return dict(sorted(locations.items(), key=lambda x: x[1], reverse=True)[:10])
    
    def _analyze_type_patterns(self, cases):
        """Analyze incident type patterns"""
        types = {}
        for case in cases:
            incident_type = case.get('incident_type', 'Unknown')
            types[incident_type] = types.get(incident_type, 0) + 1
        
        return types
    
    def _analyze_mo_patterns(self, cases):
        """Analyze modus operandi patterns using NLP"""
        try:
            descriptions = [case.get('incident_description', '') for case in cases if case.get('incident_description')]
            if not descriptions:
                return []
            
            # Use embeddings to find similar descriptions
            embeddings = self.embedder.encode(descriptions)
            
            # Cluster similar descriptions
            clustering = DBSCAN(eps=0.5, min_samples=2).fit(embeddings)
            
            patterns = []
            for cluster_id in set(clustering.labels_):
                if cluster_id != -1:  # -1 indicates outliers
                    cluster_cases = [cases[i] for i in range(len(cases)) if clustering.labels_[i] == cluster_id]
                    if len(cluster_cases) > 1:  # Only consider clusters with multiple cases
                        patterns.append({
                            'cluster_id': cluster_id,
                            'case_count': len(cluster_cases),
                            'common_elements': self._extract_common_elements(cluster_cases)
                        })
            
            return patterns
            
        except Exception as e:
            return [{'error': f'MO analysis failed: {str(e)}'}]
    
    def _extract_common_elements(self, cases):
        """Extract common elements from similar cases"""
        # Simple keyword extraction (can be enhanced)
        common_keywords = {}
        for case in cases:
            description = case.get('incident_description', '').lower()
            words = description.split()
            for word in words:
                if len(word) > 4:  # Filter short words
                    common_keywords[word] = common_keywords.get(word, 0) + 1
        
        return dict(sorted(common_keywords.items(), key=lambda x: x[1], reverse=True)[:10])
    
    def _generate_insights(self, patterns):
        """Generate actionable insights from patterns"""
        insights = []
        
        # Time-based insights
        hourly = patterns['time_patterns']['hourly_distribution']
        if hourly:
            peak_hour = max(hourly, key=hourly.get)
            insights.append(f"Peak crime hours: {peak_hour}:00 ({hourly[peak_hour]} cases)")
        
        # Location-based insights
        locations = patterns['location_patterns']
        if locations:
            hotspot = list(locations.keys())[0]
            insights.append(f"Primary hotspot: {hotspot} ({locations[hotspot]} cases)")
        
        # Type-based insights
        types = patterns['type_patterns']
        if types:
            common_type = max(types, key=types.get)
            insights.append(f"Most common crime: {common_type} ({types[common_type]} cases)")
        
        return insights
    
    def identify_hotspots(self):
        """Identify crime hotspots"""
        try:
            response = self.supabase.table("fir_records")\
                .select("incident_location")\
                .execute()
            
            locations = [case['incident_location'] for case in response.data if case.get('incident_location')]
            location_counts = {}
            
            for location in locations:
                location_counts[location] = location_counts.get(location, 0) + 1
            
            # Return hotspots with more than 2 cases
            hotspots = {loc: count for loc, count in location_counts.items() if count > 2}
            return dict(sorted(hotspots.items(), key=lambda x: x[1], reverse=True))
            
        except Exception as e:
            return {'error': str(e)}
    
    def get_comprehensive_stats(self, time_range='month'):
        """Get comprehensive statistics"""
        try:
            # Calculate date range
            if time_range == 'day':
                start_date = datetime.now() - timedelta(days=1)
            elif time_range == 'week':
                start_date = datetime.now() - timedelta(weeks=1)
            elif time_range == 'month':
                start_date = datetime.now() - timedelta(days=30)
            else:  # year
                start_date = datetime.now() - timedelta(days=365)
            
            start_date_str = start_date.strftime('%Y-%m-%d')
            
            # Get cases in time range
            response = self.supabase.table("fir_records")\
                .select("*")\
                .gte('incident_date', start_date_str)\
                .execute()
            
            cases = response.data
            
            stats = {
                'total_cases': len(cases),
                'time_range': time_range,
                'case_types': {},
                'resolution_rate': self._calculate_resolution_rate(cases),
                'average_response_time': self._calculate_avg_response_time(cases),
                'top_locations': self._analyze_location_patterns(cases),
                'trend_comparison': self._compare_with_previous_period(time_range)
            }
            
            # Count by type
            for case in cases:
                case_type = case.get('incident_type', 'Unknown')
                stats['case_types'][case_type] = stats['case_types'].get(case_type, 0) + 1
            
            return stats
            
        except Exception as e:
            return {'error': str(e)}
    
    def _calculate_resolution_rate(self, cases):
        """Calculate case resolution rate"""
        # Simple implementation - can be enhanced with actual status tracking
        total = len(cases)
        if total == 0:
            return 0
        # Assume cases older than 30 days are "resolved" for demo
        resolved = sum(1 for case in cases if 
                      (datetime.now() - datetime.fromisoformat(case['created_at'])).days > 30)
        return (resolved / total) * 100
    
    def _calculate_avg_response_time(self, cases):
        """Calculate average response time (simplified)"""
        # This would normally use actual response time data
        return "2.5 hours"  # Placeholder
    
    def _compare_with_previous_period(self, time_range):
        """Compare with previous period for trends"""
        # Implementation for trend analysis
        return {'trend': 'stable', 'change_percentage': 0}