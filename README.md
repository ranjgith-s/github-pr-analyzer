# GitHub PR Analyzer

This project is a simple React application that authenticates with GitHub and shows metrics for pull requests you have created or reviewed. It surfaces how long a pull request stayed in draft, the time to the first review and the total time until it was merged or closed. It also displays how many reviewers participated and how many change requests were made.

The UI is built with [Primer](https://primer.style) components so that it feels similar to the GitHub interface. After signing in with GitHub, a table displays the pull requests along with filters for repository and author. Click any title in the table to open that pull request on GitHub.

This repository contains only a minimal example client. You must supply a GitHub personal access token when prompted in the browser. Run the app with:

```bash
npm install
npm run dev
```

The app will open in your browser at `http://localhost:5173`.


To create a production build, run:

```bash
npm run build
```

The compiled files will be placed in the `build/` directory.
