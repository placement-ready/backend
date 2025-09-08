export const minimalistResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Minimalist Resume</title>
  <style>
    body { font-family: 'Times New Roman', serif; margin: 32px; color: #222;}
    .header { text-align: center; font-size: 30px; font-weight: bold; margin-bottom: 6px;}
    .contact { text-align: center; font-size: 14px; margin-bottom: 4px;}
    .profiles { text-align: center; font-size: 12px; margin-bottom: 6px;}
    h2 { font-size: 15px; font-weight: bold; border-bottom: 1px solid #bbb; margin-top: 24px;}
    .section { margin-bottom: 8px;}
    .job-title, .degree { font-weight: bold;}
    .job-details, .edu-details { font-size: 13px; color: #444;}
    ul { margin-left: 16px; }
  </style>
</head>
<body>
  <div class="header">{{fullName}}</div>
  <div class="contact">{{phone}} | {{email}} | {{website}}</div>
  <div class="profiles">
    {{#each profiles}}<span>{{this}}</span> | {{/each}}
    <br>{{location}}
  </div>
  <h2>Objective</h2>
  <div>{{objective}}</div>
  <h2>Experience</h2>
  {{#each experience}}
  <div class="section">
    <span class="job-title">{{company}}</span> | <span>{{role}}</span>
    <div class="job-details">{{dates}} | {{location}}</div>
    <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
  </div>
  {{/each}}
  <h2>Education</h2>
  {{#each education}}
  <div class="section">
    <span class="degree">{{degree}}</span> – <span>{{school}}</span>
    <div class="edu-details">{{dates}} | GPA: {{gpa}}</div>
    <div class="edu-details">{{location}}</div>
  </div>
  {{/each}}
  <h2>Projects</h2>
  {{#each projects}}
  <div class="section">
    <span class="job-title">{{title}}</span>
    <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
  </div>
  {{/each}}
  <h2>Patents and Publications</h2>
  <ul>{{#each publications}}<li>{{this}}</li>{{/each}}</ul>
</body>
</html>
`;
