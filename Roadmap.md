# 📘 **ROADMAP.md**

# Roadmap

This document outlines the planned improvements and long-term vision for the Git Change Report Generator extension. The goal is to keep the project transparent, organized, and easy for contributors to follow.

---

## ✅ **v1.x – Initial Release Goals (Completed)**

* Generate descriptive reports from staged Git changes
* Sidebar UI for report generation
* API key configuration (Groq)
* Basic usage tracking
* History list for previously generated reports

---

# 🚀 **Planned Improvements**

## **1. Better Report Quality**

* Improve prompt structure for more natural, human-friendly report generation
* Add optional “context hints” (e.g., Jira ticket number, branch name, etc.)
* Allow editing and saving custom templates

---

## **2. Smarter Git Change Understanding**

* Detect change categories (feature, bug fix, cleanup, refactor)
* Automatically find related files or commits for deeper context
* Highlight sections of the report that relate to specific file changes

---

## **3. Expanded Sidebar Experience**

* Cleaner, more modern UI layout
* Chat-style report view
* Copy, export, and download options
* Resizable or detachable panel

---

## **4. Usage Monitoring Enhancements**

* Real-time token usage graph
* Detailed daily limits and remaining quota
* Alerts when usage approaches the limit
* Auto-pause on rate-limit detection

---

## **5. Improved History System**

* Store past reports with timestamps
* Show diff snapshot associated with each report
* Quick “re-generate report” button
* Option to export history

---

## **6. Template Manager**

* Full editor to create, save, and switch templates
* Versioned templates per project
* Share templates across team members

---

## **7. Multi-Provider Model Support**

* Add fallback support for other free providers

  * DeepSeek
  * OpenRouter
  * Groq local server (future possibility)
* Easy switching from sidebar
* Abstracted LLM interface for future compatibility

---

## **8. Performance & Reliability**

* Improve caching of Git diffs
* Avoid unnecessary re-parsing of files
* Reduce extension startup time
* More stable error handling

---

## **9. Collaboration Features (Future)**

* Team-shared report history
* Share reports via GitHub comments
* Auto-generate PR descriptions directly from the report

---

## **10. VS Code Marketplace Enhancements**

* Add icon, badges, and GIF preview
* Publish release notes for each version
* Provide usage examples and demos

---

# 🌟 Long-Term Vision

The extension should eventually feel like a **personal documentation assistant** that understands code changes, explains them clearly, and helps developers communicate better—without requiring any paid AI services.
It’s meant to improve commit quality, team alignment, and rapid understanding of code evolution.