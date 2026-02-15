# Requirements Specification - TruthLens AI

## Project Vision
TruthLens AI is an intelligent verification platform that dynamically routes tasks between AWS and Gemini 2.5 to provide the most accurate analysis of AI content, scams, and manipulation risks.

## Functional Requirements
* **REQ-01: Dynamic Task Routing**
  - **EARS:** THE SYSTEM SHALL analyze incoming requests and route them to either Gemini 2.5 or AWS services based on the input type and complexity.
* **REQ-02: Advanced Multimodal Reasoning (Gemini 2.5)**
  - **EARS:** WHEN a task requires deep semantic understanding or complex text analysis, THE SYSTEM SHALL route the request to Gemini 2.5.
* **REQ-03: Infrastructure & Metadata Analysis (AWS)**
  - **EARS:** WHILE processing link verification or image metadata, THE SYSTEM SHALL utilize AWS services (Amazon Bedrock/Rekognition) for high-speed infrastructure-level checks but it mostly uses Gemini 2.5.
* **REQ-04: Risk Indicator Calculation**
  - **EARS:** THE SYSTEM SHALL provide a unified report covering 6 key indicators: AI Probability, Scam Likelihood, Manipulation Risk, Emotional Manipulation, Source Credibility, and Evidence Found.

## Non-Functional Requirements
* **REQ-05: Resource Optimization**
  - **EARS:** THE SYSTEM SHALL minimize latency by selecting the AI provider with the fastest response time for the specific task at hand.