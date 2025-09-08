export const elegantResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Elegant Resume</title>
  <style>
    body { font-family: 'Georgia', serif; margin: 32px; color: #222; background: #fff; }
    .header { text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 8px; }
    .contact { text-align: center; font-size: 13px; margin-bottom: 12px; }
    h2 { font-size: 15px; font-weight: bold; border-bottom: 1px solid #ddd; margin-top: 28px;}
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px;}
    th, td { font-size: 13px; border: 1px solid #bbb; padding: 4px; }
    .section { margin-bottom: 8px;}
    .job-title, .degree { font-weight: bold;}
    ul { margin-left: 16px; }
    .activity-title { font-weight: bold;}
  </style>
</head>
<body>
  <div class="header">{{fullName}}</div>
  <div class="contact">{{phone}} &bull; {{email}} &bull; {{linkedin}} &bull; {{github}}</div>
  <h2>Education</h2>
  <table>
    <tr>
      <th>Degree/Certificate</th><th>Institute/Board</th><th>CGPA/Percentage</th><th>Year</th>
    </tr>
    {{#each education}}
    <tr>
      <td>{{degree}}</td><td>{{school}}</td><td>{{cgpa}}</td><td>{{year}}</td>
    </tr>
    {{/each}}
  </table>
  <h2>Experience</h2>
  {{#each experience}}
    <div class="section">
      <span class="job-title">{{title}}</span> — {{company}}<br>
      <span class="details">{{dates}} | {{location}}</span>
      <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
    </div>
  {{/each}}
  <h2>Projects</h2>
  {{#each projects}}
    <div class="section">
      <span class="job-title">{{title}}</span> — {{location}}<br>
      <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
    </div>
  {{/each}}
  <h2>Skills</h2>
  <ul>
    <li><b>Programming:</b> {{programming}}</li>
    <li><b>OS:</b> {{os}}</li>
    <li><b>Non Technical:</b> {{nonTech}}</li>
  </ul>
  <h2>Certifications</h2>
  <ul>{{#each certifications}}<li>{{this}}</li>{{/each}}</ul>
  <h2>Positions of Responsibility</h2>
  <ul>{{#each responsibility}}<li>{{this}}</li>{{/each}}</ul>
  <h2>Achievements</h2>
  <ul>{{#each achievements}}<li>{{this}}</li>{{/each}}</ul>
  <h2>Extracurricular</h2>
  <ul>{{#each extracurricular}}<li>{{this}}</li>{{/each}}</ul>
</body>
</html>
`;
