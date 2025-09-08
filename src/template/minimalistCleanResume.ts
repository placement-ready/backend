export const minimalistCleanResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Minimalist Clean Resume</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 36px; color: #232323;}
    .header { text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 6px; color: #1a6fd1;}
    .contact { text-align: center; font-size: 13px; margin-bottom: 10px; }
    .update { font-size: 12px; text-align: right; color: #1a6fd1; margin-bottom: 6px; }
    h2 { font-size: 16px; font-weight: bold; color: #1a6fd1; margin-top: 28px; border-bottom: 1px solid #1a6fd1;}
    .section { margin-bottom: 10px;}
    .job-title, .degree { font-weight: bold;}
    .job-details, .edu-details { font-size: 13px; color: #444;}
    a { color: #1a6fd1; text-decoration: underline;}
    ul { margin-left: 16px;}
  </style>
</head>
<body>
  <div class="update">Last updated in {{lastUpdated}}</div>
  <div class="header">{{fullName}}</div>
  <div class="contact">{{location}} | {{email}} | {{phone}} | {{website}}</div>
  <h2>Welcome to RenderCV!</h2>
  <div>{{summary}}</div>
  <h2>Quick Guide</h2>
  <ul>{{#each quickGuide}}<li>{{this}}</li>{{/each}}</ul>
  <h2>Education</h2>
  {{#each education}}
    <div class="section">
      <span class="degree">{{degree}}</span>, {{school}}<br>
      <span class="edu-details">GPA: {{gpa}}</span>
      <span class="edu-details">Coursework: {{coursework}}</span>
      <span class="edu-details">{{dates}}</span>
    </div>
  {{/each}}
  <h2>Experience</h2>
  {{#each experience}}
    <div class="section">
      <span class="job-title">{{company}}</span>, {{role}}<br>
      <span class="job-details">{{dates}} | {{location}}</span>
      <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
    </div>
  {{/each}}
  <h2>Publications</h2>
  <ul>{{#each publications}}<li>{{this}}</li>{{/each}}</ul>
</body>
</html>
`;
