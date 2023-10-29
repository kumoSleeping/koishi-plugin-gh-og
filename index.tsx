import { Computed, Context, Dict, h, Schema } from 'koishi'
import { load } from 'cheerio'

const markdownIt = require('markdown-it')();


export const using = ['puppeteer'] as const


export interface Config {
  
  width?: number
  height?: number
  chick_url?: Computed<boolean>
  show_url?: Computed<boolean>
}

export const Config: Schema<Config> = Schema.object({

  width: Schema.number().default(100).description('默认图片宽度。'),
  height: Schema.number().default(100).description('默认图片高度。'),
  chick_url: Schema.computed(Schema.boolean()).default(false).description('是否同时检测github链接。'),
  show_url: Schema.computed(Schema.boolean()).default(false).description('出图成功后，是否展示github链接。'),
})

export const name = 'OpenGraph'

const extractRepoName = (url) => {
  const parts = url.split('/');
  const username = parts[3];
  const repoName = parts[4];
  return `${username}/${repoName}`;
};

async function fetchGitHubData(ctx, session, project, config) {
  try {
    const response = await ctx.http.get(`https://github.com/${project}`);
    // 如果项目存在，GitHub API 会返回项目的相关信息
    console.log('项目存在:', response.data);
    const githubUrl = `https://github.com/${project}`;
    const githubcard = `https://opengraph.githubassets.com/githubcard/${project}`;
    
    if (config.show_url == true) {
      await session.send(`${githubUrl}<image url="${githubcard}"/>`);
    } else {
      await session.send(`<image url="${githubcard}"/>`);
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('项目不存在');
    } else {
      console.error('发生错误:', error);
    }
  }
}



export function apply(ctx: Context, config: Config) {

  ctx.command('color <color:text>', '生成色图')
  .action((_, color) => {
    if (!color) return '请输入颜色。'
    return <html>
      <div style={{
        width: config.width + 'px',
        height: config.height + 'px',
        background: color,
      }}></div>
    </html>
  })


  ctx.command('rendermd <markdown:text>', 'Render Markdown to HTML')
    .action((_, markdown) => {
      if (!markdown) return 'Please provide Markdown content.';
      const html = markdownIt.render(markdown);

      // const html = md.render(markdown);
      // console.log(html)
      // const a = ctx.puppeteer.render(content, callback?)
      return <div
          dangerouslySetInnerHTML={{ __html: html }}
        />
      
    });

  // ctx.on('message', async (session) => {
  //   const input = session.content.trim();
  //   const githubRepoPattern = /^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/;
  //   let project: string

  //   if (config.chick_url) {
  //     if (input.startsWith(`https://github.com/`)) {
  //       project = extractRepoName(input);
  //       await fetchGitHubData(ctx, session, project, config);

  //     }
  //   }

  //   if (githubRepoPattern.test(input)) {
  //     project = input
  //     await fetchGitHubData(ctx, session, project, config);

  //   }

  // });
  ctx.on('message', async (session) => {
    const input = session.content.trim();
    const githubRepoPattern = /^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/;
    let project: string

    if (config.chick_url) {
      if (input.startsWith(`https://github.com/`)) {
        project = extractRepoName(input);
        await fetchGitHubData(ctx, session, project, config);

      }
    }

    if (githubRepoPattern.test(input)) {
      project = input
      await fetchGitHubData(ctx, session, project, config);

    }

  });
  
}


