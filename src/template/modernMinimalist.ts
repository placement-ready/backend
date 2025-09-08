export const modernMinimalistResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Modern Minimalist Resume</title>
  <style>
    body { font-family: 'Arial', sans-serif; margin: 30px; color: #202726; background: #fff; }
    .header { text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 2px; }
    .subhead { text-align: center; font-size: 16px; font-weight: 400; margin-bottom: 8px; color: #4a4a4a;}
    .contact { text-align: center; font-size: 13px; margin-bottom: 16px;}
    hr { margin: 8px 0;}
    h2 { font-size: 15px; text-transform: uppercase; font-weight: bold; border-bottom: 1px solid #d8d8d8; margin-top: 26px;}
    .section { margin-bottom: 10px;}
    .job-title, .role-title, .degree { font-weight: bold;}
    .details { font-size: 13px; color: #888;}
    ul { margin-left: 14px;}
    .activity-title { font-weight: bold;}
  </style>
</head>
<body>
  <div class="header">{{fullName}}</div>
  <div class="subhead">{{jobTitle}}</div>
  <div class="contact">{{portfolio}} &bull; {{github}} &bull; {{email}} &bull; {{linkedin}}</div>
  <hr>
  <h2>Summary</h2>
  <div>{{summary}}</div>
  <h2>Skills</h2>
  <ul>
    <li><b>Tools:</b> {{toolsLanguages}}</li>
    <li><b>Quant Research:</b> {{quantResearch}}</li>
    <li><b>Communication:</b> {{communication}}</li>
  </ul>
  <h2>Technical Experience</h2>
  {{#each experience}}
    <div class="section">
      <span class="role-title">{{role}}</span> / {{company}}<br>
      <span class="details">{{startDate}} — {{endDate}} | {{location}}</span>
      <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
    </div>
  {{/each}}
  <h2>Education</h2>
  {{#each education}}
    <div class="section">
      <span class="degree">{{degree}}</span>, {{school}}<br>
      <span class="details">{{year}}</span>
    </div>
  {{/each}}
  <h2>Activities</h2>
  <ul>{{#each activities}}<li>{{this}}</li>{{/each}}</ul>
</body>
</html>
`;
