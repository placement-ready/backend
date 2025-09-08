export const classicProfessionalResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Classic Professional Resume</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; margin: 38px; color: #222; background: #fff; line-height: 1.5; }
    .header { text-align: center; font-size: 30px; font-weight: 700; letter-spacing: 0.06em; margin-bottom: 8px; }
    .contact { text-align: center; font-size: 13px; margin-bottom: 22px; color: #333; }
    .section-title { font-size: 16px; font-weight: 700; margin-top: 32px; margin-bottom: 4px; text-transform: uppercase; border-bottom: 1px solid #ddd; }
    .job, .project, .edu, .leadership { margin-bottom: 16px; }
    .job-title, .degree { font-weight: bold; font-size: 14px; }
    .job-details, .edu-details { font-size: 13px; color: #666; }
    ul { margin-left: 18px; }
  </style>
</head>
<body>
  <div class="header">{{fullName}}</div>
  <div class="contact">{{address}} | {{phone}} | {{email}} | {{linkedin}} | {{github}}</div>
  <div class="section-title">Education</div>
  {{#each education}}
  <div class="edu">
    <span class="degree">{{degree}}</span> — {{school}}<br>
    <span class="edu-details">{{year}} | {{location}}</span>
  </div>
  {{/each}}
  <div class="section-title">Relevant Coursework</div>
  <ul>{{#each coursework}}<li>{{this}}</li>{{/each}}</ul>
  <div class="section-title">Experience</div>
  {{#each experience}}
  <div class="job">
    <span class="job-title">{{title}}</span><br>
    <span class="job-details">{{company}}, {{startDate}} — {{endDate}} | {{location}}</span>
    <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
  </div>
  {{/each}}
  <div class="section-title">Projects</div>
  {{#each projects}}
  <div class="project">
    <span class="job-title">{{title}}</span> — {{tech}}<br>
    <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
  </div>
  {{/each}}
  <div class="section-title">Technical Skills</div>
  <b>Languages</b>: {{languages}}<br>
  <b>Developer Tools</b>: {{developerTools}}<br>
  <b>Technologies/Frameworks</b>: {{frameworks}}<br>
  <div class="section-title">Leadership / Extracurricular</div>
  {{#each leadership}}
  <div class="leadership">
    <b>{{title}}</b> — {{org}}<br>
    <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
  </div>
  {{/each}}
</body>
</html>
`;
