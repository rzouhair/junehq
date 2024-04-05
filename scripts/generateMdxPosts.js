const fs = require('fs').promises; // For file system operations (promises)
const { createClient } = require('next-sanity'); // For fetching Sanity data
const htm = require('htm')
const vhtml = require('vhtml')
const { toHTML, uriLooksSafe } = require('@portabletext/to-html')
require('dotenv').config();

var TurndownService = require('turndown')
var turndownService = new TurndownService()

const html = htm.bind(vhtml)

const dataset = process.env.NEXT_SANITY_DATASET
const projectId = process.env.NEXT_SANITY_PROJECT_ID
const cdnUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}`

// Configure your Sanity client (replace with your project details)
const config = {
  dataset,
  projectId,
  useCdn: false,
};
const client = createClient(config);

// Function to create MDX file
const createMdxFile = async (post, directory) => {
  const meta = {
    slug: post.slug.current,
    publishedAt: post.publishedAt,
    title: post.title,
    headerImage: post.headerImage.asset.url,
    authors: post.authors.map((author) => {
      return {
        name: author.name,
        description: author.name,
        avatarUrl: author.avatar?.asset?.url || null,
      }
    })
  }

  const myPortableTextComponents = {
    types: {
      image: ({value}) => {
        console.log({
          value
        })
        const imageUrl = value.asset._ref.split('image-')[1]
        const extensionArray = value.asset._ref.split('-')
        const extension = extensionArray[extensionArray.length - 1]
        const fullUrl = imageUrl.slice(0, imageUrl.lastIndexOf('-')) + '.' + extension
        return html`<img src="${cdnUrl}/${fullUrl}" alt="${value._key}" />`.replace('>', '/>')
      },
    },
  
    marks: {
      link: ({children, value}) => {
        const href = value.href || ''
  
        if (uriLooksSafe(href)) {
          const rel = href.startsWith('/') ? undefined : 'noreferrer noopener'
          return html`<a href="${href}" rel="${rel}">${children}</a>`
        }
  
        // If the URI appears unsafe, render the children (eg, text) without the link
        return children
      },
    },
  }


  const htmlContent = toHTML(post.body, {
    components: myPortableTextComponents
  });

  const markdownContent = turndownService.turndown(htmlContent)
  const mdxContent = `import { MdxLayout } from "components/mdx-layout.tsx";

export const meta = ${JSON.stringify(meta, null, 2)}

${markdownContent}

export default ({ children, ...rest }) => (
  <MdxLayout meta={meta} {...rest}>
    {children}
  </MdxLayout>
);
`;

  const filePath = `${__dirname}/${directory}/${post.slug.current}.mdx`;
  await fs.writeFile(filePath, mdxContent);
  console.log(`Created MDX file: ${filePath}`);
};

// Main function to fetch posts and generate MDX files
const generateMdxFiles = async (directory) => {
  // Fetch posts using GROQ query (replace with your query)
  const query = `*[_type == "post"]{
    _id,
    title,
    slug,
    body,
    headerImage{
      asset->
    },
    authors[]->{
      description,
      _id,
      name,
      avatar{
        asset->
      }
    },
    publishedAt,
    _type
  }`;
  const posts = await client.fetch(query);

  // Process each post
  for (const post of posts) {
    await createMdxFile(post, directory);
  }

  console.log(`Generated MDX files in directory: ${directory}`);
};

// Set the directory to create MDX files (replace with your desired path)
const targetDirectory = '../pages/changelogs';

// Run the script
generateMdxFiles(targetDirectory)
  .catch((error) => {
    console.error('Error generating MDX files:', error);
  });
