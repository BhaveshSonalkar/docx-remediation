from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
from datetime import datetime
import mammoth
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'docx'}

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# In-memory storage for prototype
documents = {}
accessibility_issues = {}
staged_changes = {}  # Add this for storing staged changes

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/documents/upload', methods=['POST'])
def upload_document():
    """Upload DOCX file and store metadata"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only DOCX files are allowed'}), 400
    
    try:
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        
        # Save file with unique name
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, f"{document_id}_{filename}")
        file.save(file_path)
        
        # Store document metadata
        documents[document_id] = {
            'id': document_id,
            'filename': filename,
            'file_path': file_path,
            'upload_date': datetime.now().isoformat(),
            'status': 'uploaded'
        }
        
        return jsonify({
            'document_id': document_id,
            'filename': filename,
            'status': 'uploaded'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/documents/<document_id>/render', methods=['GET'])
def render_document(document_id):
    """Convert DOCX to HTML using mammoth"""
    if document_id not in documents:
        return jsonify({'error': 'Document not found'}), 404
    
    try:
        document = documents[document_id]
        file_path = document['file_path']
        
        # Convert DOCX to HTML using mammoth
        with open(file_path, "rb") as docx_file:
            result = mammoth.convert_to_html(docx_file)
            html_content = result.value
            messages = result.messages
        
        # Update document status
        documents[document_id]['status'] = 'ready'
        
        return jsonify({
            'html_content': html_content,
            'messages': [str(msg) for msg in messages],
            'document_id': document_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/documents/<document_id>/scan', methods=['GET'])
def scan_document(document_id):
    """Trigger accessibility scan (hardcoded for prototype)"""
    if document_id not in documents:
        return jsonify({'error': 'Document not found'}), 404
    
    try:
        # Update document status
        documents[document_id]['status'] = 'scanning'
        
        # Hardcoded accessibility issues for prototype
        # In real implementation, this would call actual accessibility scanning service
        hardcoded_issues = [
            {
                'clause': '1.4.3',
                'description': 'The visual presentation of text and images of text has a contrast ratio of at least 4.5:1. Large-scale text and images of large-scale text have a contrast ratio of at least 3:1',
                'details': [
                    'Paragraph 2, Run 1: Text \'Some low contrast te...\' - Contrast ratio 1.53 < 4.5 required (size=11.0pt, bold=False, large=False, fg=rgb(209, 209, 209), bg=rgb(255, 255, 255))'
                ],
                'formatted': 'Specification: WCAG 2.2, Clause: 1.4.3, Test number: 1',
                'principle_test_number': '1.4.3_1',
                'specification': 'WCAG 2.2',
                'status': 'Failed',
                'test_number': '1',
                'wcag_level': 'AA',
                'document_id': document_id,
                'id': str(uuid.uuid4())
            },
            {
                'clause': '1.3.1',
                'description': 'Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text',
                'details': [
                    'Heading structure violation: Found h3 element without preceding h2 element. Expected heading level: h2, Found heading level: h3'
                ],
                'formatted': 'Specification: WCAG 2.2, Clause: 1.3.1, Test number: 1',
                'principle_test_number': '1.3.1_1',
                'specification': 'WCAG 2.2',
                'status': 'Failed',
                'test_number': '1',
                'wcag_level': 'A',
                'document_id': document_id,
                'id': str(uuid.uuid4())
            },
            {
                'clause': '2.4.6',
                'description': 'Headings and labels describe topic or purpose',
                'details': [
                    'Heading \'Untitled Section\' lacks descriptive content. Consider using a more descriptive heading that clearly indicates the section content.'
                ],
                'formatted': 'Specification: WCAG 2.2, Clause: 2.4.6, Test number: 1',
                'principle_test_number': '2.4.6_1',
                'specification': 'WCAG 2.2',
                'status': 'Failed',
                'test_number': '1',
                'wcag_level': 'AA',
                'document_id': document_id,
                'id': str(uuid.uuid4())
            }
        ]
        
        # Store issues in memory
        for issue in hardcoded_issues:
            accessibility_issues[issue['id']] = issue
        
        # Update document status
        documents[document_id]['status'] = 'ready'
        
        return jsonify({
            'scan_results': hardcoded_issues,
            'document_id': document_id,
            'total_issues': len(hardcoded_issues)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/issues/<document_id>', methods=['GET'])
def get_document_issues(document_id):
    """Get all accessibility issues for a document"""
    if document_id not in documents:
        return jsonify({'error': 'Document not found'}), 404
    
    # Filter issues for this document
    document_issues = [
        issue for issue in accessibility_issues.values() 
        if issue['document_id'] == document_id
    ]
    
    return jsonify(document_issues)

@app.route('/api/documents', methods=['GET'])
def list_documents():
    """List all uploaded documents"""
    return jsonify(list(documents.values()))

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'docx-remediation-backend'})

@app.route('/api/issues/<issue_id>/suggest-fix', methods=['POST'])
def suggest_fix(issue_id):
    """Get AI-suggested fix for an issue (hardcoded for prototype)"""
    if issue_id not in accessibility_issues:
        return jsonify({'error': 'Issue not found'}), 404
    
    issue = accessibility_issues[issue_id]
    
    # Hardcoded suggestions based on issue type
    suggestions = {
        '1.4.3': {
            'suggested_text': 'Change text color from rgb(209, 209, 209) to rgb(68, 68, 68) for better contrast',
            'confidence': 0.95,
            'fix_type': 'color_change',
            'old_value': 'rgb(209, 209, 209)',
            'new_value': 'rgb(68, 68, 68)',
            'element_xpath': '//w:p[2]/w:r[1]/w:rPr/w:color'
        },
        '1.3.1': {
            'suggested_text': 'Change heading level from h3 to h2 to maintain proper heading hierarchy',
            'confidence': 0.88,
            'fix_type': 'heading_level_change',
            'old_value': 'h3',
            'new_value': 'h2',
            'element_xpath': '//w:p[1]/w:pPr/w:pStyle'
        },
        '2.4.6': {
            'suggested_text': 'Replace "Untitled Section" with "Project Overview" for better description',
            'confidence': 0.92,
            'fix_type': 'heading_text_change',
            'old_value': 'Untitled Section',
            'new_value': 'Project Overview',
            'element_xpath': '//w:p[1]/w:r[1]/w:t'
        }
    }
    
    clause = issue['clause']
    suggestion = suggestions.get(clause, {
        'suggested_text': 'Manual review required for this issue type',
        'confidence': 0.5,
        'fix_type': 'manual_review',
        'old_value': '',
        'new_value': '',
        'element_xpath': ''
    })
    
    return jsonify({
        'issue_id': issue_id,
        'suggested_text': suggestion['suggested_text'],
        'confidence': suggestion['confidence'],
        'fix_type': suggestion['fix_type'],
        'old_value': suggestion['old_value'],
        'new_value': suggestion['new_value'],
        'element_xpath': suggestion['element_xpath']
    })

@app.route('/api/issues/<issue_id>/stage-change', methods=['POST'])
def stage_change(issue_id):
    """Stage a fix for an issue"""
    if issue_id not in accessibility_issues:
        return jsonify({'error': 'Issue not found'}), 404
    
    data = request.get_json()
    if not data or 'new_content' not in data:
        return jsonify({'error': 'new_content is required'}), 400
    
    try:
        # Generate change ID
        change_id = str(uuid.uuid4())
        
        # Get original content from issue
        issue = accessibility_issues[issue_id]
        original_content = issue.get('details', [''])[0] if issue.get('details') else ''
        
        # Create staged change
        staged_changes[change_id] = {
            'id': change_id,
            'issue_id': issue_id,
            'document_id': issue['document_id'],
            'original_content': original_content,
            'new_content': data['new_content'],
            'change_type': data.get('change_type', 'manual'),
            'created_at': datetime.now().isoformat(),
            'status': 'staged'
        }
        
        # Calculate simple diff (for prototype)
        diff = {
            'type': 'text_change',
            'original': original_content[:50] + '...' if len(original_content) > 50 else original_content,
            'modified': data['new_content'][:50] + '...' if len(data['new_content']) > 50 else data['new_content']
        }
        
        return jsonify({
            'change_id': change_id,
            'diff': diff,
            'status': 'staged'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/documents/<document_id>/apply-changes', methods=['POST'])
def apply_changes(document_id):
    """Apply all staged changes to document (hardcoded for prototype)"""
    if document_id not in documents:
        return jsonify({'error': 'Document not found'}), 404
    
    try:
        # Get all staged changes for this document
        document_changes = [
            change for change in staged_changes.values() 
            if change['document_id'] == document_id and change['status'] == 'staged'
        ]
        
        if not document_changes:
            return jsonify({'error': 'No staged changes found for this document'}), 400
        
        # Generate new document ID for updated version
        updated_document_id = str(uuid.uuid4())
        
        # In a real implementation, this would:
        # 1. Load the original DOCX file
        # 2. Apply XML changes based on element_xpath
        # 3. Save as new document
        # For prototype, we'll just mark changes as applied
        
        applied_changes = []
        for change in document_changes:
            change['status'] = 'applied'
            change['applied_at'] = datetime.now().isoformat()
            applied_changes.append(change['id'])
        
        # Update document status
        documents[document_id]['status'] = 'remediated'
        documents[document_id]['remediated_at'] = datetime.now().isoformat()
        documents[document_id]['applied_changes'] = applied_changes
        
        return jsonify({
            'updated_document_id': updated_document_id,
            'applied_changes': applied_changes,
            'total_changes': len(applied_changes),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/changes/<change_id>', methods=['DELETE'])
def cancel_staged_change(change_id):
    """Cancel a staged change"""
    if change_id not in staged_changes:
        return jsonify({'error': 'Change not found'}), 404
    
    try:
        change = staged_changes[change_id]
        if change['status'] != 'staged':
            return jsonify({'error': 'Can only cancel staged changes'}), 400
        
        # Remove the change
        del staged_changes[change_id]
        
        return jsonify({
            'change_id': change_id,
            'status': 'cancelled'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/changes/<document_id>', methods=['GET'])
def get_staged_changes(document_id):
    """Get all staged changes for a document (bonus endpoint)"""
    if document_id not in documents:
        return jsonify({'error': 'Document not found'}), 404
    
    # Filter staged changes for this document
    document_changes = [
        change for change in staged_changes.values() 
        if change['document_id'] == document_id
    ]
    
    return jsonify(document_changes)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)