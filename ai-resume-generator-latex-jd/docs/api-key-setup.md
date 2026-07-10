# API Key Setup

The project uses Gemini API from browser JavaScript.

## Where to Enter the Key

Open the app and paste the key in:

```text
AI Setup → Gemini API Key
```

Then click:

```text
Save key locally
```

## Where the Key Is Used

File:

```text
js/ai.js
```

Function:

```js
callGemini({ apiKey, modelName, prompt })
```

The request uses:

```js
headers: {
  "Content-Type": "application/json",
  "x-goog-api-key": apiKey
}
```

## Security Note

This is okay for a student demo or local project. For a public production app, do not expose API keys in frontend code. Use a backend proxy instead.
