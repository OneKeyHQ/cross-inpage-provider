import path from 'node:path';
import {
  makeAdapterManifest,
  regenerateAdapters,
  writeAdapterManifest,
} from './adapter.mjs';
import {
  makeCaseManifest,
  writeCaseManifest,
} from './case-manifest.mjs';
import {
  connectorIconFingerprint,
  connectorKind,
  connectorMapping,
} from './connectors.mjs';
import { diagnoseFailure } from './diagnostics.mjs';
import { discoverDapp } from './discovery.mjs';
import { runElectronMachine } from './electron-runner.mjs';
import { readJson, writeJsonAtomic } from './json-file.mjs';
import {
  casesDir,
  packageDir,
  repoRelativePath,
  researchDir,
} from './paths.mjs';
import { runCommand } from './process.mjs';
import { classifyResearch } from './research.mjs';
import {
  applyProtocolPatch,
  loadRegistry,
  saveRegistry,
} from './registry.mjs';
import { makeWorkPacket } from './work-packet.mjs';

function safeSlug(value) {
  return String(value || 'protocol')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

async function ensureBuild() {
  const result = await runCommand('npm', ['run', 'build'], {
    cwd: packageDir,
    timeoutMs: 180000,
  });
  if (result.code !== 0) {
    throw new Error(`Connect Button Lab build failed:\n${result.stderr.slice(-12000)}`);
  }
}

function existingAdapterShape(result) {
  const wallets = (result.inspection?.markers || []).flatMap((marker) => {
    const provider = String(marker.walletId || '').split('-onekey-')[0];
    const kind = connectorKind(marker.text.replace(/^OneKey\s*&\s*/i, ''));
    const mapping = connectorMapping(kind);
    if (!provider || !kind || !mapping) return [];
    return [{
      wallet: kind,
      provider,
      updatedText: marker.text,
      walletId: marker.walletId,
      expectedMethods: mapping.expectedMethods,
      expectedIconFingerprint:
        marker.iconFingerprint || connectorIconFingerprint(kind),
    }];
  });
  return wallets.length > 0 ? { wallets } : null;
}

async function writeResearch(protocol, candidate, result, index) {
  const file = path.join(
    researchDir,
    `${safeSlug(protocol.slug)}-${index + 1}.json`,
  );
  await writeJsonAtomic(file, {
    protocolId: protocol.id,
    candidate,
    result,
  });
  return file;
}

function completionPatch({
  outcome,
  result,
  protocol,
  adapterFile,
  manifestFile,
  caseFile,
  kind,
}) {
  const now = new Date().toISOString();
  const common = {
    target: {
      resolvedDappUrl: result.url,
      hostname: new URL(result.url).hostname,
    },
    automation: {
      needsLlm: false,
      workPacket: null,
    },
    evidence: {
      researchAt: now,
      screenshots: [result.screenshot].filter(Boolean).map(repoRelativePath),
      lastE2eAt: now,
      lastE2eStatus: 'passed',
      lastE2eCommand: `npm --prefix packages/connect-button-lab run protocol -- --id ${protocol.id}`,
      scriptedAssertionsPassed: result.scriptedAssertionsPassed === true,
    },
  };
  if (protocol.coverage.state === 'done') {
    return {
      ...common,
      regression: {
        cycle: protocol.regression.cycle,
        state: 'done',
        outcome: kind === 'generated' ? 'repaired' : 'passed',
        checkedAt: now,
        runId: null,
        claimedAt: null,
      },
      implementation: {
        ...(adapterFile ? { adapterFile } : {}),
        ...(manifestFile ? { manifestFile } : {}),
        ...(caseFile ? { caseFile } : {}),
      },
    };
  }
  return {
    ...common,
    coverage: {
      state: 'done',
      outcome,
      completedAt: now,
      reason: result.summary,
    },
    implementation: {
      kind,
      ...(adapterFile ? { adapterFile } : {}),
      ...(manifestFile ? { manifestFile } : {}),
      ...(caseFile ? { caseFile } : {}),
      walletIds: (result.inspection?.markers || []).map((marker) => marker.walletId),
    },
  };
}

function nonCodeTerminalPatch(protocol, outcome, result, classification) {
  const now = new Date().toISOString();
  const common = {
    target: {
      resolvedDappUrl: result?.url || protocol.sourceUrl,
      hostname: result?.url ? new URL(result.url).hostname : protocol.sourceHostname,
    },
    automation: {
      classification: classification.classification,
      confidence: classification.confidence,
      patternId: classification.patternId,
      needsLlm: false,
      workPacket: null,
    },
    evidence: {
      researchAt: now,
      screenshots: [result?.screenshot].filter(Boolean).map(repoRelativePath),
      lastE2eAt: result ? now : null,
      lastE2eStatus: result?.status || null,
      scriptedAssertionsPassed: false,
    },
  };
  if (protocol.coverage.state === 'done') {
    return {
      ...common,
      regression: {
        cycle: protocol.regression.cycle,
        state: 'done',
        outcome:
          outcome === 'blocked' ? 'still_blocked' : 'still_not_applicable',
        checkedAt: now,
        runId: null,
        claimedAt: null,
      },
    };
  }
  return {
    ...common,
    coverage: {
      state: 'done',
      outcome,
      completedAt: now,
      reason: classification.reason,
    },
  };
}

async function applyAndSave(registry, protocol, patch, registryFile) {
  await applyProtocolPatch(registry, protocol.id, patch);
  await saveRegistry(registry, registryFile);
}

export async function runProtocol({
  protocolId,
  registryFile,
  mode = 'auto',
  skipBuild = false,
  maxCandidates = 3,
}) {
  const registry = await loadRegistry(registryFile);
  const protocol = registry.protocols.find(
    (candidate) => candidate.id === String(protocolId),
  );
  if (!protocol) throw new Error(`Unknown protocol ID: ${protocolId}`);
  if (!skipBuild) await ensureBuild();

  const existingCaseFile = path.join(casesDir, `${safeSlug(protocol.slug)}.json`);
  const existingCase = await readJson(existingCaseFile, null);
  const reusableCase =
    String(existingCase?.protocolId || '') === protocol.id ? existingCase : null;

  const discovery = await discoverDapp(
    protocol.target.urlOverride ||
      protocol.target.resolvedDappUrl ||
      protocol.sourceUrl,
  );
  if (discovery.status === 'blocked' || discovery.candidates.length === 0) {
    const classification = {
      classification: 'externally_blocked',
      confidence: 1,
      patternId: null,
      needsLlm: false,
      reason: discovery.reason || 'No dapp candidate URL',
    };
    await applyAndSave(
      registry,
      protocol,
      nonCodeTerminalPatch(protocol, 'blocked', null, classification),
      registryFile,
    );
    return {
      protocolId: protocol.id,
      status: 'terminal',
      outcome: 'blocked',
      classification,
    };
  }

  let chosen = null;
  const attempts = [];
  for (const [index, candidate] of discovery.candidates.slice(0, maxCandidates).entries()) {
    const resultFile = path.join(
      researchDir,
      `${safeSlug(protocol.slug)}-${index + 1}-electron.json`,
    );
    let machineResult;
    try {
      machineResult = await runElectronMachine({
        id: protocol.id,
        url: candidate.url,
        caseFile: reusableCase ? existingCaseFile : null,
        research: true,
        timeoutMs: reusableCase ? 120000 : 70000,
        resultFile,
      });
    } catch (error) {
      machineResult = {
        status: 'failed',
        summary: error.message,
        url: candidate.url,
      };
    }
    await writeResearch(protocol, candidate, machineResult, index);
    const classification = classifyResearch(machineResult);
    attempts.push({
      candidate,
      status: machineResult.status,
      summary: machineResult.summary,
      classification: classification.classification,
      confidence: classification.confidence,
    });
    if (
      machineResult.status !== 'failed' &&
      (machineResult.status === 'passed' ||
        machineResult.status === 'native' ||
        machineResult.status === 'blocked' ||
        machineResult.trigger?.clicked)
    ) {
      chosen = { candidate, machineResult, classification };
      break;
    }
  }

  if (!chosen) {
    const fallback = {
      status: 'failed',
      summary: 'All dapp candidates failed automated research',
      url: discovery.candidates[0]?.url,
    };
    const classification = classifyResearch(fallback);
    const packet = await makeWorkPacket({
      protocol,
      task: 'resolve_dapp',
      discovery,
      machineResult: fallback,
      classification,
      failure: { code: 'all_candidates_failed', attempts },
    });
    await applyAndSave(
      registry,
      protocol,
      {
        coverage: {
          state: 'pending',
          runId: null,
          claimedAt: null,
          reason: fallback.summary,
        },
        automation: {
          classification: classification.classification,
          confidence: classification.confidence,
          patternId: classification.patternId,
          workPacket: packet.relativeFile,
          needsLlm: true,
        },
      },
      registryFile,
    );
    return {
      protocolId: protocol.id,
      status: 'needs_llm',
      task: 'resolve_dapp',
      workPacket: packet.relativeFile,
    };
  }

  const { candidate, machineResult, classification } = chosen;
  classification.research = machineResult.research;
  if (classification.classification === 'native_supported') {
    await applyAndSave(
      registry,
      protocol,
      nonCodeTerminalPatch(protocol, 'native_supported', machineResult, classification),
      registryFile,
    );
    return {
      protocolId: protocol.id,
      status: 'terminal',
      outcome: 'native_supported',
    };
  }
  if (classification.classification === 'externally_blocked') {
    await applyAndSave(
      registry,
      protocol,
      nonCodeTerminalPatch(protocol, 'blocked', machineResult, classification),
      registryFile,
    );
    return {
      protocolId: protocol.id,
      status: 'terminal',
      outcome: 'blocked',
    };
  }

  let adapterFile = null;
  let manifestFile = null;
  let adapterKind = 'existing';
  let adapterShape = existingAdapterShape(machineResult);
  if (classification.patternId !== 'existing-adapter') {
    if (mode !== 'auto' || classification.confidence < 0.9 || classification.needsLlm) {
      const packet = await makeWorkPacket({
        protocol,
        task: 'choose_selector',
        discovery,
        machineResult,
        classification,
      });
      await applyAndSave(
        registry,
        protocol,
        {
          target: {
            resolvedDappUrl: machineResult.url || candidate.url,
            hostname: candidate.hostname,
          },
          coverage: {
            state: 'pending',
            runId: null,
            claimedAt: null,
            reason: classification.reason,
          },
          automation: {
            classification: classification.classification,
            confidence: classification.confidence,
            patternId: classification.patternId,
            workPacket: packet.relativeFile,
            needsLlm: true,
          },
        },
        registryFile,
      );
      return {
        protocolId: protocol.id,
        status: 'needs_llm',
        task: 'choose_selector',
        workPacket: packet.relativeFile,
      };
    }
    const manifest = makeAdapterManifest({
      protocol,
      url: machineResult.url || candidate.url,
      classification,
    });
    const writtenManifestFile = await writeAdapterManifest(manifest);
    const generation = await regenerateAdapters();
    adapterFile = generation.relativeFile;
    manifestFile = repoRelativePath(writtenManifestFile);
    adapterKind = 'generated';
    adapterShape = manifest;
    await ensureBuild();
    classification.manifestFile = manifestFile;
  }

  if (!adapterShape?.wallets?.length) {
    const packet = await makeWorkPacket({
      protocol,
      task: 'repair_e2e',
      discovery,
      machineResult,
      classification,
      failure: { code: 'wallet_assertions_unavailable' },
    });
    await applyAndSave(
      registry,
      protocol,
      {
        coverage: {
          state: 'pending',
          runId: null,
          claimedAt: null,
          reason: 'wallet_assertions_unavailable',
        },
        automation: {
          classification: classification.classification,
          confidence: classification.confidence,
          patternId: classification.patternId,
          workPacket: packet.relativeFile,
          needsLlm: true,
        },
      },
      registryFile,
    );
    return {
      protocolId: protocol.id,
      status: 'needs_llm',
      task: 'repair_e2e',
      workPacket: packet.relativeFile,
    };
  }

  const caseManifest =
    reusableCase ||
    makeCaseManifest({
      protocol,
      url: machineResult.url || candidate.url,
      trigger: machineResult.trigger,
      adapterManifest: adapterShape,
    });
  const caseResult = reusableCase
    ? {
      file: existingCaseFile,
      relativeFile: repoRelativePath(existingCaseFile),
    }
    : await writeCaseManifest(caseManifest);
  const e2eResultFile = path.join(
    researchDir,
    `${safeSlug(protocol.slug)}-e2e.json`,
  );
  const e2e = await runElectronMachine({
    id: protocol.id,
    url: caseManifest.url,
    caseFile: caseResult.file,
    resultFile: e2eResultFile,
  });
  if (e2e.status === 'passed' && e2e.scriptedAssertionsPassed === true) {
    const outcome = adapterKind === 'generated'
      ? 'implemented_verified'
      : 'existing_verified';
    await applyAndSave(
      registry,
      protocol,
      {
        ...completionPatch({
          outcome,
          result: e2e,
          protocol,
          adapterFile,
          manifestFile,
          caseFile: caseResult.relativeFile,
          kind: adapterKind,
        }),
        automation: {
          classification: classification.classification,
          confidence: classification.confidence,
          patternId: classification.patternId,
          workPacket: null,
          needsLlm: false,
        },
      },
      registryFile,
    );
    return {
      protocolId: protocol.id,
      status: 'terminal',
      outcome,
      scriptedAssertionsPassed: true,
      caseFile: caseResult.relativeFile,
      adapterFile,
      manifestFile,
    };
  }

  const failure = diagnoseFailure(e2e);
  const packetTask =
    adapterKind === 'generated' ? 'repair_e2e' : 'implement_bespoke';
  const packet = await makeWorkPacket({
    protocol,
    task: packetTask,
    discovery,
    machineResult: e2e,
    classification,
    failure,
  });
  await applyAndSave(
    registry,
    protocol,
    {
      coverage: {
        state: 'pending',
        runId: null,
        claimedAt: null,
        reason: failure.code,
      },
      automation: {
        classification: classification.classification,
        confidence: classification.confidence,
        patternId: classification.patternId,
        workPacket: packet.relativeFile,
        needsLlm: true,
      },
      evidence: {
        lastE2eAt: new Date().toISOString(),
        lastE2eStatus: e2e.status,
        scriptedAssertionsPassed: false,
        screenshots: [e2e.screenshot].filter(Boolean).map(repoRelativePath),
      },
    },
    registryFile,
  );
  return {
    protocolId: protocol.id,
    status: 'needs_llm',
    task: packetTask,
    workPacket: packet.relativeFile,
    failure,
  };
}
