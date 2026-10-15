
const video = document.getElementById('video');
let labeledFaceDescriptors;
const attendanceResult = [];
let expectedStudents = [];

const presentStudents = new Set();  // live detected students
const markedStudents = new Set();   // already marked in DB

const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get('classId');
const sessionId = urlParams.get('sessionId');

// Load models and start process
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/camera/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/camera/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/camera/models'),
])
  .then(loadLabeledImages)
  .then(startVideo)
  .catch(err => console.error('❌ Error loading models:', err));

// Load student faces
async function loadLabeledImages() {
  const labeledDescriptors = [];

  const response = await fetch(`http://localhost:5000/api/attendance/class/${classId}`);
  const { students } = await response.json();
  expectedStudents = students;

  for (const student of students) {
    const studentId = student.studentid;
    if (!studentId) continue;

    const imgUrl = `http://localhost:5000/uploads/${studentId}.jpg`;
    try {
      const img = await faceapi.fetchImage(imgUrl);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) continue;

      labeledDescriptors.push(
        new faceapi.LabeledFaceDescriptors(studentId, [detection.descriptor])
      );
    } catch (err) {
      console.error(`❌ Failed processing image for ${studentId}:`, err);
    }
  }

  labeledFaceDescriptors = labeledDescriptors;
}

// Start camera
function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => console.error('❌ Webcam error:', err));
}

// Main face recognition
video.addEventListener('play', async () => {
  if (!labeledFaceDescriptors || labeledFaceDescriptors.length === 0) return;

  const canvas = faceapi.createCanvasFromMedia(video);
  const wrapper = document.getElementById('video-wrapper');
  wrapper.appendChild(canvas);
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

  // Final absent checker after 30s
  setTimeout(async () => {
    const absentStudents = expectedStudents
      .map(s => s.studentid)
      .filter(id => !presentStudents.has(id));

    absentStudents.forEach(sid => {
      attendanceResult.push({ studentId: sid, status: "absent" });
    });

    const payload = {
      classId,
      sessionId,
      attendance: attendanceResult
    };

    await fetch('http://localhost:5000/api/attendance/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    alert("📋 Attendance session complete!");
  }, 30000);

  // Face detection loop
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (const detection of resizedDetections) {
      const result = faceMatcher.findBestMatch(detection.descriptor);
      const studentId = result.label;

      if (studentId !== 'unknown' && !markedStudents.has(studentId)) {
        markedStudents.add(studentId);
        presentStudents.add(studentId);
        attendanceResult.push({ studentId, status: "present" });

        // Save to DB
        try {
          const res = await fetch('http://localhost:5000/api/attendance/session/mark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              classId,
              studentId,
              status: "present"
            })
          });

          const data = await res.json();
          console.log("📤 Sent to DB:", data);
        } catch (err) {
          console.error("❌ Failed to send to DB:", err);
        }
      }
    }
  }, 1000);
});





// old code 

// const video = document.getElementById('video');
// let labeledFaceDescriptors;

// const urlParams = new URLSearchParams(window.location.search);
// const classId = urlParams.get('classId');

// Promise.all([
//   faceapi.nets.tinyFaceDetector.loadFromUri('/camera/models'),
//   faceapi.nets.faceLandmark68Net.loadFromUri('/camera/models'),
//   faceapi.nets.faceRecognitionNet.loadFromUri('/camera/models'),
// ])
// .then(loadLabeledImages)
// .then(startVideo)
// .catch(err => console.error('Error loading models:', err));

// async function loadLabeledImages() {
//   const labeledDescriptors = [];

// const response = await fetch(`http://localhost:5000/api/attendance/class/${classId}`);
// const { students } = await response.json();
// expectedStudents = students;

// const files = students.map(s => `${s}.jpg`);


//   for (const file of files) {
//     try {
//       const imgUrl = `http://localhost:5000/uploads/${file}`;
//       const img = await faceapi.fetchImage(imgUrl);
//       const detection = await faceapi
//         .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
//         .withFaceLandmarks()
//         .withFaceDescriptor();

//       if (!detection) {
//         console.warn(`⚠️ No face detected in ${file}, skipping...`);
//         continue; // Skip this bad image
//       }

//       const label = file.split('.')[0];
//       labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(label, [detection.descriptor]));

//     } catch (err) {
//       console.error(`❌ Error processing ${file}:`, err);
//       continue; // Skip any errors
//     }
//   }

//   if (labeledDescriptors.length === 0) {
//     console.warn('🚨 No valid faces found in uploads. Camera will open but no matching possible.');
//   }

//   labeledFaceDescriptors = labeledDescriptors;
// }

// let expectedStudents = [];     // fetched from backend
// const presentStudents = new Set(); // detected by camera


// function startVideo() {
//   navigator.mediaDevices.getUserMedia({ video: true })
//     .then(stream => {
//       console.log('Camera stream started ✅');
//       video.srcObject = stream;
//     })
//     .catch(err => console.error('Webcam error:', err));
// }

// video.addEventListener('play', async () => {
//   console.log('Video started playing 🎥');

//   if (!labeledFaceDescriptors || labeledFaceDescriptors.length === 0) {
//     console.warn('🚨 No valid faces loaded. Cannot start face matching.');
//     return; // Stop if no faces
//   }

//   const canvas = faceapi.createCanvasFromMedia(video);
//   document.body.append(canvas);

//   const displaySize = { width: video.width, height: video.height };
//   faceapi.matchDimensions(canvas, displaySize);

//   const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
//   const markedStudents = new Set();


//   setTimeout(async () => {
//   const absentStudents = expectedStudents.filter(sid => !presentStudents.has(sid));

//   for (const sid of absentStudents) {
//     console.log(`❌ ${sid} marked absent`);

//     await fetch('http://localhost:5000/api/attendance/mark', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         studentId: sid,
//         classId,
//         status: "absent"
//       })
//     });
//   }

//   alert("✅ Attendance session ended. Absent students recorded.");
// }, 30000); // 30 seconds


//   setInterval(async () => {
//     const detections = await faceapi
//       .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
//       .withFaceLandmarks()
//       .withFaceDescriptors();

//     const resizedDetections = faceapi.resizeResults(detections, displaySize);
//     const context = canvas.getContext('2d');
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     resizedDetections.forEach(async detection => {
//       const result = faceMatcher.findBestMatch(detection.descriptor);
//       const box = detection.detection.box;
//       const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
//       drawBox.draw(canvas);

//       const studentName = result.label;
//       if (!markedStudents.has(studentName) && studentName !== 'unknown') {
//         markedStudents.add(studentName);
//         console.log(`${studentName} marked present ✅`);

//         $.ajax({
//           url: 'http://localhost:5000/api/attendance/mark',
//           type: 'POST',
//           contentType: 'application/json',
//           data: JSON.stringify({
//             studentId: studentName,
//             classId: classId  // ✅ Send it here
//           }),
//           success: function (response) {
//             console.log('Attendance marked ✅', response);
//           },
//           error: function (xhr, status, error) {
//             console.error('Error sending attendance:', error);
//           }
//         });
        
//       }
//     });
//   }, 1000);
// });

