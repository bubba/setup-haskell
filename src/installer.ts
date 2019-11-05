import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as tc from '@actions/tool-cache';
import * as os from 'os';
import * as util from 'util';
import * as io from '@actions/io';
import * as exec from '@actions/exec';

export function findHaskellGHCVersion(baseInstallDir: string, version: string) {
  return _findHaskellToolVersion(baseInstallDir, 'ghc', version);
}

export function findHaskellCabalVersion(
  baseInstallDir: string,
  version: string
) {
  return _findHaskellToolVersion(baseInstallDir, 'cabal', version);
}

export async function installGhcup() {
  core.exportVariable('BOOTSTRAP_HASKELL_NONINTERACTIVE', 'true');
  let downloadPath = await tc.downloadTool('https://get-ghcup.haskell.org');
  fs.chmodSync(downloadPath, '777');

  let output = '';
  let resultCode = await exec.exec('sh', [downloadPath], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      }
    }
  });

  if (resultCode != 0) {
    throw `Unable to install 'ghcup'. Result code is ${resultCode}. Output: ${output}`;
  }

  core.addPath(path.join(os.homedir(), '.ghcup', 'bin'));

  let toolPath = await io.which('ghcup', true);

  output = '';
  resultCode = await exec.exec(`"${toolPath}`, ['--version'], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      }
    }
  });

  if (resultCode != 0) {
    throw `Unable to determine if 'ghcup' was installed. The path is ${toolPath}. Result code is ${resultCode}. Output: ${output}`;
  }
}

export async function installGhc(ghcVersion: string, cabalVersion: string) {
  try {
    await exec.exec('ghcup', ['install', ghcVersion]);
  } catch (err) {
    throw err;
  }

  try {
    await exec.exec('ghcup', ['set', ghcVersion]);
  } catch (err) {
    throw err;
  }

  try {
    await exec.exec('ghcup', ['install-cabal', getPVPVersion(cabalVersion)]);
    core.addPath(path.join(os.homedir(), '.cabal', 'bin'));
  } catch (err) {
    throw err;
  }
}

export function _findHaskellToolVersion(
  baseInstallDir: string,
  tool: string,
  version: string
) {
  if (!baseInstallDir) {
    throw new Error('baseInstallDir parameter is required');
  }
  if (!tool) {
    throw new Error('toolName parameter is required');
  }
  if (!version) {
    throw new Error('version parameter is required');
  }

  const toolPath: string = path.join(baseInstallDir, tool, version, 'bin');
  if (fs.existsSync(toolPath)) {
    core.debug(`Found tool in cache ${tool} ${version}`);
    core.addPath(toolPath);
  } else {
    throw new Error(`Version ${version} of ${tool} not found`);
  }
}

export function getMajorVersion(version: string): string {
  const vparts = version.split('.');
  switch (vparts.length) {
    case 0:
      return version;
    case 1:
      return vparts[0].concat('.0');
    default:
      return `${vparts[0]}.${vparts[1]}`;
  }
}

function getPVPVersion(version: string): string {
  const vparts = version.split('.');
  let extraZeroes = 4 - vparts.length;
  if (extraZeroes < 0) extraZeroes = 0;
  return version.concat('.0'.repeat(extraZeroes));
}
