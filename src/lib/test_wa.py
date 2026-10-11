import requests

def test_whatsapp_flow():
    # 1. Fetch departments
    depts = requests.get('http://localhost:3010/api/departments').json()['departments']
    d_id = depts[0]['id']
    u_id = depts[0]['units'][0]['id'] if depts[0]['units'] else None

    # 2. Create complaint
    create_res = requests.post('http://localhost:3010/api/complaints/create', json={
        'isAnonymous': False,
        'patientName': 'Hari Kumar',
        'patientPhone': '9855012345',
        'category': 'MEDICAL_CARE',
        'departmentId': d_id,
        'unitId': u_id,
        'location': 'OPD Room 2',
        'subject': 'WhatsApp Test Grievance',
        'description': 'Testing automated WhatsApp alert dispatch',
    }).json()

    print('1. Complaint Created:', create_res['data']['trackingId'])
    tid = create_res['data']['trackingId']

    # 3. Track complaint to get database ID
    track_res = requests.get(f'http://localhost:3010/api/complaints/track?trackingId={tid}').json()['complaint']
    comp_id = track_res['id']

    # 4. Update status & dispatch resolution alert
    update_res = requests.patch(f'http://localhost:3010/api/admin/complaints/{comp_id}', json={
        'status': 'RESOLVED',
        'actionSummary': 'Duty doctor and nursing staff counseled. Action complete.',
    }).json()

    print('2. Admin Update Result:', update_res['message'])

if __name__ == '__main__':
    test_whatsapp_flow()
