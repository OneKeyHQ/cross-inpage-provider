import path from 'node:path';
import { writeJsonAtomic } from './json-file.mjs';
import { repoRelativePath, workPacketsDir } from './paths.mjs';

function safeSlug(value) {
  return String(value || 'protocol')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function boundedString(value, limit) {
  return typeof value === 'string' ? value.slice(0, limit) : value;
}

export async function makeWorkPacket({
  protocol,
  task,
  discovery,
  machineResult,
  classification,
  failure,
}) {
  const packet = {
    schemaVersion: 1,
    protocol: {
      id: protocol.id,
      slug: protocol.slug,
      name: protocol.name,
      sourceUrl: protocol.sourceUrl,
      rankings: protocol.rankings.slice(0, 20),
      target: protocol.target,
    },
    task,
    researchSummary: {
      discovery: {
        status: discovery?.status,
        reason: boundedString(discovery?.reason, 1000),
        finalUrl: discovery?.finalUrl,
        candidates: discovery?.candidates?.slice(0, 5),
      },
      trigger: machineResult?.trigger,
      finalUrl: machineResult?.url,
      classification,
    },
    selectorCandidates: [
      machineResult?.research?.modalSelector,
      ...(machineResult?.research?.walletCandidates || [])
        .map((candidate) => candidate.selector),
    ]
      .filter(Boolean)
      .slice(0, 5),
    domExcerpts: [],
    existingAdapterExcerpt: null,
    failureSummary: failure || null,
    artifactPaths: [machineResult?.screenshot].filter(Boolean),
  };
  const serialized = JSON.stringify(packet, null, 2);
  if (Buffer.byteLength(serialized) > 50 * 1024) {
    throw new Error('Work packet exceeds the 50 KB limit');
  }
  const file = path.join(
    workPacketsDir,
    `${safeSlug(protocol.slug)}-${safeSlug(task)}.json`,
  );
  await writeJsonAtomic(file, packet);
  return {
    file,
    relativeFile: repoRelativePath(file),
    bytes: Buffer.byteLength(serialized),
  };
}
