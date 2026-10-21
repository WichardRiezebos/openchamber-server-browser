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

// A late answer for a timed-out id is dropped: no crash, no unhandled
// rejection, and the connection keeps serving the next command.
{
  const out = new PassThrough();
  const input = new PassThrough();
  const conn = new CdpConnection(out, input);
  await assert.rejects(conn.send('Runtime.evaluate', {}, undefined, 20), /timed out after 20 ms/);
  const raw = await new Promise<string>((resolve) => out.once('data', (c: Buffer) => resolve(c.toString('utf8'))));
  const late = JSON.parse(raw.replace(/\0$/, ''));
  input.write(Buffer.from(JSON.stringify({ id: late.id, result: { tooLate: true } }) + '\0'));
  const answered = conn.send('Browser.getVersion', {}, undefined, 500);
  const echo = await new Promise<string>((resolve) => {
    const onData = (c: Buffer): void => { out.removeListener('data', onData); resolve(c.toString('utf8')); };
    out.on('data', onData);
  });
  const next = JSON.parse(echo.replace(/\0$/, ''));
  input.write(Buffer.from(JSON.stringify({ id: next.id, result: { protocolVersion: 'y' } }) + '\0'));
  assert.deepEqual(await answered, { protocolVersion: 'y' });
  console.log('ok   late answer after timeout is inert');
}
console.log('unit: all checks passed');
