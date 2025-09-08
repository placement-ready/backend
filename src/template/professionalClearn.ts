export const professionalCleanResume = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Professional Clean Resume</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #555;}
    .header { text-align: center; font-size: 30px; font-weight: bold; margin-bottom: 8px; background: #dedede;}
    .contact { text-align: center; font-size: 14px; margin-bottom: 10px;}
    h2 { font-size: 17px; font-weight: bold; color: #999; border-bottom: 2px solid #dedede; margin-top: 24px;}
    .section { margin-bottom: 8px;}
    .col {display:inline-block;width:49%;vertical-align:top;}
    .col-header {font-size:18px;font-weight:bold;margin-bottom:8px;}
    .job-title, .degree { font-weight: bold;}
    .details { font-size: 13px; color: #555;}
    ul { margin-left: 14px;}
  </style>
</head>
<body>
  <div class="header">{{fullName}}</div>
  <div class="contact">{{email}} | {{phone}} | {{website}}</div>
  <div class="col">
    <div class="col-header">Education</div>
    {{#each education}}
      <div class="section">
        <span class="degree">{{degree}}</span> — {{school}}<br>
        <span class="details">{{dates}}</span>
      </div>
    {{/each}}
    <div class="col-header">Skills</div>
    <ul>{{#each skills}}<li>{{this}}</li>{{/each}}</ul>
    <div class="col-header">Coursework</div>
    <ul>{{#each coursework}}<li>{{this}}</li>{{/each}}</ul>
  </div>
  <div class="col">
    <div class="col-header">Experience</div>
    {{#each experience}}
      <div class="section">
        <span class="job-title">{{role}}</span> @ {{company}}<br>
        <span class="details">{{dates}} | {{location}}</span>
        <ul>{{#each bullets}}<li>{{this}}</li>{{/each}}</ul>
      </div>
    {{/each}}
    <div class="col-header">Awards</div>
    <ul>{{#each awards}}<li>{{this}}</li>{{/each}}</ul>
    <div class="col-header">Links</div>
    <ul>{{#each links}}<li>{{this}}</li>{{/each}}</ul>
  </div>
</body>
</html>
`;
