export const cleanResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Clean Resume</title>
  <style>
    body { font-family: 'Times New Roman', serif; margin: 32px; color: #222; }
    .header { text-align: center; font-size: 28px; font-weight: bold; color: #236fa2; margin-bottom: 4px; }
    .contact { text-align: center; font-size: 14px; margin-bottom: 8px; }
    .meta    { text-align: center; font-size: 12px; color: #4876a6; margin-bottom: 14px; }
    hr { border: none; border-top: 1px solid #bdd7ee; margin: 6px 0 16px 0;}
    h2 { font-size: 16px; margin-top: 26px; border-bottom: 1px solid #bdd7ee; text-transform: capitalize; }
    .edu-title { font-weight: bold; font-size: 15px; }
    .edu-details, .job-details { font-size: 13px; color: #213; }
    ul { margin-left: 18px; }
    .section { margin-bottom: 10px; }
    .activity-title { font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">{{fullName}}</div>
  <div class="contact">{{email}} &bull; {{phone}}</div>
  <div class="meta">Residence: {{address}} | Date of Birth: {{dob}}</div>
  <hr/>
  <h2>Education</h2>
  {{#each education}}
    <div class="section">
      <span class="edu-title">{{degree}}</span> — {{school}}<br>
      <span class="edu-details">{{details}}</span>
      <span class="edu-details">{{dates}}</span>
    </div>
  {{/each}}
  <h2>Work Experience</h2>
  {{#each experience}}
    <div class="section">
      <span class="edu-title">{{title}}</span> — {{company}}<br>
      <span class="job-details">{{dates}} | {{location}}</span>
      <ul>
        {{#each bullets}}<li>{{this}}</li>{{/each}}
      </ul>
    </div>
  {{/each}}
  <h2>Extracurricular Activities</h2>
  {{#each activities}}
    <div class="section">
      <span class="activity-title">{{title}}</span><br>
      <span>{{details}}</span>
    </div>
  {{/each}}
</body>
</html>
`;
