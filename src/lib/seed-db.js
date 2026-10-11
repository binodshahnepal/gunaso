const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Gunaso Database with Departments & Units...');

  // 1. Create Departments & Child Units
  const departmentsData = [
    {
      code: 'EMG',
      nameEn: 'Emergency Department',
      nameNp: 'आकस्मिक कक्ष विभाग',
      slaHours: 24,
      units: [
        { code: 'EMG-TRI', nameEn: 'Triage Counter', nameNp: 'ट्रियाज काउन्टर' },
        { code: 'EMG-RED', nameEn: 'Red Zone / Resuscitation', nameNp: 'रेड जोन' },
        { code: 'EMG-OBS', nameEn: 'Emergency Observation Unit', nameNp: 'आकस्मिक अब्जरभेसन' },
      ],
    },
    {
      code: 'OPD',
      nameEn: 'Outpatient Department (OPD)',
      nameNp: 'बहिरङ्ग सेवा (ओपिडी)',
      slaHours: 48,
      units: [
        { code: 'OPD-GEN', nameEn: 'General Medicine OPD', nameNp: 'जनरल मेडिसिन ओपिडी' },
        { code: 'OPD-CARD', nameEn: 'Cardiology OPD', nameNp: 'मुटु रोग (कार्डियोलोजी) ओपिडी' },
        { code: 'OPD-ORTHO', nameEn: 'Orthopedics & Joint OPD', nameNp: 'हड्डी तथा जोर्नी ओपिडी' },
        { code: 'OPD-PED', nameEn: 'Pediatrics (Children) OPD', nameNp: 'बालरोग ओपिडी' },
        { code: 'OPD-ENT', nameEn: 'ENT OPD', nameNp: 'नाक, कान, घाँटी ओपिडी' },
      ],
    },
    {
      code: 'IPD',
      nameEn: 'Inpatient Department (IPD Wards)',
      nameNp: 'अन्तरङ्ग सेवा (वार्ड)',
      slaHours: 48,
      units: [
        { code: 'IPD-MALE', nameEn: 'Male Medical Ward', nameNp: 'पुरुष मेडिकल वार्ड' },
        { code: 'IPD-FEM', nameEn: 'Female Medical Ward', nameNp: 'महिला मेडिकल वार्ड' },
        { code: 'IPD-POST', nameEn: 'Post-Operative Ward', nameNp: 'पोस्ट-अपरेटिभ वार्ड' },
        { code: 'IPD-CAB', nameEn: 'Private Cabin Ward', nameNp: 'प्राइभेट क्याबिन वार्ड' },
      ],
    },
    {
      code: 'ICU',
      nameEn: 'Intensive Care Unit (ICU / CCU)',
      nameNp: 'सघन उपचार विभाग',
      slaHours: 24,
      units: [
        { code: 'ICU-MAIN', nameEn: 'Main ICU', nameNp: 'मुख्य आइसियु' },
        { code: 'ICU-CCU', nameEn: 'Coronary Care Unit (CCU)', nameNp: 'सिमियु / सिसीयु' },
        { code: 'ICU-NICU', nameEn: 'Neonatal ICU (NICU)', nameNp: 'नवजात शिशु आइसियु (एनआइसियु)' },
      ],
    },
    {
      code: 'PHARM',
      nameEn: 'Pharmacy Department',
      nameNp: 'फार्मेसी सेवा विभाग',
      slaHours: 24,
      units: [
        { code: 'PHARM-OPD', nameEn: 'OPD Pharmacy Desk', nameNp: 'ओपिडी फार्मेसी काउन्टर' },
        { code: 'PHARM-EMG', nameEn: 'Emergency Pharmacy 24/7', nameNp: 'इमरजेन्सी फार्मेसी' },
        { code: 'PHARM-INS', nameEn: 'Health Insurance Pharmacy Desk', nameNp: 'स्वास्थ्य बिमा फार्मेसी' },
      ],
    },
    {
      code: 'BIL',
      nameEn: 'Billing & Accounts',
      nameNp: 'बिलिङ तथा काउन्टर विभाग',
      slaHours: 24,
      units: [
        { code: 'BIL-OPD', nameEn: 'OPD Ticket Billing Counter', nameNp: 'ओपिडी टिकट काउन्टर' },
        { code: 'BIL-DISC', nameEn: 'Discharge & Inpatient Billing', nameNp: 'डिस्चार्ज तथा विल काउन्टर' },
        { code: 'BIL-INS', nameEn: 'Government Health Insurance Counter', nameNp: 'स्वास्थ्य बिमा काउन्टर' },
      ],
    },
    {
      code: 'RAD',
      nameEn: 'Radiology & Imaging',
      nameNp: 'रेडियोलोजी तथा एक्स-रे विभाग',
      slaHours: 48,
      units: [
        { code: 'RAD-XRAY', nameEn: 'Digital X-Ray Unit', nameNp: 'डिजिटल एक्स-रे' },
        { code: 'RAD-USG', nameEn: 'Ultrasound / USG Room', nameNp: 'भिडियो एक्स-रे (USG)' },
        { code: 'RAD-CT', nameEn: 'CT Scan & MRI Unit', nameNp: 'सिटी स्क्यान तथा एमआरआई' },
      ],
    },
    {
      code: 'LAB',
      nameEn: 'Pathology & Lab Services',
      nameNp: 'प्रयोगशाला विभाग',
      slaHours: 48,
      units: [
        { code: 'LAB-COLL', nameEn: 'Sample Collection Desk', nameNp: 'नमूना सङ्कलन काउन्टर' },
        { code: 'LAB-BIO', nameEn: 'Biochemistry & Blood Lab', nameNp: 'बायोकेमिस्ट्री तथा ब्लड ल्याब' },
        { code: 'LAB-BLOOD', nameEn: 'Blood Bank Unit', nameNp: 'ब्लड बैंक' },
      ],
    },
    {
      code: 'HYG',
      nameEn: 'Hygiene, Sanitation & Maintenance',
      nameNp: 'सरसफाइ तथा स्वच्छता विभाग',
      slaHours: 24,
      units: [
        { code: 'HYG-WARD', nameEn: 'Ward Housekeeping Unit', nameNp: 'वार्ड सरसफाइ टोली' },
        { code: 'HYG-WAS', nameEn: 'Washrooms & Common Area Sanitation', nameNp: 'शौचालय सरसफाइ' },
      ],
    },
    {
      code: 'ADM',
      nameEn: 'Hospital Administration',
      nameNp: 'अस्पताल प्रशासन',
      slaHours: 72,
      units: [
        { code: 'ADM-SEC', nameEn: 'Security & Parking Unit', nameNp: 'सुरक्षा तथा पार्किङ' },
        { code: 'ADM-FOOD', nameEn: 'Canteen & Dietary Unit', nameNp: 'कन्टीन तथा खाना' },
      ],
    },
  ];

  const createdDepts = {};
  const createdUnits = {};

  for (const deptData of departmentsData) {
    const { units, ...dInfo } = deptData;
    const d = await prisma.department.upsert({
      where: { code: dInfo.code },
      update: {},
      create: dInfo,
    });
    createdDepts[dInfo.code] = d;

    for (const uInfo of units) {
      const u = await prisma.unit.upsert({
        where: { code: uInfo.code },
        update: {},
        create: {
          ...uInfo,
          departmentId: d.id,
        },
      });
      createdUnits[uInfo.code] = u;
    }
    console.log(`Created department: ${d.nameEn} (${d.code}) with ${units.length} units`);
  }

  // 2. Create Users
  const passwordHash = await bcrypt.hash('Admin@123456', 10);
  const staffPasswordHash = await bcrypt.hash('Staff@123456', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hospital.gov.np' },
    update: {},
    create: {
      email: 'admin@hospital.gov.np',
      name: 'Dr. Ramesh Sharma (Grievance Chief)',
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  // 3. Create Sample Complaints
  const sampleComplaints = [
    {
      trackingId: 'GN-2026-8942',
      pin: '1234',
      isAnonymous: false,
      patientName: 'Ram Bahadur Shrestha',
      patientPhone: '9841234567',
      patientEmail: 'ram.shrestha@gmail.com',
      mrnNumber: 'MRN-88421',
      category: 'DELAY_IN_SERVICE',
      departmentId: createdDepts['EMG'].id,
      unitId: createdUnits['EMG-TRI'] ? createdUnits['EMG-TRI'].id : null,
      targetPersonName: 'Emergency Counter Staff',
      targetPersonRole: 'Receptionist',
      incidentDate: new Date('2026-10-05T10:30:00Z'),
      location: 'Emergency Triage Counter 2',
      subject: 'Excessive waiting time and delay in triage in Emergency',
      description: 'I arrived with my mother who had severe abdominal pain at 10:00 AM. We were kept waiting at Counter 2 for over 45 minutes without any triage assessment or doctor attention despite low patient rush.',
      priority: 'HIGH',
      status: 'ACTION_TAKEN',
      actionSummary: 'Duty nurse and triage staff have been counseled. Priority emergency triage protocol has been re-enforced at Counter 2.',
    },
    {
      trackingId: 'GN-2026-9015',
      pin: '5678',
      isAnonymous: true,
      category: 'HYGIENE',
      departmentId: createdDepts['HYG'].id,
      unitId: createdUnits['HYG-WAS'] ? createdUnits['HYG-WAS'].id : null,
      targetPersonName: 'Cleaning Duty Incharge',
      targetPersonRole: 'Sanitation Staff',
      incidentDate: new Date('2026-10-06T14:15:00Z'),
      location: '2nd Floor OPD Washroom',
      subject: 'Unclean washroom and lack of soap',
      description: 'The washroom on the 2nd floor OPD area was extremely dirty and lacked hand soap or running water in the sink during peak hours.',
      priority: 'MEDIUM',
      status: 'SUBMITTED',
    },
    {
      trackingId: 'GN-2026-9102',
      pin: '9988',
      isAnonymous: false,
      patientName: 'Sita Kumari Gurung',
      patientPhone: '9801122334',
      patientEmail: 'sita.gurung@yahoo.com',
      mrnNumber: 'MRN-77312',
      category: 'BILLING',
      departmentId: createdDepts['BIL'].id,
      unitId: createdUnits['BIL-OPD'] ? createdUnits['BIL-OPD'].id : null,
      targetPersonName: 'Counter Officer',
      targetPersonRole: 'Billing Cashier',
      incidentDate: new Date('2026-10-06T09:00:00Z'),
      location: 'Main Cash Billing Desk',
      subject: 'Duplicate billing charge for Blood Test',
      description: 'I was charged twice for Complete Blood Count (CBC) test in invoice #49210. Requesting refund or correction.',
      priority: 'HIGH',
      status: 'RESOLVED',
      actionSummary: 'Discrepancy verified. Duplicate amount of NPR 850 has been refunded to patient account on Oct 6.',
      resolvedAt: new Date('2026-10-06T16:00:00Z'),
    }
  ];

  for (const comp of sampleComplaints) {
    await prisma.complaint.upsert({
      where: { trackingId: comp.trackingId },
      update: {},
      create: comp,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
