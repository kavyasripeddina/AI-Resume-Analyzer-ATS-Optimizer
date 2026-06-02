const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument();
const outputPath = path.join(__dirname, 'test-resume.pdf');

doc.pipe(fs.createWriteStream(outputPath));

// Title
doc.fontSize(16).font('Helvetica-Bold').text('JOHN DOE', 50, 50);
doc.fontSize(11).font('Helvetica').text('Senior Software Engineer', 50, 75);

// Contact
doc.fontSize(10).text('Email: john.doe@example.com | Phone: (555) 123-4567 | Location: San Francisco, CA', 50, 95);

// Professional Summary
doc.fontSize(12).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY', 50, 130);
doc.fontSize(10).font('Helvetica').text('Experienced Full Stack Developer with 5+ years of expertise in building scalable web applications using JavaScript, React, and Node.js. Proven track record of developing high-performance systems and leading technical teams.', 50, 150, { width: 500 });

// Technical Skills
doc.fontSize(12).font('Helvetica-Bold').text('TECHNICAL SKILLS', 50, 210);
doc.fontSize(10).font('Helvetica');
doc.text('Languages: JavaScript, Python, TypeScript, SQL', 50, 230);
doc.text('Frontend: React, HTML5, CSS3, TailwindCSS, Framer Motion', 50, 245);
doc.text('Backend: Node.js, Express.js, REST APIs', 50, 260);
doc.text('Databases: MongoDB, PostgreSQL', 50, 275);
doc.text('Cloud: AWS, Vercel, Google Cloud', 50, 290);
doc.text('Tools: Git, Docker, Jenkins, GitHub Actions', 50, 305);

// Professional Experience
doc.fontSize(12).font('Helvetica-Bold').text('PROFESSIONAL EXPERIENCE', 50, 340);
doc.fontSize(10).font('Helvetica-Bold').text('Senior Developer', 50, 360);
doc.fontSize(9).font('Helvetica').text('Tech Company Inc. | Jan 2023 to Present', 50, 375);
doc.fontSize(10).font('Helvetica');
doc.text('Architected and deployed scalable microservices handling 1M daily requests', 50, 390);
doc.text('Led team of 5 developers in building ATS optimization platform', 50, 405);
doc.text('Improved application performance by 40% through optimization', 50, 420);
doc.text('Implemented CI/CD pipelines reducing deployment time by 60%', 50, 435);

doc.fontSize(10).font('Helvetica-Bold').text('Full Stack Developer', 50, 460);
doc.fontSize(9).font('Helvetica').text('Startup Solutions LLC | Jul 2020 to Dec 2022', 50, 475);
doc.fontSize(10).font('Helvetica');
doc.text('Developed and maintained 3 production React applications used by 10K+ users', 50, 490);
doc.text('Built RESTful APIs using Node.js and Express serving 5M+ requests daily', 50, 505);
doc.text('Designed and optimized MongoDB database schemas improving query performance', 50, 520);

// Education
doc.fontSize(12).font('Helvetica-Bold').text('EDUCATION', 50, 545);
doc.fontSize(10).font('Helvetica-Bold').text('Bachelor of Science in Computer Science', 50, 565);
doc.fontSize(9).font('Helvetica').text('State University | Graduated May 2019', 50, 580);

// Certifications
doc.fontSize(12).font('Helvetica-Bold').text('CERTIFICATIONS', 50, 605);
doc.fontSize(10).font('Helvetica');
doc.text('AWS Certified Solutions Architect', 50, 625);
doc.text('Google Cloud Associate Cloud Engineer', 50, 640);

doc.end();

console.log(`PDF created successfully at: ${outputPath}`);
