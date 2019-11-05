import * as core from '@actions/core';
import {
  findHaskellGHCVersion,
  findHaskellCabalVersion,
  getMajorVersion,
  installGhcup,
  installGhc
} from './installer';

// ghc and cabal are installed directly to /opt so use that directlly instead of
// copying over to the toolcache dir.
const baseInstallDir = '/opt';
const defaultGHCVersion = '8.6.5';
const defaultCabalVersion = '3.0';

async function run() {
  let baseDir = getInputOrDefault('base-install-dir', baseInstallDir);
  let ghcVersion = getInputOrDefault('ghc-version', defaultGHCVersion);
  let cabalVersion = getInputOrDefault('cabal-version', defaultCabalVersion);

  try {
    findHaskellGHCVersion(baseInstallDir, ghcVersion);
    // fallback to a two-digits cabal version because that is what could be pre-installed.
    findHaskellCabalVersion(baseInstallDir, getMajorVersion(cabalVersion));
  } catch (error) {
    core.info('Haskell toolchain is not pre-installed, will install it now');

    try {
      core.startGroup('Installing ghcup');
      await installGhcup();
      core.endGroup();

      core.startGroup('Installing GHC');
      await installGhc(ghcVersion, cabalVersion);
      core.endGroup();
    } catch (error) {
      core.setFailed(error.message);
    }
  }
}

function getInputOrDefault(name: string, z: string): string {
  let value = core.getInput(name);
  if (!value) {
    return z;
  } else {
    return value;
  }
}

run();
