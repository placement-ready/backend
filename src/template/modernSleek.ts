export const modernSleekResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Modern Sleek Resume</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 36px; color: #202726; }
    .header { text-align: left; font-size: 30px; font-weight: bold; color: #3a7ad9; margin-bottom: 6px;}
    .contact { text-align: left; font-size: 14px; margin-bottom: 10px;}
    .update { text-align: right; font-size: 12px; color: #3a7ad9;}
    h2 { font-size: 16px; font-weight: bold; color: #3a7ad9; border-bottom: 1px solid #3a7ad9; margin-top: 28px;}
    .section { margin-bottom: 10px;}
    .job-title, .degree { font-weight: bold;}
    .details { font-size: 13px; color: #444;}
    ul { margin-left: 16px;}
    a { color: #3a7ad9; text-decoration: underline;}
  </style>
</head>
<body>
  <div class="update">Last updated: {{lastUpdated}}</div>
  <div class="header">{{fullName}}</div>
  <div class="contact">{{location}} | {{email}} | {{phone}} | {{website}} | {{linkedin}}</div>
  <h2>Education</h2>
  {{#each education}}
    <div class="section">
      <span class="degree">{{degree}}</span> - {{school}}<br>
      <span class="details">{{year}}</span>
      <span class="details">{{details}}</span>
    </div>
  {{/each}}
  <h2>Experience</h2>
  {{#each experience}}
    <div class="section">
      <span class="job-title">{{role}}</span> @ {{company}}<br>
      <span class="details">{{dates}} | {{location}}</span>
      <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
    </div>
  {{/each}}
  <h2>Skills</h2>
  <ul>{{#each skills}}<li>{{this}}</li>{{/each}}</ul>
</body>
</html>
`;
