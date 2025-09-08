export const classicResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Classic Resume</title>
  <style>
    body { font-family: 'Times New Roman', serif; margin: 36px; color: #222; }
    .header { text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 6px;}
    .contact { text-align: center; font-size: 15px; margin-bottom: 4px;}
    h2 { font-size: 16px; font-weight: bold; margin-top: 28px; border-bottom: 1px solid #aaa; }
    .section { margin-bottom: 14px; }
    .job-title, .degree, .label { font-weight: bold; }
    .job-details, .edu-details { font-size: 13px; color: #444; margin-bottom: 2px; }
    ul { margin-left: 16px; }
  </style>
</head>
<body>
  <div class="header">{{fullName}}</div>
  <div class="contact">{{email}} | {{phone}}</div>
  <h2>Experience</h2>
  {{#each experience}}
  <div class="section">
    <span class="job-title">{{company}}</span> | <span>{{role}}</span>
    <div class="job-details">{{dates}} | {{location}}</div>
    <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
  </div>
  {{/each}}
  <h2>Projects</h2>
  {{#each projects}}
  <div class="section">
    <span class="job-title">{{title}}</span> – <span>{{role}}</span>
    <div class="job-details">{{dates}} | {{location}}</div>
    <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
  </div>
  {{/each}}
  <h2>Education</h2>
  <div class="section">
    <span class="degree">{{degree}}</span> – <span>{{school}}</span>
    <div class="edu-details">{{gradYear}} | GPA: {{gpa}}</div>
    <div class="edu-details">{{location}}</div>
  </div>
  <h2>Skills</h2>
  <span class="label">Programming</span>: {{skills.programming}}
  <br>
  <span class="label">Technology</span>: {{skills.technology}}
  <h2>Coursework</h2>
  <span class="label">Graduate</span>: {{coursework.graduate}}<br>
  <span class="label">Undergraduate</span>: {{coursework.undergraduate}}
  <h2>Societies</h2>
  <ul>{{#each societies}}<li>{{this}}</li>{{/each}}</ul>
  <h2>Links</h2>
  Github: {{links.github}}<br>
  LinkedIn: {{links.linkedin}}
</body>
</html>
`;
