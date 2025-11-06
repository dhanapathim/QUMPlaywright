# QUM
This project is an Accelerator to generate the QUM Metrics using the Playwright scripts.

## Dependency Installations
- Run `npm install`
- Run `npx playwright install`
- export the *BW_USERNAME* and *BW_PASSWORD* values.
- Run the following command to get the results: `npx playwright test "./tests/create-post.spec.js" --headed`
- For I18N metrics: following environment variables need to be set:
  - export *GEN_AI_MODEL*
  - export *GEN_AI_API_KEY*
  - export *TARGET_LANG* (e.g., fr-FR, de-DE, etc.)
  - export *SUPPORT_LANGS* (e.g., en-US)(optional)
## Reports Generated
TODO
