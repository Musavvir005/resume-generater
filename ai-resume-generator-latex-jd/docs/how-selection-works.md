# How Project and Certificate Selection Works

The user enters:

- All projects
- All certificates
- Job description
- Number of projects to include
- Number of certificates to include

## AI Mode

The Gemini prompt asks the model to:

1. Extract keywords from the job description.
2. Compare the JD with all projects.
3. Select exactly the requested number of projects, if available.
4. Compare the JD with all certificates.
5. Select exactly the requested number of certificates, if available.
6. Rewrite project bullets truthfully using provided project data.
7. Return JSON used by the LaTeX template engine.

## Local Mode

The local mode does not use AI. It:

1. Extracts important technical keywords from the JD.
2. Scores every project by keyword overlap.
3. Scores every certificate by keyword overlap.
4. Sorts highest score first.
5. Selects the required count.
6. Generates simple resume bullets.

## Example

If the JD asks for:

```text
Python, Machine Learning, Computer Vision, TensorFlow, PyTorch, FastAPI
```

Then projects like these will be ranked higher:

```text
FEELGAN - Medical Image Analysis System
AI-Powered Documentation ChatBot
Student Attendance System
```

Certificates related to ML, deep learning, PyTorch, or computer vision will also rank higher.
