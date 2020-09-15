import { Browser } from 'puppeteer-core'

// const s3 = new aws.S3()
// const bucket = 'cloudcity-webscrape-screenshots'

let browserFn: () => Promise<Browser>

export function setBrowser(fn: () => Promise<Browser>) {
  browserFn = fn
}

if (process.env.CHROME_LAYER) {
  const chromium = require('chrome-aws-lambda')
  setBrowser(async () =>
    chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })
  )
}

/**
 * Runs a puppeteer instance (headless chrome), loads the specified URL
 * and takes a screenshot of what the page looks like. The screenshot is saved to S3 if AWS/IAM credentials
 * are available on the environment (e.g. you have a `~/.aws/credentials`).
 *
 * This can be useful for testing e.g. if you want to load a widget and run its client-side JavaScript in an integration test.
 *
 * Returns a message containing an `aws` CLI command to download the screenshot.
 */
export async function launchPuppet(arg: { url: string }) {
  const b = await browserFn()
  try {
    const page = await b.newPage()
    await page.goto(arg.url)

    // await page.evaluate(() => {
    //   const w = window as any
    //   w.someFunction = function () {
    //     return '#000'
    //   }
    //   // this will be executed within the page, that was loaded before
    //   document.body.style.background = w.someFunction()

    //   return new Promise(resolve => setTimeout(resolve, 5000))
    // })

    // for (let i = 0; i < 5; i++) {
    //   console.log('iteration', i)
    //   await page.click('img')

    // }
    console.log('waiting for nav')
    await waitAtMost(
      5,
      page.waitForNavigation({
        waitUntil: 'networkidle0',
      })
    )
    console.log('finished nav')

    // await page.waitForFunction('document.querySelector("body").innerText.includes("New link")')

    // // const screenshot = await page.screenshot()

    // // const key = `12345.png`
    // // await s3
    // //   .putObject({ Bucket: bucket, Key: key, Body: screenshot, ContentType: 'image/png', ACL: 'public-read' })
    // //   .promise()

    // // await b.close()
    // return `https://${bucket}.s3-us-west-2.amazonaws.com/${key}`
  } catch (e) {
    console.error(e)
  }

  b.close()
  return 'done'
}

function waitAtMost(secs: number, p: Promise<any>) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('timeout')), secs * 1000)
    p.then(resolve).catch(reject)
  })
}
