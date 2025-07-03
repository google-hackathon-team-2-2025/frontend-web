# First GoogleStudent AI Hackathon in Warsaw - Team 2

## Project: FactLens (4-th place)

### Project description

FactLens is a tool that helps you fact-check your content. Using Gemini API. Current state is a Web-tool where you can paste any info (text, images, url) and get a fact-check result with "confidence score" (true, false, manipulation, unverifiable). With feedback for user why this result was given, where is the false/true/misleading information in text user provided.

Additionally, for user convenience, our team have created a Google Chrome extension that allows you to do a screenshot of the page and get a fact-check result.

Be aware, that this project was done in 4 hours. And for some reason, it works fully as we wanted. There a lot of small, non-critical bugs. And do not even think about the code quality, mobile-first, etc.

Want to contribute? Feel free to do so. Just create a pull request.
What to use it? Do according to MIT license.
See [Getting Started](#getting-started) section for more details.

## Table of contents

- [First GoogleStudent AI Hackathon in Warsaw - Team 2](#first-googlestudent-ai-hackathon-in-warsaw---team-2)
  - [Project: FactLens (4-th place)](#project-factlens-4-th-place)
    - [Project description](#project-description)
  - [Table of contents](#table-of-contents)
  - [Getting Started](#getting-started)
  - [Chrome extension](#chrome-extension)
  - [Learn More (standard nextjs stuff, leave it here so maybe some will find this useful)](#learn-more-standard-nextjs-stuff-leave-it-here-so-maybe-some-will-find-this-useful)
  - [License](#license)

## Getting Started

Clone the repository:

```bash
git clone git@github.com:google-hackathon-team-2-2025/frontend-web.git
```

or

```bash
git clone https://github.com/google-hackathon-team-2-2025/frontend-web.git
```

Before you start, create (or copy from existing \*.example) .env and .env.local files.

```bash
cp .env.example .env
cp .env.local.example .env.local
```

Insert your Gemini API key to .env file. Yep we do not have one for you, but Google are so generous so they will eat most of the cost (really, free API access are quite generous). See [Gemini API](https://aistudio.google.com) and docs for more details.

Install dependencies:

```bash
npm install
pnpm install
bun install
yarn install
```

After it, you can run the development server:

```bash
npm run dev
pnpm dev
bun dev
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Chrome extension

First of all, you need to build the extension.

```bash
npm run build:extension
pnpm build:extension
bun build:extension
yarn build:extension
```

After it, open Google Chrome and go to [chrome://extensions/](chrome://extensions/).

At the top left corner, click "Load unpacked" button. Select the `yourFolderStructure/extension/dist` folder.

Finally, you can use the extension.

`Select Area to Check` button will prompt you to select part of a page, after it screenshot of this part will be sent to FactLens (using Gemini API) and after a few seconds you will have a new page with a fact-check result (we do not have any UI for loading part, so wait a few seconds before thinking that something is wrong, and yep this is one of small things that needs to be improved/fixed).

`Check full page` will automatically send screenshot of the whole page to FactLens (using Gemini API) and after a few seconds you will have a new page with a fact-check result. This time we have a loading indicator, so you can see that something is happening.

## Learn More (standard nextjs stuff, leave it here so maybe some will find this useful)

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

And there is small fee for using this project. Donate to [Come Back Alive](https://savelife.in.ua/en/donate-en/). Donate anything, as one [Ukrainian TV person](https://twitter.com/max_shcherbyna) said: "Donate is like a penis, there isn't small one".
