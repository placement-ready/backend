export const creativeResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Creative Resume</title>
  <style>
    body { font-family: 'Arial', sans-serif; margin: 36px; color: #222;}
    .header { text-align: center; font-size: 30px; font-weight: bold; margin-bottom: 6px; color: #207dcf;}
    .contact { text-align: center; font-size: 13px; margin-bottom: 14px;}
    .update { text-align: right; font-size: 12px; margin-bottom: 6px;}
    h2 { font-size: 16px; font-weight: bold; margin-top: 28px; border-bottom: 1px solid #207dcf;}
    .section { margin-bottom: 14px;}
    .job-title, .degree { font-weight: bold;}
    .job-details, .edu-details { font-size: 13px; color: #444; margin-bottom: 2px;}
    .highlight { color: #207dcf; }
    a { color: #207dcf; text-decoration: underline;}
    ul { margin-left: 16px; }
  </style>
</head>
<body>
  <div class="update">Last updated in {{lastUpdated}}</div>
  <div class="header highlight">{{fullName}}</div>
  <div class="contact">
    {{location}} | {{email}} | {{phone}} | {{website}} | {{linkedin}}
  </div>
  <h2 class="highlight">Welcome to RenderCV!</h2>
  <div>{{summary}}</div>
  <h2 class="highlight">Quick Guide</h2>
  <ul>{{#each quickGuide}}<li>{{this}}</li>{{/each}}</ul>
  <h2 class="highlight">Education</h2>
  {{#each education}}
  <div class="section">
    <span class="degree">{{degree}}</span> — <span>{{school}}</span>
    <div class="edu-details">GPA: {{gpa}} (<a href="{{gpaLink}}">a link to somewhere</a>)</div>
    <div class="edu-details">Coursework: {{coursework}}</div>
    <div class="edu-details">{{dates}}</div>
  </div>
  {{/each}}
  <h2 class="highlight">Experience</h2>
  {{#each experience}}
  <div class="section">
    <span class="job-title">{{company}}</span>, <span>{{role}}</span>
    <div class="job-details">{{dates}} | {{location}}</div>
    <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
  </div>
  {{/each}}
  <h2 class="highlight">Publications</h2>
  <ul>{{#each publications}}<li>{{this}}</li>{{/each}}</ul>
</body>
</html>
`;
