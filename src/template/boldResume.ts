export const boldResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bold Resume</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 30px; color: #222; background: #fff;}
    .header { text-align: center; font-size: 30px; font-weight: bold; margin-bottom: 8px;}
    .contact { text-align: center; font-size: 13px; margin-bottom: 14px;}
    h2 { font-size: 15px; font-weight: bold; border-bottom: 2px solid #222; margin-top: 28px;}
    .section { margin-bottom: 14px;}
    .job-title, .degree { font-weight: bold;}
    .edu-details, .proj-details, .job-details { font-size: 13px; color: #444;}
    ul { margin-left: 16px;}
  </style>
</head>
<body>
  <div class="header">{{fullName}}</div>
  <div class="contact">{{phone}} &bull; {{email}} &bull; {{linkedin}}</div>
  <h2>Objective</h2>
  <div>{{objective}}</div>
  <h2>Education</h2>
  {{#each education}}
    <div class="section">
      <span class="degree">{{degree}}</span> — {{school}}<br>
      <span class="edu-details">{{year}}</span>
    </div>
  {{/each}}
  <h2>Skills and Interests</h2>
  <ul>
    <li><b>Skills:</b> {{skills}}</li>
    <li><b>Interests:</b> {{interests}}</li>
    <li><b>Design Software:</b> {{designSoftware}}</li>
    <li><b>Platforms:</b> {{platforms}}</li>
  </ul>
  <h2>Projects</h2>
  {{#each projects}}
    <div class="section">
      <span class="job-title">{{title}}</span> <i>{{projectType}}</i><br>
      <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
    </div>
  {{/each}}
  <h2>Internship/Trainings</h2>
  {{#each internships}}
    <div class="section">
      <span class="job-title">{{organization}}</span> — {{location}}<br>
      <span class="job-details">{{dates}}</span>
    </div>
  {{/each}}
</body>
</html>
`;
