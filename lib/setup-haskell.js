"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const installer_1 = require("./installer");
// ghc and cabal are installed directly to /opt so use that directlly instead of
// copying over to the toolcache dir.
const baseInstallDir = '/opt';
const defaultGHCVersion = '8.6.5';
const defaultCabalVersion = '3.0';
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let baseDir = getInputOrDefault('base-install-dir', baseInstallDir);
        let ghcVersion = getInputOrDefault('ghc-version', defaultGHCVersion);
        let cabalVersion = getInputOrDefault('cabal-version', defaultCabalVersion);
        try {
            installer_1.findHaskellGHCVersion(baseInstallDir, ghcVersion);
            // fallback to a two-digits cabal version because that is what could be pre-installed.
            installer_1.findHaskellCabalVersion(baseInstallDir, getMajorVersion(cabalVersion));
        }
        catch (error) {
            core.info('Haskell toolchain is not pre-installed, will install it now');
            try {
                core.startGroup('Installing ghcup');
                yield installer_1.installGhcup();
                core.endGroup();
                core.startGroup('Installing GHC');
                yield installer_1.installGhc(ghcVersion, cabalVersion);
                core.endGroup();
            }
            catch (error) {
                core.setFailed(error.message);
            }
        }
    });
}
function getMajorVersion(version) {
    const vparts = version.split('.');
    switch (vparts.length) {
        case 0: return version;
        case 1: return vparts[0].concat('.0');
        default: return `${vparts[0]}.${vparts[1]}`;
    }
}
function getInputOrDefault(name, z) {
    let value = core.getInput(name);
    if (!value) {
        return z;
    }
    else {
        return value;
    }
}
run();
