export const simpleResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Simple Resume</title>
  <style>
    body { font-family: 'Georgia', serif; margin: 38px; color: #222; background: #fff; }
    .header { text-align: center; font-size: 28px; font-weight: 700; margin-bottom: 6px; }
    .contact { text-align: center; font-size: 13px; margin-bottom: 22px; color: #333; }
    .note { font-size: 13px; font-style: italic; color: #777; text-align: center; margin-bottom: 12px; }
    h2 { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ddd; margin-top: 32px; padding-bottom: 3px; }
    .job-title, .degree { font-weight: bold; font-size: 14px; }
    .job-details, .edu-details { font-size: 12px; color: #666; margin-bottom: 4px; }
    ul { margin-left: 20px; }
  </style>
</head>
<body>
  <div class="header">{{fullName}}</div>
  <div class="contact">{{email}} | {{phone}} | {{address}} | {{github}}</div>
  <div class="note">{{roleStatement}}</div>
  <h2>Education</h2>
  {{#each education}}
  <div>
    <span class="degree">{{degree}}</span><br>
    <span class="edu-details">{{school}}, {{year}}</span>
  </div>
  {{/each}}
  <h2>Technical Skills</h2>
  <ul>
    <li>Programming: {{programming}}</li>
    <li>Backend: {{backend}}</li>
    <li>Frontend: {{frontend}}</li>
    <li>Others: {{others}}</li>
  </ul>
  <h2>Projects (All Available in Github)</h2>
  {{#each projects}}
  <div>
    <span class="job-title">{{title}}</span>
    <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
  </div>
  {{/each}}
  <h2>Work Experience</h2>
  {{#each experience}}
  <div>
    <span class="job-title">{{title}}</span><br>
    <span class="job-details">{{company}}, {{startDate}} - {{endDate}} | {{role}}</span>
    <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
  </div>
  {{/each}}
  <h2>Award</h2>
  {{#each awards}}
  <div>
    <span>{{title}}</span>: {{description}}
  </div>
  {{/each}}
</body>
</html>
`;
