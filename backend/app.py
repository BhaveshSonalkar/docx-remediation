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
        # Comprehensive accessibility issues for prototype testing
        hardcoded_issues = [
            {
                'id': str(uuid.uuid4()),
                'document_id': document_id,
                'clause': 'WCAG 2.1 AA 1.4.3',
                'description': 'Insufficient color contrast in document title',
                'status': 'active',
                'wcag_level': 'AA',
                'details': {
                    'contrast_ratio': 1.53,
                    'required_ratio': 4.5,
                    'foreground_color': '#C8C8C8',
                    'background_color': '#FFFFFF',
                    'original_content': 'Sample Document with Accessibility Issues',
                    'element_xpath': '//w:p[1]/w:r[1]/w:t'
                },
                'element_xpath': '//w:p[1]/w:r[1]',
                'is_fixed': False
            },
            {
                'id': str(uuid.uuid4()),
                'document_id': document_id,
                'clause': 'WCAG 2.1 A 1.3.1',
                'description': 'Missing heading structure - paragraph should be a heading',
                'status': 'active',
                'wcag_level': 'A',
                'details': {
                    'issue_type': 'heading_structure',
                    'found_element': 'paragraph',
                    'expected_element': 'heading',
                    'original_content': 'This is a paragraph that should be a heading.',
                    'element_xpath': '//w:p[2]/w:r[1]/w:t'
                },
                'element_xpath': '//w:p[2]',
                'is_fixed': False
            },
            {
                'id': str(uuid.uuid4()),
                'document_id': document_id,
                'clause': 'WCAG 2.1 A 1.3.1',
                'description': 'Improper heading hierarchy - h3 without preceding h2',
                'status': 'active',
                'wcag_level': 'A',
                'details': {
                    'issue_type': 'heading_hierarchy',
                    'found_level': 'h3',
                    'expected_level': 'h2',
                    'original_content': 'Subsection',
                    'element_xpath': '//w:p[3]/w:r[1]/w:t'
                },
                'element_xpath': '//w:p[3]',
                'is_fixed': False
            },
            {
                'id': str(uuid.uuid4()),
                'document_id': document_id,
                'clause': 'WCAG 2.1 AA 1.4.3',
                'description': 'Insufficient color contrast in body text',
                'status': 'active',
                'wcag_level': 'AA',
                'details': {
                    'contrast_ratio': 1.23,
                    'required_ratio': 4.5,
                    'foreground_color': '#B4B4B4',
                    'background_color': '#FFFFFF',
                    'original_content': 'This text has insufficient color contrast.',
                    'element_xpath': '//w:p[4]/w:r[1]/w:t'
                },
                'element_xpath': '//w:p[4]/w:r[1]',
                'is_fixed': False
            },
            {
                'id': str(uuid.uuid4()),
                'document_id': document_id,
                'clause': 'WCAG 2.1 A 1.1.1',
                'description': 'Missing alternative text for referenced image',
                'status': 'active',
                'wcag_level': 'A',
                'details': {
                    'issue_type': 'missing_alt_text',
                    'reference_text': 'chart below',
                    'original_content': 'Please refer to the chart below for more information.',
                    'element_xpath': '//w:p[5]/w:r[1]/w:t'
                },
                'element_xpath': '//w:p[5]',
                'is_fixed': False
            },
            {
                'id': str(uuid.uuid4()),
                'document_id': document_id,
                'clause': 'WCAG 2.1 A 1.3.1',
                'description': 'Table missing header row',
                'status': 'active',
                'wcag_level': 'A',
                'details': {
                    'issue_type': 'table_headers',
                    'table_rows': 3,
                    'table_columns': 3,
                    'original_content': 'Data table without headers',
                    'element_xpath': '//w:tbl[1]'
                },
                'element_xpath': '//w:tbl[1]',
                'is_fixed': False
            },
            {
                'id': str(uuid.uuid4()),
                'document_id': document_id,
                'clause': 'WCAG 2.1 A 2.4.4',
                'description': 'Link text not descriptive - "here" is not meaningful',
                'status': 'active',
                'wcag_level': 'A',
                'details': {
                    'issue_type': 'link_text',
                    'link_text': 'here',
                    'context': 'Click here for more information.',
                    'original_content': 'here',
                    'element_xpath': '//w:p[6]/w:r[2]/w:t'
                },
                'element_xpath': '//w:p[6]/w:r[2]',
                'is_fixed': False
            },
            {
                'id': str(uuid.uuid4()),
                'document_id': document_id,
                'clause': 'WCAG 2.1 AA 1.4.4',
                'description': 'Text too small to read without zooming',
                'status': 'active',
                'wcag_level': 'AA',
                'details': {
                    'issue_type': 'font_size',
                    'current_size': '6pt',
                    'minimum_size': '12pt',
                    'original_content': 'This text is too small to read easily.',
                    'element_xpath': '//w:p[7]/w:r[1]/w:t'
                },
                'element_xpath': '//w:p[7]/w:r[1]',
                'is_fixed': False
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
        'WCAG 2.1 AA 1.4.3': {
            'suggested_text': 'Change text color from #C8C8C8 to #333333 for better contrast',
            'confidence': 0.95,
            'fix_type': 'color_change',
            'old_value': '#C8C8C8',
            'new_value': '#333333',
            'element_xpath': '//w:p[1]/w:r[1]/w:rPr/w:color'
        },
        'WCAG 2.1 A 1.3.1': {
            'suggested_text': 'Convert paragraph to Heading 1 for proper document structure',
            'confidence': 0.88,
            'fix_type': 'heading_structure_change',
            'old_value': 'paragraph',
            'new_value': 'heading',
            'element_xpath': '//w:p[2]/w:pPr/w:pStyle'
        },
        'WCAG 2.1 A 1.3.1': {
            'suggested_text': 'Change heading level from h3 to h2 to maintain proper hierarchy',
            'confidence': 0.92,
            'fix_type': 'heading_level_change',
            'old_value': 'h3',
            'new_value': 'h2',
            'element_xpath': '//w:p[3]/w:pPr/w:pStyle'
        },
        'WCAG 2.1 AA 1.4.3': {
            'suggested_text': 'Change text color from #B4B4B4 to #333333 for better contrast',
            'confidence': 0.95,
            'fix_type': 'color_change',
            'old_value': '#B4B4B4',
            'new_value': '#333333',
            'element_xpath': '//w:p[4]/w:r[1]/w:rPr/w:color'
        },
        'WCAG 2.1 A 1.1.1': {
            'suggested_text': 'Add "Annual Sales Chart" as alternative text for the referenced image',
            'confidence': 0.85,
            'fix_type': 'alt_text_addition',
            'old_value': '',
            'new_value': 'Annual Sales Chart',
            'element_xpath': '//w:p[5]/w:r[1]/w:t'
        },
        'WCAG 2.1 A 1.3.1': {
            'suggested_text': 'Add header row with "Column 1, Column 2, Column 3" to the table',
            'confidence': 0.90,
            'fix_type': 'table_header_addition',
            'old_value': '',
            'new_value': 'Column 1, Column 2, Column 3',
            'element_xpath': '//w:tbl[1]/w:tr[1]'
        },
        'WCAG 2.1 A 2.4.4': {
            'suggested_text': 'Change link text from "here" to "download the report" for better description',
            'confidence': 0.87,
            'fix_type': 'link_text_change',
            'old_value': 'here',
            'new_value': 'download the report',
            'element_xpath': '//w:p[6]/w:r[2]/w:t'
        },
        'WCAG 2.1 AA 1.4.4': {
            'suggested_text': 'Increase font size from 6pt to 12pt for better readability',
            'confidence': 0.93,
            'fix_type': 'font_size_change',
            'old_value': '6pt',
            'new_value': '12pt',
            'element_xpath': '//w:p[7]/w:r[1]/w:rPr/w:sz'
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