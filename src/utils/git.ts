import { spawn } from 'child_process';

type CmdOut = {
  stdout: string[];
  stderr: string[];
  code: number;
};

const cmd = (args: string[]): Promise<CmdOut> => new Promise((resolve) => {
  const out: CmdOut = {
    stdout: [],
    stderr: [],
    code: 0,
  };

  const git = spawn('git', args);

  git.stdout.on('data', (data) => {
    out.stdout.push(data.toString());
  });
  git.stderr.on('data', (data) => {
    out.stderr.push(data.toString());
  });
  git.on('close', (code) => {
    out.code = code;
    resolve(out);
  });
});

export const pull = async (branch: string = 'main') => {

};

export const clone = async () => {

};

export const status = async () => {
  const stuff = await cmd(['status']);
  console.log(stuff);
};
