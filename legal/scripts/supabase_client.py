import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json
from datetime import datetime

load_dotenv()

class SupabaseFIRClient:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        # Prefer service role key if available, otherwise fall back to anon key
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
        
        if not self.url or not self.key:
            raise ValueError("Supabase URL and Key must be set in environment variables")
        
        self.supabase: Client = create_client(self.url, self.key)
    
    def store_fir_record(self, fir_data):
        """Store FIR record in Supabase"""
        try:
            response = self.supabase.table("fir_records").insert(fir_data).execute()
            
            if response.data:
                return {"success": True, "id": response.data[0]['id']}
            else:
                return {"success": False, "error": str(response.error)}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def search_fir_records(self, filters=None):
        """Search FIR records with various filters"""
        try:
            query = self.supabase.table("fir_records").select("*")
            
            if filters:
                if filters.get('start_date') and filters.get('end_date'):
                    query = query.gte('incident_date', filters['start_date'])\
                                .lte('incident_date', filters['end_date'])
                
                if filters.get('date'):
                    query = query.eq('incident_date', filters['date'])
                
                if filters.get('incident_type'):
                    query = query.eq('incident_type', filters['incident_type'])
                
                if filters.get('police_station'):
                    query = query.eq('police_station', filters['police_station'])
                
                if filters.get('district'):
                    query = query.eq('district', filters['district'])
                
                if filters.get('ipc_section'):
                    query = query.ilike('ipc_sections', f'%{filters["ipc_section"]}%')
                
                if filters.get('search_text'):
                    query = query.ilike('incident_description', f'%{filters["search_text"]}%')
            
            query = query.order('created_at', desc=True)
            response = query.execute()
            return {"success": True, "data": response.data}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_fir_by_number(self, fir_number):
        """Get specific FIR by FIR number"""
        try:
            response = self.supabase.table("fir_records")\
                .select("*")\
                .eq("fir_number", fir_number)\
                .execute()
            
            if response.data:
                return {"success": True, "data": response.data[0]}
            else:
                return {"success": False, "error": "FIR not found"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_monthly_report(self, year, month):
        """Get monthly FIR report"""
        try:
            start_date = f"{year}-{month:02d}-01"
            next_month = month + 1 if month < 12 else 1
            next_year = year if month < 12 else year + 1
            end_date = f"{next_year}-{next_month:02d}-01"
            
            response = self.supabase.table("fir_records")\
                .select("*")\
                .gte('incident_date', start_date)\
                .lt('incident_date', end_date)\
                .order('incident_date')\
                .execute()
            
            return {"success": True, "data": response.data}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_crime_statistics(self, start_date, end_date):
        """Get crime statistics for dashboard"""
        try:
            response = self.supabase.table("fir_records")\
                .select("incident_type")\
                .gte('incident_date', start_date)\
                .lte('incident_date', end_date)\
                .execute()
            
            type_counts = {}
            for record in response.data:
                incident_type = record['incident_type']
                type_counts[incident_type] = type_counts.get(incident_type, 0) + 1
            
            return {
                "success": True,
                "type_counts": type_counts,
                "total_records": len(response.data),
                "date_range": {"start": start_date, "end": end_date}
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
