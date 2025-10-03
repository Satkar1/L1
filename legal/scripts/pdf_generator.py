from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import os
from datetime import datetime

def generate_fir_pdf(fir_data):
    """Generate FIR PDF with proper formatting"""
    
    # Create directory structure
    fir_number = fir_data['fir_number']
    year = fir_number.split('/')[1]
    month = int(fir_number.split('/')[2])
    month_name = datetime(2000, month, 1).strftime('%B')
    
    dir_path = f"fir_drafts/{year}/{month:02d}_{month_name}"
    os.makedirs(dir_path, exist_ok=True)
    
    filename = f"{fir_number.replace('/', '_')}.pdf"
    filepath = os.path.join(dir_path, filename)
    
    # Create PDF document
    doc = SimpleDocTemplate(filepath, pagesize=A4, topMargin=0.5*inch)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'FIRTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.darkblue,
        alignment=1,  # Center
        spaceAfter=30
    )
    
    header_style = ParagraphStyle(
        'FIRHeader',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.darkred,
        spaceAfter=12
    )
    
    content_style = ParagraphStyle(
        'FIRContent',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6
    )
    
    # Build story (content)
    story = []
    
    # Title
    story.append(Paragraph("FIRST INFORMATION REPORT", title_style))
    story.append(Spacer(1, 20))
    
    # FIR Number and Date
    fir_info = [
        [Paragraph("<b>FIR Number:</b>", content_style), Paragraph(fir_data['fir_number'], content_style)],
        [Paragraph("<b>Date & Time:</b>", content_style), Paragraph(datetime.now().strftime('%d/%m/%Y %H:%M'), content_style)],
        [Paragraph("<b>Police Station:</b>", content_style), Paragraph(fir_data['police_station'], content_style)],
        [Paragraph("<b>District:</b>", content_style), Paragraph(fir_data['district'], content_style)],
        [Paragraph("<b>State:</b>", content_style), Paragraph(fir_data['state'], content_style)]
    ]
    
    fir_table = Table(fir_info, colWidths=[1.5*inch, 4*inch])
    fir_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    story.append(fir_table)
    story.append(Spacer(1, 20))
    
    # Incident Details
    story.append(Paragraph("INCIDENT DETAILS", header_style))
    
    incident_info = fir_data['incident_details']
    incident_data = [
        [Paragraph("<b>Type of Incident:</b>", content_style), Paragraph(incident_info['type'], content_style)],
        [Paragraph("<b>Date of Incident:</b>", content_style), Paragraph(incident_info['date'], content_style)],
        [Paragraph("<b>Time of Incident:</b>", content_style), Paragraph(incident_info['time'], content_style)],
        [Paragraph("<b>Location:</b>", content_style), Paragraph(incident_info['location'], content_style)],
        [Paragraph("<b>Description:</b>", content_style), Paragraph(incident_info['description'], content_style)]
    ]
    
    incident_table = Table(incident_data, colWidths=[1.5*inch, 4*inch])
    story.append(incident_table)
    story.append(Spacer(1, 15))
    
    # Victim Information
    story.append(Paragraph("VICTIM INFORMATION", header_style))
    
    victim_info = fir_data['victim_info']
    victim_data = [
        [Paragraph("<b>Name:</b>", content_style), Paragraph(victim_info['name'], content_style)],
        [Paragraph("<b>Contact:</b>", content_style), Paragraph(victim_info['contact'], content_style)],
        [Paragraph("<b>Address:</b>", content_style), Paragraph(victim_info['address'], content_style)],
        [Paragraph("<b>Age:</b>", content_style), Paragraph(str(victim_info.get('age', '')), content_style)],
        [Paragraph("<b>Gender:</b>", content_style), Paragraph(victim_info.get('gender', ''), content_style)]
    ]
    
    victim_table = Table(victim_data, colWidths=[1.5*inch, 4*inch])
    story.append(victim_table)
    story.append(Spacer(1, 15))
    
    # Accused Information (if available)
    if fir_data['accused_info'].get('name'):
        story.append(Paragraph("ACCUSED INFORMATION", header_style))
        
        accused_info = fir_data['accused_info']
        accused_data = [
            [Paragraph("<b>Name:</b>", content_style), Paragraph(accused_info['name'], content_style)],
            [Paragraph("<b>Description:</b>", content_style), Paragraph(accused_info['description'], content_style)]
        ]
        
        accused_table = Table(accused_data, colWidths=[1.5*inch, 4*inch])
        story.append(accused_table)
        story.append(Spacer(1, 15))
    
    # IPC Sections Applied
    story.append(Paragraph("LEGAL SECTIONS APPLIED", header_style))
    
    sections_data = []
    for section in fir_data['sections_applied']:
        if isinstance(section, dict):
            section_text = f"IPC Section {section.get('section_number', '')}: {section.get('section_title', '')}"
            sections_data.append([Paragraph(section_text, content_style)])
    
    if sections_data:
        sections_table = Table(sections_data, colWidths=[5.5*inch])
        story.append(sections_table)
    else:
        story.append(Paragraph("No specific sections applied", content_style))
    
    story.append(Spacer(1, 15))
    
    # Investigating Officer
    story.append(Paragraph("INVESTIGATING OFFICER", header_style))
    story.append(Paragraph(fir_data['investigating_officer'], content_style))
    
    story.append(Spacer(1, 20))
    
    # Additional Comments
    if fir_data.get('additional_comments'):
        story.append(Paragraph("ADDITIONAL COMMENTS", header_style))
        story.append(Paragraph(fir_data['additional_comments'], content_style))
    
    # Generate PDF
    doc.build(story)
    
    return filepath