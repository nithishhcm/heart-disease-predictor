import io
import os
import tempfile
import qrcode
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from app.utils.chart_generator import generate_gauge, generate_shap_bar

def build_pdf_report(
    prediction_id: int,
    timestamp: datetime,
    risk_level: str,
    probability: float,
    severity: str,
    confidence: float,
    patient_profile: dict,
    shap_raw: dict,
    clinical_summary: str,
    interpretation: str,
    tests: list,
    specialists: list,
    lifestyle: list,
    timeline: str,
    model_version: str,
    ai_disclaimer: str,
    verify_url: str = "http://127.0.0.1:8000/api/report/verify"
) -> bytes:
    """
    Builds a professional hospital-grade PDF report and returns it as a bytes stream.
    Includes patient parameters, probability gauges, AI factor charts, advice, and a verification QR.
    Structured across exactly 2 pages with detailed clinical explanations of the charts.
    """
    # Initialize document in a BytesIO buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor('#7000ff')   # Purple
    c_secondary = colors.HexColor('#00f0ff') # Cyan
    c_text = colors.HexColor('#262626')      # Dark Charcoal
    c_dark = colors.HexColor('#050505')
    c_danger = colors.HexColor('#ef4444')
    c_success = colors.HexColor('#22c55e')
    
    # Custom Paragraph Styles
    style_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_primary,
        alignment=0 # Left
    )
    style_subtitle = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#6b7280'),
        alignment=0
    )
    style_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_primary,
        spaceAfter=6,
        keepWithNext=True
    )
    style_body = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_text
    )
    style_explanation = ParagraphStyle(
        'ExplanationText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#4b5563')
    )
    style_disclaimer = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#9ca3af')
    )
    
    story = []
    
    # 1. HEADER SECTION (Hospital style header layout)
    header_data = [
        [
            Paragraph("NEUROHEART AI CLINICAL LABORATORY", style_title),
            Paragraph("<b>CONFIDENTIAL MEDICAL REPORT</b><br/>Inference Diagnostic Sheet", style_subtitle)
        ]
    ]
    header_table = Table(header_data, colWidths=[4.0 * inch, 3.5 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LINEBELOW', (0,0), (-1,-1), 1.5, c_primary)
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))
    
    # 2. PATIENT DETAILS GRID
    formatted_date = timestamp.strftime('%Y-%m-%d %H:%M UTC')
    details_data = [
        [
            Paragraph(f"<b>Patient Reference ID:</b> P-{prediction_id:05d}", style_body),
            Paragraph(f"<b>Diagnostic Time:</b> {formatted_date}", style_body)
        ],
        [
            Paragraph(f"<b>Analysis Engine:</b> {model_version}", style_body),
            Paragraph(f"<b>Verification Signature:</b> NH-{prediction_id}-{hash(timestamp) % 100000:05d}", style_body)
        ]
    ]
    details_table = Table(details_data, colWidths=[3.75 * inch, 3.75 * inch])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f9fafb')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 15))
    
    # Create temp files for Matplotlib charts
    temp_files = []
    try:
        # Create gauge chart
        gauge_bytes = generate_gauge(probability, "Probability")
        temp_gauge = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        temp_gauge.write(gauge_bytes)
        temp_gauge.close()
        temp_files.append(temp_gauge.name)
        
        # Create shap bar chart
        shap_bytes = generate_shap_bar(shap_raw)
        temp_shap = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        temp_shap.write(shap_bytes)
        temp_shap.close()
        temp_files.append(temp_shap.name)
        
        # Create QR Code verification link
        qr_obj = qrcode.QRCode(version=1, box_size=5, border=1)
        qr_obj.add_data(f"{verify_url}?id={prediction_id}")
        qr_obj.make(fit=True)
        qr_img = qr_obj.make_image(fill_color="black", back_color="white")
        temp_qr = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        qr_img.save(temp_qr.name)
        temp_files.append(temp_qr.name)
        
        # ==========================================
        # PAGE 1: DIAGNOSTIC GAUGES & METRICS
        # ==========================================
        story.append(Paragraph("I. Cardiovascular Risk Assessment", style_heading))
        
        profile_p = []
        for k, v in list(patient_profile.items())[:8]:
            profile_p.append(Paragraph(f"• <b>{k}:</b> {v}", style_body))
        profile_col_text = "<br/>".join([p.text for p in profile_p])
        
        c_risk_text = f"<font color='{c_danger.hexval() if risk_level == 'High Risk' else c_success.hexval()}'><b>{risk_level.upper()} ({confidence}%)</b></font>"
        
        summary_block = f"""
        <b>Cardiovascular Evaluation</b><br/>
        Risk Category: {c_risk_text}<br/>
        Clinical Severity: <b>{severity}</b><br/>
        <br/>
        <b>Key Patient Metrics:</b><br/>
        {profile_col_text}
        """
        
        summary_flow = Paragraph(summary_block, style_body)
        gauge_img = Image(temp_gauge.name, width=2.8 * inch, height=1.75 * inch)
        
        gauge_explanation_html = """
        <b>Cardiovascular Risk Gauge:</b><br/>
        The gauge plot to the right displays the patient's overall cardiac disease risk score, computed via a machine learning classifier.
        <br/><br/>
        • <b>0% - 40% (Stable Baseline)</b>: Indicates clinical parameters align with healthy patterns.
        <br/>
        • <b>41% - 70% (Borderline Warning)</b>: Signals early deviations; lifestyle interventions or supplementary screenings are advised.
        <br/>
        • <b>71% - 100% (High Clinical Concern)</b>: Strong alignment with ischemic datasets; requires immediate clinical evaluation.
        """
        gauge_explanation_flow = Paragraph(gauge_explanation_html, style_explanation)
        
        # Table of Summary and Gauge on top
        block1_data = [
            [summary_flow, gauge_img],
            [Spacer(1, 5), gauge_explanation_flow]
        ]
        block1_table = Table(block1_data, colWidths=[4.2 * inch, 3.3 * inch])
        block1_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('SPAN', (1,1), (1,1)), # None
            ('SPAN', (0,1), (1,1)), # Merge explanations row
            ('RIGHTPADDING', (0,0), (0,-1), 10),
            ('LEFTPADDING', (1,0), (1,-1), 10),
            ('TOPPADDING', (0,1), (-1,1), 10),
        ]))
        story.append(block1_table)
        story.append(Spacer(1, 20))
        
        # Doctor Consultation Section
        story.append(Paragraph("II. Clinical Consultation Notes & Signature", style_heading))
        doctor_notes_html = """
        <b>Consulting Physician Remarks:</b><br/>
        __________________________________________________________________________________________<br/><br/>
        __________________________________________________________________________________________<br/><br/>
        <b>Authorized Signature:</b> ___________________________  <b>Date:</b> _____________________
        """
        doc_paragraph = Paragraph(doctor_notes_html, style_body)
        qr_image = Image(temp_qr.name, width=1.1 * inch, height=1.1 * inch)
        
        footer_data = [[doc_paragraph, qr_image]]
        footer_table = Table(footer_data, colWidths=[6.3 * inch, 1.2 * inch])
        footer_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ]))
        story.append(footer_table)
        
        # Page Break to next page
        story.append(PageBreak())
        
        # ==========================================
        # PAGE 2: CLINICAL INTERPRETATION & CHARTS
        # ==========================================
        # Small header
        header_data_mini = [
            [
                Paragraph("NEUROHEART AI CLINICAL LABORATORY", style_title),
                Paragraph("Reference ID: P-{prediction_id:05d}".format(prediction_id=prediction_id), style_subtitle)
            ]
        ]
        header_table_mini = Table(header_data_mini, colWidths=[4.8 * inch, 2.7 * inch])
        header_table_mini.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LINEBELOW', (0,0), (-1,-1), 1.0, c_primary)
        ]))
        story.append(header_table_mini)
        story.append(Spacer(1, 15))
        
        story.append(Paragraph("III. AI Pathology Diagnostics (SHAP Factors)", style_heading))
        
        interp_text = f"""
        <b>Patient Summary:</b> {clinical_summary}<br/><br/>
        <b>Medical Assessment:</b> {interpretation}
        """
        interp_flow = Paragraph(interp_text, style_body)
        shap_img = Image(temp_shap.name, width=3.3 * inch, height=1.9 * inch)
        
        shap_explanation_html = """
        <b>Factor Inference Impact (SHAP):</b><br/>
        The SHAP (SHapley Additive exPlanations) chart displays the features contributing most to the prediction.
        <br/><br/>
        • <font color='#ef4444'><b>Red Bars (Risk Accelerators)</b></font>: Variables that increased the patient's cardiovascular risk score. The longer the bar, the higher the risk acceleration.
        <br/>
        • <font color='#00a3ff'><b>Cyan/Blue Bars (Protective Markers)</b></font>: Variables contributing to cardiac homeostasis and pulling the risk score down.
        """
        shap_explanation_flow = Paragraph(shap_explanation_html, style_explanation)
        
        block2_data = [
            [interp_flow, shap_img],
            [Spacer(1, 5), shap_explanation_flow]
        ]
        block2_table = Table(block2_data, colWidths=[4.0 * inch, 3.5 * inch])
        block2_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('SPAN', (0,1), (1,1)), # Merge explanations row
            ('BOX', (0,0), (0,0), 0.5, colors.HexColor('#e5e7eb')),
            ('BACKGROUND', (0,0), (0,0), colors.HexColor('#f9fafb')),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (0,0), 10),
            ('RIGHTPADDING', (0,0), (0,0), 10),
            ('LEFTPADDING', (1,0), (1,0), 10),
        ]))
        story.append(block2_table)
        story.append(Spacer(1, 15))
        
        # Recommendations & Pathway Table
        story.append(Paragraph("IV. Recommended Treatment Pathway & Pathway Timeline", style_heading))
        
        rec_tests_text = "<br/>".join([f"• {t}" for t in tests])
        rec_specs_text = "<br/>".join([f"• {s}" for s in specialists])
        rec_life_text = "<br/>".join([f"• {l}" for l in lifestyle])
        
        rec_data = [
            [
                Paragraph("<b>Recommended Diagnostic Tests</b>", style_body),
                Paragraph("<b>Referrals & Specialists</b>", style_body),
                Paragraph("<b>Lifestyle & Dietary Adjustments</b>", style_body)
            ],
            [
                Paragraph(rec_tests_text, style_body),
                Paragraph(rec_specs_text, style_body),
                Paragraph(rec_life_text, style_body)
            ]
        ]
        
        rec_table = Table(rec_data, colWidths=[2.5 * inch, 2.3 * inch, 2.7 * inch])
        rec_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f3f4f6')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ]))
        story.append(rec_table)
        story.append(Spacer(1, 15))
        
        story.append(Paragraph(f"<b>Recommended Follow-up Timeline:</b> {timeline}", style_body))
        story.append(Spacer(1, 20))
        
        # Clinical Disclaimer
        story.append(Paragraph(f"<b>AI CLINICAL DISCLAIMER:</b> {ai_disclaimer}", style_disclaimer))
        
        # Build document
        doc.build(story)
        
    finally:
        # Cleanup temporary files
        for f in temp_files:
            try:
                os.remove(f)
            except Exception:
                pass
                
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
