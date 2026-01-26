# Resume Chat API Documentation

This document describes the WebSocket API for the chat-driven resume builder feature.

## Overview

The resume builder uses WebSocket (Socket.IO) for real-time communication. The AI collects resume information through a conversational interface, streaming responses token-by-token for a natural chat experience.

---

## Connection

### Socket.IO Endpoint
```
ws://[SERVER_URL]
```

### Authentication
The WebSocket connection uses the same authentication as the REST API. Ensure the user is authenticated before initiating resume chat.

---

## Events

### Client → Server Events

| Event | Description | Payload |
|-------|-------------|---------|
| `resume:start` | Start a new resume session | `{ userId: string }` |
| `resume:join` | Join an existing session | `{ sessionId: string }` |
| `resume:message` | Send a chat message | `{ sessionId: string, content: string }` |
| `resume:sectionComplete` | Mark a section complete | `{ sessionId: string, section: string }` |
| `resume:generate` | Generate final resume | `{ sessionId: string }` |
| `resume:status` | Get session status | `{ sessionId: string }` |
| `resume:leave` | Leave the session | `{ sessionId: string }` |

### Server → Client Events

| Event | Description | Payload |
|-------|-------------|---------|
| `resume:started` | Session started/resumed | See below |
| `resume:joined` | Successfully joined session | See below |
| `resume:userMessage` | User message broadcast | `{ role, content, timestamp }` |
| `resume:token` | Streaming AI response token | `{ token: string }` |
| `resume:messageComplete` | AI message finished | `{ role, content, timestamp }` |
| `resume:sessionUpdate` | Session status changed | See below |
| `resume:sectionCompleted` | Section marked complete | See below |
| `resume:generating` | Resume generation started | `{ message: string }` |
| `resume:complete` | Final resume generated | See below |
| `resume:statusUpdate` | Session status response | See below |
| `resume:error` | Error occurred | `{ message: string }` |

---

## Event Payloads

### `resume:start` (Request)
```typescript
{
  userId: string  // Required: User's ID from authentication
}
```

### `resume:started` / `resume:joined` (Response)
```typescript
{
  sessionId: string,
  status: "gathering" | "reviewing" | "completed",
  currentSection: string,  // e.g., "personalInfo", "experience"
  completedSections: string[],
  isComplete: boolean,
  messages: Array<{
    role: "user" | "assistant" | "system",
    content: string,
    timestamp: string
  }>
}
```

### `resume:message` (Request)
```typescript
{
  sessionId: string,  // Required
  content: string     // Required: User's message
}
```

### `resume:token` (Response - Streaming)
```typescript
{
  token: string  // Single token from AI response
}
```

### `resume:messageComplete` (Response)
```typescript
{
  role: "assistant",
  content: string,     // Full AI response
  timestamp: string
}
```

### `resume:sessionUpdate` (Response)
```typescript
{
  status: "gathering" | "reviewing" | "completed",
  currentSection: string,
  completedSections: string[],
  isComplete: boolean
}
```

### `resume:sectionComplete` (Request)
```typescript
{
  sessionId: string,
  section: "personalInfo" | "summary" | "experience" | "education" | 
           "skills" | "projects" | "certifications" | "languages" | "achievements"
}
```

### `resume:sectionCompleted` (Response)
```typescript
{
  section: string,
  completedSections: string[],
  currentSection: string,
  isReady: boolean,           // True if all required sections complete
  missingRequired: string[]   // List of missing required sections
}
```

### `resume:complete` (Response)
```typescript
{
  sessionId: string,
  message: string,
  resume: {
    personalInfo: {
      fullName: string,
      email: string,
      phone: string | null,
      location: string | null,
      website: string | null,
      linkedin: string | null,
      github: string | null
    },
    summary: string,
    experience: Array<{
      company: string,
      role: string,
      location: string | null,
      startDate: string,
      endDate: string | null,
      current: boolean,
      description: string,
      highlights: string[]
    }>,
    education: Array<{
      institution: string,
      degree: string,
      field: string | null,
      startDate: string | null,
      endDate: string | null,
      gpa: string | null,
      highlights: string[]
    }>,
    skills: string[],
    projects: Array<{
      name: string,
      description: string,
      technologies: string[],
      url: string | null,
      highlights: string[]
    }>,
    certifications: string[],
    languages: string[],
    achievements: string[]
  }
}
```

---

## Resume Sections

### Required Sections
Must be completed before generating the final resume:
1. `personalInfo` - Name, email, contact details
2. `summary` - Professional summary
3. `experience` - Work history (at least one entry)
4. `education` - Educational background (at least one entry)
5. `skills` - Technical and soft skills (at least 3)

### Optional Sections
User can choose to skip these:
- `projects` - Notable projects
- `certifications` - Professional certifications
- `languages` - Languages spoken
- `achievements` - Awards and recognition

---

## Example Chat Flow

### 1. Start Session
```javascript
// Client
socket.emit('resume:start', { userId: 'user_123' });

// Server response
socket.on('resume:started', (data) => {
  console.log('Session ID:', data.sessionId);
  // Display messages to user
  data.messages.forEach(msg => displayMessage(msg));
});
```

### 2. Send User Message
```javascript
// Client
socket.emit('resume:message', {
  sessionId: 'resume_abc123_xyz789',
  content: 'My name is John Doe'
});

// Handle streaming tokens
let currentResponse = '';
socket.on('resume:token', (data) => {
  currentResponse += data.token;
  updateAIBubble(currentResponse);
});

// Handle complete message
socket.on('resume:messageComplete', (data) => {
  finalizeAIBubble(data.content);
});
```

### 3. Handle Errors
```javascript
socket.on('resume:error', (data) => {
  showError(data.message);
});
```

### 4. Generate Final Resume
```javascript
// Only call after all required sections are complete
socket.emit('resume:generate', { sessionId: 'resume_abc123_xyz789' });

socket.on('resume:generating', (data) => {
  showLoadingState(data.message);
});

socket.on('resume:complete', (data) => {
  hideLoadingState();
  displayFinalResume(data.resume);
});
```

### 5. Leave Session
```javascript
socket.emit('resume:leave', { sessionId: 'resume_abc123_xyz789' });
```

---

## Frontend Implementation Notes

### Streaming UI Pattern
```javascript
// Recommended pattern for streaming messages
const streamingMessage = document.createElement('div');
streamingMessage.className = 'ai-message streaming';

socket.on('resume:token', (data) => {
  streamingMessage.textContent += data.token;
  // Auto-scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on('resume:messageComplete', (data) => {
  streamingMessage.classList.remove('streaming');
  // Optionally apply markdown rendering
  streamingMessage.innerHTML = renderMarkdown(data.content);
});
```

### Session Persistence
- Sessions are stored in the database
- Users can resume incomplete sessions
- Call `resume:start` with the same `userId` to resume an existing session
- Only one active session per user at a time

### Error Handling
Always listen for `resume:error` events:
```javascript
socket.on('resume:error', (data) => {
  // Common errors:
  // - "Session not found"
  // - "AI service is not configured"
  // - "Cannot generate resume. Missing required sections: ..."
  // - "This resume is already completed"
});
```

### State Management
Track session state locally:
```javascript
const sessionState = {
  sessionId: null,
  status: 'gathering',
  currentSection: 'personalInfo',
  completedSections: [],
  isComplete: false
};

socket.on('resume:sessionUpdate', (data) => {
  Object.assign(sessionState, data);
  updateUI(sessionState);
});
```

---

## Status Codes

| Status | Description |
|--------|-------------|
| `gathering` | Actively collecting resume information |
| `reviewing` | All required sections complete, ready for generation |
| `completed` | Final resume has been generated |

---

## Rate Limiting

- WebSocket messages are not explicitly rate-limited
- AI responses may be slow during high load
- Implement client-side debouncing for rapid user input

---

## Support

For issues or questions, contact the backend team.
