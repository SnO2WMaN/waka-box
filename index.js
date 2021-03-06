require('dotenv').config()
const { WakaTimeClient, RANGE } = require('wakatime-client')
const Octokit = require('@octokit/rest')

const {
  GIST_ID: gistId,
  GH_TOKEN: githubToken,
  WAKATIME_API_KEY: wakatimeApiKey
} = process.env

const wakatime = new WakaTimeClient(wakatimeApiKey)

const octokit = new Octokit({
  auth: `token ${githubToken}`
})

function generateBarChart(percent, size) {
  const syms = '░▏▎▍▌▋▊▉█'

  const frac = (size * 8 * percent) / 100
  const barsFull = Math.floor(frac / 8)
  const semi = frac % 8
  const barsEmpty = size - barsFull - 1

  return [
    syms.slice(8, 9).repeat(barsFull),
    syms.slice(semi, 1),
    syms.slice(0, 1).repeat(barsEmpty)
  ].join('')
}

async function updateGist(stats) {
  const lines = []
  for (let i = 0; i < stats.data.languages.length; i += 1) {
    const data = stats.data.languages[i]
    const { name, percent, text: time } = data

    const line = [
      name.padEnd(11),
      time.padEnd(14),
      generateBarChart(percent, 21),
      `${String(percent.toFixed(1)).padStart(5)}%`
    ]

    lines.push(line.join(' '))
  }
  try {
    // Get original filename to update that same file
    await octokit.gists.update({
      gist_id: gistId,
      description: '📊 Weekly development breakdown',
      files: {
        '📊 Weekly development breakdown': {
          content: lines.join('\n')
        }
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Unable to update gist\n${error}`)
  }
}

async function main() {
  const stats = await wakatime.getMyStats({ range: RANGE.LAST_7_DAYS })
  await updateGist(stats)
}

;(async () => {
  await main()
})()
