export const boldCreativeResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bold Creative Resume</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 34px; color: #276f55; background: #fff; }
    .header { text-align: center; font-size: 32px; font-weight: bold; color: #206fa2; margin-bottom: 6px;}
    .contact { text-align: center; font-size: 14px; margin-bottom: 10px; }
    .summary { font-weight: bold; color: #276f55; margin-bottom: 10px;}
    h2 { font-size: 17px; font-weight: bold; margin-top: 28px; color: #276f55; border-bottom: 2px solid #bee2d6;}
    .section { margin-bottom: 8px;}
    .role { font-weight: bold;}
    .details { font-size: 13px; color: #222;}
    ul { margin-left: 24px;}
  </style>
</head>
<body>
  <div class="header">{{fullName}}</div>
  <div class="contact">{{location}} | {{phone}} | {{email}} | {{linkedin}} | {{github}}</div>
  <div class="summary">{{summary}}</div>
  <h2>Skills</h2>
    <div><b>Automation:</b> {{skills.automation}}</div>
    <div><b>Cloud:</b> {{skills.cloud}}</div>
    <div><b>Languages:</b> {{skills.languages}}</div>
    <div><b>OS:</b> {{skills.os}}</div>
    <div><b>Policies:</b> {{skills.policies}}</div>
    <div><b>Testing:</b> {{skills.testing}}</div>
  <h2>Experience</h2>
  {{#each experience}}
    <div class="section">
      <span class="role">{{title}}</span><br>
      <span class="details">{{company}}</span> <span class="details">{{dates}}</span> <span class="details">{{location}}</span>
      <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
    </div>
  {{/each}}
  <h2>Education</h2>
  {{#each education}}
    <div class="section">
      <span class="role">{{degree}}</span>, {{school}} (<span class="details">{{year}}</span>)
    </div>
  {{/each}}
  <h2>Certifications</h2>
  <ul>{{#each certifications}}<li>{{this}}</li>{{/each}}</ul>
</body>
</html>
`;
