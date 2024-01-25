import OpenAI from 'openai'
import * as util from 'util'

const openai = new OpenAI()

async function main() {
  // アシスタントを作成
  const assistant = await openai.beta.assistants.create({
    name:         'Math Tutor',
    instructions: 'You are a personal math tutor. Write and run code to answer math questions.',
    tools:        [{ type: 'code_interpreter' }],
    model:        'gpt-3.5-turbo-1106'
  })

  // スレッドを作成
  const thread = await openai.beta.threads.create()

  // スレッドにメッセージを追加
  await openai.beta.threads.messages.create(
    thread.id,
    {
      role:    'user',
      content: 'I need to solve the equation `3x + 11 = 14`. Can you help me?'
    }
  )

  // アシスタントを実行
  const run = await openai.beta.threads.runs.create(
    thread.id,
    {
      assistant_id: assistant.id,
      instructions: ''
    }
  )

  // 完了するまでポーリング
  await checkRunStatus(thread.id, run.id)

  // 実行結果を取得
  const result = await openai.beta.threads.messages.list(
    thread.id
  )
  log({ messages: result.data })

  // アシスタントを削除
  await openai.beta.assistants.del(assistant.id)
}

/**
 * 実行ステータスを確認する関数です。
 * 実行ステータスが 'completed' または 'failed' になるまで、5秒ごとに自身を再帰的に呼び出します。
 * @param {string} threadId - スレッドのID
 * @param {string} runId - 実行のID
 */
async function checkRunStatus(threadId: string, runId: string) {
  const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId)
  if (runStatus.status === 'completed') {
    console.log('Run completed')
    return
  } else if (runStatus.status === 'failed') {
    console.error('Error occurred during the run execution')
  } else {
    console.log('Run not completed yet')
    await delay(5000)
    return checkRunStatus(threadId, runId)
  }
}

/**
 * 指定した時間（ミリ秒）だけ処理を遅延させます。
 */
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * オブジェクトをコンソールに出力する関数です。
 * util.inspectを使用してオブジェクトを文字列に変換し、その結果をコンソールに出力します。
 * @param {any} obj - 出力するオブジェクト
 */
function log(obj: any) {
  console.log(util.inspect(obj, false, null, true))
}

main().catch(console.error)
