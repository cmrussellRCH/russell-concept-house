import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import {cloudinaryAssetSourcePlugin} from 'sanity-plugin-cloudinary'

export default defineConfig({
  name: 'default',
  title: 'Russell Concept House',

  projectId: 'cc0sr5iy',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(),
    cloudinaryAssetSourcePlugin({
      cloudName: process.env.SANITY_STUDIO_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.SANITY_STUDIO_CLOUDINARY_API_KEY,
      apiSecret: process.env.SANITY_STUDIO_CLOUDINARY_API_SECRET,
      username: process.env.SANITY_STUDIO_CLOUDINARY_USERNAME,
      password: process.env.SANITY_STUDIO_CLOUDINARY_PASSWORD,
    })
  ],

  schema: {
    types: schemaTypes,
  },
})