# Setting up Sanity API Token

To import articles into Sanity, you need to create an API token.

## Steps:

1. **Go to your Sanity project dashboard:**
   https://www.sanity.io/manage/project/cc0sr5iy/api

2. **Click on "Tokens" tab**

3. **Click "Add API token"**

4. **Configure the token:**
   - Name: "Content Import Token"
   - Permissions: **Editor** (needed to create documents)
   - Click "Save"

5. **Copy the generated token**

6. **Add to your .env file:**
   ```
   SANITY_API_TOKEN=your-token-here
   ```

## Security Notes:

- Keep your token secret
- Never commit it to version control
- The token has write access to your dataset
- You can revoke it anytime from the Sanity dashboard

## Running the Import:

After setting up your token:

```bash
npm run import-to-sanity
```

This will import all 33 articles from your Wix migration.