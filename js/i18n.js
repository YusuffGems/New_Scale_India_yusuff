/* ============================================================
   js/i18n.js — English · हिन्दी · தமிழ்
   Add a language: add the code to CONFIG.languages, then add a
   matching block below. Missing keys fall back to English.
   ============================================================ */

const I18N = {
  en: {
    portal: 'Assessment Portal',
    tagline: 'Every assessment, verified at source.',
    blurb: 'GPS-locked evidence, candidate-wise verification and tamper-proof attendance for skill assessments under the Leather Sector Skill Council.',
    adminLogin: 'Admin / Super Admin',
    assessorLogin: 'Assessor',
    email: 'Email', password: 'Password', signIn: 'Sign in', signOut: 'Sign out',
    assessmentKey: 'Assessment key', enterKey: 'Enter the unique key given to you',
    openAssessment: 'Open assessment',
    language: 'Language',

    /* assessor flow */
    batchDetails: 'Batch details', batchId: 'Batch ID', batchType: 'Batch type',
    centre: 'Training centre', centreAddress: 'Centre address', partner: 'Training partner',
    jobRole: 'Job role', qpCode: 'QP code', qpName: 'Question paper', scheme: 'Scheme',
    assessor: 'Assessor', assessmentDate: 'Assessment date', totalCandidates: 'Total candidates',
    startAssessment: 'Start assessment',
    stepCentrePhoto: 'Centre photo', stepAssessorPhoto: 'Assessor photo',
    stepCandidates: 'Candidates', stepDocuments: 'Documents', stepSubmit: 'Submit',
    captureCentre: 'Photograph the training centre',
    captureCentreHelp: 'Camera only. Location and time are stamped onto the image.',
    captureAssessor: 'Take your photo at the centre',
    captureAssessorHelp: 'Your face must be visible. Gallery upload is disabled.',
    capturePhoto: 'Capture photo', retake: 'Retake', continue: 'Continue',
    back: 'Back', location: 'Location', capturedAt: 'Captured at', accuracy: 'Accuracy',
    captureLocation: 'Capture location', locating: 'Locating…', locationVerified: 'Location verified',
    locationRequired: 'Location is required before you can continue.',

    candidateList: 'Candidate list', clickCandidate: 'Tap a candidate to begin their assessment.',
    candidateId: 'Candidate ID', candidateName: 'Candidate name', mobile: 'Mobile',
    aadhaar: 'Aadhaar number', present: 'Present', absent: 'Absent',
    markAbsent: 'Mark absent', notStarted: 'Not started', completed: 'Completed',
    candidatePhoto: 'Candidate photo', idProof: 'ID proof',
    candidatePhotoHelp: 'Photograph the candidate at the workstation.',
    idProofHelp: 'Photograph the candidate ID or Aadhaar card.',
    candidatePassword: 'Candidate password', enterPassword: 'Ask the candidate to enter their password',
    wrongPassword: 'Password does not match this candidate.',
    theory: 'Theory', practical: 'Practical',
    startTheory: 'Start theory', startPractical: 'Start practical',
    theoryDone: 'Theory complete', practicalDone: 'Practical complete',
    question: 'Question', of: 'of', submitAnswers: 'Submit answers',
    practicalChecklist: 'Practical assessment', marksAwarded: 'Marks awarded',
    saveCandidate: 'Save candidate result', candidateSaved: 'Candidate result saved',
    allCandidatesDone: 'All candidates completed',
    pendingCandidates: 'candidates still pending',

    documentSubmission: 'Document submission',
    documentHelp: 'Attach evidence for the whole batch before final submission.',
    uploadPhotos: 'Upload photos', uploadVideos: 'Upload videos',
    uploadAttendance: 'Upload signed attendance sheet',
    attendanceSheet: 'Attendance sheet', downloadSheet: 'Download blank sheet',
    finalReview: 'Final review', submitLock: 'Submit and lock',
    lockWarning: 'Once submitted, this assessment locks permanently. Nothing can be edited afterwards.',
    confirmSubmit: 'Yes, submit and lock', notYet: 'Not yet',
    lockedTitle: 'Assessment locked', lockedBody: 'Submitted successfully. Nothing further is required from you.',
    done: 'Done', exit: 'Exit',

    /* admin */
    dashboard: 'Dashboard', todayAssessment: "Today's assessments", upcoming: 'Upcoming',
    completedA: 'Completed', postponed: 'Postponed', cancelled: 'Cancelled',
    batches: 'Batches', candidates: 'Candidates', assessors: 'Assessors',
    questionPapers: 'Question papers', questionBank: 'Question bank',
    documents: 'Batch documents', reports: 'Reports', settings: 'Settings', auditLogs: 'Audit logs',
    bulkUpload: 'Bulk upload', downloadTemplate: 'Download template',
    createBatch: 'Create batch', status: 'Status', actions: 'Actions', view: 'View',
    search: 'Search', filter: 'Filter', export: 'Export', print: 'Print',
    totalPresent: 'Total present candidates', totalAbsent: 'Total absent candidates',
    signature: 'Candidate signature', slNo: 'S. No',

    /* v2 additions */
    assessorId: 'Assessor ID', myAssessments: 'My assessments',
    upcomingTab: 'Upcoming', completedTab: 'Completed', calendarTab: 'Calendar',
    thisMonth: 'This month', totalDone: 'Total completed', assignedBatches: 'Assigned batches',
    openByKey: 'Open by assessment key', noUpcoming: 'No upcoming assessments',
    noCompleted: 'Nothing completed yet', openBatch: 'Open batch',
    add: 'Add', edit: 'Edit', remove: 'Delete', save: 'Save', cancel: 'Cancel',
    confirmDelete: 'Delete this record?', deleteWarning: 'This cannot be undone.',
    downloadMedia: 'Download photos & videos', preparingZip: 'Preparing download…',
    superAdminOnly: 'Super Admin only', submittedOn: 'Submitted on',

    /* v3 additions */
    batchSchedule: 'Batch schedule', reportingTime: 'Reporting time', session: 'Session',
    venue: 'Venue / hall', spocName: 'Centre SPOC', spocMobile: 'SPOC mobile',
    startTimeL: 'Start time', endTimeL: 'End time',
    fieldMapping: 'Field mapping', mapColumns: 'Map your columns',
    mappingHelp: 'Match each column in your file to a portal field. Anything left unmapped uses the default below.',
    fileColumn: 'Column in your file', portalField: 'Portal field', notMapped: 'Not mapped',
    defaultsForBatch: 'Defaults for new batches', required: 'Required',
    autoDetected: 'auto-detected', reviewImport: 'Review and import', backToMapping: 'Back to mapping'
  },

  hi: {
    portal: 'मूल्यांकन पोर्टल',
    tagline: 'हर मूल्यांकन, मौके पर प्रमाणित।',
    blurb: 'लेदर सेक्टर स्किल काउंसिल के कौशल मूल्यांकन के लिए जीपीएस-आधारित प्रमाण, अभ्यर्थीवार सत्यापन और सुरक्षित उपस्थिति।',
    adminLogin: 'एडमिन / सुपर एडमिन',
    assessorLogin: 'मूल्यांकनकर्ता',
    email: 'ईमेल', password: 'पासवर्ड', signIn: 'साइन इन', signOut: 'साइन आउट',
    assessmentKey: 'मूल्यांकन कुंजी', enterKey: 'आपको दी गई विशिष्ट कुंजी दर्ज करें',
    openAssessment: 'मूल्यांकन खोलें',
    language: 'भाषा',

    batchDetails: 'बैच विवरण', batchId: 'बैच आईडी', batchType: 'बैच प्रकार',
    centre: 'प्रशिक्षण केंद्र', centreAddress: 'केंद्र का पता', partner: 'प्रशिक्षण भागीदार',
    jobRole: 'जॉब रोल', qpCode: 'क्यूपी कोड', qpName: 'प्रश्न पत्र', scheme: 'योजना',
    assessor: 'मूल्यांकनकर्ता', assessmentDate: 'मूल्यांकन तिथि', totalCandidates: 'कुल अभ्यर्थी',
    startAssessment: 'मूल्यांकन शुरू करें',
    stepCentrePhoto: 'केंद्र फोटो', stepAssessorPhoto: 'मूल्यांकनकर्ता फोटो',
    stepCandidates: 'अभ्यर्थी', stepDocuments: 'दस्तावेज़', stepSubmit: 'जमा करें',
    captureCentre: 'प्रशिक्षण केंद्र की फोटो लें',
    captureCentreHelp: 'केवल कैमरा। फोटो पर स्थान और समय अंकित होगा।',
    captureAssessor: 'केंद्र पर अपनी फोटो लें',
    captureAssessorHelp: 'चेहरा स्पष्ट दिखना चाहिए। गैलरी से अपलोड बंद है।',
    capturePhoto: 'फोटो लें', retake: 'दोबारा लें', continue: 'आगे बढ़ें',
    back: 'पीछे', location: 'स्थान', capturedAt: 'समय', accuracy: 'सटीकता',
    captureLocation: 'स्थान लें', locating: 'स्थान खोजा जा रहा है…', locationVerified: 'स्थान सत्यापित',
    locationRequired: 'आगे बढ़ने से पहले स्थान आवश्यक है।',

    candidateList: 'अभ्यर्थी सूची', clickCandidate: 'मूल्यांकन शुरू करने के लिए अभ्यर्थी पर टैप करें।',
    candidateId: 'अभ्यर्थी आईडी', candidateName: 'अभ्यर्थी का नाम', mobile: 'मोबाइल',
    aadhaar: 'आधार संख्या', present: 'उपस्थित', absent: 'अनुपस्थित',
    markAbsent: 'अनुपस्थित करें', notStarted: 'शुरू नहीं हुआ', completed: 'पूर्ण',
    candidatePhoto: 'अभ्यर्थी की फोटो', idProof: 'पहचान प्रमाण',
    candidatePhotoHelp: 'कार्यस्थल पर अभ्यर्थी की फोटो लें।',
    idProofHelp: 'अभ्यर्थी का पहचान पत्र या आधार कार्ड फोटो करें।',
    candidatePassword: 'अभ्यर्थी पासवर्ड', enterPassword: 'अभ्यर्थी से पासवर्ड दर्ज करवाएँ',
    wrongPassword: 'पासवर्ड मेल नहीं खाता।',
    theory: 'सैद्धांतिक', practical: 'प्रायोगिक',
    startTheory: 'सैद्धांतिक शुरू करें', startPractical: 'प्रायोगिक शुरू करें',
    theoryDone: 'सैद्धांतिक पूर्ण', practicalDone: 'प्रायोगिक पूर्ण',
    question: 'प्रश्न', of: '/', submitAnswers: 'उत्तर जमा करें',
    practicalChecklist: 'प्रायोगिक मूल्यांकन', marksAwarded: 'दिए गए अंक',
    saveCandidate: 'अभ्यर्थी परिणाम सहेजें', candidateSaved: 'परिणाम सहेजा गया',
    allCandidatesDone: 'सभी अभ्यर्थी पूर्ण',
    pendingCandidates: 'अभ्यर्थी शेष हैं',

    documentSubmission: 'दस्तावेज़ जमा करना',
    documentHelp: 'अंतिम जमा करने से पहले पूरे बैच के प्रमाण संलग्न करें।',
    uploadPhotos: 'फोटो अपलोड करें', uploadVideos: 'वीडियो अपलोड करें',
    uploadAttendance: 'हस्ताक्षरित उपस्थिति पत्रक अपलोड करें',
    attendanceSheet: 'उपस्थिति पत्रक', downloadSheet: 'खाली पत्रक डाउनलोड करें',
    finalReview: 'अंतिम समीक्षा', submitLock: 'जमा करें और लॉक करें',
    lockWarning: 'जमा करने के बाद मूल्यांकन स्थायी रूप से लॉक हो जाएगा। कोई बदलाव संभव नहीं।',
    confirmSubmit: 'हाँ, जमा करें', notYet: 'अभी नहीं',
    lockedTitle: 'मूल्यांकन लॉक', lockedBody: 'सफलतापूर्वक जमा हो गया। अब आपसे कुछ अपेक्षित नहीं।',
    done: 'पूर्ण', exit: 'बाहर',

    dashboard: 'डैशबोर्ड', todayAssessment: 'आज के मूल्यांकन', upcoming: 'आगामी',
    completedA: 'पूर्ण', postponed: 'स्थगित', cancelled: 'रद्द',
    batches: 'बैच', candidates: 'अभ्यर्थी', assessors: 'मूल्यांकनकर्ता',
    questionPapers: 'प्रश्न पत्र', questionBank: 'प्रश्न बैंक',
    documents: 'बैच दस्तावेज़', reports: 'रिपोर्ट', settings: 'सेटिंग्स', auditLogs: 'ऑडिट लॉग',
    bulkUpload: 'बल्क अपलोड', downloadTemplate: 'टेम्पलेट डाउनलोड करें',
    createBatch: 'बैच बनाएँ', status: 'स्थिति', actions: 'कार्य', view: 'देखें',
    search: 'खोजें', filter: 'फ़िल्टर', export: 'निर्यात', print: 'प्रिंट',
    totalPresent: 'कुल उपस्थित अभ्यर्थी', totalAbsent: 'कुल अनुपस्थित अभ्यर्थी',
    signature: 'अभ्यर्थी हस्ताक्षर', slNo: 'क्र. सं.',

    /* v2 additions */
    assessorId: 'मूल्यांकनकर्ता आईडी', myAssessments: 'मेरे मूल्यांकन',
    upcomingTab: 'आगामी', completedTab: 'पूर्ण', calendarTab: 'कैलेंडर',
    thisMonth: 'इस माह', totalDone: 'कुल पूर्ण', assignedBatches: 'आवंटित बैच',
    openByKey: 'कुंजी से खोलें', noUpcoming: 'कोई आगामी मूल्यांकन नहीं',
    noCompleted: 'अभी कुछ पूर्ण नहीं', openBatch: 'बैच खोलें',
    add: 'जोड़ें', edit: 'संपादित करें', remove: 'हटाएँ', save: 'सहेजें', cancel: 'रद्द',
    confirmDelete: 'क्या यह रिकॉर्ड हटाना है?', deleteWarning: 'यह वापस नहीं होगा।',
    downloadMedia: 'फोटो व वीडियो डाउनलोड करें', preparingZip: 'डाउनलोड तैयार हो रहा है…',
    superAdminOnly: 'केवल सुपर एडमिन', submittedOn: 'जमा किया गया',

    /* v3 additions */
    batchSchedule: 'बैच अनुसूची', reportingTime: 'रिपोर्टिंग समय', session: 'सत्र',
    venue: 'स्थल / हॉल', spocName: 'केंद्र एसपीओसी', spocMobile: 'एसपीओसी मोबाइल',
    startTimeL: 'प्रारंभ समय', endTimeL: 'समाप्ति समय',
    fieldMapping: 'फ़ील्ड मैपिंग', mapColumns: 'अपने कॉलम मैप करें',
    mappingHelp: 'अपनी फ़ाइल के प्रत्येक कॉलम को पोर्टल फ़ील्ड से मिलाएँ। बिना मैप किए फ़ील्ड में नीचे दिया डिफ़ॉल्ट लगेगा।',
    fileColumn: 'आपकी फ़ाइल का कॉलम', portalField: 'पोर्टल फ़ील्ड', notMapped: 'मैप नहीं',
    defaultsForBatch: 'नए बैच के डिफ़ॉल्ट', required: 'आवश्यक',
    autoDetected: 'स्वतः पहचाना', reviewImport: 'समीक्षा कर आयात करें', backToMapping: 'मैपिंग पर लौटें'
  },

  ta: {
    portal: 'மதிப்பீட்டு போர்ட்டல்',
    tagline: 'ஒவ்வொரு மதிப்பீடும், இடத்திலேயே சரிபார்க்கப்படும்.',
    blurb: 'தோல் துறை திறன் கவுன்சிலின் திறன் மதிப்பீடுகளுக்கான GPS சான்று, நபர்வாரி சரிபார்ப்பு மற்றும் பாதுகாப்பான வருகைப் பதிவு.',
    adminLogin: 'நிர்வாகி / சூப்பர் அட்மின்',
    assessorLogin: 'மதிப்பீட்டாளர்',
    email: 'மின்னஞ்சல்', password: 'கடவுச்சொல்', signIn: 'உள்நுழை', signOut: 'வெளியேறு',
    assessmentKey: 'மதிப்பீட்டு சாவி', enterKey: 'உங்களுக்கு வழங்கப்பட்ட தனிச் சாவியை உள்ளிடவும்',
    openAssessment: 'மதிப்பீட்டைத் திற',
    language: 'மொழி',

    batchDetails: 'பேட்ச் விவரம்', batchId: 'பேட்ச் ஐடி', batchType: 'பேட்ச் வகை',
    centre: 'பயிற்சி மையம்', centreAddress: 'மைய முகவரி', partner: 'பயிற்சி கூட்டாளர்',
    jobRole: 'பணிப் பங்கு', qpCode: 'QP குறியீடு', qpName: 'வினாத்தாள்', scheme: 'திட்டம்',
    assessor: 'மதிப்பீட்டாளர்', assessmentDate: 'மதிப்பீட்டு தேதி', totalCandidates: 'மொத்த பயிலுநர்கள்',
    startAssessment: 'மதிப்பீட்டைத் தொடங்கு',
    stepCentrePhoto: 'மைய புகைப்படம்', stepAssessorPhoto: 'மதிப்பீட்டாளர் புகைப்படம்',
    stepCandidates: 'பயிலுநர்கள்', stepDocuments: 'ஆவணங்கள்', stepSubmit: 'சமர்ப்பி',
    captureCentre: 'பயிற்சி மையத்தைப் படமெடுக்கவும்',
    captureCentreHelp: 'கேமரா மட்டும். இடமும் நேரமும் படத்தில் பதிவாகும்.',
    captureAssessor: 'மையத்தில் உங்கள் புகைப்படம் எடுக்கவும்',
    captureAssessorHelp: 'முகம் தெளிவாகத் தெரிய வேண்டும். கேலரி பதிவேற்றம் முடக்கப்பட்டுள்ளது.',
    capturePhoto: 'படம் எடு', retake: 'மீண்டும் எடு', continue: 'தொடர்க',
    back: 'பின்', location: 'இருப்பிடம்', capturedAt: 'நேரம்', accuracy: 'துல்லியம்',
    captureLocation: 'இருப்பிடத்தைப் பதிவு செய்', locating: 'இருப்பிடம் தேடப்படுகிறது…',
    locationVerified: 'இருப்பிடம் சரிபார்க்கப்பட்டது',
    locationRequired: 'தொடர்வதற்கு முன் இருப்பிடம் அவசியம்.',

    candidateList: 'பயிலுநர் பட்டியல்', clickCandidate: 'மதிப்பீட்டைத் தொடங்க பயிலுநரைத் தட்டவும்.',
    candidateId: 'பயிலுநர் ஐடி', candidateName: 'பயிலுநர் பெயர்', mobile: 'கைபேசி',
    aadhaar: 'ஆதார் எண்', present: 'வருகை', absent: 'வரவில்லை',
    markAbsent: 'வரவில்லை எனக் குறி', notStarted: 'தொடங்கவில்லை', completed: 'முடிந்தது',
    candidatePhoto: 'பயிலுநர் புகைப்படம்', idProof: 'அடையாளச் சான்று',
    candidatePhotoHelp: 'பணியிடத்தில் பயிலுநரைப் படமெடுக்கவும்.',
    idProofHelp: 'பயிலுநரின் அடையாள அட்டையைப் படமெடுக்கவும்.',
    candidatePassword: 'பயிலுநர் கடவுச்சொல்', enterPassword: 'பயிலுநரைக் கடவுச்சொல் உள்ளிடச் சொல்லவும்',
    wrongPassword: 'கடவுச்சொல் பொருந்தவில்லை.',
    theory: 'கோட்பாடு', practical: 'செய்முறை',
    startTheory: 'கோட்பாட்டைத் தொடங்கு', startPractical: 'செய்முறையைத் தொடங்கு',
    theoryDone: 'கோட்பாடு முடிந்தது', practicalDone: 'செய்முறை முடிந்தது',
    question: 'வினா', of: '/', submitAnswers: 'விடைகளைச் சமர்ப்பி',
    practicalChecklist: 'செய்முறை மதிப்பீடு', marksAwarded: 'வழங்கிய மதிப்பெண்',
    saveCandidate: 'முடிவைச் சேமி', candidateSaved: 'முடிவு சேமிக்கப்பட்டது',
    allCandidatesDone: 'அனைத்து பயிலுநர்களும் முடிந்தனர்',
    pendingCandidates: 'பயிலுநர்கள் மீதம்',

    documentSubmission: 'ஆவணச் சமர்ப்பிப்பு',
    documentHelp: 'இறுதிச் சமர்ப்பிப்புக்கு முன் பேட்ச் சான்றுகளை இணைக்கவும்.',
    uploadPhotos: 'புகைப்படங்களைப் பதிவேற்று', uploadVideos: 'வீடியோ பதிவேற்று',
    uploadAttendance: 'கையொப்பமிட்ட வருகைப் பட்டியலைப் பதிவேற்று',
    attendanceSheet: 'வருகைப் பட்டியல்', downloadSheet: 'காலி பட்டியலைப் பதிவிறக்கு',
    finalReview: 'இறுதி சரிபார்ப்பு', submitLock: 'சமர்ப்பித்து பூட்டு',
    lockWarning: 'சமர்ப்பித்த பின் மதிப்பீடு நிரந்தரமாகப் பூட்டப்படும். திருத்த முடியாது.',
    confirmSubmit: 'ஆம், சமர்ப்பி', notYet: 'இப்போது வேண்டாம்',
    lockedTitle: 'மதிப்பீடு பூட்டப்பட்டது', lockedBody: 'வெற்றிகரமாகச் சமர்ப்பிக்கப்பட்டது.',
    done: 'முடிந்தது', exit: 'வெளியேறு',

    dashboard: 'டாஷ்போர்டு', todayAssessment: 'இன்றைய மதிப்பீடுகள்', upcoming: 'வரவிருக்கும்',
    completedA: 'முடிந்தவை', postponed: 'ஒத்திவைக்கப்பட்டவை', cancelled: 'ரத்து',
    batches: 'பேட்ச்கள்', candidates: 'பயிலுநர்கள்', assessors: 'மதிப்பீட்டாளர்கள்',
    questionPapers: 'வினாத்தாள்கள்', questionBank: 'வினா வங்கி',
    documents: 'பேட்ச் ஆவணங்கள்', reports: 'அறிக்கைகள்', settings: 'அமைப்புகள்', auditLogs: 'தணிக்கை பதிவு',
    bulkUpload: 'மொத்தப் பதிவேற்றம்', downloadTemplate: 'டெம்ப்ளேட் பதிவிறக்கு',
    createBatch: 'பேட்ச் உருவாக்கு', status: 'நிலை', actions: 'செயல்கள்', view: 'பார்',
    search: 'தேடு', filter: 'வடிகட்டு', export: 'ஏற்றுமதி', print: 'அச்சிடு',
    totalPresent: 'மொத்த வருகை', totalAbsent: 'மொத்த வராதவர்',
    signature: 'பயிலுநர் கையொப்பம்', slNo: 'வ. எண்',

    /* v2 additions */
    assessorId: 'மதிப்பீட்டாளர் ஐடி', myAssessments: 'என் மதிப்பீடுகள்',
    upcomingTab: 'வரவிருக்கும்', completedTab: 'முடிந்தவை', calendarTab: 'நாள்காட்டி',
    thisMonth: 'இந்த மாதம்', totalDone: 'மொத்தம் முடிந்தவை', assignedBatches: 'ஒதுக்கப்பட்ட பேட்ச்கள்',
    openByKey: 'சாவி மூலம் திற', noUpcoming: 'வரவிருக்கும் மதிப்பீடு இல்லை',
    noCompleted: 'இதுவரை முடிந்தவை இல்லை', openBatch: 'பேட்சைத் திற',
    add: 'சேர்', edit: 'திருத்து', remove: 'நீக்கு', save: 'சேமி', cancel: 'ரத்து',
    confirmDelete: 'இந்தப் பதிவை நீக்கவா?', deleteWarning: 'இதை மீட்க முடியாது.',
    downloadMedia: 'படங்கள் & வீடியோ பதிவிறக்கு', preparingZip: 'பதிவிறக்கம் தயாராகிறது…',
    superAdminOnly: 'சூப்பர் அட்மின் மட்டும்', submittedOn: 'சமர்ப்பித்த நாள்',

    /* v3 additions */
    batchSchedule: 'பேட்ச் அட்டவணை', reportingTime: 'அறிக்கை நேரம்', session: 'அமர்வு',
    venue: 'இடம் / அரங்கு', spocName: 'மைய தொடர்பாளர்', spocMobile: 'தொடர்பாளர் கைபேசி',
    startTimeL: 'தொடக்க நேரம்', endTimeL: 'முடிவு நேரம்',
    fieldMapping: 'புலம் இணைப்பு', mapColumns: 'உங்கள் நெடுவரிசைகளை இணைக்கவும்',
    mappingHelp: 'உங்கள் கோப்பின் ஒவ்வொரு நெடுவரிசையையும் போர்ட்டல் புலத்துடன் பொருத்தவும். இணைக்கப்படாதவை கீழுள்ள இயல்பு மதிப்பைப் பயன்படுத்தும்.',
    fileColumn: 'கோப்பு நெடுவரிசை', portalField: 'போர்ட்டல் புலம்', notMapped: 'இணைக்கப்படவில்லை',
    defaultsForBatch: 'புதிய பேட்சுக்கான இயல்புகள்', required: 'அவசியம்',
    autoDetected: 'தானாகக் கண்டறியப்பட்டது', reviewImport: 'சரிபார்த்து இறக்குமதி', backToMapping: 'இணைப்புக்குத் திரும்பு'
  }
};

let LANG = localStorage.getItem('lssc_lang') || CONFIG.defaultLanguage;

function t(key) {
  return (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key;
}

function setLang(code) {
  LANG = code;
  localStorage.setItem('lssc_lang', code);
  document.documentElement.lang = code;
  if (typeof rerender === 'function') rerender();
}

function langSwitch(dark) {
  return `<div class="lang ${dark ? 'dark' : ''}">${CONFIG.languages
    .map(l => `<button class="${l.code === LANG ? 'on' : ''}" onclick="setLang('${l.code}')">${l.label}</button>`)
    .join('')}</div>`;
}
