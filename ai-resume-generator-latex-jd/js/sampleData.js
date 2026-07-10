const SAMPLE_DATA = {
  jobTitle: "AI/ML Engineer Intern",
  projectCount: 3,
  certificateCount: 3,
  name: "Jane Doe",
  email: "jane.doe@example.com",
  phone: "+1 123-456-7890",
  github: "https://github.com/janedoe",
  linkedin: "https://linkedin.com/in/janedoe",
  leetcode: "https://leetcode.com/u/janedoe",
  education: [
    {
      institution: "University XXXXX",
      location: "City, State XXXXX",
      degree: "M.S. in Computer Science; CGPA: 8.30/10.0",
      duration: "Sep 2025 -- Jun 2027 (Expected)"
    },
    {
      institution: "University XXXXX",
      location: "City, State XXXXX",
      degree: "B.S. in Computer Science; CGPA: 7.57/10.0",
      duration: "Jun 2021 -- May 2025"
    }
  ],
  experience: [
    {
      role: "Software Engineering Intern",
      duration: "May 2024 -- Jul 2024",
      company: "Company XXXXX Ltd.",
      location: "City, State XXXXX",
      bullets: "Architected a system using Face Recognition and OpenCV with 95%+ identification accuracy for 100+ users.\nAutomated user tracking with Machine Learning algorithms including SVM and CNN, improving efficiency by 80% versus manual methods.\nEngineered real-time facial detection and recognition pipeline using Python, OpenCV, NumPy, and scikit-learn."
    }
  ],
  patents: [
    {
      title: "Patent/Publication XXXXX: Federated Edge Learning with GANs",
      detail: "Patent Approved (Application No: XXXXX) -- Pioneered a privacy-preserving disease detection system using federated learning, generative adversarial networks, and decentralized diagnostics."
    }
  ],
  projects: [
    {
      title: "Project XXXXX - Medical Image Analysis System",
      technologies: "Python, TensorFlow, PyTorch, GANs, CNNs, Federated Learning",
      description: "Privacy-preserving disease detection system using Federated Edge Learning and GANs for distributed medical image analysis.",
      features: "Synthetic medical image generation, CNN classification, COVID-19/TB/OCT dataset training, federated learning workflow, privacy-preserving diagnostics",
      metrics: "15% diagnostic accuracy improvement, 10,000+ synthetic medical images, 90%+ accuracy",
      link: ""
    },
    {
      title: "Project XXXXX - Web Application Platform",
      technologies: "React, Node.js, MongoDB, Socket.io, JWT, Bcrypt, React Leaflet",
      description: "Full-stack web application with secure authentication, custom listings, geolocation, and real-time chat.",
      features: "JWT authentication, item search, real-time chat, map integration, Context API state management",
      metrics: "40% reduction in unauthorized access attempts, 60% higher user engagement, 35% fewer state-related bugs",
      link: ""
    },
    {
      title: "Project XXXXX - AI-Powered Documentation ChatBot",
      technologies: "Python, React, FastAPI, RAG, LLM, OpenAI, Embeddings",
      description: "Intelligent chatbot for context-aware question answering from documentation using Retrieval-Augmented Generation.",
      features: "Document parsing, cleaning, chunking, semantic search, REST APIs, React frontend, real-time Q&A",
      metrics: "1,000+ pages processed, sub-second response times",
      link: ""
    },
    {
      title: "Project XXXXX - User Attendance System",
      technologies: "Python, OpenCV, NumPy, scikit-learn, SVM, CNN",
      description: "Face-recognition based attendance system for automating user tracking.",
      features: "Face detection, face recognition, user logging, model training, real-time camera pipeline",
      metrics: "95%+ identification accuracy, 100+ users",
      link: ""
    }
  ],
  certificates: [
    { title: "Certificate XXXXX - Machine Learning", issuer: "Issuer XXXXX", date: "2024", skills: "Machine Learning, supervised learning, neural networks, model evaluation" },
    { title: "Certificate XXXXX - Deep Learning", issuer: "Issuer XXXXX", date: "2024", skills: "PyTorch, CNNs, neural networks, computer vision" },
    { title: "Certificate XXXXX - Web Development", issuer: "Issuer XXXXX", date: "2023", skills: "React, Node.js, MongoDB, REST APIs" },
    { title: "Certificate XXXXX - Version Control", issuer: "Issuer XXXXX", date: "2023", skills: "Git, GitHub, version control" }
  ],
  achievements: [
    "Platform XXXXX -- Solved 350+ problems across data structures and algorithms",
    "Program XXXXX -- Presented Project XXXXX at National Student Research Program",
    "Competition XXXXX -- Competed in Nationwide Innovation Hackathon"
  ],
  skills: {
    languages: "Python, C++, JavaScript, SQL, HTML/CSS",
    frameworks: "React, Node.js, Flask, TensorFlow, PyTorch, scikit-learn, OpenCV",
    databases: "MongoDB, MySQL",
    tools: "Git, GitHub, VS Code, PyCharm, Jupyter Notebook, Postman, Docker",
    core: "Machine Learning, Deep Learning, Computer Vision, GANs, CNNs, Federated Learning, REST APIs"
  },
  jobDescription: `We are hiring an AI/ML Engineer Intern with strong knowledge of Python, machine learning, deep learning, computer vision, TensorFlow or PyTorch, model evaluation, and API integration. Responsibilities include developing ML models, preprocessing datasets, building computer vision pipelines, experimenting with CNN architectures, documenting results, and collaborating with developers to integrate models into web applications. Preferred skills include FastAPI, REST APIs, Git, Docker, RAG, LLMs, and experience with healthcare or image analysis projects.`
};
