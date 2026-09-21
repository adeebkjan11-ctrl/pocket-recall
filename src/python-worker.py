"""JSON-lines adapter to QVAC's official Python SDK; all inference is local."""
import asyncio
import json
import os
import sys
from pathlib import Path
from tetherto.qvac_sdk import Client, load_model, completion, cancel, unload_model
from tetherto.qvac_sdk.models import QWEN3_600M_INST_Q4

def send(value):
    print('POCKET_JSON:' + json.dumps(value), flush=True)

async def main():
    config = {'plugins':['@qvac/sdk/llamacpp-completion/plugin'],
              'cacheDirectory':str(Path('.qvac/models').resolve()),
              'loggerConsoleOutput':False, 'registryDownloadMaxRetries':1,
              'registryStreamTimeoutMs':20000}
    async with Client(sdk_dir=sys.argv[1],bare_path=sys.argv[2],config=config) as client:
        transport = client.transport
        model = None
        active = None
        tasks = set()

        async def handle(command):
            nonlocal model, active
            try:
                action = command['action']
                value = {}
                if action == 'prepare':
                    source = os.environ.get('QVAC_MODEL_PATH')
                    downloaded = Path(__file__).resolve().parent.parent / '.qvac/models/Qwen3-0.6B-Q4_0.gguf'
                    if not source and downloaded.exists():
                        source = str(downloaded)
                    model = await load_model(transport,
                        model_src=str(Path(source).resolve()) if source else QWEN3_600M_INST_Q4,
                        model_type='llamacpp-completion',
                        model_config={'ctx_size':4096,'device':'cpu'},
                        on_progress=lambda p: send({'progress':p.percentage}))
                elif action == 'generate':
                    active = completion(transport,model_id=model,
                        history=[{'role':'user','content':command['prompt']}],
                        generation_params={'predict':1000,'temp':0.2},capture_thinking=True)
                    try:
                        result = await asyncio.wait_for(asyncio.shield(active.final),180)
                        value = {'text':result.content_text,
                                 'tokensPerSecond':getattr(result.stats,'tokens_per_second',None)}
                    except asyncio.TimeoutError:
                        await cancel(transport,request_id=active.request_id)
                        raise RuntimeError('Generation timed out. Try shorter notes.')
                    finally:
                        active = None
                elif action == 'stop':
                    if active:
                        await cancel(transport,request_id=active.request_id)
                elif action == 'shutdown':
                    if model:
                        await unload_model(transport,model)
                        model = None
                else:
                    raise ValueError('Unknown local command')
                send({'id':command['id'],'result':value})
            except Exception as error:
                send({'id':command['id'],'error':str(error)})

        while True:
            line = await asyncio.to_thread(sys.stdin.readline)
            if not line:
                break
            command = json.loads(line)
            task = asyncio.create_task(handle(command))
            tasks.add(task)
            task.add_done_callback(tasks.discard)
        if tasks:
            await asyncio.gather(*tasks,return_exceptions=True)

asyncio.run(main())
