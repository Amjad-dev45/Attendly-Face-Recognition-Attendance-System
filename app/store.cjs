const { randomUUID } = require('node:crypto');
function seed() {
 const names = ['Emma Wilson','Liam Chen','Olivia Martin','Noah Williams','Amelia Hassan','Elijah Brown','Sophia Garcia','Lucas Dubois','Isabella Kim','James Patel','Mia Thompson','Benjamin Ali'];
 const students = names.map((name,i)=>({id:`ST${2401+i}`,name,email:name.toLowerCase().replace(' ','.')+'@demo.edu',department:i%3===0?'Information Systems':'Computer Science',descriptor:null}));
 const courses = [{id:'CS301',name:'Artificial Intelligence',teacher:'Dr. Sarah Mitchell',room:'Lab 204',schedule:'Mon & Thu · 09:00',color:'purple'},{id:'CS204',name:'Database Systems',teacher:'Dr. Daniel Brooks',room:'Room 108',schedule:'Tue & Fri · 11:00',color:'blue'},{id:'IS302',name:'Software Engineering',teacher:'Dr. Sarah Mitchell',room:'Lab 302',schedule:'Wed · 14:00',color:'orange'}].map(c=>({...c,students:students.map(s=>s.id)}));
 const sessions = Array.from({length:8},(_,i)=>({id:randomUUID(),courseId:courses[i%3].id,date:new Date(Date.now()-(8-i)*86400000).toISOString(),status:'completed',method:'demo',attendance:Object.fromEntries(students.map((s,j)=>[s.id,(j+i)%9===0?'absent':'present']))}));
 return {students,courses,sessions};
}
function mutate(db,action,p={}) {
 if(action==='student') {
  if(!p.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email||'')) throw Error('Enter a name and valid email.');
  if(db.students.some(s=>s.email.toLowerCase()===p.email.toLowerCase())) throw Error('This email is already registered.');
  const s={id:'ST'+randomUUID().slice(0,6).toUpperCase(),name:p.name.trim().slice(0,80),email:p.email.trim(),department:p.department||'Computer Science',descriptor:null}; db.students.push(s); return s;
 }
 if(action==='course') {
  if(!p.name?.trim()||!p.teacher?.trim()) throw Error('Course name and instructor are required.');
  const c={id:'CS'+randomUUID().slice(0,5).toUpperCase(),name:p.name.trim(),teacher:p.teacher.trim(),room:p.room||'Unassigned',schedule:p.schedule||'To be scheduled',color:'purple',students:db.students.map(s=>s.id)}; db.courses.push(c); return c;
 }
 if(action==='enroll') {
  const s=db.students.find(s=>s.id===p.studentId);
  if(!s||!Array.isArray(p.descriptor)||p.descriptor.length!==128||!p.descriptor.every(Number.isFinite)) throw Error('A valid face descriptor is required.');
  s.descriptor=p.descriptor; return {id:s.id};
 }
 if(action==='start') {
  const c=db.courses.find(c=>c.id===p.courseId); if(!c) throw Error('Course not found.');
  if(db.sessions.some(s=>s.courseId===c.id&&s.status==='live')) throw Error('This course already has a live session.');
  const s={id:randomUUID(),courseId:c.id,date:new Date().toISOString(),status:'live',method:p.method==='camera'?'camera':'demo',attendance:Object.fromEntries(c.students.map(id=>[id,'pending']))}; db.sessions.push(s); return s;
 }
 const s=db.sessions.find(s=>s.id===p.sessionId); if(!s) throw Error('Session not found.');
 if(s.status!=='live') throw Error('This session has ended.');
 if(action==='mark') {if(!Object.hasOwn(s.attendance,p.studentId)||!['present','absent'].includes(p.status)) throw Error('Invalid attendance entry.'); s.attendance[p.studentId]=p.status;return s;}
 if(action==='finish') {Object.keys(s.attendance).forEach(id=>{if(s.attendance[id]==='pending')s.attendance[id]='absent';});s.status='completed';return s;}
 throw Error('Unknown action.');
}
module.exports={seed,mutate};
