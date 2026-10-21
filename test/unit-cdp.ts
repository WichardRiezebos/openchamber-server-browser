import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { CdpConnection } from '../service/cdp.ts';

// No answer within the timeout -> rejects, pending entry is gone.
{
  const conn = new CdpConnection(new PassThrough(), new PassThrough());
  await assert.rejects(conn.send('Runtime.evaluate', {}, undefined, 20), /timed out after 20 ms/);
  console.log('ok   cdp send times out');
}

// Answer arrives -> resolves; the request id is readable from the outgoing bytes.
{
  const out = new PassThrough();
  const input = new PassThrough();
  const conn = new CdpConnection(out, input);
  const pending = conn.send('Browser.getVersion', {}, undefined, 500);
  const raw = await new Promise<string>((resolve) => out.once('data', (c: Buffer) => resolve(c.toString('utf8'))));
  const request = JSON.parse(raw.replace(/\0$/, ''));
  input.write(Buffer.from(JSON.stringify({ id: request.id, result: { protocolVersion: 'x' } }) + '\0'));
  assert.deepEqual(await pending, { protocolVersion: 'x' });
  console.log('ok   cdp send resolves on answer');
}
console.log('unit: all checks passed');
