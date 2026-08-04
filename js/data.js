/* ============================================================
   js/data.js — seed data
   Replace SEED with an API response when you move to Supabase.
   ============================================================ */

const SEED = {

  /* ---------------- assessors ---------------- */
  assessors: [
    { id: 'AS-1187', name: 'K. Rajkumar', mobile: '9840112233', email: 'rajkumar@leatherssc.org', password: 'Assessor@123', roles: 'LSS/N4106, LSS/N4103', state: 'Madhya Pradesh', status: 'Active', done: 42 },
    { id: 'AS-1204', name: 'M. Suganya', mobile: '9840445566', email: 'suganya@leatherssc.org', password: 'Assessor@123', roles: 'LSS/N4106', state: 'Tamil Nadu', status: 'Active', done: 27 },
    { id: 'AS-1310', name: 'P. Nandkishore', mobile: '9838778899', email: 'nand@leatherssc.org', password: 'Assessor@123', roles: 'LSS/N4106, LSS/N9001', state: 'Uttar Pradesh', status: 'Active', done: 61 }
  ],

  /* ---------------- question papers ---------------- */
  questionPapers: [
    {
      id: 'QP1', qpCode: 'LSS/N4106', qpName: 'Shoesmiths (Cobbler) (LSS/N4106) Day 0',
      jobRole: 'Shoesmith (Cobbler)', nsqf: 3, version: '1.0',
      theoryMarks: 30, practicalMarks: 70, passPercent: 50,
      theoryQuestions: 10, practicalCriteria: 6, active: true
    },
    {
      id: 'QP2', qpCode: 'LSS/N4103', qpName: 'Shoe Upper Stitcher (LSS/N4103)',
      jobRole: 'Shoe Upper Stitcher', nsqf: 4, version: '2.0',
      theoryMarks: 30, practicalMarks: 70, passPercent: 50,
      theoryQuestions: 10, practicalCriteria: 6, active: true
    },
    {
      id: 'QP3', qpCode: 'LSS/N9001', qpName: 'Leather Goods Craft Operator (LSS/N9001)',
      jobRole: 'Leather Goods Craft Operator', nsqf: 3, version: '1.0',
      theoryMarks: 25, practicalMarks: 75, passPercent: 50,
      theoryQuestions: 10, practicalCriteria: 6, active: false
    }
  ],

  /* ---------------- batches ---------------- */
  batches: [
    {
      batchId: '3882781-2',
      assessmentKey: 'LSSC-3882781-2',
      batchType: 'Fresh Skilling',
      qpCode: 'LSS/N4106',
      qpName: 'Shoesmiths (Cobbler) (LSS/N4106) Day 0',
      jobRole: 'Shoesmith (Cobbler)',
      scheme: 'PMKVY 4.0',
      partner: 'Satna Leather Skill Centre',
      centreName: 'GIID Skill Centre — Satna',
      centreAddress: 'Ward 12, Civil Lines, Satna, Madhya Pradesh 485001',
      district: 'Satna', state: 'Madhya Pradesh',
      assessorId: 'AS-1187',
      assessmentDate: new Date().toISOString().slice(0, 10),
      startTime: '09:30', endTime: '16:30',
      reportingTime: '08:30', session: 'Full Day', venue: 'Assessment Hall 1',
      spocName: '', spocMobile: '',
      status: 'SCHEDULED',
      /* filled by the assessor portal */
      centrePhoto: null, assessorPhoto: null, gps: null,
      evidence: [], attendanceSheetFile: null,
      isLocked: false, submittedAt: null
    },
    {
      batchId: '3882781-3',
      assessmentKey: 'LSSC-3882781-3',
      batchType: 'Fresh Skilling',
      qpCode: 'LSS/N4103',
      qpName: 'Shoe Upper Stitcher (LSS/N4103)',
      jobRole: 'Shoe Upper Stitcher',
      scheme: 'PMKVY 4.0',
      partner: 'Satna Leather Skill Centre',
      centreName: 'GIID Skill Centre — Satna',
      centreAddress: 'Ward 12, Civil Lines, Satna, Madhya Pradesh 485001',
      district: 'Satna', state: 'Madhya Pradesh',
      assessorId: 'AS-1187',
      assessmentDate: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10),
      startTime: '09:30', endTime: '16:30',
      reportingTime: '08:30', session: 'Full Day', venue: 'Assessment Hall 1',
      spocName: '', spocMobile: '',
      status: 'SCHEDULED',
      centrePhoto: null, assessorPhoto: null, gps: null,
      evidence: [], attendanceSheetFile: null, isLocked: false, submittedAt: null
    },
    {
      batchId: '3871204-1',
      assessmentKey: 'LSSC-3871204-1',
      batchType: 'RPL',
      qpCode: 'LSS/N4106',
      qpName: 'Shoesmiths (Cobbler) (LSS/N4106) Day 0',
      jobRole: 'Shoesmith (Cobbler)',
      scheme: 'PMKVY 4.0',
      partner: 'Rewa Footwear Institute',
      centreName: 'Rewa Footwear Institute — Unit 1',
      centreAddress: 'Industrial Area, Rewa, Madhya Pradesh 486001',
      district: 'Rewa', state: 'Madhya Pradesh',
      assessorId: 'AS-1310',
      assessmentDate: new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10),
      startTime: '09:00', endTime: '16:00',
      reportingTime: '08:00', session: 'Full Day', venue: 'Assessment Hall 1',
      spocName: '', spocMobile: '',
      status: 'COMPLETED',
      centrePhoto: null, assessorPhoto: null,
      gps: { lat: 24.5373, lng: 81.3042, acc: 11 },
      evidence: [], attendanceSheetFile: null, isLocked: true,
      submittedAt: new Date(Date.now() - 6 * 864e5).toISOString()
    },
    {
      batchId: '3854402-1',
      assessmentKey: 'LSSC-3854402-1',
      batchType: 'Up-skilling',
      qpCode: 'LSS/N4106',
      qpName: 'Shoesmiths (Cobbler) (LSS/N4106) Day 0',
      jobRole: 'Shoesmith (Cobbler)',
      scheme: 'PMKVY 4.0',
      partner: 'Satna Leather Skill Centre',
      centreName: 'GIID Skill Centre — Satna',
      centreAddress: 'Ward 12, Civil Lines, Satna, Madhya Pradesh 485001',
      district: 'Satna', state: 'Madhya Pradesh',
      assessorId: 'AS-1187',
      assessmentDate: new Date(Date.now() - 12 * 864e5).toISOString().slice(0, 10),
      startTime: '09:30', endTime: '16:30',
      reportingTime: '08:30', session: 'Full Day', venue: 'Assessment Hall 1',
      spocName: '', spocMobile: '',
      status: 'COMPLETED',
      centrePhoto: null, assessorPhoto: null,
      gps: { lat: 24.5854, lng: 80.8322, acc: 14 },
      evidence: [], attendanceSheetFile: null, isLocked: true,
      submittedAt: new Date(Date.now() - 12 * 864e5).toISOString()
    },
    {
      batchId: '3869915-4',
      assessmentKey: 'LSSC-3869915-4',
      batchType: 'Fresh Skilling',
      qpCode: 'LSS/N9001',
      qpName: 'Leather Goods Craft Operator (LSS/N9001)',
      jobRole: 'Leather Goods Craft Operator',
      scheme: 'SCALE INDIA',
      partner: 'GIID Vocational Centre',
      centreName: 'GIID Tambaram Sanatorium',
      centreAddress: 'GIID Campus, Tambaram Sanatorium, Chennai 600047',
      district: 'Chengalpattu', state: 'Tamil Nadu',
      assessorId: 'AS-1204',
      assessmentDate: new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10),
      startTime: '10:00', endTime: '15:00',
      reportingTime: '09:00', session: 'Full Day', venue: 'Assessment Hall 1',
      spocName: '', spocMobile: '',
      status: 'POSTPONED',
      centrePhoto: null, assessorPhoto: null, gps: null,
      evidence: [], attendanceSheetFile: null, isLocked: false, submittedAt: null
    }
  ],

  /* ---------------- candidates ----------------
     Fields match the bulk-upload template exactly. */
  candidates: [
    ['CAN_039025748', 'Rajesh Kumar Saket', '7879199189'],
    ['CAN_039025618', 'Ramcharitr Banshal', '9301182407'],
    ['CAN_033193439', 'Rajesh Banshal', '9301002510'],
    ['CAN_033116874', 'Vaijnath Saket', '9752971585'],
    ['CAN_032829105', 'Dharmdas', '9630043237'],
    ['CAN_032827002', 'Tejbhan Saket', '7489860260'],
    ['CAN_028809641', 'Saukhilal Saket', '9993171726'],
    ['CAN_028807239', 'Anande Saket', '8839697898'],
    ['CAN_028443353', 'Ramkrishan Saket', '7898235923'],
    ['CAN_028364185', 'Ram Kishor Saket', '7879778266'],
    ['CAN_028364086', 'Brij Kumar Saket', '7879676016'],
    ['CAN_028333912', 'Rohit Kumar Saket', '7247353589']
  ].map(([id, name, mobile], i) => ({
    sno: i + 1,
    candidateId: id,
    name,
    mobile,
    aadhaarLast4: '',                       // only last 4 digits are ever stored
    password: '1234',
    batchId: '3882781-2',
    batchType: 'Fresh Skilling',
    qpCode: 'LSS/N4106',
    qpName: 'Shoesmiths (Cobbler) (LSS/N4106) Day 0',
    centreName: 'GIID Skill Centre — Satna',
    centreAddress: 'Ward 12, Civil Lines, Satna, Madhya Pradesh 485001',
    gender: 'Male',
    /* assessor-filled */
    attendance: null,                       // PRESENT | ABSENT
    photo: null, idProof: null, gps: null,
    theoryAnswers: null, theoryScore: null,
    practicalScores: null, practicalScore: null,
    result: null, completedAt: null
  }))
};

/* ============================================================
   QUESTION BANK — LSS/N4106 Shoesmith (Cobbler)
   Each question carries text in every supported language.
   ============================================================ */

const QUESTION_BANK = {
  'LSS/N4106': {
    theory: [
      {
        q: { en: 'Which tool is used to cut leather to a marked pattern?',
             hi: 'चिह्नित पैटर्न के अनुसार चमड़ा काटने के लिए कौन सा औज़ार प्रयोग होता है?',
             ta: 'குறிக்கப்பட்ட வடிவத்தில் தோலை வெட்ட எந்தக் கருவி பயன்படுகிறது?' },
        o: { en: ['Skiving knife', 'Clicking knife', 'Lasting pincer', 'Awl'],
             hi: ['स्काइविंग चाकू', 'क्लिकिंग चाकू', 'लास्टिंग पिंसर', 'सुआ'],
             ta: ['ஸ்கைவிங் கத்தி', 'கிளிக்கிங் கத்தி', 'லாஸ்டிங் பின்சர்', 'ஊசி'] },
        a: 1
      },
      {
        q: { en: 'What is the purpose of skiving the leather edge?',
             hi: 'चमड़े के किनारे की स्काइविंग का उद्देश्य क्या है?',
             ta: 'தோலின் விளிம்பை ஸ்கைவ் செய்வதன் நோக்கம் என்ன?' },
        o: { en: ['To thin the edge before folding', 'To colour the edge', 'To harden the leather', 'To waterproof the leather'],
             hi: ['मोड़ने से पहले किनारा पतला करना', 'किनारे को रंगना', 'चमड़े को कठोर करना', 'चमड़े को जलरोधक बनाना'],
             ta: ['மடிப்பதற்கு முன் விளிம்பை மெலிதாக்க', 'விளிம்புக்கு நிறம் தர', 'தோலை கடினமாக்க', 'நீர்ப்புகா ஆக்க'] },
        a: 0
      },
      {
        q: { en: 'A shoe last is used to —',
             hi: 'शू लास्ट का प्रयोग किसके लिए होता है —',
             ta: 'ஷூ லாஸ்ட் எதற்குப் பயன்படுகிறது —' },
        o: { en: ['Shape the shoe during making', 'Polish the finished shoe', 'Measure the sole thickness', 'Store the shoe'],
             hi: ['जूता बनाते समय आकार देना', 'तैयार जूते को पॉलिश करना', 'सोल की मोटाई नापना', 'जूता रखना'],
             ta: ['தயாரிக்கும்போது வடிவம் தர', 'முடிந்த ஷூவை பாலிஷ் செய்ய', 'சோலின் தடிமன் அளக்க', 'ஷூவை சேமிக்க'] },
        a: 0
      },
      {
        q: { en: 'Which adhesive is commonly used for sole attaching in repair work?',
             hi: 'मरम्मत कार्य में सोल जोड़ने के लिए सामान्यतः कौन सा चिपकाने वाला प्रयोग होता है?',
             ta: 'பழுதுபார்ப்பில் சோல் ஒட்ட பொதுவாகப் பயன்படும் பசை எது?' },
        o: { en: ['Wood glue', 'Neoprene / rubber solution', 'Wallpaper paste', 'Egg white'],
             hi: ['लकड़ी का गोंद', 'नियोप्रीन / रबर सॉल्यूशन', 'वॉलपेपर पेस्ट', 'अंडे की सफेदी'],
             ta: ['மர பசை', 'நியோபிரீன் / ரப்பர் கரைசல்', 'வால்பேப்பர் பேஸ்ட்', 'முட்டை வெள்ளை'] },
        a: 1
      },
      {
        q: { en: 'Before applying adhesive, the bonding surface must be —',
             hi: 'चिपकाने से पहले जोड़ की सतह होनी चाहिए —',
             ta: 'பசை பூசும் முன் ஒட்டும் பரப்பு எப்படி இருக்க வேண்டும் —' },
        o: { en: ['Oiled', 'Roughened and dust free', 'Wet', 'Painted'],
             hi: ['तेल लगी', 'खुरदरी और धूल रहित', 'गीली', 'रंगी हुई'],
             ta: ['எண்ணெய் பூசப்பட்டது', 'சொரசொரப்பாகவும் தூசியின்றியும்', 'ஈரமாக', 'வர்ணம் பூசப்பட்டது'] },
        a: 1
      },
      {
        q: { en: 'Which safety item must a cobbler use while operating a finishing machine?',
             hi: 'फिनिशिंग मशीन चलाते समय मोची को कौन सी सुरक्षा वस्तु प्रयोग करनी चाहिए?',
             ta: 'ஃபினிஷிங் இயந்திரம் இயக்கும்போது எந்தப் பாதுகாப்புச் சாதனம் அவசியம்?' },
        o: { en: ['Safety goggles and dust mask', 'Woollen gloves only', 'Sandals', 'No protection needed'],
             hi: ['सुरक्षा चश्मा और डस्ट मास्क', 'केवल ऊनी दस्ताने', 'चप्पल', 'कोई सुरक्षा नहीं'],
             ta: ['பாதுகாப்பு கண்ணாடி மற்றும் தூசி முகக்கவசம்', 'கம்பளி கையுறை மட்டும்', 'செருப்பு', 'எதுவும் தேவையில்லை'] },
        a: 0
      },
      {
        q: { en: 'Welted construction refers to —',
             hi: 'वेल्टेड कंस्ट्रक्शन का अर्थ है —',
             ta: 'வெல்டட் கட்டமைப்பு என்பது —' },
        o: { en: ['A strip stitched between upper and sole', 'A glued-only sole', 'A moulded plastic sole', 'A woven upper'],
             hi: ['अपर और सोल के बीच सिली पट्टी', 'केवल चिपकाया सोल', 'ढला हुआ प्लास्टिक सोल', 'बुना हुआ अपर'],
             ta: ['மேற்பகுதிக்கும் சோலுக்கும் இடையே தைக்கப்பட்ட பட்டை', 'பசை மட்டும் சோல்', 'வார்க்கப்பட்ட பிளாஸ்டிக் சோல்', 'நெய்யப்பட்ட மேற்பகுதி'] },
        a: 0
      },
      {
        q: { en: 'What causes a stitch to skip on a hand-stitched shoe?',
             hi: 'हाथ से सिले जूते में टाँका छूटने का कारण क्या है?',
             ta: 'கையால் தைக்கப்பட்ட ஷூவில் தையல் தவறுவதற்கான காரணம்?' },
        o: { en: ['Blunt awl or wrong needle spacing', 'Too much polish', 'Cold weather', 'New laces'],
             hi: ['भोथरा सुआ या गलत सूई अंतराल', 'अधिक पॉलिश', 'ठंडा मौसम', 'नए फीते'],
             ta: ['மழுங்கிய ஊசி அல்லது தவறான இடைவெளி', 'அதிக பாலிஷ்', 'குளிர் காலநிலை', 'புதிய லேஸ்'] },
        a: 0
      },
      {
        q: { en: 'Leather waste at the workstation should be —',
             hi: 'कार्यस्थल पर चमड़े का कचरा होना चाहिए —',
             ta: 'பணியிடத்தில் தோல் கழிவு எப்படிக் கையாளப்பட வேண்டும் —' },
        o: { en: ['Segregated and disposed as per centre rules', 'Burnt in the workshop', 'Left on the floor', 'Mixed with food waste'],
             hi: ['नियमानुसार अलग करके निपटाया जाए', 'कार्यशाला में जलाया जाए', 'फर्श पर छोड़ा जाए', 'भोजन कचरे में मिलाया जाए'],
             ta: ['விதிகளின்படி பிரித்து அகற்றப்பட வேண்டும்', 'பட்டறையில் எரிக்க வேண்டும்', 'தரையில் விட வேண்டும்', 'உணவுக் கழிவுடன் கலக்க வேண்டும்'] },
        a: 0
      },
      {
        q: { en: 'The correct order of shoe repair is —',
             hi: 'जूता मरम्मत का सही क्रम है —',
             ta: 'ஷூ பழுதுபார்ப்பின் சரியான வரிசை —' },
        o: { en: ['Inspect → clean → repair → finish → check', 'Finish → inspect → repair → clean', 'Repair → inspect → clean → finish', 'Clean → finish → inspect → repair'],
             hi: ['जाँच → सफाई → मरम्मत → फिनिश → पुनः जाँच', 'फिनिश → जाँच → मरम्मत → सफाई', 'मरम्मत → जाँच → सफाई → फिनिश', 'सफाई → फिनिश → जाँच → मरम्मत'],
             ta: ['சோதனை → சுத்தம் → பழுது → முடித்தல் → சரிபார்ப்பு', 'முடித்தல் → சோதனை → பழுது → சுத்தம்', 'பழுது → சோதனை → சுத்தம் → முடித்தல்', 'சுத்தம் → முடித்தல் → சோதனை → பழுது'] },
        a: 0
      }
    ],

    practical: [
      { max: 15, c: { en: 'Selects correct tools and materials for the job',
                      hi: 'कार्य हेतु सही औज़ार व सामग्री का चयन',
                      ta: 'சரியான கருவிகள் மற்றும் பொருட்களைத் தேர்வு' } },
      { max: 15, c: { en: 'Cuts and skives leather accurately to pattern',
                      hi: 'पैटर्न के अनुसार चमड़ा सही काटना व स्काइव करना',
                      ta: 'வடிவத்திற்கேற்ப தோலை துல்லியமாக வெட்டி ஸ்கைவ் செய்தல்' } },
      { max: 15, c: { en: 'Stitching or sole attaching quality and finish',
                      hi: 'सिलाई या सोल जोड़ने की गुणवत्ता एवं फिनिश',
                      ta: 'தையல் அல்லது சோல் ஒட்டும் தரம் மற்றும் முடிவு' } },
      { max: 10, c: { en: 'Uses machinery safely with correct PPE',
                      hi: 'सही सुरक्षा उपकरण के साथ मशीन का सुरक्षित प्रयोग',
                      ta: 'சரியான பாதுகாப்பு உபகரணத்துடன் இயந்திரப் பயன்பாடு' } },
      { max: 10, c: { en: 'Maintains a clean and organised workstation',
                      hi: 'कार्यस्थल स्वच्छ एवं व्यवस्थित रखना',
                      ta: 'பணியிடத்தை சுத்தமாகவும் ஒழுங்காகவும் வைத்தல்' } },
      { max: 5,  c: { en: 'Completes the job within the given time',
                      hi: 'निर्धारित समय में कार्य पूर्ण करना',
                      ta: 'கொடுக்கப்பட்ட நேரத்தில் பணியை முடித்தல்' } }
    ]
  }
};

/* Any QP code without its own bank falls back to LSS/N4106 */
function bankFor(qpCode) {
  return QUESTION_BANK[qpCode] || QUESTION_BANK['LSS/N4106'];
}
