export const classicCleanResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Classic Clean Resume</title>
  <style>
    body { font-family: 'Times New Roman', serif; margin: 34px; color: #222;}
    .header { text-align: center; font-size: 32px; font-weight: bold; margin-bottom: 8px;}
    .contact { text-align: center; font-size: 13px; margin-bottom: 8px;}
    h2 { font-size: 15px; font-weight: bold; margin-top: 26px; border-bottom: 1px solid #aaa;}
    .section { margin-bottom: 10px;}
    .job-title, .degree { font-weight: bold;}
    .job-details { font-size: 13px; color: #444;}
    ul { margin-left: 16px;}
  </style>
</head>
<body>
  <div class="header">{{fullName}}</div>
  <div class="contact">{{phone}} | {{email}} | {{profile}} | {{citizenship}}</div>
  <h2>Summary</h2>
  <div>{{summary}}</div>
  <h2>Experience</h2>
  {{#each experience}}
    <div class="section">
      <span class="job-title">{{company}}</span> | <span>{{role}}</span>
      <div class="job-details">{{dates}} | {{location}}</div>
      <ul>
        {{#each bullets}}<li>{{this}}</li>{{/each}}
      </ul>
    </div>
  {{/each}}
  <h2>Projects</h2>
  {{#each projects}}
    <div class="section">
      <span class="job-title">{{title}}</span>
      <ul>
        {{#each bullets}}<li>{{this}}</li>{{/each}}
      </ul>
    </div>
  {{/each}}
  <h2>Education</h2>
  <div class="section">
    <span class="degree">{{degree}}</span>, {{school}}
    <div class="job-details">{{gradYear}}</div>
    <div class="job-details">{{location}}</div>
  </div>
  <h2>Skills</h2>
  <div><b>Languages:</b> {{skills.languages}}</div>
  <div><b>Tools:</b> {{skills.tools}}</div>
  <div><b>Research:</b> {{skills.research}}</div>
</body>
</html>
`;
